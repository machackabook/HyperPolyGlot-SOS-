/**
 * AmbientAudioService - Dynamic Web Audio API Soundscape Synthesis Engine
 * Generates continuous procedural soundscapes and drones tailored to the current
 * sentiment in EnvironmentState (analytical, energetic, alarm, tranquil, cosmic, chaos),
 * with integrated Solfeggio & Harmonic Resonator frequencies (432 Hz, 528 Hz, 963 Hz).
 */

import { SentimentType } from '../types';

interface VoiceCluster {
  oscRoot: OscillatorNode;
  oscFifth: OscillatorNode;
  oscSub: OscillatorNode;
  oscShimmer?: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  panner?: StereoPannerNode;
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
}

class AmbientAudioService {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isActive = false;
  private currentVolume = 0.35;
  private currentSentiment: SentimentType = 'analytical';
  private harmonicMode: '432' | '528' | '963' | 'all' = '432';

  // Active voice nodes
  private currentVoice: VoiceCluster | null = null;

  public initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.85;

      this.masterGain.connect(this.analyser);
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public isSoundscapeActive(): boolean {
    return this.isActive;
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public setVolume(vol: number): void {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx && this.isActive) {
      const now = this.audioCtx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.currentVolume * 0.18, now + 0.3);
    }
  }

  public toggle(sentiment?: SentimentType): boolean {
    if (this.isActive) {
      this.stop();
      return false;
    } else {
      this.start(sentiment || this.currentSentiment);
      return true;
    }
  }

  public start(sentiment: SentimentType = 'analytical'): void {
    const ctx = this.initContext();
    this.currentSentiment = sentiment;
    this.isActive = true;

    // Build synthesis cluster
    this.rebuildVoice(sentiment);

    const now = ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0.001, now);
      this.masterGain.gain.linearRampToValueAtTime(this.currentVolume * 0.18, now + 2.0);
    }
  }

  public stop(): void {
    if (!this.isActive || !this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    setTimeout(() => {
      this.teardownVoice();
      this.isActive = false;
    }, 1300);
  }

  public updateSentiment(sentiment: SentimentType): void {
    if (this.currentSentiment === sentiment && this.currentVoice) return;
    this.currentSentiment = sentiment;
    if (this.isActive && this.audioCtx) {
      this.transitionSentiment(sentiment);
    }
  }

  public setHarmonic(mode: '432' | '528' | '963' | 'all'): void {
    this.harmonicMode = mode;
    if (this.isActive) {
      this.transitionSentiment(this.currentSentiment);
    }
  }

  private getFrequenciesForSentiment(sentiment: SentimentType): {
    root: number;
    fifth: number;
    sub: number;
    shimmer: number;
    filterFreq: number;
    q: number;
    type: OscillatorType;
    lfoRate: number;
  } {
    // Check harmonic override
    if (this.harmonicMode === '432') {
      return {
        root: 432,
        fifth: 648,
        sub: 108,
        shimmer: 864,
        filterFreq: 900,
        q: 2.5,
        type: 'sine',
        lfoRate: 0.2,
      };
    }
    if (this.harmonicMode === '528') {
      return {
        root: 528,
        fifth: 792,
        sub: 132,
        shimmer: 1056,
        filterFreq: 1400,
        q: 3.5,
        type: 'triangle',
        lfoRate: 0.8,
      };
    }
    if (this.harmonicMode === '963') {
      return {
        root: 963,
        fifth: 1444.5,
        sub: 240.75,
        shimmer: 1926,
        filterFreq: 2200,
        q: 4.0,
        type: 'sine',
        lfoRate: 0.4,
      };
    }

    // Default per-sentiment soundscape matrices
    switch (sentiment) {
      case 'analytical':
        // Pure crystalline 432 Hz crystal equilibrium + airy harmonics
        return {
          root: 432,
          fifth: 648,
          sub: 108,
          shimmer: 864,
          filterFreq: 1100,
          q: 2.2,
          type: 'sine',
          lfoRate: 0.25,
        };
      case 'energetic':
        // 528 Hz Transformation pad with pulsing triangle and saw harmonic
        return {
          root: 528,
          fifth: 792,
          sub: 132,
          shimmer: 1056,
          filterFreq: 1800,
          q: 4.5,
          type: 'triangle',
          lfoRate: 1.4,
        };
      case 'alarm':
        // Dissonant 220 Hz detuned saw + 233 Hz minor second beating + deep rumble
        return {
          root: 220,
          fifth: 233, // deliberate minor second dissonance
          sub: 55,
          shimmer: 440,
          filterFreq: 850,
          q: 5.5,
          type: 'sawtooth',
          lfoRate: 2.0,
        };
      case 'tranquil':
        // Warm 432 Hz heart resonance + lush sub-bass pad with slow breathing
        return {
          root: 432,
          fifth: 540, // pure major third
          sub: 108,
          shimmer: 648,
          filterFreq: 750,
          q: 1.5,
          type: 'sine',
          lfoRate: 0.12,
        };
      case 'cosmic':
        // 963 Hz Solfeggio consensus + deep sub 54 Hz + wide stereo detuning
        return {
          root: 963,
          fifth: 481.5,
          sub: 54,
          shimmer: 1926,
          filterFreq: 2400,
          q: 3.2,
          type: 'sine',
          lfoRate: 0.35,
        };
      case 'chaos':
        // Microtonal detuning and sweeping frequencies
        return {
          root: 367.4,
          fifth: 512.8,
          sub: 89.2,
          shimmer: 1142.6,
          filterFreq: 2800,
          q: 6.0,
          type: 'sawtooth',
          lfoRate: 3.5,
        };
      case 'creative':
        // Lush 528 Hz transformation with major seventh harmonics and slow sweeps
        return {
          root: 528,
          fifth: 990, // major seventh harmonic
          sub: 132,
          shimmer: 1584,
          filterFreq: 1600,
          q: 3.0,
          type: 'triangle',
          lfoRate: 0.6,
        };
      default:
        return {
          root: 432,
          fifth: 648,
          sub: 108,
          shimmer: 864,
          filterFreq: 1100,
          q: 2.2,
          type: 'sine',
          lfoRate: 0.25,
        };
    }
  }

  private transitionSentiment(sentiment: SentimentType): void {
    if (!this.audioCtx || !this.currentVoice) {
      this.rebuildVoice(sentiment);
      return;
    }

    const cfg = this.getFrequenciesForSentiment(sentiment);
    const now = this.audioCtx.currentTime;
    const rampTime = 1.8;

    try {
      // Smooth frequency glide
      this.currentVoice.oscRoot.frequency.cancelScheduledValues(now);
      this.currentVoice.oscRoot.frequency.exponentialRampToValueAtTime(Math.max(20, cfg.root), now + rampTime);

      this.currentVoice.oscFifth.frequency.cancelScheduledValues(now);
      this.currentVoice.oscFifth.frequency.exponentialRampToValueAtTime(Math.max(20, cfg.fifth), now + rampTime);

      this.currentVoice.oscSub.frequency.cancelScheduledValues(now);
      this.currentVoice.oscSub.frequency.exponentialRampToValueAtTime(Math.max(20, cfg.sub), now + rampTime);

      if (this.currentVoice.oscShimmer) {
        this.currentVoice.oscShimmer.frequency.cancelScheduledValues(now);
        this.currentVoice.oscShimmer.frequency.exponentialRampToValueAtTime(Math.max(20, cfg.shimmer), now + rampTime);
      }

      this.currentVoice.filter.frequency.cancelScheduledValues(now);
      this.currentVoice.filter.frequency.exponentialRampToValueAtTime(cfg.filterFreq, now + rampTime);
      this.currentVoice.filter.Q.setValueAtTime(cfg.q, now + rampTime);

      if (this.currentVoice.lfo) {
        this.currentVoice.lfo.frequency.setValueAtTime(cfg.lfoRate, now + rampTime);
      }
    } catch {
      // Rebuild on ramp error
      this.rebuildVoice(sentiment);
    }
  }

  private rebuildVoice(sentiment: SentimentType): void {
    this.teardownVoice();
    if (!this.audioCtx || !this.masterGain) return;

    const ctx = this.audioCtx;
    const cfg = this.getFrequenciesForSentiment(sentiment);

    // Root Oscillator
    const oscRoot = ctx.createOscillator();
    oscRoot.type = cfg.type;
    oscRoot.frequency.setValueAtTime(cfg.root, ctx.currentTime);

    // Fifth Harmonic Oscillator
    const oscFifth = ctx.createOscillator();
    oscFifth.type = cfg.type;
    oscFifth.frequency.setValueAtTime(cfg.fifth, ctx.currentTime);

    // Sub-bass Foundation Oscillator (Pure deep sine)
    const oscSub = ctx.createOscillator();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(cfg.sub, ctx.currentTime);

    // Shimmer / Overtone Oscillator
    const oscShimmer = ctx.createOscillator();
    oscShimmer.type = 'sine';
    oscShimmer.frequency.setValueAtTime(cfg.shimmer, ctx.currentTime);

    // Dynamic Filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cfg.filterFreq, ctx.currentTime);
    filter.Q.setValueAtTime(cfg.q, ctx.currentTime);

    // Internal Gain Stage
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);

    // Subtle Stereo Panning
    let panner: StereoPannerNode | undefined;
    if (typeof ctx.createStereoPanner === 'function') {
      panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(0.0, ctx.currentTime);
    }

    // Breathing LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(cfg.lfoRate, ctx.currentTime);
    lfoGain.gain.setValueAtTime(180, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Connect node graph
    oscRoot.connect(filter);
    oscFifth.connect(filter);
    oscSub.connect(filter);
    oscShimmer.connect(filter);

    filter.connect(gain);
    if (panner) {
      gain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      gain.connect(this.masterGain);
    }

    // Start oscillators
    const now = ctx.currentTime;
    oscRoot.start(now);
    oscFifth.start(now);
    oscSub.start(now);
    oscShimmer.start(now);
    lfo.start(now);

    this.currentVoice = {
      oscRoot,
      oscFifth,
      oscSub,
      oscShimmer,
      filter,
      gain,
      panner,
      lfo,
      lfoGain,
    };
  }

  private teardownVoice(): void {
    if (this.currentVoice) {
      try {
        this.currentVoice.oscRoot.stop();
        this.currentVoice.oscRoot.disconnect();
        this.currentVoice.oscFifth.stop();
        this.currentVoice.oscFifth.disconnect();
        this.currentVoice.oscSub.stop();
        this.currentVoice.oscSub.disconnect();
        if (this.currentVoice.oscShimmer) {
          this.currentVoice.oscShimmer.stop();
          this.currentVoice.oscShimmer.disconnect();
        }
        if (this.currentVoice.lfo) {
          this.currentVoice.lfo.stop();
          this.currentVoice.lfo.disconnect();
        }
        this.currentVoice.filter.disconnect();
        this.currentVoice.gain.disconnect();
      } catch {
        // Ignored
      }
      this.currentVoice = null;
    }
  }
}

export const ambientAudioService = new AmbientAudioService();
