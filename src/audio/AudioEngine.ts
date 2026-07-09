import type { PlaybackSettings, ActiveVoice } from '../types';
import type { Pcm } from './edit';
import { nanoid } from 'nanoid';

/**
 * Low-latency audio engine built on the Web Audio API.
 *
 * Design goals:
 *  - Decode + cache AudioBuffers up front so triggering a sound only has to
 *    wire up a BufferSource → GainNode → master graph (target < 30ms).
 *  - Support simultaneous playback (multi-voice), per-voice gain, fades,
 *    rate/pitch, reverse and looping.
 *  - Expose a master gain node so the mixer can control global volume.
 *
 * The engine is deliberately framework-agnostic; the React store subscribes to
 * it via the `onVoicesChanged` callback.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  /** Decoded buffers keyed by sound id. */
  private buffers = new Map<string, AudioBuffer>();
  /** Reversed buffers cached lazily keyed by sound id. */
  private reversed = new Map<string, AudioBuffer>();
  /** Live voices keyed by voice id. */
  private voices = new Map<string, Voice>();

  onVoicesChanged: ((voices: ActiveVoice[]) => void) | null = null;

  /** Lazily create the AudioContext (must follow a user gesture on some browsers). */
  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Warm up the context on first user interaction to avoid first-play latency. */
  unlock(): void {
    this.ensureCtx();
  }

  setMasterVolume(v: number): void {
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(clamp(v, 0, 2), this.ctx.currentTime, 0.01);
    }
  }

  /** Whether this browser/WebView can route audio to a chosen output device. */
  supportsOutputRouting(): boolean {
    return (
      typeof AudioContext !== 'undefined' &&
      'setSinkId' in AudioContext.prototype
    );
  }

  /**
   * Route all output to a specific device (headphones, USB, Bluetooth, HDMI or a
   * virtual cable feeding OBS/Discord). Pass '' for the system default.
   * Uses `AudioContext.setSinkId`, available in Chromium-based browsers and
   * WebView2; a no-op where unsupported.
   */
  async setOutputDevice(deviceId: string): Promise<boolean> {
    const ctx = this.ensureCtx() as AudioContext & {
      setSinkId?: (id: string) => Promise<void>;
    };
    if (typeof ctx.setSinkId !== 'function') return false;
    try {
      await ctx.setSinkId(deviceId);
      return true;
    } catch (err) {
      console.warn('[soundboard] setOutputDevice failed', err);
      return false;
    }
  }

  /** List available audio output devices (requires prior mic permission for labels). */
  async listOutputDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === 'audiooutput');
  }

  /** Decode raw bytes into a cached AudioBuffer. Idempotent per id. */
  async load(id: string, data: ArrayBuffer): Promise<AudioBuffer> {
    const existing = this.buffers.get(id);
    if (existing) return existing;
    const ctx = this.ensureCtx();
    // decodeAudioData detaches the buffer, so decode a copy to keep the source.
    const buffer = await ctx.decodeAudioData(data.slice(0));
    this.buffers.set(id, buffer);
    return buffer;
  }

  isLoaded(id: string): boolean {
    return this.buffers.has(id);
  }

  unload(id: string): void {
    this.buffers.delete(id);
    this.reversed.delete(id);
  }

  /** Snapshot a decoded buffer as editable PCM (copies channel data). */
  getPcm(id: string): Pcm | null {
    const buffer = this.buffers.get(id);
    if (!buffer) return null;
    const channels: Float32Array[] = [];
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      channels.push(new Float32Array(buffer.getChannelData(ch)));
    }
    return { channels, sampleRate: buffer.sampleRate };
  }

  /** Replace the cached buffer for a sound from edited PCM. Returns the buffer. */
  setPcm(id: string, pcm: Pcm): AudioBuffer {
    const ctx = this.ensureCtx();
    const frames = pcm.channels[0]?.length ?? 0;
    const buffer = ctx.createBuffer(
      Math.max(1, pcm.channels.length),
      Math.max(1, frames),
      pcm.sampleRate,
    );
    pcm.channels.forEach((data, ch) => buffer.getChannelData(ch).set(data));
    this.buffers.set(id, buffer);
    this.reversed.delete(id); // invalidate reversed cache after an edit
    return buffer;
  }

  /** Preview just the region [startSec, endSec) of a loaded sound. */
  previewRegion(id: string, startSec: number, endSec: number): string | null {
    const ctx = this.ensureCtx();
    const buffer = this.buffers.get(id);
    if (!buffer) return null;
    const from = Math.max(0, Math.min(buffer.duration, startSec));
    const to = Math.max(from, Math.min(buffer.duration, endSec));
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    src.connect(gain).connect(this.master!);
    const voiceId = nanoid(8);
    const voice: Voice = { id: voiceId, soundId: id, src, gain, title: 'preview', startedAt: Date.now() };
    src.onended = () => {
      this.voices.delete(voiceId);
      try { src.disconnect(); gain.disconnect(); } catch { /* noop */ }
      this.emit();
    };
    src.start(ctx.currentTime, from, Math.max(0.01, to - from));
    this.voices.set(voiceId, voice);
    this.emit();
    return voiceId;
  }

  /** Compute normalized waveform peaks (0..1) for a preview strip. */
  static computeWaveform(buffer: AudioBuffer, buckets = 64): number[] {
    const raw = buffer.getChannelData(0);
    const block = Math.floor(raw.length / buckets) || 1;
    const peaks: number[] = [];
    let max = 0.0001;
    for (let i = 0; i < buckets; i++) {
      let peak = 0;
      const start = i * block;
      for (let j = 0; j < block; j++) {
        const v = Math.abs(raw[start + j] ?? 0);
        if (v > peak) peak = v;
      }
      peaks.push(peak);
      if (peak > max) max = peak;
    }
    return peaks.map((p) => Math.min(1, p / max));
  }

  /**
   * Trigger a sound. Returns the voice id, or null if the buffer isn't loaded.
   * `pitch` is approximated via detune when the browser supports it.
   */
  play(
    id: string,
    settings: PlaybackSettings,
    meta: { title: string },
    opts: { onEnded?: () => void; forceNoLoop?: boolean } = {},
  ): string | null {
    const ctx = this.ensureCtx();
    let buffer = this.buffers.get(id);
    if (!buffer) return null;

    if (settings.reverse) {
      buffer = this.getReversed(id, buffer);
    }

    const loop = settings.loop && !opts.forceNoLoop;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = loop;
    src.playbackRate.value = clamp(settings.rate, 0.25, 4);
    // Pitch shift in cents (100 cents per semitone). Independent of rate.
    if (settings.pitch !== 0 && 'detune' in src) {
      (src.detune as AudioParam).value = clamp(settings.pitch, -12, 12) * 100;
    }

    const gain = ctx.createGain();
    const target = clamp(settings.volume, 0, 2);
    const now = ctx.currentTime;

    if (settings.fadeIn > 0) {
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, target),
        now + settings.fadeIn,
      );
    } else {
      gain.gain.setValueAtTime(target, now);
    }

    src.connect(gain).connect(this.master!);

    const voiceId = nanoid(8);
    const voice: Voice = { id: voiceId, soundId: id, src, gain, title: meta.title, startedAt: Date.now() };

    // Schedule fade-out for non-looping sounds with a known duration.
    if (!loop && settings.fadeOut > 0) {
      const dur = buffer.duration / src.playbackRate.value;
      const fadeStart = now + Math.max(0, dur - settings.fadeOut);
      gain.gain.setValueAtTime(target, fadeStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, fadeStart + settings.fadeOut);
    }

    src.onended = () => {
      this.voices.delete(voiceId);
      try {
        src.disconnect();
        gain.disconnect();
      } catch {
        /* already disconnected */
      }
      this.emit();
      opts.onEnded?.();
    };

    src.start(now);
    this.voices.set(voiceId, voice);
    this.emit();
    return voiceId;
  }

  /** Stop one voice, honoring an optional fade-out. */
  stop(voiceId: string, fadeOut = 0.02): void {
    const voice = this.voices.get(voiceId);
    if (!voice || !this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), now);
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeOut);
      voice.src.stop(now + fadeOut);
    } catch {
      /* voice may have already ended */
    }
  }

  /** Stop every active voice. */
  stopAll(): void {
    for (const id of [...this.voices.keys()]) this.stop(id);
  }

  /** Stop all voices belonging to a given sound. */
  stopSound(soundId: string): void {
    for (const [id, v] of this.voices) if (v.soundId === soundId) this.stop(id);
  }

  isSoundPlaying(soundId: string): boolean {
    for (const v of this.voices.values()) if (v.soundId === soundId) return true;
    return false;
  }

  setVoiceVolume(voiceId: string, v: number): void {
    const voice = this.voices.get(voiceId);
    if (voice && this.ctx) {
      voice.gain.gain.setTargetAtTime(clamp(v, 0, 2), this.ctx.currentTime, 0.01);
    }
  }

  getActiveVoices(): ActiveVoice[] {
    return [...this.voices.values()].map((v) => ({
      id: v.id,
      soundId: v.soundId,
      title: v.title,
      startedAt: v.startedAt,
    }));
  }

  private getReversed(id: string, buffer: AudioBuffer): AudioBuffer {
    const cached = this.reversed.get(id);
    if (cached) return cached;
    const ctx = this.ensureCtx();
    const rev = ctx.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate,
    );
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = rev.getChannelData(ch);
      for (let i = 0, n = src.length; i < n; i++) dst[i] = src[n - 1 - i]!;
    }
    this.reversed.set(id, rev);
    return rev;
  }

  private emit(): void {
    this.onVoicesChanged?.(this.getActiveVoices());
  }
}

interface Voice {
  id: string;
  soundId: string;
  title: string;
  src: AudioBufferSourceNode;
  gain: GainNode;
  startedAt: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Singleton used across the app. */
export const audioEngine = new AudioEngine();
