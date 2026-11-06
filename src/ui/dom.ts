import type Phaser from 'phaser';

/** 游戏逻辑分辨率，DOM 覆盖层按它做比例换算 */
export const VIEW_W = 480;
export const VIEW_H = 270;

type Child = Node | string | null | undefined | false;

export interface ElAttrs {
  class?: string;
  text?: string;
  html?: string;
  title?: string;
  style?: string;
  onClick?: (e: MouseEvent) => void;
  [data: `data-${string}`]: string;
}

/** 轻量 DOM 构造器：el('button', { class: 'btn', text: '确定', onClick }) */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: ElAttrs = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined) continue;
    if (k === 'class') node.className = v as string;
    else if (k === 'text') node.textContent = v as string;
    else if (k === 'html') node.innerHTML = v as string;
    else if (k === 'onClick') {
      const handler = v as (e: MouseEvent) => void;
      node.addEventListener('click', (ev) => handler(ev as MouseEvent));
    }
    else node.setAttribute(k, v as string);
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c);
  }
  return node;
}

export type LayerName = 'hud' | 'radio' | 'labels' | 'dialogue' | 'modal' | 'toast';
const LAYER_ORDER: LayerName[] = ['labels', 'hud', 'radio', 'dialogue', 'modal', 'toast'];

/** 全局 UI 状态：弹窗打开时 Phaser 场景不响应移动 / 调频按键 */
export const UIState = {
  modalDepth: 0,
  get modalOpen(): boolean {
    return this.modalDepth > 0;
  },
};

/**
 * Stage：让 #overlay 与 Phaser 画布完全重合。
 * CSS 变量 --u = 1 个游戏像素对应的屏幕像素，字号与间距都用它缩放。
 */
class StageImpl {
  private overlay!: HTMLElement;
  private game: Phaser.Game | null = null;
  private layers = new Map<LayerName, HTMLDivElement>();

  init(game: Phaser.Game): void {
    this.game = game;
    this.overlay = document.getElementById('overlay')!;
    for (const name of LAYER_ORDER) {
      const div = el('div', { class: `layer layer-${name}` });
      this.overlay.append(div);
      this.layers.set(name, div);
    }
    const sync = () => this.sync();
    window.addEventListener('resize', () => requestAnimationFrame(sync));
    game.scale.on('resize', () => requestAnimationFrame(sync));
    // 画布尺寸在首帧之后才稳定
    requestAnimationFrame(sync);
    window.setTimeout(sync, 200);
  }

  sync(): void {
    const canvas = this.game?.canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const app = this.overlay.parentElement!.getBoundingClientRect();
    Object.assign(this.overlay.style, {
      left: `${rect.left - app.left}px`,
      top: `${rect.top - app.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    this.overlay.style.setProperty('--u', `${rect.width / VIEW_W}px`);
  }

  layer(name: LayerName): HTMLDivElement {
    return this.layers.get(name)!;
  }

  clear(name: LayerName): void {
    this.layer(name).replaceChildren();
  }

  /** 游戏坐标（0-480, 0-270）→ 覆盖层百分比定位 */
  place(node: HTMLElement, x: number, y: number): void {
    node.style.left = `${(x / VIEW_W) * 100}%`;
    node.style.top = `${(y / VIEW_H) * 100}%`;
  }
}

export const Stage = new StageImpl();

export interface ModalHandle {
  root: HTMLDivElement;
  body: HTMLDivElement;
  close(): void;
}

export interface ModalOptions {
  /** 是否显示右上角关闭按钮，默认 true */
  closable?: boolean;
  /** 弹窗关闭后回调（无论何种方式关闭） */
  onClose?: () => void;
  /** 额外 class，例如 'wide' */
  className?: string;
}

/** 打开一个居中弹窗，返回 body 供调用方填充内容 */
export function openModal(title: string, opts: ModalOptions = {}): ModalHandle {
  const body = el('div', { class: 'modal-body' });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    UIState.modalDepth = Math.max(0, UIState.modalDepth - 1);
    backdrop.remove();
    opts.onClose?.();
  };
  const head = el('div', { class: 'modal-head' }, [
    el('div', { class: 'modal-title', text: title }),
    opts.closable === false ? null : el('button', { class: 'modal-close', text: '×', title: '关闭', onClick: close }),
  ]);
  const modal = el('div', { class: `modal ${opts.className ?? ''}` }, [head, body]);
  const backdrop = el('div', { class: 'modal-backdrop' }, [modal]);
  Stage.layer('modal').append(backdrop);
  UIState.modalDepth += 1;
  return { root: modal, body, close };
}

/** 历史接口：不再展示内部说明文字，保留空节点避免调用方改动 */
export function pendingNote(): HTMLElement {
  return el('div', { class: 'note hidden' });
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
