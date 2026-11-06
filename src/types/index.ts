export type TimeOfDay = 'morning' | 'noon' | 'dusk' | 'night';

export interface SoundEntry {
  id: string;
  sceneId: string;
  hanzi: string;
  tailo: string;
  mandarin: string;
  culture?: string;
  category: 'greeting' | 'food' | 'market' | 'family' | 'place' | 'proverb' | 'daily';
  frequency: number; // MHz, 87.0 - 108.0
  pos: { x: number; y: number };
  times?: TimeOfDay[];
  speaker?: string;
  audio?: string; // 正式录音路径，相对于应用 base URL；未提供则使用占位合成
  tones?: number[]; // 每个音节的调类(1-8)，用于占位合成
  reviewStatus: 'pending' | 'reviewed';
}

export type ChallengeType =
  | 'listen_choose'
  | 'find_object'
  | 'dialogue_choice'
  | 'repeat_after'
  | 'reorder'
  | 'tone_discrimination'
  | 'proverb_fill';

export interface Challenge {
  id: string;
  soundId: string;
  type: ChallengeType;
  prompt: string;
  options?: string[];
  answer: number | number[];
  tokens?: string[];
  explain?: string;
}

export interface HotspotDef {
  id: string;
  label: string;
  /** 脚底中心（世界坐标，场景宽 720） */
  x: number;
  y: number;
  w: number;
  h: number;
  action: 'minigame:bargain' | 'minigame:bobing' | 'npc' | 'exit';
  /** 贴图名：npc-<sprite>；小游戏可用 obj-bobing / obj-stall */
  sprite?: string;
  npcLine?: string;
  /** 多句对话（优先于 npcLine） */
  dialogue?: Array<{ speaker?: string; text: string; tailo?: string; audio?: string }>;
}

export type ScenePalette = 'laocuo' | 'bashi' | 'zhongshan' | 'gulangyu' | 'zengcuoan' | 'nanputuo';

export interface SceneDef {
  id: string;
  name: string;
  tailo: string;
  desc: string;
  palette: ScenePalette;
  mapPos: { x: number; y: number };
  unlock: { requireCollected: number; fromScene?: string };
  hotspots: HotspotDef[];
  storyIntro: string;
}

/** 场景里可靠近触发的闽南文化科普点 */
export interface KnowledgeDef {
  id: string;
  sceneId: string;
  title: string;
  tailo: string;
  category: 'food' | 'architecture' | 'custom' | 'craft' | 'nature';
  /** 场景内小物件贴图：prop-<prop> */
  prop: string;
  /** 脚底中心（世界坐标） */
  x: number;
  y: number;
  summary: string;
  body: string[];
  words?: Array<{ hanzi: string; tailo: string; mandarin: string }>;
}

export interface QuestDef {
  id: string;
  title: string;
  desc: string;
  sceneId: string;
  goal: { type: 'collect_in_scene' | 'minigame_win' | 'collect_total'; target: number; key?: string };
  reward: string;
}

export interface GlossaryEntry {
  term: string;
  tailo: string;
  note: string;
}

export interface ReviewCard {
  soundId: string;
  ease: number;
  interval: number; // 天
  reps: number;
  due: number; // 时间戳
}

export interface CollectedInfo {
  soundId: string;
  stars: number; // 1-3
  collectedAt: number;
}

export interface SaveData {
  version: number;
  currentScene: string;
  timeOfDay: TimeOfDay;
  collected: Record<string, CollectedInfo>;
  unlockedScenes: string[];
  quests: Record<string, 'active' | 'done'>;
  minigameWins: Record<string, number>;
  review: Record<string, ReviewCard>;
  /** 已读过的科普点 id */
  knowledgeSeen: string[];
  settings: { volume: number; showTailo: boolean };
  lastPlayed: number;
}
