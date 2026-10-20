import { audioVoiceService } from './audioVoiceService';

interface NavigatorResponse {
  description: string;
  urgency: 'low' | 'medium' | 'high';
  source: string;
}

class NavigatorService {
  private lastNodePath: string = '';
  private isNavigating: boolean = false;
  private lastNavTime: number = 0;
  private MIN_NAV_INTERVAL = 8000; // 8 seconds between voice overs

  public async navigateToNode(
    nodeName: string,
    nodePath: string,
    nodeType: 'file' | 'directory',
    content?: string
  ): Promise<void> {
    const now = Date.now();
    if (this.isNavigating || nodePath === this.lastNodePath || (now - this.lastNavTime < this.MIN_NAV_INTERVAL)) {
      return;
    }

    this.isNavigating = true;
    this.lastNodePath = nodePath;
    this.lastNavTime = now;

    try {
      const response = await fetch('/api/navigator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeName,
          nodePath,
          nodeType,
          contentSnippet: content || ''
        })
      });

      if (!response.ok) throw new Error('Navigator API error');
      const data: NavigatorResponse = await response.json();

      // Trigger TTS via audioVoiceService
      audioVoiceService.speak(data.description);
    } catch (error) {
      console.error('[Navigator Service Error]:', error);
    } finally {
      this.isNavigating = false;
    }
  }

  public reset(): void {
    this.lastNodePath = '';
    this.lastNavTime = 0;
  }
}

export const navigatorService = new NavigatorService();
