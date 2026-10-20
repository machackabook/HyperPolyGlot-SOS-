/**
 * AudioVoiceService - Real-time Web Audio, 963Hz Oscillator, Audio Analyser,
 * Microphone Stream Input & Speech Recognition for Voice Commands
 */

export interface MicrophoneAudioData {
  volume: number;
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  isSpeaking: boolean;
}

export interface VoiceAudioData {
  volume: number;
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  isSpeaking: boolean;
  activeText: string;
  profile: string;
  carrierFreq: number;
}

class AudioVoiceService {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private solfeggioOsc: OscillatorNode | null = null;
  private solfeggioGain: GainNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private is963Active = false;
  private isVoiceEnabled = true;
  private pitch = 1.0;
  private rate = 1.05;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private speechListeners: ((speaking: boolean, text: string) => void)[] = [];
  private speechLogListeners: ((text: string) => void)[] = [];

  // Dedicated AI Voice Output Web Audio Stream & Analyser
  private voiceAnalyser: AnalyserNode | null = null;
  private voiceFrequencyData: Uint8Array | null = null;
  private voiceWaveformData: Uint8Array | null = null;
  private isVoiceSpeaking = false;
  private currentSpokenText = '';
  private voiceCarrierOsc: OscillatorNode | null = null;
  private voiceFormantFilter: BiquadFilterNode | null = null;
  private voiceCarrierGain: GainNode | null = null;
  private voiceAnimTimer: any = null;
  private voiceSynthTime = 0;
  private combinedFrequencyBuffer: Uint8Array | null = null;

  // Microphone state & audio nodes
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private isMicActive = false;
  private micFrequencyData: Uint8Array | null = null;
  private micWaveformData: Uint8Array | null = null;
  private micListeners: ((active: boolean, level: number) => void)[] = [];
  private recognition: any = null;
  private isRecognizing = false;
  private transcriptListeners: ((transcript: string, isFinal: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoice();
      };
      this.loadVoice();
    }
  }

  private loadVoice(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer English natural voices if available
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];
    if (preferred) {
      this.selectedVoice = preferred;
    }
  }

  public initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.85;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public toggle963(forceState?: boolean): boolean {
    const ctx = this.initContext();
    const target = forceState !== undefined ? forceState : !this.is963Active;

    if (target) {
      if (this.solfeggioOsc) {
        this.solfeggioOsc.stop();
        this.solfeggioOsc.disconnect();
      }
      this.solfeggioOsc = ctx.createOscillator();
      this.solfeggioGain = ctx.createGain();

      this.solfeggioOsc.type = 'sine';
      this.solfeggioOsc.frequency.setValueAtTime(963, ctx.currentTime);

      // Soft harmonic envelope
      this.solfeggioGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.solfeggioGain.gain.exponentialRampToValueAtTime(0.028, ctx.currentTime + 1.2);

      this.solfeggioOsc.connect(this.solfeggioGain);
      if (this.analyser) {
        this.solfeggioGain.connect(this.analyser);
      }
      this.solfeggioGain.connect(ctx.destination);

      this.solfeggioOsc.start();
      this.is963Active = true;
    } else {
      if (this.solfeggioGain && this.audioCtx) {
        this.solfeggioGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.4);
        setTimeout(() => {
          if (this.solfeggioOsc) {
            this.solfeggioOsc.stop();
            this.solfeggioOsc.disconnect();
            this.solfeggioOsc = null;
          }
        }, 450);
      }
      this.is963Active = false;
    }
    return this.is963Active;
  }

  public getAudioFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.frequencyData) return null;
    (this.analyser as any).getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  // =========================================================================
  // AI VOICE RESPONSE OUTPUT WEB AUDIO STREAM & REAL-TIME ANALYSER
  // =========================================================================

  private initVoiceAnalyser(): AnalyserNode {
    const ctx = this.initContext();
    if (!this.voiceAnalyser) {
      this.voiceAnalyser = ctx.createAnalyser();
      this.voiceAnalyser.fftSize = 256;
      this.voiceAnalyser.smoothingTimeConstant = 0.75;
      this.voiceFrequencyData = new Uint8Array(this.voiceAnalyser.frequencyBinCount);
      this.voiceWaveformData = new Uint8Array(this.voiceAnalyser.fftSize);
    }
    return this.voiceAnalyser;
  }

  public startVoiceAudioStream(text: string): void {
    const ctx = this.initContext();
    const analyser = this.initVoiceAnalyser();
    this.isVoiceSpeaking = true;
    this.currentSpokenText = text;
    this.voiceSynthTime = 0;

    const profile = this.getCurrentProfile();
    const carrier = profile?.carrierFreq || 432;

    try {
      this.stopVoiceAudioStream();

      // Create carrier oscillator and dual resonant formant filters
      const osc = ctx.createOscillator();
      const formant1 = ctx.createBiquadFilter();
      const formant2 = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(carrier * (this.pitch || 1.0), ctx.currentTime);

      formant1.type = 'bandpass';
      formant1.frequency.setValueAtTime(800, ctx.currentTime);
      formant1.Q.setValueAtTime(3.0, ctx.currentTime);

      formant2.type = 'bandpass';
      formant2.frequency.setValueAtTime(2200, ctx.currentTime);
      formant2.Q.setValueAtTime(4.0, ctx.currentTime);

      // Subtle vocal presence gain
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 0.08);

      osc.connect(formant1);
      formant1.connect(formant2);
      formant2.connect(gain);

      // Connect to voice analyser & master analyser
      gain.connect(analyser);
      if (this.analyser) {
        gain.connect(this.analyser);
      }
      // Connect to audio destination at subtle level
      gain.connect(ctx.destination);

      osc.start();

      this.voiceCarrierOsc = osc;
      this.voiceFormantFilter = formant1;
      this.voiceCarrierGain = gain;

      // Modulation loop to simulate human formant movement across phonemes
      let step = 0;
      const words = text.split(/\s+/);
      const totalWords = Math.max(1, words.length);

      if (this.voiceAnimTimer) clearInterval(this.voiceAnimTimer);
      this.voiceAnimTimer = setInterval(() => {
        if (!this.isVoiceSpeaking || !this.voiceCarrierOsc || !this.voiceCarrierGain || !this.voiceFormantFilter) {
          if (this.voiceAnimTimer) clearInterval(this.voiceAnimTimer);
          return;
        }

        step++;
        this.voiceSynthTime += 0.05;
        const now = ctx.currentTime;
        const currentWord = words[Math.floor(step / 6) % totalWords] || 'voice';

        // Modulate formant filter based on vowel sounds in active word
        const vowels = (currentWord.match(/[aeiou]/gi) || []).length;
        const baseF1 = 450 + (vowels % 4) * 280 + Math.sin(step * 0.4) * 120;
        const targetPitch = carrier * (this.pitch || 1.0) * (1 + Math.sin(step * 0.25) * 0.08);

        this.voiceCarrierOsc.frequency.setTargetAtTime(targetPitch, now, 0.04);
        this.voiceFormantFilter.frequency.setTargetAtTime(baseF1, now, 0.05);

        // Syllable volume envelope dip and rise
        const syllableVol = 0.012 + Math.abs(Math.sin(step * 0.6)) * 0.015;
        this.voiceCarrierGain.gain.setTargetAtTime(syllableVol, now, 0.03);
      }, 50);

    } catch (e) {
      console.warn('Voice Web Audio stream initialization note:', e);
    }
  }

  public stopVoiceAudioStream(): void {
    if (this.voiceAnimTimer) {
      clearInterval(this.voiceAnimTimer);
      this.voiceAnimTimer = null;
    }

    if (this.voiceCarrierGain && this.audioCtx) {
      try {
        this.voiceCarrierGain.gain.setTargetAtTime(0.0001, this.audioCtx.currentTime, 0.05);
      } catch {}
    }

    if (this.voiceCarrierOsc) {
      try {
        this.voiceCarrierOsc.stop(this.audioCtx ? this.audioCtx.currentTime + 0.08 : 0);
        this.voiceCarrierOsc.disconnect();
      } catch {}
      this.voiceCarrierOsc = null;
    }

    this.voiceFormantFilter = null;
    this.voiceCarrierGain = null;
    this.isVoiceSpeaking = false;
    this.currentSpokenText = '';
  }

  public getVoiceAudioData(): VoiceAudioData | null {
    if (!this.isVoiceSpeaking && !this.isMicActive) {
      return null;
    }

    const profile = this.getCurrentProfile();
    const carrierFreq = profile?.carrierFreq || 432;

    if (this.voiceAnalyser && this.voiceFrequencyData && this.voiceWaveformData) {
      (this.voiceAnalyser as any).getByteFrequencyData(this.voiceFrequencyData);
      (this.voiceAnalyser as any).getByteTimeDomainData(this.voiceWaveformData);

      // Compute RMS volume
      let sum = 0;
      for (let i = 0; i < this.voiceWaveformData.length; i++) {
        const norm = (this.voiceWaveformData[i] - 128) / 128;
        sum += norm * norm;
      }
      const rms = Math.sqrt(sum / this.voiceWaveformData.length);
      const volume = Math.min(1.0, rms * 5.2);

      return {
        volume,
        frequencyData: this.voiceFrequencyData,
        waveformData: this.voiceWaveformData,
        isSpeaking: this.isVoiceSpeaking,
        activeText: this.currentSpokenText,
        profile: profile.name,
        carrierFreq,
      };
    } else {
      // Synthetic acoustic fallback for headless / server / isolated canvas
      if (!this.voiceFrequencyData) this.voiceFrequencyData = new Uint8Array(128);
      if (!this.voiceWaveformData) this.voiceWaveformData = new Uint8Array(256);

      this.voiceSynthTime += 0.06;
      const t = this.voiceSynthTime;
      const voiceVol = this.isVoiceSpeaking ? (0.35 + Math.sin(t * 4.2) * 0.25) : 0;

      for (let i = 0; i < this.voiceWaveformData.length; i++) {
        const wave = Math.sin(t * 12 + i * 0.14) * 55 * voiceVol + Math.cos(t * 5 + i * 0.28) * 30 * voiceVol;
        this.voiceWaveformData[i] = Math.max(0, Math.min(255, Math.floor(128 + wave)));
      }
      for (let i = 0; i < this.voiceFrequencyData.length; i++) {
        const freqVal = (Math.sin(t * 3.5 + i * 0.18) * 0.5 + 0.5) * 210 * voiceVol;
        this.voiceFrequencyData[i] = Math.floor(freqVal);
      }

      return {
        volume: voiceVol,
        frequencyData: this.voiceFrequencyData,
        waveformData: this.voiceWaveformData,
        isSpeaking: this.isVoiceSpeaking,
        activeText: this.currentSpokenText,
        profile: profile.name,
        carrierFreq,
      };
    }
  }

  public isAiSpeaking(): boolean {
    return this.isVoiceSpeaking;
  }

  public getActiveSpeechText(): string {
    return this.currentSpokenText;
  }

  public getCombinedAudioFrequencyData(): Uint8Array | null {
    if (!this.combinedFrequencyBuffer) {
      this.combinedFrequencyBuffer = new Uint8Array(128);
    }

    const voiceData = this.getVoiceAudioData();
    const micData = this.isMicActive ? this.getMicrophoneAudioData() : null;
    const baseAudio = this.getAudioFrequencyData();

    // Fast blend into combinedFrequencyBuffer
    for (let i = 0; i < 128; i++) {
      let maxVal = 0;
      if (voiceData && voiceData.isSpeaking && voiceData.frequencyData) {
        maxVal = Math.max(maxVal, voiceData.frequencyData[i] || 0);
      }
      if (micData && micData.isSpeaking && micData.frequencyData) {
        maxVal = Math.max(maxVal, micData.frequencyData[i] || 0);
      }
      if (baseAudio) {
        maxVal = Math.max(maxVal, baseAudio[i] || 0);
      }
      this.combinedFrequencyBuffer[i] = maxVal;
    }

    return this.combinedFrequencyBuffer;
  }

  // =========================================================================
  // MICROPHONE INPUT & REAL-TIME AUDIO WAVEFORM ANALYSIS
  // =========================================================================

  private isSyntheticMic = false;
  private syntheticTime = 0;

  public async startMicrophone(): Promise<boolean> {
    const ctx = this.initContext();

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        this.micStream = stream;
        this.micSourceNode = ctx.createMediaStreamSource(stream);

        // Dedicated Analyser for microphone with 256 bins for smooth perimeter waveforms
        this.micAnalyser = ctx.createAnalyser();
        this.micAnalyser.fftSize = 256;
        this.micAnalyser.smoothingTimeConstant = 0.8;

        this.micFrequencyData = new Uint8Array(this.micAnalyser.frequencyBinCount);
        this.micWaveformData = new Uint8Array(this.micAnalyser.fftSize);

        this.micSourceNode.connect(this.micAnalyser);

        this.isSyntheticMic = false;
        this.isMicActive = true;
        this.notifyMicChange(true, 0);

        this.initSpeechRecognition();
        return true;
      }
    } catch (err) {
      console.warn('Physical microphone unavailable, engaging synthetic acoustic analyzer:', err);
    }

    // Graceful acoustic fallback mode: creates active 256-bin buffers
    this.micFrequencyData = new Uint8Array(128);
    this.micWaveformData = new Uint8Array(256);
    this.isSyntheticMic = true;
    this.isMicActive = true;
    this.notifyMicChange(true, 0.4);

    return true;
  }

  public stopMicrophone(): void {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micSourceNode) {
      this.micSourceNode.disconnect();
      this.micSourceNode = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.isRecognizing = false;
    }
    this.isMicActive = false;
    this.isSyntheticMic = false;
    this.notifyMicChange(false, 0);
  }

  public toggleMicrophone(): Promise<boolean> {
    if (this.isMicActive) {
      this.stopMicrophone();
      return Promise.resolve(false);
    } else {
      return this.startMicrophone();
    }
  }

  public isMicrophoneActive(): boolean {
    return this.isMicActive;
  }

  /**
   * Retrieves real-time microphone waveform and frequency data,
   * calculating speech intensity level (0.0 to 1.0)
   */
  public getMicrophoneAudioData(): MicrophoneAudioData | null {
    if (!this.isMicActive || !this.micFrequencyData || !this.micWaveformData) {
      return null;
    }

    if (!this.isSyntheticMic && this.micAnalyser) {
      (this.micAnalyser as any).getByteFrequencyData(this.micFrequencyData);
      (this.micAnalyser as any).getByteTimeDomainData(this.micWaveformData);

      // Calculate RMS volume level
      let sum = 0;
      for (let i = 0; i < this.micWaveformData.length; i++) {
        const normalized = (this.micWaveformData[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / this.micWaveformData.length);
      const volume = Math.min(1.0, rms * 4.5);
      const isSpeaking = volume > 0.08;

      return {
        volume,
        frequencyData: this.micFrequencyData,
        waveformData: this.micWaveformData,
        isSpeaking,
      };
    } else {
      // Synthetic acoustic voice oscillation for simulated/headless environments
      this.syntheticTime += 0.05;
      const t = this.syntheticTime;
      const voiceVol = 0.35 + Math.sin(t * 3.5) * 0.25 + (Math.sin(t * 8.2) > 0.3 ? 0.3 : 0);

      for (let i = 0; i < this.micWaveformData.length; i++) {
        const wave = Math.sin(t * 14 + i * 0.12) * 48 * voiceVol + Math.cos(t * 6 + i * 0.25) * 25 * voiceVol;
        this.micWaveformData[i] = Math.max(0, Math.min(255, Math.floor(128 + wave)));
      }
      for (let i = 0; i < this.micFrequencyData.length; i++) {
        this.micFrequencyData[i] = Math.floor((Math.sin(t * 4 + i * 0.2) * 0.5 + 0.5) * 180 * voiceVol);
      }

      return {
        volume: voiceVol,
        frequencyData: this.micFrequencyData,
        waveformData: this.micWaveformData,
        isSpeaking: voiceVol > 0.2,
      };
    }
  }

  // =========================================================================
  // SPEECH RECOGNITION (VOICE-TO-COMMAND INTERFACE)
  // =========================================================================

  private initSpeechRecognition(): void {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          this.notifyTranscript(final.trim(), true);
        } else if (interim) {
          this.notifyTranscript(interim.trim(), false);
        }
      };

      this.recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('Speech recognition error:', e.error);
        }
      };

      this.recognition.onend = () => {
        // Automatically restart speech recognition while mic is active
        if (this.isMicActive && this.recognition) {
          try {
            this.recognition.start();
          } catch {}
        } else {
          this.isRecognizing = false;
        }
      };

      this.recognition.start();
      this.isRecognizing = true;
    } catch (e) {
      console.warn('Failed to start SpeechRecognition:', e);
    }
  }

  public onTranscript(cb: (transcript: string, isFinal: boolean) => void): () => void {
    this.transcriptListeners.push(cb);
    return () => {
      this.transcriptListeners = this.transcriptListeners.filter((l) => l !== cb);
    };
  }

  private notifyTranscript(transcript: string, isFinal: boolean): void {
    this.transcriptListeners.forEach((cb) => cb(transcript, isFinal));
  }

  public onMicChange(cb: (active: boolean, level: number) => void): () => void {
    this.micListeners.push(cb);
    return () => {
      this.micListeners = this.micListeners.filter((l) => l !== cb);
    };
  }

  private notifyMicChange(active: boolean, level: number): void {
    this.micListeners.forEach((cb) => cb(active, level));
  }

  // =========================================================================
  // VOICE PROFILES & ACCESSIBILITY SUBSYSTEM
  // =========================================================================

  private currentProfileId = 'sovereign';
  private announcerListeners: ((message: string, assertive: boolean) => void)[] = [];

  public static readonly PROFILES: Record<string, { id: string; name: string; pitch: number; rate: number; carrierFreq: number; description: string; style: string }> = {
    sovereign: {
      id: 'sovereign',
      name: 'Sovereign Core',
      pitch: 0.95,
      rate: 1.05,
      carrierFreq: 432,
      description: 'Balanced, authoritative neural voice with subtle harmonic undertones',
      style: 'from-cyan-400 to-blue-500',
    },
    quantum: {
      id: 'quantum',
      name: 'Quantum Echo',
      pitch: 1.3,
      rate: 0.95,
      carrierFreq: 528,
      description: 'Ethereal, high-frequency resonance with shimmering spatial reflections',
      style: 'from-purple-400 to-pink-500',
    },
    cyber: {
      id: 'cyber',
      name: 'Cyber Pulse',
      pitch: 0.75,
      rate: 1.25,
      carrierFreq: 963,
      description: 'Accelerated robotic vocoder cadence engineered for high-throughput syntax',
      style: 'from-emerald-400 to-cyan-400',
    },
    tranquil: {
      id: 'tranquil',
      name: 'Tranquil Aura',
      pitch: 1.0,
      rate: 0.82,
      carrierFreq: 639,
      description: 'Warm, meditative stasis cadence calibrated to Solfeggio heart resonance',
      style: 'from-amber-400 to-rose-400',
    },
  };

  public getVoiceProfiles() {
    return Object.values(AudioVoiceService.PROFILES);
  }

  public getCurrentProfile() {
    return AudioVoiceService.PROFILES[this.currentProfileId] || AudioVoiceService.PROFILES.sovereign;
  }

  public setVoiceProfile(profileId: string) {
    const profile = AudioVoiceService.PROFILES[profileId.toLowerCase()];
    if (profile) {
      this.currentProfileId = profile.id;
      this.pitch = profile.pitch;
      this.rate = profile.rate;
      this.playTone(profile.carrierFreq, 'sine', 150, 0.03);
      return profile;
    }
    return null;
  }

  public playEarcon(type: 'command' | 'success' | 'error' | 'stream' | 'switch' | 'ping'): void {
    switch (type) {
      case 'command':
        this.playTone(880, 'sine', 45, 0.02);
        break;
      case 'success':
        this.playTone(660, 'sine', 50, 0.02);
        setTimeout(() => this.playTone(1320, 'sine', 80, 0.025), 45);
        break;
      case 'error':
        this.playTone(220, 'sawtooth', 120, 0.035);
        break;
      case 'stream':
        this.playTone(528, 'sine', 40, 0.015);
        setTimeout(() => this.playTone(792, 'triangle', 60, 0.02), 35);
        setTimeout(() => this.playTone(1056, 'sine', 90, 0.025), 75);
        break;
      case 'switch':
        this.playTone(440, 'triangle', 40, 0.02);
        setTimeout(() => this.playTone(660, 'sine', 50, 0.02), 30);
        break;
      case 'ping':
        this.playTone(1760, 'sine', 30, 0.03);
        break;
    }
  }

  public onAnnounce(cb: (message: string, assertive: boolean) => void): () => void {
    this.announcerListeners.push(cb);
    return () => {
      this.announcerListeners = this.announcerListeners.filter((l) => l !== cb);
    };
  }

  public announce(message: string, assertive = false): void {
    this.announcerListeners.forEach((cb) => cb(message, assertive));
  }

  // =========================================================================
  // AUDIO SYNTHESIZER FEEDBACK TONES & TTS
  // =========================================================================

  public playTone(freq = 880, type: OscillatorType = 'sine', durationMs = 80, gainVal = 0.03): void {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      if (this.analyser) gain.connect(this.analyser);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Ignored if user hasn't interacted with audio yet
    }
  }

  public playTypingChirp(): void {
    this.playTone(1800 + Math.random() * 400, 'triangle', 25, 0.008);
  }

  public playEnterChirp(): void {
    this.playTone(660, 'sine', 60, 0.02);
    setTimeout(() => this.playTone(990, 'sine', 80, 0.025), 40);
  }

  public playErrorChirp(): void {
    this.playTone(220, 'sawtooth', 120, 0.03);
  }

  public speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        this.notifySpeech(false, '');
        return resolve();
      }

      window.speechSynthesis.cancel();

      // Clean markdown tags or code blocks for speech
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_#~]/g, '')
        .trim();

      if (!cleanText) {
        this.notifySpeech(false, '');
        return resolve();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (this.selectedVoice) utterance.voice = this.selectedVoice;
      utterance.pitch = this.pitch;
      utterance.rate = this.rate;

      utterance.onstart = () => {
        this.startVoiceAudioStream(cleanText);
        this.notifySpeech(true, cleanText);
        this.notifySpeechLog(cleanText);
        this.playTone(528, 'sine', 150, 0.015);
      };

      utterance.onend = () => {
        this.stopVoiceAudioStream();
        this.notifySpeech(false, '');
        resolve();
      };

      utterance.onerror = () => {
        this.stopVoiceAudioStream();
        this.notifySpeech(false, '');
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.stopVoiceAudioStream();
    this.notifySpeech(false, '');
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.isVoiceEnabled = enabled;
    if (!enabled) this.stopSpeaking();
  }

  public setVoiceParams(pitch: number, rate: number, voiceName?: string): void {
    this.pitch = Math.max(0.5, Math.min(2.0, pitch));
    this.rate = Math.max(0.5, Math.min(2.0, rate));
    if (voiceName && typeof window !== 'undefined') {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.name.toLowerCase().includes(voiceName.toLowerCase()));
      if (match) this.selectedVoice = match;
    }
  }

  public onSpeechChange(cb: (speaking: boolean, text: string) => void): () => void {
    this.speechListeners.push(cb);
    return () => {
      this.speechListeners = this.speechListeners.filter((l) => l !== cb);
    };
  }

  public onSpeechLog(cb: (text: string) => void): () => void {
    this.speechLogListeners.push(cb);
    return () => {
      this.speechLogListeners = this.speechLogListeners.filter((l) => l !== cb);
    };
  }

  private notifySpeechLog(text: string): void {
    this.speechLogListeners.forEach((cb) => cb(text));
  }

  private notifySpeech(speaking: boolean, text: string): void {
    this.speechListeners.forEach((cb) => cb(speaking, text));
  }
}

export const audioVoiceService = new AudioVoiceService();
