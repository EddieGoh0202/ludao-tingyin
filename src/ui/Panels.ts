import { AudioManager } from '../core/AudioManager';
import { Content } from '../core/ContentRepository';
import { EventBus } from '../core/EventBus';
import { SaveManager } from '../core/SaveManager';
import { StateStore } from '../core/StateStore';
import { dueCards, grade } from '../learning/SRS';
import { CollectionSystem } from '../systems/collection/CollectionSystem';
import { QuestSystem } from '../systems/quest/QuestSystem';
import type { SoundEntry } from '../types';
import { el, openModal, pendingNote, shuffle } from './dom';

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);

function playBtn(sound: SoundEntry): HTMLButtonElement {
  const b = el('button', { class: 'btn small amber', text: '▶' });
  b.addEventListener('click', () => AudioManager.playSound(sound));
  return b;
}

/** 声音簿：按场景分页，未收集的显示为「？？？」 */
export function openCollection(initialScene?: string): void {
  const modal = openModal(`声音簿 · ${StateStore.collectedCount()}/${CollectionSystem.total()}`, { className: 'wide' });
  const tabs = el('div', { class: 'panel-tabs' });
  const grid = el('div', { class: 'col-grid' });
  modal.body.append(tabs, grid, pendingNote());

  const render = (sceneId: string) => {
    tabs.querySelectorAll('.btn').forEach((b) => b.classList.toggle('active', (b as HTMLElement).dataset.scene === sceneId));
    grid.replaceChildren();
    for (const s of Content.soundsIn(sceneId)) {
      const info = StateStore.data.collected[s.id];
      if (!info) {
        grid.append(
          el('div', { class: 'col-item unknown' }, [
            el('div', { class: 'col-text' }, [
              el('div', { class: 'col-hanzi', text: '？？？' }),
              el('div', { class: 'col-mandarin', text: `约 ${Math.floor(s.frequency)} MHz 附近${s.times ? ' · 特定时段' : ''}` }),
            ]),
          ]),
        );
        continue;
      }
      grid.append(
        el('div', { class: 'col-item' }, [
          el('div', { class: 'col-text' }, [
            el('div', { class: 'col-hanzi', text: s.hanzi }),
            StateStore.data.settings.showTailo ? el('div', { class: 'col-tailo', text: s.tailo }) : null,
            el('div', { class: 'col-mandarin', text: s.mandarin }),
            s.culture ? el('div', { class: 'col-culture', text: s.culture }) : null,
          ]),
          el('div', { class: 'col-stars', text: stars(info.stars) }),
          playBtn(s),
        ]),
      );
    }
  };

  for (const sc of Content.scenes) {
    const unlocked = StateStore.data.unlockedScenes.includes(sc.id);
    const b = el('button', {
      class: 'btn small ghost',
      text: `${sc.name} ${CollectionSystem.countInScene(sc.id)}/${Content.soundsIn(sc.id).length}`,
      'data-scene': sc.id,
    });
    b.disabled = !unlocked;
    b.addEventListener('click', () => render(sc.id));
    tabs.append(b);
  }
  render(initialScene ?? StateStore.data.currentScene);
}

export function openQuests(): void {
  const modal = openModal('任务簿');
  const list = QuestSystem.visible();
  if (!list.length) modal.body.append(el('div', { class: 'review-empty', text: '暂时没有任务。' }));
  for (const q of list) {
    const done = QuestSystem.isDone(q.id);
    const p = Math.min(q.goal.target, QuestSystem.progress(q));
    const bar = el('div', { class: 'quest-bar' }, [el('div')]);
    (bar.firstElementChild as HTMLElement).style.width = `${(p / q.goal.target) * 100}%`;
    modal.body.append(
      el('div', { class: `quest-item ${done ? 'done' : ''}` }, [
        el('div', { class: 'quest-title', text: `${done ? '✔ ' : ''}${q.title}  （${p}/${q.goal.target}）` }),
        el('div', { class: 'quest-desc', text: q.desc }),
        bar,
        el('div', { class: 'quest-reward', text: `奖励：${q.reward}` }),
      ]),
    );
  }
  // 词汇表
  const gl = el('div', { class: 'quest-item' }, [el('div', { class: 'quest-title', text: '小词典' })]);
  for (const g of Content.glossary) {
    gl.append(el('div', { class: 'quest-desc', text: `${g.term}（${g.tailo}）—— ${g.note}` }));
  }
  modal.body.append(gl);
}

export function reviewDueCount(): number {
  return dueCards(StateStore.data.review).length;
}

/** 复习：先只听声音，回想意思，再翻面自评「记得 / 忘了」，按 SRS 排期 */
export function openReview(onChange?: () => void): void {
  const modal = openModal('复习 · 再听一遍', { onClose: onChange });
  let queue = dueCards(StateStore.data.review).map((c) => c.soundId);
  let practice = false;

  const renderEmpty = () => {
    modal.body.replaceChildren();
    const collected = Object.keys(StateStore.data.collected);
    modal.body.append(
      el('div', { class: 'review-empty', text: collected.length ? '今天没有到期的卡片，做得好！' : '还没有收集声音，先去调频吧。' }),
    );
    if (collected.length) {
      const b = el('button', { class: 'btn', text: '随便练 5 句' });
      b.addEventListener('click', () => {
        practice = true;
        queue = shuffle(collected).slice(0, 5);
        renderCard();
      });
      modal.body.append(el('div', { class: 'ch-actions' }, [b]));
    }
  };

  const renderCard = () => {
    const id = queue[0];
    const sound = id ? Content.sound(id) : undefined;
    if (!sound) {
      renderEmpty();
      return;
    }
    modal.body.replaceChildren();
    const answer = el('div', { class: 'review-answer hidden' }, [
      el('div', { class: 'ch-hanzi', text: sound.hanzi }),
      el('div', { class: 'col-tailo', text: sound.tailo }),
      el('div', { class: 'col-mandarin', text: sound.mandarin }),
    ]);
    const reveal = el('button', { class: 'btn', text: '翻面看答案' });
    const yes = el('button', { class: 'btn hidden', text: '记得 ✔' });
    const no = el('button', { class: 'btn ghost hidden', text: '忘了 ✘' });
    const listen = el('button', { class: 'ch-play', text: '▶', title: '再听一次' });
    listen.addEventListener('click', () => AudioManager.playSound(sound));
    reveal.addEventListener('click', () => {
      answer.classList.remove('hidden');
      reveal.classList.add('hidden');
      yes.classList.remove('hidden');
      no.classList.remove('hidden');
    });
    const next = (ok: boolean) => {
      AudioManager.sfx(ok ? 'ok' : 'bad');
      const card = StateStore.data.review[sound.id];
      if (card && !practice) StateStore.data.review[sound.id] = grade(card, ok);
      StateStore.persist();
      queue.shift();
      renderCard();
    };
    yes.addEventListener('click', () => next(true));
    no.addEventListener('click', () => next(false));
    modal.body.append(
      el('div', { class: 'review-progress', text: `${practice ? '自由练习' : '到期复习'} · 剩余 ${queue.length} 张` }),
      el('div', { class: 'ch-card' }, [
        el('div', { class: 'ch-card-main' }, [
          el('div', { class: 'ch-hanzi', text: '这句是什么意思？' }),
          el('div', { class: 'ch-meta', text: '先听，在心里说出意思，再翻面' }),
        ]),
        listen,
      ]),
      answer,
      el('div', { class: 'ch-actions' }, [reveal, yes, no]),
      pendingNote(),
    );
    window.setTimeout(() => AudioManager.playSound(sound), 200);
  };

  if (queue.length) renderCard();
  else renderEmpty();
}

export function openSettings(onReset: () => void): void {
  const modal = openModal('设置');
  const s = StateStore.data.settings;
  const vol = el('input') as HTMLInputElement;
  vol.type = 'range';
  vol.min = '0';
  vol.max = '1';
  vol.step = '0.05';
  vol.value = String(s.volume);
  vol.addEventListener('input', () => {
    s.volume = Number(vol.value);
    AudioManager.setVolume(s.volume);
    StateStore.persist();
  });
  const tailo = el('input') as HTMLInputElement;
  tailo.type = 'checkbox';
  tailo.checked = s.showTailo;
  tailo.addEventListener('change', () => {
    s.showTailo = tailo.checked;
    StateStore.persist();
  });
  const reset = el('button', { class: 'btn small', text: '清除存档并回到标题' });
  reset.addEventListener('click', () => {
    if (!window.confirm('确定清除全部进度吗？')) return;
    SaveManager.clear();
    modal.close();
    onReset();
  });
  modal.body.append(
    el('div', { class: 'settings-row' }, [el('span', { text: '音量' }), vol]),
    el('div', { class: 'settings-row' }, [tailo, el('span', { text: '显示台罗拼音（Tâi-lô）' })]),
    el('div', { class: 'settings-row' }, [reset]),
    el('div', { class: 'note', text: '操作：WASD/方向键或点击地面移动；Q/E 或拖动刻度调频；E/空格 交谈。' }),
    pendingNote(),
  );
}

/** 新声音收集后的轻提示 */
export function installCollectToast(): void {
  EventBus.on('sound:collected', ({ soundId, stars: n, isNew }) => {
    const s = Content.sound(soundId);
    if (!s) return;
    EventBus.emit('toast', { text: `${isNew ? '新收集' : '更新'}：「${s.hanzi}」${stars(n)} · ${StateStore.collectedCount()}/${CollectionSystem.total()}` });
  });
}
