import { Content } from '../core/ContentRepository';
import { EventBus } from '../core/EventBus';
import { StateStore } from '../core/StateStore';
import { CollectionSystem } from '../systems/collection/CollectionSystem';
import { TIME_HINT, TIME_LABEL, TimeSystem } from '../systems/timeWeather/TimeSystem';
import { Stage, el } from './dom';
import { openCollection, openQuests, openReview, openSettings, reviewDueCount } from './Panels';

export interface HudCallbacks {
  onMap: () => void;
  onReset: () => void;
}

/** 顶部状态栏 + 左下角操作提示 */
export class Hud {
  private bar!: HTMLDivElement;
  private hint!: HTMLDivElement;
  private countEl!: HTMLDivElement;
  private timeBtn!: HTMLButtonElement;
  private badge!: HTMLSpanElement;
  private offs: Array<() => void> = [];

  constructor(
    private sceneId: string,
    private cb: HudCallbacks,
  ) {}

  mount(): void {
    const sc = Content.scene(this.sceneId);
    this.countEl = el('div', { class: 'hud-count' });
    this.timeBtn = el('button', { class: 'btn small amber' });
    this.timeBtn.addEventListener('click', () => TimeSystem.advance());
    this.badge = el('span', { class: 'badge' });

    const btn = (text: string, fn: () => void) => {
      const b = el('button', { class: 'btn small', text });
      b.addEventListener('click', fn);
      return b;
    };
    const reviewBtn = el('button', { class: 'btn small', text: '复习' }, [this.badge]);
    reviewBtn.addEventListener('click', () => openReview(() => this.refresh()));
    this.bar = el('div', { class: 'hud-bar' }, [
      el('div', { class: 'hud-place', html: `<b>${sc.name}</b><i>${sc.tailo}</i>` }),
      this.countEl,
      this.timeBtn,
      el('div', { class: 'hud-spacer' }),
      el('div', { class: 'hud-btns' }, [
        btn('地图', () => this.cb.onMap()),
        btn('声音簿', () => openCollection(this.sceneId)),
        btn('任务', () => openQuests()),
        reviewBtn,
        btn('设置', () => openSettings(() => this.cb.onReset())),
      ]),
    ]);
    this.bar.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.hint = el('div', { class: 'hud-hint', text: 'WASD/方向键 或 点击地面移动 · Q/E 调频（Shift 加速）· 靠近人物按 空格 交谈' });
    Stage.layer('hud').append(this.bar, this.hint);

    this.offs.push(
      EventBus.on('sound:collected', () => this.refresh()),
      EventBus.on('time:changed', () => this.refresh()),
    );
    this.refresh();
  }

  refresh(): void {
    this.countEl.textContent = `声音 ${StateStore.collectedCount()}/${CollectionSystem.total()} 段`;
    const t = TimeSystem.current;
    this.timeBtn.textContent = `☀ ${TIME_LABEL[t]}`;
    this.timeBtn.title = `${TIME_HINT[t]} · 点击切换时段（不同时段能听到不同的声音）`;
    const due = reviewDueCount();
    this.badge.textContent = String(due);
    this.badge.classList.toggle('hidden', due === 0);
  }

  setHint(text: string): void {
    this.hint.textContent = text;
  }

  destroy(): void {
    this.offs.forEach((f) => f());
    this.offs = [];
    this.bar?.remove();
    this.hint?.remove();
  }
}
