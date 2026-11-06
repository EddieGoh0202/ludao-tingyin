import { EventBus } from '../core/EventBus';
import { Stage, el } from './dom';

let installed = false;

/** 监听 toast 事件，在右上角依次弹出提示 */
export function installToast(): void {
  if (installed) return;
  installed = true;
  EventBus.on('toast', ({ text }) => {
    const layer = Stage.layer('toast');
    const node = el('div', { class: 'toast', text });
    layer.append(node);
    while (layer.children.length > 3) layer.firstElementChild?.remove();
    window.setTimeout(() => node.classList.add('out'), 3200);
    window.setTimeout(() => node.remove(), 3700);
  });
}
