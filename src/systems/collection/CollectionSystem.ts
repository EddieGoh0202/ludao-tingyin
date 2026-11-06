import { AudioManager } from '../../core/AudioManager';
import { Content } from '../../core/ContentRepository';
import { EventBus } from '../../core/EventBus';
import { StateStore } from '../../core/StateStore';
import { newCard } from '../../learning/SRS';

export const CollectionSystem = {
  /** 收集一段声音；重复收集只保留更高星级。返回是否为新收集 */
  collect(soundId: string, stars: number): boolean {
    const data = StateStore.data;
    const prev = data.collected[soundId];
    const isNew = !prev;
    if (prev) {
      prev.stars = Math.max(prev.stars, stars);
    } else {
      data.collected[soundId] = { soundId, stars, collectedAt: Date.now() };
      data.review[soundId] = newCard(soundId);
    }
    StateStore.persist();
    AudioManager.sfx('collect');
    EventBus.emit('sound:collected', { soundId, stars, isNew });
    return isNew;
  },

  countInScene(sceneId: string): number {
    return Content.soundsIn(sceneId).filter((s) => StateStore.isCollected(s.id)).length;
  },

  total(): number {
    return Content.sounds.length;
  },
};
