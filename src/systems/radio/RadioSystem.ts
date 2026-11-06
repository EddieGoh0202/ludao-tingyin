import { AudioManager } from '../../core/AudioManager';
import { EventBus } from '../../core/EventBus';
import type { SoundEntry } from '../../types';

export const FREQ_MIN = 87;
export const FREQ_MAX = 108;
/** 锁定所需的持续时间（秒） */
export const LOCK_TIME = 1.5;

export interface RadioSignal {
  /** 离最近声源的距离强度 S（0-1） */
  strength: number;
  /** 频率对准程度 C（0-1） */
  clarity: number;
  /** 最近的未收集声源 */
  nearestId: string | null;
  /** 当前正在播放的声源（S·C 最大） */
  targetId: string | null;
  /** 锁定进度 0-1 */
  lockProgress: number;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * 收音机调频：
 *  S 由玩家与声源距离衰减，C 由频率差决定；
 *  noise = 1 - S·C，voice = S·C，低通截止 = 400 + C·3200；
 *  C > 0.9 且 S > 0.6 持续 1.5 秒 → radio:locked。
 */
export class RadioSystem {
  freq = 96.0;
  on = true;
  paused = false;
  private lockTimer = 0;
  private emitAcc = 0;
  /** 放弃挑战后的冷却：声源 id → 剩余秒数，冷却期间不会再次锁定 */
  private snoozed = new Map<string, number>();
  private lastSignal: RadioSignal = { strength: 0, clarity: 0, nearestId: null, targetId: null, lockProgress: 0 };

  constructor(
    private hearRadius = 170,
    private bandwidth = 1.2,
  ) {}

  get signal(): RadioSignal {
    return this.lastSignal;
  }

  setFreq(f: number): void {
    this.freq = Math.round(Math.max(FREQ_MIN, Math.min(FREQ_MAX, f)) * 10) / 10;
  }

  tune(delta: number): void {
    this.setFreq(this.freq + delta);
  }

  setOn(on: boolean): void {
    this.on = on;
    AudioManager.radioOn(on && !this.paused);
    this.lockTimer = 0;
  }

  /** 打开挑战等面板时暂停收音（静音 + 停止锁定计时） */
  setPaused(p: boolean): void {
    this.paused = p;
    this.lockTimer = 0;
    AudioManager.radioOn(this.on && !p);
  }

  /** 暂时不再锁定某个声源（玩家关闭挑战后避免立刻重新弹出） */
  snooze(id: string, seconds: number): void {
    this.snoozed.set(id, seconds);
  }

  update(
    dt: number,
    px: number,
    py: number,
    sounds: SoundEntry[],
    isCollected: (id: string) => boolean,
  ): RadioSignal {
    for (const [id, left] of this.snoozed) {
      if (left - dt <= 0) this.snoozed.delete(id);
      else this.snoozed.set(id, left - dt);
    }
    let best: { s: SoundEntry; S: number; C: number } | null = null;
    let nearest: { s: SoundEntry; S: number } | null = null;

    for (const s of sounds) {
      const d = Math.hypot(s.pos.x - px, (s.pos.y - py) * 1.5);
      const S = clamp01(1 - d / this.hearRadius);
      if (S <= 0) continue;
      const C = clamp01(1 - Math.abs(this.freq - s.frequency) / this.bandwidth);
      if (!best || S * C > best.S * best.C) best = { s, S, C };
      if (!isCollected(s.id) && (!nearest || S > nearest.S)) nearest = { s, S };
    }

    const active = this.on && !this.paused;
    const S = best?.S ?? 0;
    const C = best?.C ?? 0;
    const sc = S * C;

    if (active) {
      AudioManager.setMix(Math.max(0.12, 1 - sc), sc, 400 + C * 3200);
      AudioManager.setVoiceLoop(best && sc > 0.04 ? best.s : null);
    }

    const lockable = active && best && !isCollected(best.s.id) && !this.snoozed.has(best.s.id) && C > 0.9 && S > 0.6;
    this.lockTimer = lockable ? this.lockTimer + dt : Math.max(0, this.lockTimer - dt * 2);

    this.lastSignal = {
      strength: nearest?.S ?? 0,
      clarity: C,
      nearestId: nearest?.s.id ?? null,
      targetId: best && sc > 0.04 ? best.s.id : null,
      lockProgress: clamp01(this.lockTimer / LOCK_TIME),
    };

    if (lockable && this.lockTimer >= LOCK_TIME && best) {
      this.lockTimer = 0;
      AudioManager.setVoiceLoop(null);
      AudioManager.sfx('lock');
      EventBus.emit('radio:locked', { soundId: best.s.id });
    }

    this.emitAcc += dt;
    if (this.emitAcc >= 0.1) {
      this.emitAcc = 0;
      EventBus.emit('radio:signal', {
        strength: this.lastSignal.strength,
        clarity: this.lastSignal.clarity,
        nearestId: this.lastSignal.nearestId,
      });
    }
    return this.lastSignal;
  }
}
