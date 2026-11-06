import type { TimeOfDay } from '../types';

export interface GameEvents {
  'radio:locked': { soundId: string };
  'radio:signal': { strength: number; clarity: number; nearestId: string | null };
  'challenge:completed': { soundId: string; correct: boolean; stars: number };
  'sound:collected': { soundId: string; stars: number; isNew: boolean };
  'time:changed': { time: TimeOfDay };
  'quest:completed': { questId: string };
  'scene:enter': { sceneId: string };
  'scene:unlocked': { sceneId: string };
  'toast': { text: string };
  'ui:open': { panel: 'collection' | 'map' | 'review' | 'quests' };
  'minigame:result': { key: string; win: boolean };
}

type Handler<T> = (payload: T) => void;

class EventBusImpl {
  private handlers = new Map<string, Set<Handler<unknown>>>();

  on<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<unknown>);
    return () => this.off(event, handler);
  }

  off<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): void {
    this.handlers.get(event)?.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    this.handlers.get(event)?.forEach((h) => {
      try {
        h(payload);
      } catch (err) {
        console.error(`[EventBus] ${event} handler error`, err);
      }
    });
  }
}

export const EventBus = new EventBusImpl();
