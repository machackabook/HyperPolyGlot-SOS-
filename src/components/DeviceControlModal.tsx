import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  X,
  Zap,
  Lock,
  Unlock,
  Battery,
  BatteryCharging,
  Wifi,
  Cpu,
  Monitor,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Terminal,
  Volume2,
  Play,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Eye,
  Keyboard,
  Bell,
  RefreshCw,
} from 'lucide-react';
import {
  DeviceCapabilityTelemetry,
  TextFragmentMatch,
  BrowserExecutionResult,
  A11yNavigationState,
} from '../types';
import { browserControl } from '../services/browserControlService';
import { audioVoiceService } from '../services/audioVoiceService';

interface DeviceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunInTerminal?: (cmd: string) => void;
}

type TabType = 'permissions' | 'fragment' | 'execution' | 'a11y' | 'gemini-assist';

export const DeviceControlModal: React.FC<DeviceControlModalProps> = ({
  isOpen,
  onClose,
  onRunInTerminal,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('permissions');
  const [telemetry, setTelemetry] = useState<DeviceCapabilityTelemetry | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);

  // Text Fragment State
  const [fragmentInput, setFragmentInput] = useState('');
  const [activeMatches, setActiveMatches] = useState<TextFragmentMatch[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Live Browser Execution State
  const [codeSnippet, setCodeSnippet] = useState('document.title');
  const [execResult, setExecResult] = useState<BrowserExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Accessibility State
  const [a11yState, setA11yState] = useState<A11yNavigationState | null>(null);
  const [announceInput, setAnnounceInput] = useState('');
  const [isAssertive, setIsAssertive] = useState(false);

  // Gemini Assist State
  const [assistPrompt, setAssistPrompt] = useState('highlight singularity in terminal');
  const [assistOutput, setAssistOutput] = useState<string | null>(null);
  const [isProcessingAssist, setIsProcessingAssist] = useState(false);

  // Refresh Telemetry
  const refreshTelemetry = async () => {
    setIsLoadingTelemetry(true);
    const data = await browserControl.getDeviceTelemetry();
    setTelemetry(data);
    setA11yState(browserControl.getA11yNavigationState());
    setActiveMatches(browserControl.getActiveFragmentMatches());
    setCurrentMatchIdx(browserControl.getCurrentFragmentIndex());
    setIsLoadingTelemetry(false);
  };

  useEffect(() => {
    if (isOpen) {
      refreshTelemetry();
      audioVoiceService.playTone(960, 'sine', 70);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handlers for Wake Lock
  const handleToggleWakeLock = async () => {
    audioVoiceService.playEnterChirp();
    if (browserControl.isWakeLockActive()) {
      await browserControl.releaseScreenWakeLock();
    } else {
      await browserControl.requestScreenWakeLock();
    }
    await refreshTelemetry();
  };

  // Handlers for Notifications
  const handleTestNotification = async () => {
    audioVoiceService.playTone(1200, 'sine', 90);
    const ok = await browserControl.dispatchNotification('⚡ HyperTerminal Polyglot Quine OS', {
      body: 'Authorized browser device control active. Screen wake lock & neural sync engaged.',
    });
    if (!ok) {
      alert('Notification permission not granted. Request permission in browser settings.');
    }
    await refreshTelemetry();
  };

  // Handlers for Haptics
  const handleTestVibration = () => {
    audioVoiceService.playTone(440, 'triangle', 80);
    const ok = browserControl.vibrate([60, 40, 60]);
    if (!ok) {
      browserControl.announceToScreenReader('Haptic vibration not supported on this platform.');
    }
  };

  // Handlers for Text Fragment
  const handleSearchFragment = (phrase?: string) => {
    const target = phrase || fragmentInput;
    if (!target) return;
    audioVoiceService.playEnterChirp();
    const matches = browserControl.highlightTextFragment(target, { scroll: true, announce: true });
    setActiveMatches(matches);
    setCurrentMatchIdx(matches.length > 0 ? 0 : -1);
  };

  const handleNextFragment = () => {
    audioVoiceService.playTone(700, 'sine', 40);
    browserControl.nextFragment();
    setCurrentMatchIdx(browserControl.getCurrentFragmentIndex());
  };

  const handlePrevFragment = () => {
    audioVoiceService.playTone(600, 'sine', 40);
    browserControl.prevFragment();
    setCurrentMatchIdx(browserControl.getCurrentFragmentIndex());
  };

  const handleClearFragments = () => {
    audioVoiceService.playTone(300, 'sine', 50);
    browserControl.clearTextFragments();
    setActiveMatches([]);
    setCurrentMatchIdx(-1);
  };

  const handleCopyFragmentUrl = async () => {
    if (!fragmentInput) return;
    const url = browserControl.generateFragmentUrl(fragmentInput);
    const ok = await browserControl.copyToClipboard(url);
    if (ok) {
      audioVoiceService.playTone(880, 'sine', 50);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // Handlers for Live Browser Execution
  const handleExecuteBrowserCode = async () => {
    if (!codeSnippet.trim()) return;
    setIsExecuting(true);
    audioVoiceService.playEnterChirp();
    const res = await browserControl.executeBrowserCode(codeSnippet);
    setExecResult(res);
    setIsExecuting(false);
  };

  // Handlers for Accessibility Navigation
  const handleA11yTabNext = () => {
    audioVoiceService.playTone(650, 'sine', 40);
    browserControl.focusNextA11yElement();
    setA11yState(browserControl.getA11yNavigationState());
  };

  const handleA11yTabPrev = () => {
    audioVoiceService.playTone(550, 'sine', 40);
    browserControl.focusPrevA11yElement();
    setA11yState(browserControl.getA11yNavigationState());
  };

  const handleSendA11yAnnouncement = () => {
    if (!announceInput.trim()) return;
    audioVoiceService.playTone(880, 'sine', 60);
    browserControl.announceToScreenReader(announceInput, isAssertive);
    setAnnounceInput('');
    setA11yState(browserControl.getA11yNavigationState());
  };

  // Handlers for Gemini Device Assistance
  const handleRunAssistIntent = async (override?: string) => {
    const text = override || assistPrompt;
    if (!text.trim()) return;
    setIsProcessingAssist(true);
    audioVoiceService.playEnterChirp();
    const res = await browserControl.executeDeviceAssistIntent(text);
    setAssistOutput(res.reply);
    setIsProcessingAssist(false);
    await refreshTelemetry();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-control-title"
    >
      <div className="device-control-panel relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#050b14]/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden font-mono text-slate-200">
        {/* Holographic Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/30 bg-slate-900/60 select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="device-control-title" className="text-sm font-bold tracking-wider text-cyan-300">
                  DEVICE CONTROL &amp; ACCESSIBILITY SUBSYSTEM
                </h2>
                <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded-full">
                  SOVEREIGN HOST
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Live Browser Execution</span>
                <span>•</span>
                <span>W3C Text Fragments (:~:text=)</span>
                <span>•</span>
                <span>ChromeVox ARIA Live</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshTelemetry}
              disabled={isLoadingTelemetry}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-950 hover:text-cyan-300 text-slate-400 border border-slate-700/50 transition-all cursor-pointer"
              title="Refresh Device Telemetry"
              aria-label="Refresh Device Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingTelemetry ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-700/50 transition-all cursor-pointer"
              title="Close Panel (Escape)"
              aria-label="Close Device Control Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Telemetry Bar */}
        {telemetry && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 text-[10.5px]">
            <div className="flex items-center gap-2">
              {telemetry.battery ? (
                <>
                  {telemetry.battery.charging ? (
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Battery className="w-4 h-4 text-cyan-400" />
                  )}
                  <span>
                    BATTERY: <span className="text-cyan-300 font-bold">{telemetry.battery.level}%</span>
                  </span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400">POWER: AC MAINS</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Lock className={`w-4 h-4 ${telemetry.wakeLockActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>
                WAKE LOCK:{' '}
                <span className={telemetry.wakeLockActive ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                  {telemetry.wakeLockActive ? 'ACTIVE' : 'IDLE'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-fuchsia-400" />
              <span>
                CORES: <span className="text-fuchsia-300 font-bold">{telemetry.hardware.logicalCores}</span>
                {telemetry.hardware.deviceMemoryGb && (
                  <span className="text-slate-400"> ({telemetry.hardware.deviceMemoryGb}GB)</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <span>
                DISPLAY:{' '}
                <span className="text-slate-300">
                  {telemetry.screen.width}x{telemetry.screen.height}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="truncate">
                AI:{' '}
                <span className="text-emerald-300 font-semibold">
                  {telemetry.onDeviceAI.modelAvailable ? 'NANO ACTIVE' : 'HYBRID'}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-900/40 overflow-x-auto select-none">
          <button
            onClick={() => {
              setActiveTab('permissions');
              audioVoiceService.playTone(500, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Device Permissions</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('fragment');
              audioVoiceService.playTone(550, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'fragment'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Text Fragments (:~:text=)</span>
            {activeMatches.length > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] bg-cyan-900 text-cyan-200 rounded-full font-bold">
                {activeMatches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('execution');
              audioVoiceService.playTone(600, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'execution'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live Browser Execution</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('a11y');
              audioVoiceService.playTone(650, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'a11y'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Accessibility &amp; ChromeVox</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('gemini-assist');
              audioVoiceService.playTone(700, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'gemini-assist'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>On-Device Gemini Assist</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[60vh]">
          {/* TAB 1: PERMISSIONS & HARDWARE */}
          {activeTab === 'permissions' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-cyan-300 tracking-wider">
                    AUTHORIZED DEVICE PERMISSIONS &amp; HARDWARE CONTROL
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Direct access to native user device APIs authorized in modern Chromium / ChromeVox runtimes.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleWakeLock}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                      browserControl.isWakeLockActive()
                        ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-800/80 hover:bg-slate-700 border-slate-600 text-slate-300'
                    }`}
                  >
                    {browserControl.isWakeLockActive() ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Release Wake Lock</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Keep Screen Awake</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {telemetry && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Permission: Microphone */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Microphone Audio</span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.permissions.microphone === 'granted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.permissions.microphone}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Real-time audio input for border waveform oscilloscope and voice recognition.
                    </p>
                  </div>

                  {/* Permission: Clipboard */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Clipboard Read/Write</span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.permissions.clipboardWrite === 'granted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.permissions.clipboardWrite}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Enables copying text fragments, quine standalone HTML, and logs to system clipboard.
                    </p>
                  </div>

                  {/* Permission: Notifications */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">System Notifications</span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.permissions.notifications === 'granted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {telemetry.permissions.notifications}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Background operational alerts and Gemini completion broadcasts.
                    </p>
                  </div>

                  {/* Permission: Wake Lock */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Screen Wake Lock</span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.wakeLockActive
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.wakeLockActive ? 'LOCKED' : 'AVAILABLE'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Prevents display sleep during long neural generation or quine execution.
                    </p>
                  </div>

                  {/* Hardware Haptics */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Haptic Vibration</span>
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        SUPPORTED
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Physical haptic feedback pulse on mobile/touchscreen/ChromeOS devices.
                    </p>
                  </div>

                  {/* Screen Fullscreen */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Native Fullscreen</span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.screen.fullscreen
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.screen.fullscreen ? 'ENGAGED' : 'WINDOWED'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Unobstructed sovereign terminal view across full display hardware.
                    </p>
                  </div>
                </div>
              )}

              {/* Hardware Quick Action Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={handleTestNotification}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Dispatch Test Notification</span>
                </button>

                <button
                  onClick={handleTestVibration}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Trigger Haptic Vibration</span>
                </button>

                <button
                  onClick={() => browserControl.toggleFullscreen()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Toggle Fullscreen</span>
                </button>

                <button
                  onClick={async () => {
                    const t = await browserControl.getDeviceTelemetry();
                    await browserControl.copyToClipboard(JSON.stringify(t, null, 2));
                    audioVoiceService.playTone(880, 'sine', 50);
                    alert('Copied Device Telemetry JSON to clipboard!');
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Telemetry JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TEXT FRAGMENTS (:~:text=) */}
          {activeTab === 'fragment' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-cyan-300 tracking-wider">
                  W3C SCROLL-TO-TEXT FRAGMENT ENGINE (`:~:text=`)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Target, highlight, and anchor exact phrases in the terminal, VFS documents, and DOM with smooth viewport auto-centering and accessibility announcements.
                </p>
              </div>

              {/* Fragment Input Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={fragmentInput}
                    onChange={(e) => setFragmentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchFragment();
                    }}
                    placeholder="Enter text fragment to highlight (e.g. Polymorphic, singularity, 963)..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-cyan-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <button
                  onClick={() => handleSearchFragment()}
                  className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Highlight &amp; Anchor</span>
                </button>

                {activeMatches.length > 0 && (
                  <button
                    onClick={handleClearFragments}
                    className="p-2 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition-all cursor-pointer"
                    title="Clear Fragment Highlights"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sample Quick Fragment Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-500">Quick Anchors:</span>
                {['Polymorphic', 'Singularity', '963 Hz', 'Satcom', 'VFS', 'Torus Knot'].map((pill) => (
                  <button
                    key={pill}
                    onClick={() => {
                      setFragmentInput(pill);
                      handleSearchFragment(pill);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all"
                  >
                    "{pill}"
                  </button>
                ))}
              </div>

              {/* Results & Navigation Controls */}
              {activeMatches.length > 0 ? (
                <div className="p-4 bg-slate-900/70 border border-cyan-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded-full">
                        MATCH {currentMatchIdx + 1} OF {activeMatches.length}
                      </span>
                      <span className="text-xs text-slate-300">
                        Active Fragment: <strong className="text-cyan-400">"{activeMatches[0].text}"</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handlePrevFragment}
                        className="p-1 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 cursor-pointer"
                        title="Previous Match"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextFragment}
                        className="p-1 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 cursor-pointer"
                        title="Next Match"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Canonical Fragment URL preview */}
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                    <div className="truncate text-slate-400 font-mono">
                      <span className="text-cyan-400">W3C URL: </span>
                      <span>{activeMatches[0].fragmentUrl}</span>
                    </div>
                    <button
                      onClick={handleCopyFragmentUrl}
                      className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  </div>

                  {/* Match Snippets */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {activeMatches.slice(0, 5).map((m, idx) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          browserControl.jumpToMatch(idx);
                          setCurrentMatchIdx(idx);
                        }}
                        className={`w-full text-left p-2 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                          currentMatchIdx === idx
                            ? 'bg-cyan-950/60 border-cyan-400/80 text-cyan-200'
                            : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-cyan-500 font-bold mr-2">#{idx + 1}</span>
                        <span>...{m.fullSnippet}...</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                  <Search className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No active text fragment highlighted.</p>
                  <p className="text-[10.5px] text-slate-500">
                    Type a query above or run <code className="text-cyan-400">fragment search &lt;text&gt;</code> in the terminal.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE BROWSER EXECUTION */}
          {activeTab === 'execution' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-cyan-300 tracking-wider">
                  LIVE BROWSER JAVASCRIPT &amp; DOM EXECUTION RUNTIME
                </h3>
                <p className="text-[11px] text-slate-400">
                  Safely execute browser expressions, inspect live window state, read local storage, and dispatch DOM events with microsecond precision.
                </p>
              </div>

              {/* Code Snippet Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">JavaScript Expression or Script:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Snippets:</span>
                    {[
                      { label: 'Title', code: 'document.title' },
                      { label: 'Screen', code: 'window.innerWidth + "x" + window.innerHeight' },
                      { label: 'UserAgent', code: 'navigator.userAgent' },
                      { label: 'Storage', code: 'Object.keys(localStorage)' },
                      { label: 'Marks', code: '$$(".os-text-fragment-highlight").length' },
                    ].map((snip) => (
                      <button
                        key={snip.label}
                        onClick={() => setCodeSnippet(snip.code)}
                        className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-300 border border-slate-800 cursor-pointer"
                      >
                        {snip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        handleExecuteBrowserCode();
                      }
                    }}
                    rows={4}
                    className="w-full p-3 bg-slate-950 font-mono text-xs text-cyan-300 border border-cyan-500/40 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="Enter JavaScript expression (e.g. document.title, location.href, performance.now())..."
                  />
                  <div className="absolute right-3 bottom-3 text-[10px] text-slate-500 select-none">
                    Ctrl + Enter to Run
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={handleExecuteBrowserCode}
                    disabled={isExecuting}
                    className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isExecuting ? 'Executing...' : 'Run in Browser Context'}</span>
                  </button>

                  {onRunInTerminal && (
                    <button
                      onClick={() => {
                        onRunInTerminal(`browser exec ${codeSnippet}`);
                        onClose();
                      }}
                      className="text-xs text-slate-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      Send to Terminal Console
                    </button>
                  )}
                </div>
              </div>

              {/* Execution Result Log */}
              {execResult && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono">
                  <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Execution Result:</span>
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                          execResult.error ? 'bg-rose-950 text-rose-300' : 'bg-cyan-950 text-cyan-300'
                        }`}
                      >
                        {execResult.resultType}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[10px]">{execResult.executionTimeMs} ms</span>
                  </div>

                  {execResult.error ? (
                    <div className="text-xs text-rose-400 font-bold bg-rose-950/30 p-2.5 rounded border border-rose-500/30">
                      Error: {execResult.error}
                    </div>
                  ) : (
                    <pre className="text-xs text-cyan-200 overflow-x-auto whitespace-pre-wrap max-h-40 bg-slate-900/50 p-2 rounded">
                      {String(execResult.result)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACCESSIBILITY & CHROMEVOX */}
          {activeTab === 'a11y' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-cyan-300 tracking-wider">
                  BACKEND ACCESSIBILITY KEYBOARD ACCESS &amp; CHROMEVOX SUB-TIER
                </h3>
                <p className="text-[11px] text-slate-400">
                  Comprehensive keyboard traversal, active element inspection, and dedicated ARIA live broadcast regions (<code className="text-cyan-400">aria-live="polite"</code> and <code className="text-fuchsia-400">"assertive"</code>).
                </p>
              </div>

              {/* Accessibility Focus Navigator Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                    <span>ACCESSIBILITY TREE WALKER</span>
                    <span className="text-[10px] text-slate-400">
                      {a11yState ? `${a11yState.totalTraversableElements} Interactive Nodes` : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Navigate through focusable elements programmatically, triggering native screen reader updates.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleA11yTabPrev}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Shift + Tab</span>
                    </button>
                    <button
                      onClick={handleA11yTabNext}
                      className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                    >
                      <span>Tab (Focus Next)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                    <span>ACTIVE FOCUSED ELEMENT</span>
                  </div>
                  {a11yState && (
                    <div className="text-[11px] space-y-1">
                      <div>
                        <span className="text-slate-500">Selector: </span>
                        <code className="text-cyan-300 font-bold">{a11yState.focusedElementSelector}</code>
                      </div>
                      <div>
                        <span className="text-slate-500">Role: </span>
                        <span className="text-fuchsia-300">{a11yState.focusedRole}</span>
                      </div>
                      {a11yState.focusedAriaLabel && (
                        <div>
                          <span className="text-slate-500">ARIA Label: </span>
                          <span className="text-emerald-300">"{a11yState.focusedAriaLabel}"</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Screen Reader Broadcast Dispatcher */}
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>BROADCAST TO CHROMEVOX / SCREEN READER</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAssertive}
                      onChange={(e) => setIsAssertive(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-400 focus:ring-0"
                    />
                    <span>Assertive Priority (Interrupts Speech)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={announceInput}
                    onChange={(e) => setAnnounceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendA11yAnnouncement();
                    }}
                    placeholder="Enter announcement phrase for ChromeVox..."
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleSendA11yAnnouncement}
                    className="px-3.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Broadcast
                  </button>
                </div>
              </div>

              {/* Announcement History Log */}
              {a11yState && a11yState.announcementHistory.length > 0 && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400">Recent ChromeVox Broadcasts:</span>
                  <div className="space-y-1 max-h-28 overflow-y-auto text-[10.5px] text-slate-300 font-mono">
                    {a11yState.announcementHistory.slice(-5).map((log: string, i: number) => (
                      <div key={i} className="text-cyan-200/90 truncate">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ON-DEVICE GEMINI ASSIST */}
          {activeTab === 'gemini-assist' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-fuchsia-300 tracking-wider">
                  ON-DEVICE GEMINI ASSISTANT &amp; DEVICE CONTROL INTENT BRIDGE
                </h3>
                <p className="text-[11px] text-slate-400">
                  Allow on-device Gemini to iteratively parse natural language commands, execute authorized browser controls, highlight text fragments, and maintain screen wake lock seamlessly.
                </p>
              </div>

              {/* Sample Intent Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400">Sample Autonomous Directives:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { title: 'Highlight Text Fragment', prompt: 'highlight singularity in terminal' },
                    { title: 'Display Wake Lock', prompt: 'keep screen awake and check battery' },
                    { title: 'ChromeVox Broadcast', prompt: 'announce Polymorphic Neural Substrate ready' },
                    { title: 'Live Browser Exec', prompt: 'exec document.title + " | " + window.innerWidth' },
                  ].map((item) => (
                    <button
                      key={item.title}
                      onClick={() => {
                        setAssistPrompt(item.prompt);
                        handleRunAssistIntent(item.prompt);
                      }}
                      className="p-2.5 text-left rounded-xl bg-slate-900/60 hover:bg-fuchsia-950/40 border border-slate-800 hover:border-fuchsia-500/50 transition-all cursor-pointer space-y-1"
                    >
                      <div className="text-xs font-bold text-fuchsia-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                        <span>{item.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">"{item.prompt}"</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt Box */}
              <div className="space-y-2 pt-2">
                <div className="relative">
                  <input
                    type="text"
                    value={assistPrompt}
                    onChange={(e) => setAssistPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRunAssistIntent();
                    }}
                    placeholder="Tell Gemini what to do on this device (e.g. highlight torus, keep awake, check battery)..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 font-mono text-xs text-white border border-fuchsia-500/40 rounded-xl focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleRunAssistIntent()}
                    disabled={isProcessingAssist}
                    className="px-4 py-2 bg-fuchsia-950 hover:bg-fuchsia-900 text-fuchsia-200 border border-fuchsia-500/50 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(217,70,239,0.3)]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isProcessingAssist ? 'Processing Intent...' : 'Dispatch Assistant Directive'}</span>
                  </button>
                </div>
              </div>

              {/* Assistant Output */}
              {assistOutput && (
                <div className="p-3.5 bg-slate-950 border border-fuchsia-500/30 rounded-xl space-y-1.5 animate-in fade-in">
                  <span className="text-[11px] font-bold text-fuchsia-300">Device Assistant Output:</span>
                  <p className="text-xs text-slate-200 font-mono whitespace-pre-wrap">{assistOutput}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] select-none text-slate-400">
          <div className="flex items-center gap-3">
            <span>Hotkeys: Alt+Shift+D (HUD)</span>
            <span>•</span>
            <span>Alt+Shift+F (Fragment)</span>
            <span>•</span>
            <span>Tab / Shift+Tab (A11y)</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
