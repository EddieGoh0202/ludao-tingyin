import { el, shuffle } from '../../../ui/dom';
import type { ChallengeCtx, ChallengeStrategy } from '../types';

/** 排序：点选词块拼成句子。answer 为正确顺序对应的 tokens 下标 */
export const Reorder: ChallengeStrategy = {
  mount(root: HTMLElement, ctx: ChallengeCtx): void {
    const tokens = ctx.challenge.tokens ?? [];
    const answer = Array.isArray(ctx.challenge.answer) ? ctx.challenge.answer : [];
    const picked: number[] = [];
    let done = false;

    const line = el('div', { class: 'ro-line' });
    const pool = el('div', { class: 'ro-pool' });
    const order = shuffle(tokens.map((_t, i) => i));
    // 避免打乱后恰好就是正确顺序
    if (order.length > 1 && order.every((v, i) => v === answer[i])) order.reverse();

    const chips = new Map<number, HTMLButtonElement>();
    const render = () => {
      line.replaceChildren(
        ...(picked.length
          ? picked.map((i) => {
              const c = el('button', { class: 'ro-chip in', text: tokens[i] });
              c.addEventListener('click', () => {
                if (done) return;
                picked.splice(picked.indexOf(i), 1);
                render();
              });
              return c;
            })
          : [el('span', { class: 'ro-empty', text: '点下面的词块，按顺序放到这里' })]),
      );
      for (const [i, chip] of chips) chip.disabled = done || picked.includes(i);
      submit.disabled = done || picked.length !== tokens.length;
    };

    for (const i of order) {
      const chip = el('button', { class: 'ro-chip', text: tokens[i] });
      chip.addEventListener('click', () => {
        if (done || picked.includes(i)) return;
        picked.push(i);
        render();
      });
      chips.set(i, chip);
      pool.append(chip);
    }

    const reset = el('button', { class: 'btn small ghost', text: '重排' });
    reset.addEventListener('click', () => {
      if (done) return;
      picked.length = 0;
      render();
    });
    const submit = el('button', { class: 'btn small', text: '提交' });
    submit.addEventListener('click', () => {
      if (done) return;
      done = true;
      const ok = picked.every((v, i) => v === answer[i]);
      line.classList.add(ok ? 'correct' : 'wrong');
      if (!ok) {
        root.append(el('div', { class: 'ch-sub', text: `正确顺序：${answer.map((i) => tokens[i]).join(' ')}` }));
      }
      render();
      ctx.answer(ok);
    });

    root.append(line, pool, el('div', { class: 'ro-tools' }, [reset, submit]));
    render();
  },
};
