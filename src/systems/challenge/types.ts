import type { Challenge, SoundEntry } from '../../types';

/**
 * 挑战策略拿到的上下文。
 * 策略只负责「怎么问」，正确的判定与收星由 ChallengeRunner 负责。
 */
export interface ChallengeCtx {
  /** 已经打乱过选项、并重映射过 answer 的题目 */
  readonly challenge: Challenge;
  readonly sound: SoundEntry;
  /** 清晰播放整句，rate < 1 为慢速 */
  play(rate?: number): void;
  /** 播放某个调类的示意音 */
  playTone(tone: number): void;
  /** 标记玩家使用了提示（影响星级） */
  hint(): void;
  /** 提交判定，只接受第一次 */
  answer(correct: boolean): void;
}

export interface ChallengeStrategy {
  /** 把题目渲染进 root；root 已被清空 */
  mount(root: HTMLElement, ctx: ChallengeCtx): void;
}
