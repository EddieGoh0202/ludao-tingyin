export const dictionaryOrigin = 'https://sutian.moe.edu.tw';

const traditional = new Map(Object.entries({
  个: '個', 这: '這', 济: '濟', 钱: '錢', 较: '較', 伤: '傷', 贵: '貴', 鱼: '魚', 鲜: '鮮', 无: '無',
  头: '頭', 笋: '筍', 冻: '凍', 买: '買', 虾: '蝦', 面: '麵', 汤: '湯', 骑: '騎', 楼: '樓',
  厦: '廈', 门: '門', 屿: '嶼', 伞: '傘', 饼: '餅', 状: '狀', 闹: '鬧', 热: '熱', 钢: '鋼', 弹: '彈',
  红: '紅', 砖: '磚', 欢: '歡', 来: '來', 听: '聽', 馅: '餡', 烧: '燒', 鸭: '鴨', 讨: '討', 当: '當',
  灯: '燈', 风: '風', 边: '邊', 树: '樹', 闲: '閒', 莲: '蓮', 钟: '鐘', 声: '聲', 师: '師',
  庙: '廟', 报: '報', 顺: '順', 样: '樣', 饲: '飼', 静: '靜', 伫: '佇', 里: '裡', 见: '見', 说: '說',
  过: '過', 会: '會', 发: '發', 台: '臺', 语: '語', 话: '話', 录: '錄',
}));

export function toTraditional(text) {
  return [...text].map((char) => traditional.get(char) ?? char).join('');
}

function decodeHtml(text) {
  return text.replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll(/\s+/g, ' ').trim();
}

export function extractDictionaryEntries(html) {
  const resultPattern = /<a href="\/zh-hant\/su\/[^\"]+\/">([\s\S]*?)<\/a>[\s\S]*?data-src="\[&quot;([^\"]+\.mp3)&quot;\]"/g;
  const entries = [];
  const seen = new Set();
  for (const match of html.matchAll(resultPattern)) {
    const title = decodeHtml(match[1].replace(/<[^>]+>/g, ''));
    const source = decodeHtml(match[2]);
    if (!title || seen.has(`${title}\n${source}`)) continue;
    seen.add(`${title}\n${source}`);
    entries.push({ title, audioUrl: `${dictionaryOrigin}${source}` });
  }
  return entries;
}

function comparable(text) {
  return text.replace(/[\s\u3000。，、！？；：？！「」『』（）()?!,.;:]/g, '');
}

export function findExactAudio(html, query) {
  for (const entry of extractDictionaryEntries(html)) {
    if (comparable(entry.title) === comparable(query)) return entry.audioUrl;
  }
  return null;
}

export async function queryDictionary(term) {
  const queryText = toTraditional(term);
  const url = new URL('/zh-hant/tshiau/', dictionaryOrigin);
  url.searchParams.set('lui', 'tai_su');
  url.searchParams.set('tsha', queryText);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`查詢 ${queryText} 失敗：HTTP ${response.status}`);
  return { queryText, audioUrl: findExactAudio(await response.text(), queryText) };
}
