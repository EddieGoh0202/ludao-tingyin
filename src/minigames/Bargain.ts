import './minigames.css';
import data from '../../content/minigames.json';
import { el, openModal, pendingNote, shuffle } from '../ui/dom';
import { AudioManager } from '../core/AudioManager';
import { speak } from '../core/speak';
import { EventBus } from '../core/EventBus';

interface Line {
  hanzi: string;
  tailo: string;
  mandarin: string;
}

const cfg = data.bargain;

/** 一句闽南话台词卡：汉字 + 台罗 + 普通话 + 播放 */
export function lineCard(line: Line, speaker: string, voiceId?: string): HTMLElement {
  const play = () => speak(line.hanzi, line.tailo, voiceId);
  return el('div', { class: 'mg-line' }, [
    el('div', { class: 'mg-speaker', text: speaker }),
    el('div', { class: 'mg-hanzi', text: line.hanzi }),
    el('div', { class: 'mg-tailo', text: line.tailo }),
    el('div', { class: 'mg-mandarin', text: line.mandarin }),
    el('button', { class: 'mg-btn mg-btn-small', text: '▶ 再听一次', onClick: play }),
  ]);
}

/** 八市砍价：3 轮闽南话选择题，答对 ≥ passScore 成功降价 */
export function openBargain(): void {
  const modal = openModal(cfg.title, { className: 'wide' });
  const stage = el('div', { class: 'mg-stage' });
  modal.body.append(stage, pendingNote());

  let round = 0;
  let score = 0;
  let reported = false;

  const start = () => {
    round = 0;
    score = 0;
    reported = false;
    stage.replaceChildren(
      lineCard(cfg.intro, '头家娘', 'mg-bargain-intro'),
      el('div', { class: 'mg-row' }, [el('button', { class: 'mg-btn', text: '开始讲价', onClick: showRound })]),
    );
    speak(cfg.intro.hanzi, cfg.intro.tailo, 'mg-bargain-intro');
  };

  function showRound(): void {
    const r = cfg.rounds[round];
    const order = shuffle(r.options.map((_, i) => i));
    const feedback = el('div', { class: 'mg-feedback' });
    const optBox = el('div', { class: 'mg-options' });
    let answered = false;

    order.forEach((origIdx) => {
      const opt = r.options[origIdx];
      const btn = el('button', { class: 'mg-btn mg-option' }, [
        el('span', { class: 'mg-opt-hanzi', text: opt.hanzi }),
        opt.tailo ? el('span', { class: 'mg-opt-tailo', text: opt.tailo }) : null,
      ]);
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const ok = origIdx === r.answer;
        if (ok) score += 1;
        AudioManager.sfx(ok ? 'ok' : 'bad');
        if (opt.tailo) speak(opt.hanzi, opt.tailo, `mg-bargain-r${round + 1}-opt${origIdx + 1}`);
        for (const b of optBox.querySelectorAll('button')) b.setAttribute('disabled', 'true');
        btn.classList.add(ok ? 'mg-right' : 'mg-wrong');
        const rightBtn = optBox.children[order.indexOf(r.answer)];
        rightBtn?.classList.add('mg-right');
        const last = round >= cfg.rounds.length - 1;
        feedback.replaceChildren(
          el('div', { class: ok ? 'mg-ok' : 'mg-bad', text: ok ? '答对了！' : '差一点～' }),
          el('div', { class: 'mg-explain', text: r.explain }),
          el('button', {
            class: 'mg-btn',
            text: last ? '看结果' : '下一轮',
            onClick: () => {
              round += 1;
              if (last) showResult();
              else showRound();
            },
          }),
        );
      });
      optBox.append(btn);
    });

    stage.replaceChildren(
      el('div', { class: 'mg-progress', text: `第 ${round + 1} / ${cfg.rounds.length} 轮 · 答对 ${score}` }),
      lineCard({ hanzi: r.line, tailo: r.tailo, mandarin: r.mandarin }, '头家娘', `mg-bargain-r${round + 1}`),
      el('div', { class: 'mg-prompt', text: r.prompt }),
      optBox,
      feedback,
    );
    speak(r.line, r.tailo, `mg-bargain-r${round + 1}`);
  }

  function showResult(): void {
    const win = score >= cfg.passScore;
    if (!reported) {
      reported = true;
      EventBus.emit('minigame:result', { key: 'bargain', win });
    }
    const line = win ? cfg.win : cfg.lose;
    const lineId = win ? 'mg-bargain-win' : 'mg-bargain-lose';
    AudioManager.sfx(win ? 'unlock' : 'bad');
    stage.replaceChildren(
      el('div', { class: win ? 'mg-result mg-ok' : 'mg-result mg-bad', text: win ? `砍价成功！答对 ${score} / ${cfg.rounds.length}` : `砍价失败，答对 ${score} / ${cfg.rounds.length}` }),
      lineCard(line, '头家娘', lineId),
      el('div', { class: 'mg-row' }, [
        win ? null : el('button', { class: 'mg-btn', text: '再试一次', onClick: start }),
        el('button', { class: 'mg-btn', text: '离开摊位', onClick: () => modal.close() }),
      ]),
    );
    speak(line.hanzi, line.tailo, lineId);
  }

  start();
}
