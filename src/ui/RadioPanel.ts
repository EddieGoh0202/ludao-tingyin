import { AudioManager } from '../core/AudioManager';
import { Content } from '../core/ContentRepository';
import { FREQ_MAX, FREQ_MIN, type RadioSignal, type RadioSystem } from '../systems/radio/RadioSystem';
import { Stage, el } from './dom';

/**
 * 收音机面板（右下角）：频率窗、可拖动刻度、锁定环、电源、S/清晰度表、Q/E 微调。
 * 由场景每帧调用 render(signal)。
 */
export class RadioPanel {
  private root!: HTMLDivElement;
  private freqEl!: HTMLDivElement;
  private needle!: HTMLDivElement;
  private lock!: HTMLDivElement;
  private sBar!: HTMLDivElement;
  private cBar!: HTMLDivElement;
  private status!: HTMLSpanElement;
  private power!: HTMLButtonElement;
  private dragging = false;
  private lastText = '';

  constructor(private radio: RadioSystem) {}

  mount(): void {
    this.freqEl = el('div', { class: 'radio-freq' });
    this.needle = el('div', { class: 'radio-needle' });
    const scale = el('div', { class: 'radio-scale', title: '拖动或点击调频' }, [this.needle]);
    const setFromPointer = (e: PointerEvent) => {
      const r = scale.getBoundingClientRect();
      const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      this.radio.setFreq(FREQ_MIN + t * (FREQ_MAX - FREQ_MIN));
    };
    scale.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      scale.setPointerCapture(e.pointerId);
      setFromPointer(e);
      e.stopPropagation();
    });
    scale.addEventListener('pointermove', (e) => {
      if (this.dragging) setFromPointer(e);
    });
    const stop = () => {
      this.dragging = false;
    };
    scale.addEventListener('pointerup', stop);
    scale.addEventListener('pointercancel', stop);

    this.lock = el('div', { class: 'radio-lock' });
    this.power = el('button', { class: 'radio-power', text: '电源', title: '开 / 关收音机' });
    this.power.addEventListener('click', (e) => {
      e.stopPropagation();
      AudioManager.init();
      AudioManager.sfx('click');
      this.radio.setOn(!this.radio.on);
    });

    this.sBar = el('div');
    this.cBar = el('div');
    const down = el('button', { class: 'btn small ghost', text: 'Q ◀', title: '频率 -0.1（按住 Shift 为 -1）' });
    const up = el('button', { class: 'btn small ghost', text: '▶ E', title: '频率 +0.1（按住 Shift 为 +1）' });
    down.addEventListener('click', (e) => this.radio.tune(e.shiftKey ? -1 : -0.1));
    up.addEventListener('click', (e) => this.radio.tune(e.shiftKey ? 1 : 0.1));
    this.status = el('span', { class: 'radio-status' });

    this.root = el('div', { class: 'radio-panel' }, [
      el('div', { class: 'radio-window' }, [this.freqEl, scale]),
      el('div', { class: 'radio-knob' }, [this.lock, this.power]),
      el('div', { class: 'radio-meters' }, [
        el('span', { text: '信号' }),
        el('div', { class: 'radio-meter' }, [this.sBar]),
        el('span', { text: '清晰' }),
        el('div', { class: 'radio-meter clarity' }, [this.cBar]),
      ]),
      el('div', { class: 'radio-tune' }, [down, up, this.status]),
    ]);
    // 面板上的点击不应触发场景里的「点击移动」
    this.root.addEventListener('pointerdown', (e) => e.stopPropagation());
    Stage.layer('radio').append(this.root);
  }

  render(sig: RadioSignal): void {
    const r = this.radio;
    this.freqEl.innerHTML = `${r.freq.toFixed(1)}<small>MHz</small>`;
    this.needle.style.left = `${((r.freq - FREQ_MIN) / (FREQ_MAX - FREQ_MIN)) * 100}%`;
    this.lock.style.setProperty('--p', String(Math.round(sig.lockProgress * 100)));
    this.sBar.style.width = `${Math.round(sig.strength * 100)}%`;
    this.cBar.style.width = `${Math.round((sig.targetId ? sig.clarity : 0) * 100)}%`;
    this.root.classList.toggle('off', !r.on);
    this.root.classList.toggle('locked', sig.lockProgress > 0.05);
    this.power.textContent = r.on ? '关' : '开';

    let text: string;
    if (!r.on) text = '收音机已关闭';
    else if (r.paused) text = '……';
    else if (sig.lockProgress > 0.05) text = '锁定中，保持住！';
    else if (sig.targetId) {
      const s = Content.sound(sig.targetId);
      text = sig.clarity > 0.9 ? '再靠近一点' : `有声音：${s?.speaker ?? '某人'}…`;
    } else if (sig.strength > 0.25) text = '附近有声音，慢慢调频';
    else if (sig.strength > 0) text = '远处隐约有声…';
    else text = '只有沙沙声，四处走走';
    if (text !== this.lastText) {
      this.status.textContent = text;
      this.lastText = text;
    }
  }

  setVisible(v: boolean): void {
    this.root.classList.toggle('hidden', !v);
  }

  destroy(): void {
    this.root?.remove();
  }
}
