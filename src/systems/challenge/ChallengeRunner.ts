import { AudioManager } from '../../core/AudioManager';
import { Content } from '../../core/ContentRepository';
import { StateStore } from '../../core/StateStore';
import { splitSyllables, toneOf, XIAMEN_TONE_CONTOUR } from '../../learning/tailo';
import type { Challenge, SoundEntry } from '../../types';
import { el, openModal, pendingNote, shuffle } from '../../ui/dom';
import { CHALLENGE_LABEL, ChallengeRegistry } from './ChallengeRegistry';
import type { ChallengeCtx } from './types';

export interface ChallengeResult {
  soundId: string;
  correct: boolean;
  stars: number;
}

/** 把选项打乱，并把 answer 重新映射到打乱后的下标 */
function prepare(challenge: Challenge): Challenge {
  if (challenge.type === 'reorder' || challenge.type === 'repeat_after') return challenge;
  const options = challenge.options ?? [];
  const order = shuffle(options.map((_o, i) => i));
  // 避免打乱后正确项恰好在原位
  if (order.length > 1 && order[0] === challenge.answer) order.push(order.shift()!);
  return {
    ...challenge,
    options: order.map((i) => options[i]),
    answer: order.indexOf(typeof challenge.answer === 'number' ? challenge.answer : 0),
  };
}

/**
 * 挑战弹窗：顶部是「这一段声音」的卡片，下面是各题型的作答区。
 * 无失败态：答错可再试一次；两次未对可以 1 星收下，稍后在复习里再练。
 */
export function runChallenge(
  soundId: string,
  onDone?: (r: ChallengeResult) => void,
  onCancel?: () => void,
): void {
  const sound = Content.sound(soundId);
  const base = Content.challengeFor(soundId);
  if (!sound || !base) {
    onDone?.({ soundId, correct: false, stars: 1 });
    return;
  }

  let finished = false;
  const modal = openModal(`${CHALLENGE_LABEL[base.type]} · ${sound.hanzi}`, {
    className: 'challenge-modal',
    // 右上角 × 关闭：未作答完成视为放弃，本段声音不收集
    onClose: () => {
      if (!finished) onCancel?.();
    },
  });
  let hintUsed = false;
  let wrongs = 0;
  let settled = false;

  const head = el('div', { class: 'ch-card' }, [
    el('div', { class: 'ch-card-main' }, [
      el('div', { class: 'ch-hanzi', text: sound.hanzi }),
      el('div', { class: 'ch-tailo', text: sound.tailo }),
      el('div', { class: 'ch-meta', text: [sound.speaker, sound.mandarin].filter(Boolean).join(' · ') }),
    ]),
    el('button', { class: 'ch-play', text: '▶', title: '再听一次' }),
  ]);
  const playBtn = head.querySelector('.ch-play') as HTMLButtonElement;
  const play = (rate = 1) => {
    AudioManager.playSound(sound, rate);
  };
  playBtn.addEventListener('click', () => play());

  const feedback = el('div', { class: 'ch-feedback hidden' });
  const area = el('div', { class: 'ch-area' });
  modal.body.append(head, el('div', { class: 'ch-prompt', text: base.prompt }), area, feedback);
  if (!StateStore.data.settings.showTailo) head.querySelector('.ch-tailo')?.classList.add('hidden');
  modal.body.append(pendingNote());

  const toneSequence = () =>
    splitSyllables(sound.tailo)
      .map((s) => `${s.normalize('NFC')}=${XIAMEN_TONE_CONTOUR[toneOf(s)].name}`)
      .join(' / ');

  const settle = (correct: boolean) => {
    if (settled) return;
    settled = true;
    const stars = correct ? (wrongs === 0 && !hintUsed ? 3 : 2) : 1;
    const closeBtn = el('button', { class: 'btn', text: correct ? '收进声音簿' : '收下，稍后再练' });
    closeBtn.addEventListener('click', () => {
      finished = true;
      modal.close();
      onDone?.({ soundId, correct, stars });
    });
    feedback.append(closeBtn);
    closeBtn.focus();
  };

  const mount = () => {
    area.replaceChildren();
    feedback.replaceChildren();
    feedback.classList.add('hidden');
    const prepared = prepare(base);
    const ctx: ChallengeCtx = {
      challenge: prepared,
      sound: sound as SoundEntry,
      play,
      playTone: (t) => AudioManager.playTone(t),
      hint: () => {
        hintUsed = true;
      },
      answer: (correct) => {
        if (settled) return;
        if (correct) {
          AudioManager.sfx('ok');
          feedback.className = 'ch-feedback ok';
          feedback.append(
            el('div', { class: 'ch-result', text: wrongs === 0 && !hintUsed ? '★★★ 完全正确！' : '★★ 答对了！' }),
            base.explain ? el('div', { class: 'ch-explain', text: base.explain }) : el('span'),
            base.type === 'tone_discrimination' ? el('div', { class: 'ch-explain', text: toneSequence() }) : el('span'),
          );
          settle(true);
        } else {
          AudioManager.sfx('bad');
          wrongs += 1;
          feedback.className = 'ch-feedback bad';
          if (wrongs === 1) {
            const retry = el('button', { class: 'btn small', text: '再试一次' });
            retry.addEventListener('click', () => {
              hintUsed = true;
              mount();
            });
            feedback.append(
              el('div', { class: 'ch-result', text: '还差一点，再看看提示。' }),
              base.explain ? el('div', { class: 'ch-explain', text: base.explain }) : el('span'),
              el('div', { class: 'ch-actions' }, [retry]),
            );
          } else {
            feedback.append(
              el('div', { class: 'ch-result', text: '没关系，先记住它，等一下在复习里再见。' }),
              base.explain ? el('div', { class: 'ch-explain', text: base.explain }) : el('span'),
            );
            settle(false);
          }
        }
      },
    };
    ChallengeRegistry[base.type].mount(area, ctx);
  };

  mount();
  // 打开就自动播一遍，帮助玩家建立「先听」的习惯
  window.setTimeout(() => play(), 220);
}
