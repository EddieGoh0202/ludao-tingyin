import { AudioManager } from '../../core/AudioManager';
import { Stage, UIState, el } from '../../ui/dom';

export interface DialogueLine {
  speaker?: string;
  text: string;
  /** 有台罗或实体录音时显示「▶」按钮；没有录音则使用调型提示音 */
  tailo?: string;
  /** 相对于应用 base URL 的实体台语录音路径 */
  audio?: string;
  /** 该句的立绘（dataURL）；未提供则沿用对话选项里的立绘 */
  portrait?: string | null;
}

export interface DialogueOptions {
  /** 全屏背景插画 dataURL：提供时进入「视觉小说」式对话 */
  bg?: string;
  /** 对方立绘 dataURL */
  portrait?: string | null;
  /** 玩家立绘 dataURL（speaker 为「我」时显示在左侧） */
  playerPortrait?: string | null;
}

/**
 * 底部对话框：逐字显示，点击 / 空格 / 回车 → 若未打完则补全，否则下一句。
 * 对话期间计入 UIState.modalDepth，场景不响应移动。
 */
class DialogueSystemImpl {
  private queue: DialogueLine[] = [];
  private box: HTMLDivElement | null = null;
  private textEl!: HTMLDivElement;
  private speakerEl!: HTMLDivElement;
  private playBtn!: HTMLButtonElement;
  private scrim: HTMLDivElement | null = null;
  private portraitEl: HTMLImageElement | null = null;
  private opts: DialogueOptions = {};
  private full = '';
  private shown = 0;
  private timer: number | null = null;
  private onDone: (() => void) | null = null;
  private keyHandler = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      e.stopPropagation();
      this.advance();
    }
  };

  get active(): boolean {
    return this.box !== null;
  }

  /** 切换场景时强制关闭：清空队列、释放 modalDepth，不触发 onDone */
  dismiss(): void {
    if (!this.box) return;
    this.queue = [];
    this.onDone = null;
    this.close();
  }

  show(lines: DialogueLine[] | DialogueLine, onDone?: () => void, opts: DialogueOptions = {}): void {
    const arr = Array.isArray(lines) ? lines : [lines];
    if (!arr.length) {
      onDone?.();
      return;
    }
    if (this.box) {
      // 已在对话中：追加到队列，回调串联
      this.queue.push(...arr);
      const prev = this.onDone;
      this.onDone = () => {
        prev?.();
        onDone?.();
      };
      return;
    }
    this.queue = [...arr];
    this.onDone = onDone ?? null;
    this.opts = opts;
    this.open();
    this.next();
  }

  private open(): void {
    const layer = Stage.layer('dialogue');
    if (this.opts.bg) {
      const bg = el('div', { class: 'dlg-bg' });
      bg.style.backgroundImage = `url(${this.opts.bg})`;
      this.portraitEl = el('img', { class: 'dlg-portrait hidden' }) as HTMLImageElement;
      this.portraitEl.alt = '';
      this.scrim = el('div', { class: 'dlg-scrim' }, [bg, el('div', { class: 'dlg-shade' }), this.portraitEl]);
      layer.append(this.scrim);
    }
    this.speakerEl = el('div', { class: 'dlg-speaker' });
    this.textEl = el('div', { class: 'dlg-text' });
    this.playBtn = el('button', { class: 'dlg-play hidden', text: '▶', title: '播放' });
    this.playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const audio = this.playBtn.dataset.audio;
      if (audio) AudioManager.playAudio(audio);
    });
    const more = el('div', { class: 'dlg-more', text: '▼' });
    this.box = el('div', { class: `dlg-box ${this.opts.bg ? 'vn' : ''}` }, [this.speakerEl, this.textEl, this.playBtn, more]);
    this.box.addEventListener('click', () => this.advance());
    this.scrim?.addEventListener('click', () => this.advance());
    layer.append(this.box);
    UIState.modalDepth += 1;
    window.addEventListener('keydown', this.keyHandler, true);
  }

  private close(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    AudioManager.stopVoice();
    this.box?.remove();
    this.box = null;
    this.scrim?.remove();
    this.scrim = null;
    this.portraitEl = null;
    this.opts = {};
    UIState.modalDepth = Math.max(0, UIState.modalDepth - 1);
    window.removeEventListener('keydown', this.keyHandler, true);
    const cb = this.onDone;
    this.onDone = null;
    cb?.();
  }

  private next(): void {
    const line = this.queue.shift();
    if (!line) {
      this.close();
      return;
    }
    this.speakerEl.textContent = line.speaker ?? '';
    this.speakerEl.classList.toggle('hidden', !line.speaker);
    if (this.portraitEl) {
      const isPlayer = line.speaker === '我';
      const src = line.portrait !== undefined ? line.portrait : isPlayer ? this.opts.playerPortrait : this.opts.portrait;
      this.portraitEl.classList.toggle('hidden', !src);
      this.portraitEl.classList.toggle('left', isPlayer);
      if (src && this.portraitEl.src !== src) {
        this.portraitEl.src = src;
        this.portraitEl.classList.remove('enter');
        void this.portraitEl.offsetWidth;
        this.portraitEl.classList.add('enter');
      }
    }
    this.playBtn.classList.toggle('hidden', !line.tailo && !line.audio);
    this.playBtn.dataset.tailo = line.tailo ?? '';
    this.playBtn.dataset.audio = line.audio ?? '';
    // 有真人录音的台词显示即自动播放；无录音的不自动放占位合成
    if (line.audio) AudioManager.playAudio(line.audio);
    else AudioManager.stopVoice();
    this.full = line.text;
    this.shown = 0;
    this.textEl.textContent = '';
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      this.shown += 1;
      this.textEl.textContent = this.full.slice(0, this.shown);
      if (this.shown >= this.full.length && this.timer !== null) {
        window.clearInterval(this.timer);
        this.timer = null;
      }
    }, 28);
  }

  private advance(): void {
    if (!this.box) return;
    AudioManager.sfx('click');
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
      this.textEl.textContent = this.full;
      return;
    }
    this.next();
  }
}

export const DialogueSystem = new DialogueSystemImpl();
