import type { ChallengeType } from '../../types';
import type { ChallengeStrategy } from './types';
import { mountOptions } from './strategies/options';
import { Reorder } from './strategies/Reorder';
import { RepeatAfter } from './strategies/RepeatAfter';
import { ToneDiscrimination } from './strategies/ToneDiscrimination';

const ListenChoose: ChallengeStrategy = { mount: (root, ctx) => mountOptions(root, ctx, { style: 'list' }) };
const DialogueChoice: ChallengeStrategy = { mount: (root, ctx) => mountOptions(root, ctx, { style: 'list' }) };
const ProverbFill: ChallengeStrategy = { mount: (root, ctx) => mountOptions(root, ctx, { style: 'list' }) };
const FindObject: ChallengeStrategy = { mount: (root, ctx) => mountOptions(root, ctx, { style: 'grid', icon: true }) };

/** 7 种挑战题型 → 渲染策略。新增题型只需在这里注册 */
export const ChallengeRegistry: Record<ChallengeType, ChallengeStrategy> = {
  listen_choose: ListenChoose,
  dialogue_choice: DialogueChoice,
  proverb_fill: ProverbFill,
  find_object: FindObject,
  tone_discrimination: ToneDiscrimination,
  reorder: Reorder,
  repeat_after: RepeatAfter,
};

export const CHALLENGE_LABEL: Record<ChallengeType, string> = {
  listen_choose: '听音选义',
  dialogue_choice: '对话应答',
  proverb_fill: '俗谚文化',
  find_object: '听音找物',
  tone_discrimination: '声调辨析',
  reorder: '词序排列',
  repeat_after: '开口跟读',
};
