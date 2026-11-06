import type { SaveData } from '../types';

const KEY = 'ludao-tingyin-save';
export const SAVE_VERSION = 1;

export function createDefaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    currentScene: 'laocuo',
    timeOfDay: 'morning',
    collected: {},
    unlockedScenes: ['laocuo'],
    quests: {},
    minigameWins: {},
    review: {},
    knowledgeSeen: [],
    settings: { volume: 0.8, showTailo: true },
    lastPlayed: Date.now(),
  };
}

function migrate(raw: Partial<SaveData>): SaveData {
  const base = createDefaultSave();
  return {
    ...base,
    ...raw,
    knowledgeSeen: Array.isArray(raw.knowledgeSeen) ? raw.knowledgeSeen : [],
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    version: SAVE_VERSION,
  };
}

export const SaveManager = {
  load(): SaveData | null {
    try {
      const text = localStorage.getItem(KEY);
      if (!text) return null;
      return migrate(JSON.parse(text) as Partial<SaveData>);
    } catch (err) {
      console.warn('[SaveManager] 读取存档失败', err);
      return null;
    }
  },
  save(data: SaveData): void {
    try {
      data.lastPlayed = Date.now();
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('[SaveManager] 写入存档失败', err);
    }
  },
  clear(): void {
    localStorage.removeItem(KEY);
  },
  hasSave(): boolean {
    return localStorage.getItem(KEY) !== null;
  },
};
