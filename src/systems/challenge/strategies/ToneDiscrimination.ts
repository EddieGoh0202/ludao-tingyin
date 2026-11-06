import { XIAMEN_TONE_CONTOUR, splitSyllables, toneOf } from '../../../learning/tailo';
import { el } from '../../../ui/dom';
import type { ChallengeCtx, ChallengeStrategy } from '../types';
import { mountOptions } from './options';

/** 声调辨析：逐音节试听调型，再选答案 */
export const ToneDiscrimination: ChallengeStrategy = {
  mount(root: HTMLElement, ctx: ChallengeCtx): void {
    const syllables = splitSyllables(ctx.sound.tailo);
    const row = el('div', { class: 'tone-row' });
    for (const syl of syllables) {
      const tone = toneOf(syl);
      const contour = XIAMEN_TONE_CONTOUR[tone];
      const btn = el('button', { class: 'tone-chip', title: '播放这个音节的调型' }, [
        el('span', { class: 'tone-syl', text: syl.normalize('NFC') }),
        el('span', { class: 'tone-icon', text: '♪' }),
      ]);
      btn.addEventListener('click', () => ctx.playTone(tone));
      row.append(btn);
      // 「看调值」视为提示
      void contour;
    }
    const hintBtn = el('button', { class: 'btn small ghost', text: '看调值提示' });
    const hintBox = el('div', { class: 'tone-hint hidden' });
    hintBox.textContent = syllables
      .map((s) => `${s.normalize('NFC')}：${XIAMEN_TONE_CONTOUR[toneOf(s)].name}`)
      .join('　');
    hintBtn.addEventListener('click', () => {
      ctx.hint();
      hintBox.classList.remove('hidden');
      hintBtn.disabled = true;
    });
    root.append(el('div', { class: 'ch-sub', text: '点击每个音节，听它的高低走向：' }), row, el('div', { class: 'tone-tools' }, [hintBtn, hintBox]));
    mountOptions(root, ctx, { style: 'list' });
  },
};
