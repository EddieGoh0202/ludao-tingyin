import { el } from '../../../ui/dom';
import type { ChallengeCtx } from '../types';

/** 供「找东西」使用的卡片图标；未收录的选项退化为放大镜 */
const ICONS: Record<string, string> = {
  茶壶: '🫖',
  菜脯: '🥬',
  藤椅: '🪑',
  收音机: '📻',
  风狮爷: '🦁',
  竹筛: '🧺',
  海蛎: '🦪',
  花蛤: '🐚',
  小管: '🦑',
  石斑鱼: '🐟',
  土笋冻: '🍮',
  虾: '🦐',
};

/**
 * 单选类题目的公共渲染（listen_choose / dialogue_choice / proverb_fill / find_object）。
 * 选项已在 ChallengeRunner 中打乱，answer 为正确项下标。
 */
export function mountOptions(
  root: HTMLElement,
  ctx: ChallengeCtx,
  opts: { style: 'list' | 'grid'; icon?: boolean } = { style: 'list' },
): void {
  const { options = [], answer } = ctx.challenge;
  const correctIndex = typeof answer === 'number' ? answer : 0;
  const buttons: HTMLButtonElement[] = [];
  let done = false;

  const list = el('div', { class: opts.style === 'grid' ? 'ch-options grid' : 'ch-options' });
  options.forEach((text, i) => {
    const label = el('span', { class: 'ch-opt-label', text });
    const btn = el('button', { class: 'ch-opt', 'data-index': String(i) }, [
      opts.icon ? el('span', { class: 'ch-opt-icon', text: ICONS[text] ?? '🔍' }) : null,
      label,
    ]);
    btn.addEventListener('click', () => {
      if (done) return;
      done = true;
      for (const b of buttons) b.disabled = true;
      btn.classList.add(i === correctIndex ? 'correct' : 'wrong');
      if (i !== correctIndex) buttons[correctIndex]?.classList.add('correct');
      ctx.answer(i === correctIndex);
    });
    buttons.push(btn);
    list.append(btn);
  });
  root.append(list);

  const status = el('div', { class: 'ch-status' });
  root.append(status);
}
