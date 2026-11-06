// 配音覆盖检查：列出游戏里所有会被“播放”的闽南话词句，判断是否有真人/词典录音，
// 并把缺失项导出为配音工具可直接导入的待补录清单（items 格式，kind 0=词句，1=对话）。
// 用法：node tools/voice-coverage.mjs [--strict]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'));
const norm = (t) => String(t ?? '').replace(/[\s\u3000，。！？、,.!?；;：:「」『』《》（）()…—\-~～·]/g, '');
const voice = read('public/recordings/voice/manifest.json');
const SCENES = ['laocuo', 'bashi', 'zhongshan', 'gulangyu', 'zengcuoan', 'nanputuo'];
const sounds = SCENES.flatMap((s) => read(`content/sounds/${s}.json`));
const scenes = read('content/scenes.json').scenes;
const knowledgeFile = read('content/knowledge.json');
const knowledge = Array.isArray(knowledgeFile) ? knowledgeFile : knowledgeFile.knowledge;
const mg = read('content/minigames.json');

let errors = 0;
const voiceById = new Map();
const voiceByText = new Map();
for (const item of voice.items) {
  if (!item.audio || !existsSync(resolve(root, 'public/recordings/voice', item.audio))) {
    errors++;
    console.error(`配音文件缺失：${item.id} → ${item.audio}`);
    continue;
  }
  voiceById.set(item.id, item.audio);
  if (!voiceByText.has(norm(item.text))) voiceByText.set(norm(item.text), item.audio);
}
const otherByText = new Map();
for (const s of sounds) {
  const audio = voiceById.get(s.id) ?? s.audio;
  if (s.audio && !voiceById.has(s.id) && !existsSync(resolve(root, 'public', s.audio))) {
    errors++;
    console.error(`词条录音文件缺失：${s.id} → ${s.audio}`);
  }
  if (audio && !otherByText.has(norm(s.hanzi))) otherByText.set(norm(s.hanzi), audio);
}

const lines = [];
const add = (id, sceneId, kind, text, tailo, mandarin, speaker, where) => lines.push({ id, sceneId, kind, text, tailo: tailo ?? '', mandarin: mandarin ?? '', speaker: speaker ?? '', where });
for (const s of sounds) add(s.id, s.sceneId, 0, s.hanzi, s.tailo, s.mandarin, s.speaker, '声音词条');
for (const sc of scenes) for (const h of sc.hotspots ?? []) {
  (h.dialogue ?? []).forEach((d, i) => add(`${sc.id}-${h.id}-${String(i + 1).padStart(2, '0')}`, sc.id, 1, d.text, d.tailo, d.mandarin, d.speaker ?? h.label, `${sc.name ?? sc.id}·${h.label ?? h.id} 对话`));
}
for (const k of knowledge) {
  add(k.id, k.sceneId, 0, k.title, k.tailo, k.title, '', `科普卡「${k.title}」标题`);
  (k.words ?? []).forEach((w, i) => add(`${k.id}-w${i + 1}`, k.sceneId, 0, w.hanzi, w.tailo, w.mandarin, '', `科普卡「${k.title}」词语`));
}
const b = mg.bargain;
add('mg-bargain-intro', 'bashi', 1, b.intro.hanzi, b.intro.tailo, b.intro.mandarin, '头家娘', '八市砍价');
b.rounds.forEach((r, i) => {
  add(`mg-bargain-r${i + 1}`, 'bashi', 1, r.line, r.tailo, r.mandarin, '头家娘', `八市砍价 第${i + 1}轮`);
  r.options.forEach((o, j) => o.tailo && add(`mg-bargain-r${i + 1}-opt${j + 1}`, 'bashi', 1, o.hanzi, o.tailo, '', '我', `八市砍价 第${i + 1}轮选项`));
});
add('mg-bargain-win', 'bashi', 1, b.win.hanzi, b.win.tailo, b.win.mandarin, '头家娘', '八市砍价 成功');
add('mg-bargain-lose', 'bashi', 1, b.lose.hanzi, b.lose.tailo, b.lose.mandarin, '头家娘', '八市砍价 失败');
const g = mg.bobing;
add('mg-bobing-intro', 'zhongshan', 1, g.intro.hanzi, g.intro.tailo, g.intro.mandarin, '阿伯', '中山路博饼');
add('mg-bobing-pity', 'zhongshan', 1, g.pityLine.hanzi, g.pityLine.tailo, g.pityLine.mandarin, '阿伯', '中山路博饼 保底');
add('mg-bobing-win', 'zhongshan', 1, g.winLine.hanzi, g.winLine.tailo, g.winLine.mandarin, '众人', '中山路博饼 状元');
for (const p of g.prizes) if (p.key !== 'none') add(`mg-bobing-${p.key}`, 'zhongshan', 0, p.name, p.tailo, p.name, '', '中山路博饼 奖项');

const source = (l) => {
  if (voiceById.has(l.id)) return 'voice';
  if (voiceByText.has(norm(l.text))) return 'voice';
  if (otherByText.has(norm(l.text))) return 'dictionary';
  return null;
};
const missing = [];
const stat = { voice: 0, dictionary: 0, missing: 0 };
for (const l of lines) {
  const s = source(l);
  if (s) stat[s]++;
  else { stat.missing++; missing.push(l); }
}

const outDir = resolve(root, '..', 'outputs');
mkdirSync(outDir, { recursive: true });
// 同一文本只需录一次：保留首个 ID，其余使用处写进 note（游戏按文本自动复用）
const unique = new Map();
for (const l of missing) {
  const key = norm(l.text);
  const hit = unique.get(key);
  if (hit) hit.also.push(`${l.id}（${l.where}）`);
  else unique.set(key, { ...l, also: [] });
}
const todo = [...unique.values()];
const items = todo.map(({ where, also, ...rest }) => ({ ...rest, note: also.length ? `${where}；同句复用：${also.join('、')}` : where }));
writeFileSync(resolve(outDir, '待补录配音清单.json'), `${JSON.stringify({ formatVersion: 1, total: items.length, items }, null, 2)}\n`);
const txt = [`待补录配音清单（缺口 ${missing.length} 处，去重后需录 ${items.length} 条；可把同名 .json 导入配音工具逐句录制）`, ''];
let last = '';
for (const l of todo) {
  if (l.sceneId !== last) { txt.push('', `【${l.sceneId}】`); last = l.sceneId; }
  txt.push(`${l.id}\t${l.text}\t${l.tailo}\t（${l.where}${l.also.length ? `；另用于 ${l.also.length} 处` : ''}）`);
}
writeFileSync(resolve(outDir, '待补录配音清单.txt'), `${txt.join('\n')}\n`);

console.log(`游戏内可播放词句 ${lines.length} 条：真人配音 ${stat.voice}，词典录音 ${stat.dictionary}，仍缺录音 ${stat.missing}（去重后需录 ${items.length} 条）`);
console.log(`待补录清单已写入 outputs/待补录配音清单.json / .txt`);
if (errors) process.exitCode = 1;
if (process.argv.includes('--strict') && stat.missing) process.exitCode = 1;
