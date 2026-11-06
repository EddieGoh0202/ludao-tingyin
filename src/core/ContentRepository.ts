import scenesFile from '../../content/scenes.json';
import laocuo from '../../content/sounds/laocuo.json';
import bashi from '../../content/sounds/bashi.json';
import zhongshan from '../../content/sounds/zhongshan.json';
import gulangyu from '../../content/sounds/gulangyu.json';
import zengcuoan from '../../content/sounds/zengcuoan.json';
import nanputuo from '../../content/sounds/nanputuo.json';
import knowledgeFile from '../../content/knowledge.json';
import challenges from '../../content/challenges.json';
import quests from '../../content/quests.json';
import glossary from '../../content/glossary.json';
import type { Challenge, GlossaryEntry, KnowledgeDef, QuestDef, SceneDef, SoundEntry, TimeOfDay } from '../types';
import { VoiceBank } from './VoiceBank';

export interface UpcomingPlace {
  name: string;
  x: number;
  y: number;
}

/** 只读内容仓库：所有闽南话内容来自 content/*.json，代码中不写死语句 */
class ContentRepositoryImpl {
  readonly scenes: SceneDef[] = scenesFile.scenes as SceneDef[];
  readonly upcoming: UpcomingPlace[] = (scenesFile as { upcoming?: UpcomingPlace[] }).upcoming ?? [];
  readonly sounds: SoundEntry[] = ([...laocuo, ...bashi, ...zhongshan, ...gulangyu, ...zengcuoan, ...nanputuo] as SoundEntry[])
    .map((sound) => {
      // 真人配音优先（按 ID），其次条目自带录音；都没有时才用占位合成。
      const audio = VoiceBank.byId(sound.id) ?? sound.audio;
      if (audio) VoiceBank.registerText(sound.hanzi, audio);
      return audio ? { ...sound, audio } : sound;
    });
  readonly knowledge: KnowledgeDef[] = (Array.isArray(knowledgeFile)
    ? knowledgeFile
    : (knowledgeFile as { knowledge: KnowledgeDef[] }).knowledge) as KnowledgeDef[];
  readonly quests: QuestDef[] = quests as QuestDef[];
  readonly glossary: GlossaryEntry[] = glossary;
  private soundMap = new Map(this.sounds.map((s) => [s.id, s]));
  private challengeMap = new Map((challenges as Challenge[]).map((c) => [c.soundId, c]));

  scene(id: string): SceneDef {
    const s = this.scenes.find((x) => x.id === id);
    if (!s) throw new Error(`未知场景 ${id}`);
    return s;
  }

  sound(id: string): SoundEntry | undefined {
    return this.soundMap.get(id);
  }

  soundsIn(sceneId: string): SoundEntry[] {
    return this.sounds.filter((s) => s.sceneId === sceneId);
  }

  /** 当前时段能听到的声音 */
  audibleIn(sceneId: string, time: TimeOfDay): SoundEntry[] {
    return this.soundsIn(sceneId).filter((s) => !s.times || s.times.includes(time));
  }

  challengeFor(soundId: string): Challenge | undefined {
    return this.challengeMap.get(soundId);
  }

  knowledgeIn(sceneId: string): KnowledgeDef[] {
    return this.knowledge.filter((k) => k.sceneId === sceneId);
  }
}

export const Content = new ContentRepositoryImpl();
