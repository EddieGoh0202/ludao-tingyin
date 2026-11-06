import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dictionaryOrigin, extractDictionaryEntries, toTraditional } from './dictionary-utils.mjs';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sceneIds = ['bashi', 'zhongshan', 'gulangyu', 'zengcuoan', 'nanputuo'];
const outputDir = resolve(project, 'public/recordings/dictionary');

const retryTerms = {
  bs01: ['偌濟'], bs02: ['較俗'], bs03: ['傷貴'], bs07: ['鮮'], bs08: ['一斤', '斤'],
  bs11: ['土筍', '筍'], bs14: ['加送', '一寡'], bs15: ['免找'], bs16: ['好食', '好', '食'],
  bs18: ['買菜', '買', '菜'], bs19: ['欲買', '欲', '啥物'],
  zs01: ['沙茶麵', '沙茶', '麵'], zs02: ['花生湯', '花生', '塗豆', '湯'], zs03: ['騎樓', '亭仔跤'],
  zs04: ['鼓浪嶼'], zs05: ['廈門'], zs06: ['行街', '行', '街'], zs07: ['落雨矣', '落雨'],
  zs09: ['佇遮', '遮'], zs10: ['欲去佗位', '佗位'], zs11: ['直直行', '直直'],
  zs14: ['跋餅', '博餅', '餅'], zs18: ['好耍', '耍'], zs19: ['慢慢仔行', '慢慢仔'],
  zs20: ['一人一款命', '一款'],
  gl04: ['三角梅'], gl05: ['日光岩'], gl06: ['渡船頭', '渡頭', '碼頭'], gl07: ['坐船'],
  gl08: ['海風真透', '海風'], gl09: ['紅磚厝'], gl11: ['番客'], gl12: ['歡迎來鼓浪嶼', '歡迎'],
  gl16: ['日頭落山矣', '日頭', '落山'], gl19: ['慢慢仔行', '慢慢仔'], gl20: ['真好聽', '好聽'],
  zc01: ['燒肉粽', '肉粽'], zc02: ['姜母鴨'], zc04: ['王船'], zc06: ['鼎邊糊'], zc07: ['燈仔'],
  zc10: ['天暗矣', '天暗'], zc11: ['魚仔', '魚'], zc12: ['風真大', '風'], zc13: ['沙茶麵', '沙茶', '麵'],
  zc14: ['好食', '好'], zc15: ['一粒偌濟錢', '偌濟'], zc19: ['食果子拜樹頭'], zc20: ['閒閒仔'],
  np03: ['素餅'], np06: ['五老峰'], np07: ['鐘聲'], np10: ['心肝靜', '心肝'], np12: ['寺廟', '廟寺'],
  np13: ['好心有好報', '好心'], np14: ['扒山'], np15: ['放生池'],
};

const approvedVariant = {
  zs20: { query: '一款', title: '一个人一款命。' },
};

function comparable(text) {
  return text.replace(/[\s\u3000。，、！？；：？！「」『』（）()?!,.;:]/g, '');
}

async function query(term) {
  const queryText = toTraditional(term);
  const url = new URL('/zh-hant/tshiau/', dictionaryOrigin);
  url.searchParams.set('lui', 'tai_su');
  url.searchParams.set('tsha', queryText);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`查詢 ${queryText} 失敗：HTTP ${response.status}`);
  return { queryText, entries: extractDictionaryEntries(await response.text()) };
}

const soundsByScene = new Map();
const missing = [];
for (const sceneId of sceneIds) {
  const sounds = JSON.parse(await readFile(resolve(project, `content/sounds/${sceneId}.json`), 'utf8'));
  soundsByScene.set(sceneId, sounds);
}

await mkdir(outputDir, { recursive: true });
const report = [];
for (const sounds of soundsByScene.values()) {
  for (const sound of sounds) {
    if (sound.audio) {
      report.push({ id: sound.id, sceneId: sound.sceneId, text: sound.hanzi, query: null, matchedTitle: null, audio: sound.audio, status: 'found' });
      continue;
    }

    const attempts = retryTerms[sound.id] ?? [sound.hanzi];
    const candidates = [];
    for (const attempt of attempts) {
      const result = await query(attempt);
      candidates.push({ query: result.queryText, titles: result.entries.map((entry) => entry.title) });
      const approved = approvedVariant[sound.id];
      const match = approved?.query === attempt
        ? result.entries.find((entry) => comparable(entry.title) === comparable(approved.title))
        : result.entries.find((entry) => comparable(entry.title) === comparable(sound.hanzi));
      if (!match) continue;

      const relativeAudio = `recordings/dictionary/${sound.id}.mp3`;
      const response = await fetch(match.audioUrl);
      if (!response.ok) throw new Error(`下載 ${sound.id} 失敗：HTTP ${response.status}`);
      await writeFile(resolve(project, 'public', relativeAudio), Buffer.from(await response.arrayBuffer()));
      sound.audio = relativeAudio;
      report.push({ id: sound.id, sceneId: sound.sceneId, text: sound.hanzi, query: result.queryText, matchedTitle: match.title, audio: relativeAudio, status: 'found', attempts: candidates });
      break;
    }
    if (sound.audio) continue;
    const item = {
      id: sound.id,
      sceneId: sound.sceneId,
      text: sound.hanzi,
      tailo: sound.tailo,
      mandarin: sound.mandarin,
      targetAudio: `recordings/dictionary/${sound.id}.mp3`,
      status: 'missing',
      searchMode: 'tai_su',
      attemptedQueries: candidates.map((entry) => entry.query),
    };
    missing.push(item);
    report.push({ ...item, query: null, matchedTitle: null, audio: null });
  }
}

for (const [sceneId, sounds] of soundsByScene) {
  await writeFile(resolve(project, `content/sounds/${sceneId}.json`), `${JSON.stringify(sounds, null, 2)}\n`);
}

const manifest = {
  source: `${dictionaryOrigin}/zh-hant/tshiau/`,
  queryLanguage: 'zh-hant',
  searchMode: 'tai_su',
  generatedAt: new Date().toISOString(),
  total: report.length,
  found: report.filter((item) => item.status === 'found').length,
  missing: missing.length,
  items: report,
};
await writeFile(resolve(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(resolve(outputDir, 'missing.json'), `${JSON.stringify({
  source: manifest.source,
  queryLanguage: manifest.queryLanguage,
  searchMode: manifest.searchMode,
  generatedAt: manifest.generatedAt,
  naming: 'targetAudio uses the existing scene prefix plus two-digit entry number, for example zs20.mp3.',
  total: missing.length,
  items: missing,
}, null, 2)}\n`);

console.log(`臺灣台語查詞目重試完成：${manifest.found}/${manifest.total} 有音檔，${missing.length} 項待補`);
for (const item of missing) console.log(`- ${item.id}: ${item.text}`);
