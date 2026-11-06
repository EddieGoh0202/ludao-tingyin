import { knowledgeArt } from '../../art/illustrations';
import { AudioManager } from '../../core/AudioManager';
import { Content } from '../../core/ContentRepository';
import { EventBus } from '../../core/EventBus';
import { speak } from '../../core/speak';
import { StateStore } from '../../core/StateStore';
import type { KnowledgeDef } from '../../types';
import { el, openModal } from '../../ui/dom';

const CATEGORY_LABEL: Record<KnowledgeDef['category'], string> = {
  food: '闽南美食',
  architecture: '闽南建筑',
  custom: '民俗风情',
  craft: '老手艺',
  nature: '山海风物',
};

/** 闽南文化科普点：靠近后打开图文卡片，记录已读 */
export const KnowledgeSystem = {
  isSeen(id: string): boolean {
    return StateStore.data.knowledgeSeen.includes(id);
  },

  seenCount(): number {
    const ids = new Set(Content.knowledge.map((k) => k.id));
    return StateStore.data.knowledgeSeen.filter((id) => ids.has(id)).length;
  },

  total(): number {
    return Content.knowledge.length;
  },

  markSeen(id: string): boolean {
    if (this.isSeen(id)) return false;
    StateStore.data.knowledgeSeen.push(id);
    StateStore.persist();
    return true;
  },

  open(k: KnowledgeDef, onClose?: () => void): void {
    const isNew = this.markSeen(k.id);
    const modal = openModal(`${CATEGORY_LABEL[k.category]} · ${k.title}`, { className: 'wide knowledge', onClose });
    const art = el('img', { class: 'kn-art' }) as HTMLImageElement;
    art.src = knowledgeArt(k.prop);
    art.alt = k.title;

    const say = el('button', { class: 'btn small amber', text: '▶ 听' });
    say.addEventListener('click', () => speak(k.title, k.tailo, k.id));

    const head = el('div', { class: 'kn-head' }, [
      el('div', { class: 'kn-title', text: k.title }),
      StateStore.data.settings.showTailo ? el('div', { class: 'kn-tailo', text: k.tailo }) : null,
      el('div', { class: 'kn-summary', text: k.summary }),
      say,
    ]);

    const words = k.words?.length
      ? el(
          'div',
          { class: 'kn-words' },
          k.words.map((w, n) => {
            const b = el('button', { class: 'kn-word' }, [
              el('b', { text: w.hanzi }),
              StateStore.data.settings.showTailo ? el('i', { text: w.tailo }) : null,
              el('span', { text: w.mandarin }),
            ]);
            b.addEventListener('click', () => speak(w.hanzi, w.tailo, `${k.id}-w${n + 1}`));
            return b;
          }),
        )
      : null;

    const parts: Array<HTMLElement | null> = [
      el('div', { class: 'kn-top' }, [art, head]),
      el(
        'div',
        { class: 'kn-body' },
        k.body.map((p) => el('p', { text: p })),
      ),
      words ? el('div', { class: 'kn-sub', text: '相关闽南话（点击可听）' }) : null,
      words,
      el('div', { class: 'kn-foot', text: `闽南见闻 ${this.seenCount()}/${this.total()}` }),
    ];
    modal.body.append(...parts.filter((p): p is HTMLElement => p !== null));
    AudioManager.sfx('ok');
    if (isNew) EventBus.emit('toast', { text: `新见闻：${k.title} · ${this.seenCount()}/${this.total()}` });
  },
};
