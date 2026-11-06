import type { SaveData, TimeOfDay } from '../types';
import { SaveManager, createDefaultSave } from './SaveManager';

class StateStoreImpl {
  data: SaveData = createDefaultSave();
  private saveTimer: number | null = null;

  loadOrNew(fresh = false): void {
    const loaded = fresh ? null : SaveManager.load();
    this.data = loaded ?? createDefaultSave();
  }

  /** 合并多次写入，300ms 内只落盘一次 */
  persist(): void {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      SaveManager.save(this.data);
      this.saveTimer = null;
    }, 300);
  }

  setScene(id: string): void {
    this.data.currentScene = id;
    this.persist();
  }

  setTime(t: TimeOfDay): void {
    this.data.timeOfDay = t;
    this.persist();
  }

  isCollected(id: string): boolean {
    return !!this.data.collected[id];
  }

  collectedCount(): number {
    return Object.keys(this.data.collected).length;
  }
}

export const StateStore = new StateStoreImpl();
