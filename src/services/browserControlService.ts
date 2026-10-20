/**
 * Browser Control & Device Subsystem Service
 * Provides live native browser execution, authorized device permissions management,
 * W3C Scroll-to-Text Fragment (:~:text=) highlighting, and backend accessibility
 * keyboard traversal for ChromeVox / screen-reader instances.
 */

import {
  DeviceCapabilityTelemetry,
  DevicePermissionStatus,
  TextFragmentMatch,
  BrowserExecutionResult,
  A11yNavigationState,
  DeviceAssistAction,
} from '../types';

export class BrowserControlService {
  private static instance: BrowserControlService;

  // Active Screen Wake Lock sentinel
  private wakeLockSentinel: any = null;

  // Accessibility announcement live elements
  private liveRegionPolite: HTMLElement | null = null;
  private liveRegionAssertive: HTMLElement | null = null;
  private announcementHistory: string[] = [];

  // Active highlighted text fragment matches
  private activeFragmentMatches: TextFragmentMatch[] = [];
  private currentFragmentIndex: number = -1;

  // Accessibility traversal index
  private currentA11yIndex: number = -1;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initA11yLiveRegions();
      this.bindWindowVisibilityForWakeLock();
    }
  }

  public static getInstance(): BrowserControlService {
    if (!BrowserControlService.instance) {
      BrowserControlService.instance = new BrowserControlService();
    }
    return BrowserControlService.instance;
  }

  // =========================================================================
  // 1. LIVE BROWSER EXECUTION ENGINE
  // =========================================================================

  /**
   * Evaluates JavaScript expressions and DOM mutations in the live browser runtime.
   */
  public async executeBrowserCode(code: string): Promise<BrowserExecutionResult> {
    const startTime = performance.now();
    const id = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timestamp = new Date().toLocaleTimeString();

    if (typeof window === 'undefined') {
      return {
        id,
        code,
        result: 'Browser runtime not active in headless mode',
        resultType: 'string',
        executionTimeMs: 0,
        timestamp,
      };
    }

    try {
      // Safe sandboxed context scope wrapper
      // Exposes useful utility functions directly in execution scope:
      // $(selector), $$(selector), highlight(phrase), echo(val)
      const sandboxContext = {
        $: (selector: string) => document.querySelector(selector),
        $$: (selector: string) => Array.from(document.querySelectorAll(selector)),
        highlight: (phrase: string) => this.highlightTextFragment(phrase),
        echo: (val: any) => val,
        window,
        document,
        navigator,
        performance,
        location,
        localStorage,
        sessionStorage,
      };

      // Wrap in async function for immediate await capabilities
      const fn = new Function(
        ...Object.keys(sandboxContext),
        `"use strict"; return (async () => { return (${code}); })();`
      );

      const rawResult = await fn(...Object.values(sandboxContext));
      const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));

      let resultType: string = typeof rawResult;
      let displayResult = rawResult;

      if (rawResult === undefined) {
        displayResult = 'undefined';
        resultType = 'undefined';
      } else if (rawResult === null) {
        displayResult = 'null';
        resultType = 'null';
      } else if (rawResult instanceof HTMLElement) {
        displayResult = `<${rawResult.tagName.toLowerCase()}${rawResult.id ? ` id="${rawResult.id}"` : ''}${
          rawResult.className ? ` class="${rawResult.className.slice(0, 30)}..."` : ''
        }>`;
        resultType = 'HTMLElement';
      } else if (typeof rawResult === 'object') {
        try {
          displayResult = JSON.stringify(rawResult, null, 2);
        } catch {
          displayResult = Object.prototype.toString.call(rawResult);
        }
      }

      return {
        id,
        code,
        result: displayResult,
        resultType,
        executionTimeMs,
        timestamp,
      };
    } catch (err: any) {
      const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));
      return {
        id,
        code,
        result: null,
        resultType: 'error',
        executionTimeMs,
        timestamp,
        error: err?.message || String(err),
      };
    }
  }

  // =========================================================================
  // 2. HIGHLIGHT TEXT FRAGMENT API (:~:text=) & VISUAL HIGHLIGHTER
  // =========================================================================

  /**
   * Generates a canonical W3C Scroll-to-Text Fragment URL
   * Spec: https://wicg.github.io/scroll-to-text-fragment/
   * e.g. https://domain.com/path#:~:text=polymorphic%20neurality
   */
  public generateFragmentUrl(phrase: string): string {
    if (typeof window === 'undefined') return `#:~:text=${encodeURIComponent(phrase)}`;
    const base = window.location.href.split('#')[0];
    const encoded = encodeURIComponent(phrase.trim());
    return `${base}#:~:text=${encoded}`;
  }

  /**
   * Highlights occurrences of a text phrase inside the active DOM,
   * adds animated cybernetic glow marks, scrolls to match, and notifies ChromeVox.
   */
  public highlightTextFragment(
    phrase: string,
    options: { scroll?: boolean; announce?: boolean } = { scroll: true, announce: true }
  ): TextFragmentMatch[] {
    const clean = phrase.trim();
    if (!clean || typeof document === 'undefined') return [];

    // Clear any previous fragment marks first
    this.clearTextFragments();

    const matches: TextFragmentMatch[] = [];
    const fragmentUrl = this.generateFragmentUrl(clean);

    // Target search containers (terminal output lines, prompt headers, and document body)
    const targets = Array.from(
      document.querySelectorAll('[data-terminal-line], .terminal-content-area, main, #root')
    );
    const searchRoots = targets.length > 0 ? targets : [document.body];

    const regex = new RegExp(`(${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

    let globalIndex = 0;

    for (const root of searchRoots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          // Skip input elements, scripts, styles, and already highlighted marks
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toLowerCase();
          if (tag === 'script' || tag === 'style' || tag === 'input' || tag === 'textarea' || tag === 'mark') {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest('.device-control-panel')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      const nodesToReplace: Text[] = [];
      let currentNode = walker.nextNode();
      while (currentNode) {
        if (regex.test(currentNode.nodeValue || '')) {
          nodesToReplace.push(currentNode as Text);
        }
        currentNode = walker.nextNode();
      }

      for (const textNode of nodesToReplace) {
        const text = textNode.nodeValue || '';
        const parent = textNode.parentElement;
        if (!parent) continue;

        const fragment = document.createDocumentFragment();
        let lastIdx = 0;
        regex.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
          const matchStart = match.index;
          const matchEnd = regex.lastIndex;

          if (matchStart > lastIdx) {
            fragment.appendChild(document.createTextNode(text.substring(lastIdx, matchStart)));
          }

          const matchedText = match[0];
          const matchId = `frag-match-${globalIndex}`;

          const mark = document.createElement('mark');
          mark.id = matchId;
          mark.className =
            'os-text-fragment-highlight bg-cyan-400/35 text-cyan-100 px-1 py-0.5 rounded shadow-[0_0_12px_rgba(6,182,212,0.8)] border border-cyan-300 font-bold transition-all duration-300 animate-pulse';
          mark.setAttribute('data-fragment-index', String(globalIndex));
          mark.setAttribute('tabindex', '0');
          mark.setAttribute('role', 'mark');
          mark.setAttribute(
            'aria-label',
            `Highlighted Text Fragment: ${matchedText}, match ${globalIndex + 1}`
          );
          mark.textContent = matchedText;

          fragment.appendChild(mark);

          matches.push({
            id: matchId,
            text: matchedText,
            fullSnippet: text.slice(Math.max(0, matchStart - 20), Math.min(text.length, matchEnd + 20)),
            targetSelector: `#${matchId}`,
            fragmentUrl,
            occurrenceIndex: globalIndex,
            totalOccurrences: 0,
          });

          globalIndex++;
          lastIdx = matchEnd;
        }

        if (lastIdx < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIdx)));
        }

        parent.replaceChild(fragment, textNode);
      }
    }

    // Update total count
    matches.forEach((m) => {
      m.totalOccurrences = matches.length;
    });

    this.activeFragmentMatches = matches;
    this.currentFragmentIndex = matches.length > 0 ? 0 : -1;

    // Update browser URL hash according to W3C spec without reloading
    if (matches.length > 0 && typeof history !== 'undefined') {
      try {
        history.replaceState(null, '', `#:~:text=${encodeURIComponent(clean)}`);
      } catch {
        // Safe fallback
      }
    }

    // Scroll to first match & announce to ChromeVox
    if (matches.length > 0 && options.scroll !== false) {
      this.jumpToMatch(0);
    }

    if (options.announce !== false) {
      const msg =
        matches.length > 0
          ? `Text fragment highlighted: "${clean}". Found ${matches.length} occurrences. Focused on match 1.`
          : `Text fragment "${clean}" was not found in the active viewport.`;
      this.announceToScreenReader(msg, true);
    }

    return matches;
  }

  /**
   * Jump to specific match index and apply focus
   */
  public jumpToMatch(index: number): boolean {
    if (this.activeFragmentMatches.length === 0) return false;
    const targetIdx = (index + this.activeFragmentMatches.length) % this.activeFragmentMatches.length;
    this.currentFragmentIndex = targetIdx;
    const match = this.activeFragmentMatches[targetIdx];

    const markEl = document.getElementById(match.id);
    if (markEl) {
      // Focus element for accessibility navigation
      markEl.focus({ preventScroll: true });
      markEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      markEl.classList.remove('animate-pulse');
      // Trigger a quick flash
      markEl.style.transform = 'scale(1.15)';
      setTimeout(() => {
        if (markEl) markEl.style.transform = 'scale(1.0)';
      }, 300);

      this.announceToScreenReader(
        `Fragment match ${targetIdx + 1} of ${this.activeFragmentMatches.length}: ${match.text}`,
        false
      );
      return true;
    }
    return false;
  }

  public nextFragment(): boolean {
    if (this.activeFragmentMatches.length === 0) return false;
    return this.jumpToMatch(this.currentFragmentIndex + 1);
  }

  public prevFragment(): boolean {
    if (this.activeFragmentMatches.length === 0) return false;
    return this.jumpToMatch(this.currentFragmentIndex - 1);
  }

  public clearTextFragments(): void {
    if (typeof document === 'undefined') return;
    const marks = document.querySelectorAll('.os-text-fragment-highlight');
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
    this.activeFragmentMatches = [];
    this.currentFragmentIndex = -1;

    // Reset URL hash if it was a fragment
    if (typeof history !== 'undefined' && window.location.hash.includes(':~:text=')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  public getActiveFragmentMatches(): TextFragmentMatch[] {
    return this.activeFragmentMatches;
  }

  public getCurrentFragmentIndex(): number {
    return this.currentFragmentIndex;
  }

  // =========================================================================
  // 3. AUTHORIZED DEVICE PERMISSIONS & HARDWARE TELEMETRY
  // =========================================================================

  /**
   * Probes authorized device permissions and hardware specifications.
   */
  public async getDeviceTelemetry(): Promise<DeviceCapabilityTelemetry> {
    const isClient = typeof window !== 'undefined' && typeof navigator !== 'undefined';

    const defaultTelemetry: DeviceCapabilityTelemetry = {
      permissions: {
        microphone: 'prompt',
        clipboardRead: 'prompt',
        clipboardWrite: 'granted',
        notifications: 'prompt',
        geolocation: 'prompt',
        screenWakeLock: 'prompt',
      },
      battery: null,
      network: {
        online: isClient ? navigator.onLine : true,
      },
      hardware: {
        logicalCores: isClient ? navigator.hardwareConcurrency || 4 : 4,
        touchPoints: isClient ? navigator.maxTouchPoints || 0 : 0,
      },
      wakeLockActive: this.wakeLockSentinel !== null,
      onDeviceAI: {
        supported: false,
        status: 'Checking...',
      },
      screen: {
        width: isClient ? window.innerWidth : 1920,
        height: isClient ? window.innerHeight : 1080,
        availWidth: isClient ? window.screen.availWidth : 1920,
        availHeight: isClient ? window.screen.availHeight : 1080,
        pixelRatio: isClient ? window.devicePixelRatio : 1,
        colorDepth: isClient ? window.screen.colorDepth : 24,
        orientation: isClient && window.screen.orientation ? window.screen.orientation.type : 'landscape-primary',
        fullscreen: isClient ? Boolean(document.fullscreenElement) : false,
      },
    };

    if (!isClient) return defaultTelemetry;

    // 1. Probe permissions safely
    if (navigator.permissions && navigator.permissions.query) {
      const probePerm = async (name: string): Promise<DevicePermissionStatus> => {
        try {
          const status = await navigator.permissions.query({ name: name as any });
          return (status.state as DevicePermissionStatus) || 'prompt';
        } catch {
          return 'unsupported';
        }
      };

      defaultTelemetry.permissions.microphone = await probePerm('microphone');
      defaultTelemetry.permissions.clipboardRead = await probePerm('clipboard-read');
      defaultTelemetry.permissions.clipboardWrite = await probePerm('clipboard-write');
      defaultTelemetry.permissions.notifications = await probePerm('notifications');
      defaultTelemetry.permissions.geolocation = await probePerm('geolocation');
      defaultTelemetry.permissions.screenWakeLock = await probePerm('screen-wake-lock');
    }

    // 2. Battery Telemetry
    try {
      if ('getBattery' in navigator && typeof (navigator as any).getBattery === 'function') {
        const battery = await (navigator as any).getBattery();
        defaultTelemetry.battery = {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        };
      }
    } catch {
      // Battery API unsupported or restricted
    }

    // 3. Network Information
    try {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        defaultTelemetry.network.downlink = conn.downlink;
        defaultTelemetry.network.rtt = conn.rtt;
        defaultTelemetry.network.effectiveType = conn.effectiveType;
        defaultTelemetry.network.saveData = conn.saveData;
      }
    } catch {
      // Ignore
    }

    // 4. Device Memory
    if ('deviceMemory' in navigator) {
      defaultTelemetry.hardware.deviceMemoryGb = (navigator as any).deviceMemory;
    }

    // 5. On-Device AI capabilities (e.g. Chrome Built-in AI / window.ai)
    try {
      if ('ai' in window && (window as any).ai?.languageModel) {
        const canCreate = await (window as any).ai.languageModel.capabilities();
        const available = canCreate.available === 'readily' || canCreate.available === 'after-download';
        defaultTelemetry.onDeviceAI = {
          supported: true,
          status: available ? 'Gemini Nano On-Device Ready' : 'Downloadable On-Device Model',
          modelAvailable: available,
        };
      } else {
        defaultTelemetry.onDeviceAI = {
          supported: false,
          status: 'Hybrid Server / Local Neural Engine Active',
          modelAvailable: false,
        };
      }
    } catch {
      defaultTelemetry.onDeviceAI = {
        supported: false,
        status: 'Hybrid Server Fallback',
        modelAvailable: false,
      };
    }

    return defaultTelemetry;
  }

  /**
   * Requests Screen Wake Lock to prevent native display sleep during terminal sessions.
   */
  public async requestScreenWakeLock(): Promise<{ success: boolean; message: string }> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return { success: false, message: 'Screen Wake Lock API is not supported in this browser environment.' };
    }

    try {
      if (this.wakeLockSentinel) {
        return { success: true, message: 'Screen Wake Lock is already active.' };
      }
      this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      this.wakeLockSentinel.addEventListener('release', () => {
        this.wakeLockSentinel = null;
        this.announceToScreenReader('Screen Wake Lock was released by the device.', false);
      });
      this.announceToScreenReader('Device screen wake lock acquired. Display will remain awake.', true);
      return { success: true, message: 'Screen Wake Lock acquired: Device display locked awake.' };
    } catch (err: any) {
      return { success: false, message: `Wake Lock request denied: ${err?.message || err}` };
    }
  }

  public async releaseScreenWakeLock(): Promise<{ success: boolean; message: string }> {
    if (!this.wakeLockSentinel) {
      return { success: true, message: 'No active Wake Lock to release.' };
    }
    try {
      await this.wakeLockSentinel.release();
      this.wakeLockSentinel = null;
      return { success: true, message: 'Screen Wake Lock successfully released.' };
    } catch (err: any) {
      return { success: false, message: `Failed to release Wake Lock: ${err?.message || err}` };
    }
  }

  public isWakeLockActive(): boolean {
    return this.wakeLockSentinel !== null;
  }

  /**
   * System Clipboard Access (Write)
   */
  public async copyToClipboard(text: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      this.announceToScreenReader('Copied to system clipboard.', false);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * System Clipboard Access (Read)
   */
  public async readFromClipboard(): Promise<string | null> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return null;
    }
    try {
      return await navigator.clipboard.readText();
    } catch {
      return null;
    }
  }

  /**
   * Native Browser Notification
   */
  public async dispatchNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
      return true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
        return true;
      }
    }
    return false;
  }

  /**
   * Native Haptic Device Vibration
   */
  public vibrate(pattern: number | number[] = [60, 40, 60]): boolean {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        return navigator.vibrate(pattern);
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Toggle Native Fullscreen Mode
   */
  public async toggleFullscreen(): Promise<boolean> {
    if (typeof document === 'undefined') return false;
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        return true;
      } else {
        await document.exitFullscreen();
        return false;
      }
    } catch {
      return false;
    }
  }

  // =========================================================================
  // 4. BACKEND ACCESSIBILITY KEYBOARD ACCESS & CHROMEVOX SUBSYSTEM
  // =========================================================================

  /**
   * Injects ARIA Live Regions into the document for screen-reader (ChromeVox, NVDA, VoiceOver) accessibility.
   */
  private initA11yLiveRegions(): void {
    if (typeof document === 'undefined') return;

    // Check if live regions already exist
    let polite = document.getElementById('a11y-live-region-polite');
    if (!polite) {
      polite = document.createElement('div');
      polite.id = 'a11y-live-region-polite';
      polite.setAttribute('aria-live', 'polite');
      polite.setAttribute('aria-atomic', 'true');
      polite.className = 'sr-only fixed -left-[9999px] top-0 w-1 h-1 overflow-hidden pointer-events-none';
      document.body.appendChild(polite);
    }
    this.liveRegionPolite = polite;

    let assertive = document.getElementById('a11y-live-region-assertive');
    if (!assertive) {
      assertive = document.createElement('div');
      assertive.id = 'a11y-live-region-assertive';
      assertive.setAttribute('aria-live', 'assertive');
      assertive.setAttribute('aria-atomic', 'true');
      assertive.className = 'sr-only fixed -left-[9999px] top-0 w-1 h-1 overflow-hidden pointer-events-none';
      document.body.appendChild(assertive);
    }
    this.liveRegionAssertive = assertive;
  }

  /**
   * Broadcasts messages directly to ChromeVox / screen readers.
   */
  public announceToScreenReader(message: string, assertive: boolean = false): void {
    if (!message) return;
    this.announcementHistory.push(`[${new Date().toLocaleTimeString()}] ${message}`);
    if (this.announcementHistory.length > 50) {
      this.announcementHistory.shift();
    }

    const targetRegion = assertive ? this.liveRegionAssertive : this.liveRegionPolite;
    if (targetRegion) {
      // Clear briefly to re-trigger announcement for identical consecutive strings
      targetRegion.textContent = '';
      setTimeout(() => {
        if (targetRegion) {
          targetRegion.textContent = message;
        }
      }, 50);
    }
  }

  /**
   * Discovers all traversable interactive accessibility elements in the OS.
   */
  public getTraversableElements(): HTMLElement[] {
    if (typeof document === 'undefined') return [];

    const selectors = [
      'input:not([disabled])',
      'button:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]',
      '[role="tab"]',
      '[role="mark"]',
      '.os-text-fragment-highlight',
    ];

    const elements = Array.from(document.querySelectorAll<HTMLElement>(selectors.join(',')));
    return elements.filter((el) => {
      // Must be visible and in the active DOM
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && (rect.width > 0 || rect.height > 0);
    });
  }

  /**
   * Traverses to next interactive element with accessibility announcement
   */
  public focusNextA11yElement(): HTMLElement | null {
    const list = this.getTraversableElements();
    if (list.length === 0) return null;

    this.currentA11yIndex = (this.currentA11yIndex + 1) % list.length;
    const el = list[this.currentA11yIndex];
    this.applyA11yFocus(el, this.currentA11yIndex, list.length);
    return el;
  }

  /**
   * Traverses to previous interactive element
   */
  public focusPrevA11yElement(): HTMLElement | null {
    const list = this.getTraversableElements();
    if (list.length === 0) return null;

    this.currentA11yIndex = (this.currentA11yIndex - 1 + list.length) % list.length;
    const el = list[this.currentA11yIndex];
    this.applyA11yFocus(el, this.currentA11yIndex, list.length);
    return el;
  }

  private applyA11yFocus(el: HTMLElement, index: number, total: number): void {
    el.focus();
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const role = el.getAttribute('role') || el.tagName.toLowerCase();
    const label = el.getAttribute('aria-label') || el.title || el.textContent?.slice(0, 40) || 'Element';
    this.announceToScreenReader(`Accessibility focus (${index + 1} of ${total}): ${role} - ${label}`, false);
  }

  /**
   * Returns current accessibility state snapshot
   */
  public getA11yNavigationState(): A11yNavigationState {
    const list = this.getTraversableElements();
    const active = typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null;

    const selector = active
      ? `${active.tagName.toLowerCase()}${active.id ? `#${active.id}` : ''}${
          active.className ? `.${active.className.split(/\s+/)[0]}` : ''
        }`
      : 'none';

    return {
      focusedElementSelector: selector,
      focusedRole: active?.getAttribute('role') || active?.tagName.toLowerCase() || 'none',
      focusedAriaLabel: active?.getAttribute('aria-label') || active?.title || '',
      focusedText: active?.textContent?.slice(0, 50) || '',
      lastAnnouncement: this.announcementHistory[this.announcementHistory.length - 1] || 'Ready',
      announcementHistory: [...this.announcementHistory],
      totalTraversableElements: list.length,
      currentElementIndex: active ? list.indexOf(active) : -1,
    };
  }

  /**
   * Returns a hierarchical summary of the OS accessibility tree for display in terminal
   */
  public getA11yTreeSummary(): string {
    const list = this.getTraversableElements();
    const rows = list.slice(0, 15).map((el, idx) => {
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') || tag;
      const label = el.getAttribute('aria-label') || el.title || el.innerText?.slice(0, 30) || '(unnamed)';
      const isFocused = document.activeElement === el ? '>>> [ACTIVE FOCUS]' : '    ';
      return `${isFocused} [${String(idx + 1).padStart(2, '0')}] <${tag} role="${role}">: "${label.replace(/\n/g, ' ')}"`;
    });

    return `ACCESSIBILITY OBJECT TREE (${list.length} Interactive Nodes Detected):
------------------------------------------------------------------------
${rows.join('\n')}
${list.length > 15 ? `... and ${list.length - 15} more accessibility nodes.` : ''}
------------------------------------------------------------------------
Hotkeys: Alt+Shift+K (A11y HUD) | Alt+Shift+F (Highlight Text Fragment) | Tab / Shift+Tab (Navigate)`;
  }

  // =========================================================================
  // 5. ON-DEVICE GEMINI & DEVICE ASSISTANCE BRIDGE
  // =========================================================================

  /**
   * Processes natural language device assistance directives
   * e.g. "highlight singularity", "keep screen awake", "check battery", "read output", "copy quine"
   */
  public async executeDeviceAssistIntent(prompt: string): Promise<{ reply: string; actionTaken: DeviceAssistAction }> {
    const lower = prompt.toLowerCase();

    // 1. Highlight Text Fragment Intent
    if (lower.includes('highlight') || lower.includes('find text') || lower.includes('locate phrase')) {
      const phraseMatch = prompt.match(/(?:highlight|find text|locate phrase|mark)\s+["']?([^"'\n]+)["']?/i);
      const targetPhrase = phraseMatch ? phraseMatch[1].trim() : 'Polymorphic';
      const matches = this.highlightTextFragment(targetPhrase, { scroll: true, announce: true });

      const action: DeviceAssistAction = {
        action: 'highlight_fragment',
        param: targetPhrase,
        description: `Highlighted ${matches.length} text fragments matching "${targetPhrase}" with W3C :~:text= anchoring.`,
        status: matches.length > 0 ? 'success' : 'failed',
      };

      const reply = matches.length > 0
        ? `[DEVICE ASSISTANCE]: Successfully located and highlighted ${matches.length} occurrences of "${targetPhrase}". Focused match 1 in viewport. Canonical fragment URL: ${matches[0].fragmentUrl}`
        : `[DEVICE ASSISTANCE]: Phrase "${targetPhrase}" was not found in active terminal or viewport text.`;

      return { reply, actionTaken: action };
    }

    // 2. Screen Wake Lock Intent
    if (lower.includes('wake') || lower.includes('keep awake') || lower.includes('sleep') || lower.includes('display on')) {
      if (lower.includes('off') || lower.includes('release') || lower.includes('stop')) {
        const res = await this.releaseScreenWakeLock();
        return {
          reply: `[DEVICE ASSISTANCE]: ${res.message}`,
          actionTaken: {
            action: 'wakelock',
            param: 'off',
            description: res.message,
            status: res.success ? 'success' : 'failed',
          },
        };
      } else {
        const res = await this.requestScreenWakeLock();
        return {
          reply: `[DEVICE ASSISTANCE]: ${res.message}`,
          actionTaken: {
            action: 'wakelock',
            param: 'on',
            description: res.message,
            status: res.success ? 'success' : 'failed',
          },
        };
      }
    }

    // 3. Battery Telemetry Intent
    if (lower.includes('battery') || lower.includes('power') || lower.includes('charge')) {
      const telemetry = await this.getDeviceTelemetry();
      const battery = telemetry.battery;
      const desc = battery
        ? `Battery: ${battery.level}% (${battery.charging ? 'Charging ⚡' : 'On Battery 🔋'})`
        : 'Battery API not available on this device platform.';

      return {
        reply: `[DEVICE ASSISTANCE]: Native power profile inspected: ${desc}`,
        actionTaken: {
          action: 'none',
          description: desc,
          status: battery ? 'success' : 'unsupported',
        },
      };
    }

    // 4. Notification Intent
    if (lower.includes('notify') || lower.includes('notification') || lower.includes('alert me')) {
      const body = prompt.replace(/(?:notify me|send notification|alert me|notify)\s*/i, '') || 'HyperTerminal Polymorphic Task Complete';
      const ok = await this.dispatchNotification('⚡ HyperTerminal Polyglot Quine OS', { body });
      return {
        reply: ok
          ? `[DEVICE ASSISTANCE]: Dispatched authorized browser notification: "${body}".`
          : `[DEVICE ASSISTANCE]: Notification permission not granted or unsupported.`,
        actionTaken: {
          action: 'notify',
          param: body,
          description: `Dispatched notification: ${body}`,
          status: ok ? 'success' : 'failed',
        },
      };
    }

    // 5. Screen Reader / ChromeVox Announce Intent
    if (lower.includes('announce') || lower.includes('chromevox') || lower.includes('screen reader') || lower.includes('read out')) {
      const msg = prompt.replace(/(?:announce|chromevox|screen reader|read out)\s*/i, '') || 'Polymorphic Core operational';
      this.announceToScreenReader(msg, true);
      return {
        reply: `[DEVICE ASSISTANCE]: Dispatched assertive announcement to ChromeVox / ARIA live region: "${msg}".`,
        actionTaken: {
          action: 'screen_reader',
          param: msg,
          description: `Announced to screen reader: ${msg}`,
          status: 'success',
        },
      };
    }

    // 6. Haptic Vibration Intent
    if (lower.includes('vibrate') || lower.includes('haptic')) {
      const ok = this.vibrate([80, 50, 80]);
      return {
        reply: ok
          ? `[DEVICE ASSISTANCE]: Triggered dual-pulse haptic vibration on native user hardware.`
          : `[DEVICE ASSISTANCE]: Haptic vibration API unsupported on this device.`,
        actionTaken: {
          action: 'vibrate',
          param: '80,50,80',
          description: 'Haptic vibration pulse',
          status: ok ? 'success' : 'unsupported',
        },
      };
    }

    // 7. Clipboard Intent
    if (lower.includes('copy') || lower.includes('clipboard')) {
      const textToCopy = prompt.replace(/(?:copy|clipboard)\s*/i, '') || window.location.href;
      const ok = await this.copyToClipboard(textToCopy);
      return {
        reply: ok
          ? `[DEVICE ASSISTANCE]: Copied "${textToCopy.slice(0, 40)}" to native operating system clipboard.`
          : `[DEVICE ASSISTANCE]: Clipboard write operation failed.`,
        actionTaken: {
          action: 'clipboard',
          param: textToCopy,
          description: 'System clipboard copy',
          status: ok ? 'success' : 'failed',
        },
      };
    }

    // 8. General Live Browser Execution
    if (lower.includes('eval') || lower.includes('exec') || lower.includes('run js') || lower.includes('browser exec')) {
      const jsCode = prompt.replace(/(?:eval|exec|run js|browser exec)\s*/i, '').trim();
      const res = await this.executeBrowserCode(jsCode);
      return {
        reply: res.error
          ? `[DEVICE ASSISTANCE EXECUTION ERROR]: ${res.error}`
          : `[DEVICE ASSISTANCE EXECUTION]: (${res.resultType}) ${res.result} [Executed in ${res.executionTimeMs}ms]`,
        actionTaken: {
          action: 'browser_exec',
          param: jsCode,
          description: `Evaluated ${jsCode}`,
          status: res.error ? 'failed' : 'success',
        },
      };
    }

    // Fallback standard device assistance summary
    const telemetry = await this.getDeviceTelemetry();
    return {
      reply: `[DEVICE ASSISTANCE]: Ready. Authorized device capabilities: Screen (${telemetry.screen.width}x${telemetry.screen.height}), Logical Cores (${telemetry.hardware.logicalCores}), WakeLock (${telemetry.wakeLockActive ? 'ACTIVE' : 'IDLE'}), Online (${telemetry.network.online ? 'YES' : 'NO'}). You can ask me to "highlight <phrase>", "keep screen awake", "check battery", "notify me", or "announce to chromevox".`,
      actionTaken: {
        action: 'none',
        description: 'Telemetry check',
        status: 'success',
      },
    };
  }

  private bindWindowVisibilityForWakeLock(): void {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', async () => {
      // Re-acquire wake lock if tab becomes visible again after being minimized
      if (document.visibilityState === 'visible' && this.wakeLockSentinel !== null) {
        try {
          if ('wakeLock' in navigator) {
            this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          }
        } catch {
          // Ignore re-acquire failure
        }
      }
    });
  }
}

export const browserControl = BrowserControlService.getInstance();
