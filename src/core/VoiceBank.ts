import voiceManifest from '../../public/recordings/voice/manifest.json';

/**
 * 真人配音总库：public/recordings/voice/manifest.json（配音工具导出的完整清单）。
 * 优先按条目 ID 匹配（词条 lc01 / 对话 laocuo-ama-01 / 小游戏 mg-… / 科普 kn-…），
 * 其次按台词文本匹配，让同一句话在小游戏、科普卡片等地方也能播放真人录音。
 */
interface VoiceItem {
  id: string;
  sceneId?: string;
  text: string;
  audio?: string;
}

const BASE = 'recordings/voice/';
const items = (voiceManifest.items as VoiceItem[]).filter((item) => typeof item.audio === 'string' && item.audio);

/** 去掉标点、空白后比较，避免「食饱未？」与「食饱未」对不上。 */
export function normalizeLine(text: string): string {
  return text.replace(/[\s\u3000，。！？、,.!?；;：:「」『』《》（）()…—\-~～·]/g, '');
}

const byId = new Map(items.map((item) => [item.id, `${BASE}${item.audio}`]));
const byText = new Map<string, string>();
for (const item of items) {
  const key = normalizeLine(item.text);
  if (key && !byText.has(key)) byText.set(key, `${BASE}${item.audio}`);
}
/** 其他来源（例如萌典词条录音）按文本补充，真人配音优先。 */
const extraByText = new Map<string, string>();

export const VoiceBank = {
  get size(): number {
    return byId.size;
  },
  byId(id: string): string | undefined {
    return byId.get(id);
  },
  byText(text: string | undefined): string | undefined {
    if (!text) return undefined;
    const key = normalizeLine(text);
    return byText.get(key) ?? extraByText.get(key);
  },
  /** 先 ID、后文本。 */
  find(id: string | undefined, text: string | undefined): string | undefined {
    return (id ? byId.get(id) : undefined) ?? this.byText(text);
  },
  registerText(text: string, audio: string | undefined): void {
    if (!audio) return;
    const key = normalizeLine(text);
    if (key && !byText.has(key) && !extraByText.has(key)) extraByText.set(key, audio);
  },
};
