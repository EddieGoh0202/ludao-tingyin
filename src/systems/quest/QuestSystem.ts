import { AudioManager } from '../../core/AudioManager';
import { Content } from '../../core/ContentRepository';
import { EventBus } from '../../core/EventBus';
import { StateStore } from '../../core/StateStore';
import type { QuestDef } from '../../types';
import { CollectionSystem } from '../collection/CollectionSystem';

let initialized = false;

export const QuestSystem = {
  init(): void {
    if (initialized) return;
    initialized = true;
    EventBus.on('sound:collected', () => this.evaluate());
    EventBus.on('minigame:result', ({ key, win }) => {
      if (win) {
        const wins = StateStore.data.minigameWins;
        wins[key] = (wins[key] ?? 0) + 1;
        StateStore.persist();
      }
      this.evaluate();
    });
  },

  progress(q: QuestDef): number {
    const g = q.goal;
    switch (g.type) {
      case 'collect_in_scene':
        return CollectionSystem.countInScene(q.sceneId);
      case 'collect_total':
        return StateStore.collectedCount();
      case 'minigame_win':
        return StateStore.data.minigameWins[g.key ?? ''] ?? 0;
    }
  },

  isDone(id: string): boolean {
    return StateStore.data.quests[id] === 'done';
  },

  /** 当前可见任务：所在场景已解锁 */
  visible(): QuestDef[] {
    const unlocked = new Set(StateStore.data.unlockedScenes);
    return Content.quests.filter((q) => unlocked.has(q.sceneId));
  },

  evaluate(): void {
    const data = StateStore.data;
    let changed = false;
    for (const q of this.visible()) {
      if (this.isDone(q.id)) continue;
      if (this.progress(q) >= q.goal.target) {
        data.quests[q.id] = 'done';
        changed = true;
        EventBus.emit('quest:completed', { questId: q.id });
        EventBus.emit('toast', { text: `任务完成：${q.title} · ${q.reward}` });
      }
    }
    if (this.checkUnlocks()) changed = true;
    if (changed) StateStore.persist();
  },

  /** 按累计收集数解锁新场景 */
  checkUnlocks(): boolean {
    const data = StateStore.data;
    const count = StateStore.collectedCount();
    let changed = false;
    for (const s of Content.scenes) {
      if (data.unlockedScenes.includes(s.id)) continue;
      if (count >= s.unlock.requireCollected) {
        data.unlockedScenes.push(s.id);
        changed = true;
        AudioManager.sfx('unlock');
        EventBus.emit('scene:unlocked', { sceneId: s.id });
        EventBus.emit('toast', { text: `新地点解锁：${s.name}（${s.tailo}），打开地图前往吧！` });
      }
    }
    return changed;
  },
};
