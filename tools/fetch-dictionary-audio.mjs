import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { queryDictionary } from './dictionary-utils.mjs';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sceneIds = ['bashi', 'zhongshan', 'gulangyu', 'zengcuoan', 'nanputuo'];
const outputDir = resolve(project, 'public/recordings/dictionary');

async function loadScene(sceneId) {
  return JSON.parse(await readFile(resolve(project, `content/sounds/${sceneId}.json`), 'utf8'));
}

async function saveScene(sceneId, sounds) {
  await writeFile(resolve(project, `content/sounds/${sceneId}.json`), `${JSON.stringify(sounds, null, 2)}\n`);
}

await mkdir(outputDir, { recursive: true });
const soundsByScene = new Map();
const sounds = [];
for (const sceneId of sceneIds) {
  const entries = await loadScene(sceneId);
  soundsByScene.set(sceneId, entries);
  sounds.push(...entries);
}

const report = [];
for (const [index, sound] of sounds.entries()) {
  const result = await queryDictionary(sound.hanzi);
  const relativeAudio = `recordings/dictionary/${sound.id}.mp3`;
  if (result.audioUrl) {
    const output = resolve(project, 'public', relativeAudio);
    const response = await fetch(result.audioUrl);
    if (!response.ok) throw new Error(`下載 ${sound.id} 失敗：HTTP ${response.status}`);
    await writeFile(output, Buffer.from(await response.arrayBuffer()));
    sound.audio = relativeAudio;
    report.push({ id: sound.id, text: sound.hanzi, query: result.queryText, audio: relativeAudio, status: 'found' });
  } else {
    delete sound.audio;
    report.push({ id: sound.id, text: sound.hanzi, query: result.queryText, audio: null, status: 'missing' });
  }
  process.stdout.write(`[${index + 1}/${sounds.length}] ${sound.id} ${result.queryText} ${result.audioUrl ? '✓' : '—'}\n`);
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 120));
}

for (const [sceneId, entries] of soundsByScene) await saveScene(sceneId, entries);
await writeFile(resolve(project, 'public/recordings/dictionary/manifest.json'), `${JSON.stringify({
  source: 'https://sutian.moe.edu.tw',
  queryLanguage: 'zh-hant',
  generatedAt: new Date().toISOString(),
  total: report.length,
  found: report.filter((item) => item.status === 'found').length,
  missing: report.filter((item) => item.status === 'missing').length,
  items: report,
}, null, 2)}\n`);

const missing = report.filter((item) => item.status === 'missing');
console.log(`辭典音檔完成：${report.length - missing.length}/${report.length}`);
if (missing.length) {
  console.log('未找到精確詞條：');
  for (const item of missing) console.log(`- ${item.id}: ${item.query}`);
}
