/**
 * SoundPlayer - collect sound with graceful fallbacks (Lane C, Phase 11).
 *
 * Asset note: place the collect effect at `public/sounds/collect.mp3`.
 * For GitHub Pages preview builds, pass the Vite base URL from app code
 * as `baseUrl` so the fetch URL resolves under the correct sub-path.
 * This module itself avoids Vite-specific globals so it stays runnable
 * under Jest/jsdom (CommonJS).
 *
 * Chain in playCollect():
 *   disabled -> 'silent'
 *   fetch(baseUrl + 'sounds/collect.mp3') + Audio element -> 'file'
 *   AudioContext oscillator beep -> 'webaudio'
 *   otherwise -> 'silent'
 *
 * Never throws and never autoplays before a user gesture: no Audio nodes
 * are created in the constructor, only inside playCollect().
 */

export type PlayResult = 'file' | 'webaudio' | 'silent';

interface OscillatorLike {
  connect: (node: unknown) => void;
  start: () => void;
  stop: () => void;
  frequency?: { value: number };
}

interface GainLike {
  connect: (node: unknown) => void;
  gain?: { value: number };
}

interface AudioContextLike {
  destination: unknown;
  currentTime?: number;
  state?: string;
  resume?: () => Promise<void>;
  createOscillator: () => OscillatorLike;
  createGain: () => GainLike;
}

export class SoundPlayer {
  private enabled = true;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? '/';
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async playCollect(): Promise<PlayResult> {
    try {
      if (!this.enabled) {
        return 'silent';
      }
      const url = this.buildUrl();
      if (await this.tryFile(url)) {
        return 'file';
      }
      if (this.tryWebAudio()) {
        return 'webaudio';
      }
      return 'silent';
    } catch {
      return 'silent';
    }
  }

  private buildUrl(): string {
    if (this.baseUrl.endsWith('/')) {
      return `${this.baseUrl}sounds/collect.mp3`;
    }
    if (this.baseUrl === '') {
      return 'sounds/collect.mp3';
    }
    return `${this.baseUrl}/sounds/collect.mp3`;
  }

  private async tryFile(url: string): Promise<boolean> {
    try {
      if (typeof fetch === 'undefined') {
        return false;
      }
      if (typeof Audio === 'undefined') {
        return false;
      }
      const res = await fetch(url);
      if (!res || !res.ok) {
        return false;
      }
      const audio = new Audio(url);
      if (typeof audio.play !== 'function') {
        return false;
      }
      const played = audio.play() as unknown;
      if (
        played !== undefined &&
        played !== null &&
        typeof (played as Promise<void>).then === 'function'
      ) {
        await (played as Promise<void>);
      }
      return true;
    } catch {
      return false;
    }
  }

  private tryWebAudio(): boolean {
    try {
      const AC = this.getAudioContextConstructor();
      if (!AC) {
        return false;
      }
      const ctx: AudioContextLike = new AC();
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        void ctx.resume().catch(() => undefined);
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      if (osc.frequency) {
        osc.frequency.value = 880;
      }
      if (gain.gain) {
        gain.gain.value = 0.2;
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      const when = typeof ctx.currentTime === 'number' ? ctx.currentTime + 0.2 : undefined;
      if (when !== undefined) {
        try {
          (osc.stop as (when?: number) => void)(when);
        } catch {
          osc.stop();
        }
      } else {
        osc.stop();
      }
      return true;
    } catch {
      return false;
    }
  }

  private getAudioContextConstructor(): (new () => AudioContextLike) | undefined {
    try {
      const candidates: unknown[] = [];
      if (typeof window !== 'undefined') {
        const w = window as unknown as Record<string, unknown>;
        candidates.push(w['AudioContext'], w['webkitAudioContext']);
      }
      candidates.push((globalThis as unknown as Record<string, unknown>)['AudioContext']);
      for (const c of candidates) {
        if (typeof c === 'function') {
          return c as new () => AudioContextLike;
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}
