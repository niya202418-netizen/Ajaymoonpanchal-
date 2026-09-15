/**
 * Web Audio API Paranormal Audio Synthesizer
 * Provides sound feedback for EMF clicks, spirit box sweeps, REM alerts, and sensor interactions.
 */

class GhostAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.35;
  private spiritBoxOsc: OscillatorNode | null = null;
  private spiritBoxGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.spiritBoxGain) {
      this.spiritBoxGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume() {
    return this.volume;
  }

  /**
   * Play Geiger-style EMF click/chirp
   * @param emfLevel 0 to 25 mG
   */
  public playEmfClick(emfLevel: number) {
    if (this.isMuted || emfLevel < 1.0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Higher EMF = higher frequency and sharp click
      const freq = Math.min(1800, 240 + emfLevel * 60);
      osc.type = emfLevel > 15 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);

      const intensityGain = Math.min(0.25, (emfLevel / 25) * 0.22 + 0.03) * this.volume;
      gain.gain.setValueAtTime(intensityGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.045);
    } catch {
      // Audio autoplay policy or error safely caught
    }
  }

  /**
   * Play REM Pod proximity chime
   */
  public playRemPodTone(distanceMeters: number) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Closer proximity = higher urgency frequency
      const freq = Math.max(400, 1500 - distanceMeters * 350);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.18 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch {}
  }

  /**
   * Play short Spirit Box static sweep / radio blip
   */
  public playSpiritBoxSweep() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // White noise buffer for radio static
      const bufferSize = this.ctx.sampleRate * 0.06; // 60ms radio sweep
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.25;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 2000, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08 * this.volume, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {}
  }

  /**
   * Play disembodied phonetic utterance cue when ghost speaks through spirit box
   */
  public playGhostSpeechChime() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(85, this.ctx.currentTime + 0.35);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.25 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch {}
  }

  /**
   * Interaction blip for UI button clicks and beacon placement
   */
  public playUiClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.055);
    } catch {}
  }

  /**
   * Alert horn when a ghost hunt or critical EMF 5 event triggers
   */
  public playAlertSiren() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(640, this.ctx.currentTime + 0.2);
      osc.frequency.linearRampToValueAtTime(320, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.2 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.46);
    } catch {}
  }

  /**
   * Play realistic investigator heartbeat pulse ("lub-dub" thumps)
   * Triggered when threat level is elevated, high, or during a hunt
   */
  public playHeartbeat(intensity: number = 0.5) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const gainLevel = Math.min(0.35, 0.08 + intensity * 0.22) * this.volume;

      // First beat ("lub")
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(65, now);
      osc1.frequency.exponentialRampToValueAtTime(35, now + 0.1);

      gain1.gain.setValueAtTime(gainLevel, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.13);

      // Second beat ("dub") ~110ms later
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(75, now + 0.11);
      osc2.frequency.exponentialRampToValueAtTime(38, now + 0.22);

      gain2.gain.setValueAtTime(gainLevel * 0.85, now + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.11);
      osc2.stop(now + 0.25);
    } catch {}
  }

  /**
   * Play short tactical chirp when threat tier escalates
   */
  public playThreatChirp(urgency: 'caution' | 'danger' | 'critical' | 'hunt') {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (urgency === 'hunt') {
        this.playAlertSiren();
        return;
      }

      const freqMap = {
        caution: 580,
        danger: 820,
        critical: 1100
      };

      const baseFreq = freqMap[urgency] || 600;
      osc.type = urgency === 'critical' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.08);

      gain.gain.setValueAtTime(0.15 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  /**
   * Device haptic vibration for mobile phones (Android / supported devices)
   */
  public triggerHaptic(pattern: number | number[] = 100) {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }
}

export const ghostAudio = new GhostAudioEngine();

