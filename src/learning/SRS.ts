import type { ReviewCard } from '../types';

const DAY = 24 * 60 * 60 * 1000;
const RELEARN = 10 * 60 * 1000;

export function newCard(soundId: string, now = Date.now()): ReviewCard {
  return { soundId, ease: 2.5, interval: 0, reps: 0, due: now + DAY };
}

/** 简化版 SM-2：答对拉长间隔，答错 10 分钟后重来 */
export function grade(card: ReviewCard, correct: boolean, now = Date.now()): ReviewCard {
  if (!correct) {
    return { ...card, reps: 0, interval: 0, ease: Math.max(1.3, card.ease - 0.2), due: now + RELEARN };
  }
  const reps = card.reps + 1;
  const interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(Math.max(1, card.interval) * card.ease);
  return { ...card, reps, interval, ease: Math.min(3, card.ease + 0.1), due: now + interval * DAY };
}

export function dueCards(cards: Record<string, ReviewCard>, now = Date.now()): ReviewCard[] {
  return Object.values(cards)
    .filter((c) => c.due <= now)
    .sort((a, b) => a.due - b.due);
}
