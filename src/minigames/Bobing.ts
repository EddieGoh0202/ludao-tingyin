import './minigames.css';
import data from '../../content/minigames.json';
import { el, openModal, pendingNote } from '../ui/dom';
import { AudioManager } from '../core/AudioManager';
import { speak } from '../core/speak';
import { EventBus } from '../core/EventBus';
import { lineCard } from './Bargain';

const cfg = data.bobing;
type PrizeKey = 'zhuangyuan' | 'duitang' | 'sanhong' | 'sijin' | 'erju' | 'yixiu' | 'none';

/** 3×3 网格中各点数的点位 */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** 连续未出状元次数（本次会话内累计） */
let misses = 0;

/** 简化博饼判奖 */
export function judge(dice: number[]): PrizeKey {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dice) counts[d] += 1;
  const fours = counts[4];
  if (fours >= 4 || counts.some((c) => c >= 5)) return 'zhuangyuan';
  if ([1, 2, 3, 4, 5, 6].every((f) => counts[f] === 1)) return 'duitang';
  if (fours === 3) return 'sanhong';
  if (counts.some((c, f) => f !== 4 && c === 4)) return 'sijin';
  if (fours === 2) return 'erju';
  if (fours === 1) return 'yixiu';
  return 'none';
}

const rand = () => 1 + Math.floor(Math.random() * 6);

function dieNode(value: number): HTMLElement {
  const red = value === 1 || value === 4;
  const cells: HTMLElement[] = [];
  for (let i = 0; i < 9; i++) {
    const on = PIPS[value].includes(i);
    cells.push(el('span', { class: on ? (red ? 'mg-pip mg-pip-red' : 'mg-pip') : 'mg-pip-empty' }));
  }
  return el('div', { class: 'mg-die', title: String(value) }, cells);
}

/** 中山路博饼：六骰跋碗，保底状元 */
export function openBobing(): void {
  let timer: number | null = null;
  const modal = openModal(cfg.title, {
    className: 'wide',
    onClose: () => {
      if (timer !== null) window.clearInterval(timer);
    },
  });

  let dice = [1, 2, 3, 4, 5, 6];
  const bowl = el('div', { class: 'mg-bowl' });
  const result = el('div', { class: 'mg-prize' });
  const stats = el('div', { class: 'mg-progress' });
  const tally = new Map<PrizeKey, number>();
  const rollBtn = el('button', { class: 'mg-btn mg-btn-big', text: cfg.rollLabel });

  const renderDice = () => bowl.replaceChildren(...dice.map(dieNode));
  const renderStats = () => {
    const parts = cfg.prizes
      .filter((p) => p.key !== 'none' && tally.get(p.key as PrizeKey))
      .map((p) => `${p.name}×${tally.get(p.key as PrizeKey)}`);
    stats.textContent = parts.length ? `本局战绩：${parts.join('　')}` : '本局战绩：还没中奖';
  };

  const finish = () => {
    let forced = false;
    let key = judge(dice);
    if (key !== 'zhuangyuan' && misses >= cfg.pityAfter) {
      // 保底：强制状元
      dice = [4, 4, 4, 4, rand(), rand()];
      key = judge(dice);
      forced = true;
    }
    renderDice();
    misses = key === 'zhuangyuan' ? 0 : misses + 1;
    tally.set(key, (tally.get(key) ?? 0) + 1);
    renderStats();

    const prize = cfg.prizes.find((p) => p.key === key)!;
    const children: (HTMLElement | null)[] = [
      forced ? lineCard(cfg.pityLine, '阿伯', 'mg-bobing-pity') : null,
      el('div', { class: key === 'none' ? 'mg-prize-name' : 'mg-prize-name mg-ok' }, [
        el('span', { text: prize.name }),
        el('span', { class: 'mg-opt-tailo', text: ` ${prize.tailo}` }),
      ]),
      el('div', { class: 'mg-explain', text: prize.desc }),
      key === 'zhuangyuan' ? lineCard(cfg.winLine, '众人', 'mg-bobing-win') : null,
    ];
    result.replaceChildren(...children.filter((c): c is HTMLElement => c !== null));

    if (key === 'zhuangyuan') {
      AudioManager.sfx('unlock');
      if (forced) speak(cfg.pityLine.hanzi, cfg.pityLine.tailo, 'mg-bobing-pity');
      else speak(cfg.winLine.hanzi, cfg.winLine.tailo, 'mg-bobing-win');
      EventBus.emit('minigame:result', { key: 'bobing', win: true });
    } else if (key !== 'none') {
      AudioManager.sfx('ok');
      speak(prize.name, prize.tailo, `mg-bobing-${prize.key}`);
    }
    rollBtn.removeAttribute('disabled');
  };

  rollBtn.addEventListener('click', () => {
    if (timer !== null) return;
    rollBtn.setAttribute('disabled', 'true');
    result.replaceChildren(el('div', { class: 'mg-explain', text: '骰子叮叮当当……' }));
    const started = performance.now();
    timer = window.setInterval(() => {
      dice = dice.map(rand);
      renderDice();
      AudioManager.sfx('dice');
      if (performance.now() - started >= 600) {
        window.clearInterval(timer!);
        timer = null;
        finish();
      }
    }, 90);
  });

  renderDice();
  renderStats();
  modal.body.append(
    lineCard(cfg.intro, '阿伯', 'mg-bobing-intro'),
    bowl,
    el('div', { class: 'mg-row' }, [rollBtn]),
    result,
    stats,
    pendingNote(),
  );
  speak(cfg.intro.hanzi, cfg.intro.tailo, 'mg-bobing-intro');
}
