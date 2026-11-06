// 内容校验：字段完整性、ID 唯一性、引用关系、答案下标范围。
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'content');
const errors = [];
const warns = [];

function load(rel) {
  try {
    return JSON.parse(readFileSync(join(root, rel), 'utf8'));
  } catch (err) {
    errors.push(`${rel}: JSON 解析失败 - ${err.message}`);
    return null;
  }
}

const scenesFile = load('scenes.json');
const scenes = scenesFile?.scenes ?? [];
const sceneIds = new Set();
for (const s of scenes) {
  for (const k of ['id', 'name', 'tailo', 'desc', 'palette', 'mapPos', 'unlock', 'hotspots', 'storyIntro']) {
    if (s[k] === undefined) errors.push(`scene ${s.id ?? '?'}: 缺少字段 ${k}`);
  }
  if (sceneIds.has(s.id)) errors.push(`scene ${s.id}: ID 重复`);
  sceneIds.add(s.id);
}
for (const s of scenes) {
  if (s.unlock?.fromScene && !sceneIds.has(s.unlock.fromScene)) errors.push(`scene ${s.id}: fromScene ${s.unlock.fromScene} 不存在`);
  for (const h of s.hotspots ?? []) {
    if (typeof h.x !== 'number' || typeof h.y !== 'number' || h.x < 16 || h.x > 704 || h.y < 184 || h.y > 262) {
      errors.push(`scene ${s.id}: hotspot ${h.id} 坐标超出可行走范围`);
    }
  }
}

const sounds = [];
for (const f of readdirSync(join(root, 'sounds')).filter((n) => n.endsWith('.json'))) {
  const list = load(`sounds/${f}`);
  if (Array.isArray(list)) sounds.push(...list);
}
const soundIds = new Set();
const CATS = ['greeting', 'food', 'market', 'family', 'place', 'proverb', 'daily'];
const TIMES = ['morning', 'noon', 'dusk', 'night'];
const freqByScene = new Map();
for (const s of sounds) {
  for (const k of ['id', 'sceneId', 'hanzi', 'tailo', 'mandarin', 'category', 'frequency', 'pos', 'reviewStatus']) {
    if (s[k] === undefined || s[k] === '') errors.push(`sound ${s.id ?? '?'}: 缺少字段 ${k}`);
  }
  if (soundIds.has(s.id)) errors.push(`sound ${s.id}: ID 重复`);
  soundIds.add(s.id);
  if (!sceneIds.has(s.sceneId)) errors.push(`sound ${s.id}: sceneId ${s.sceneId} 不存在`);
  if (!CATS.includes(s.category)) errors.push(`sound ${s.id}: category ${s.category} 非法`);
  if (typeof s.frequency !== 'number' || s.frequency < 87 || s.frequency > 108) errors.push(`sound ${s.id}: frequency 超出 87-108`);
  for (const t of s.times ?? []) if (!TIMES.includes(t)) errors.push(`sound ${s.id}: times 含非法值 ${t}`);
  const key = `${s.sceneId}@${s.frequency}`;
  if (freqByScene.has(key)) warns.push(`sound ${s.id} 与 ${freqByScene.get(key)} 同场景同频率`);
  freqByScene.set(key, s.id);
  if (s.reviewStatus !== 'reviewed') warns.push(`sound ${s.id}: 方言内容待核对`);
  if (s.pos && (s.pos.x < 30 || s.pos.x > 690 || s.pos.y < 184 || s.pos.y > 256)) errors.push(`sound ${s.id}: pos 超出 x30-690 / y184-256`);
}

const challenges = load('challenges.json') ?? [];
if (!Array.isArray(challenges)) errors.push('challenges.json: 顶层必须是数组');
const TYPES = ['listen_choose', 'find_object', 'dialogue_choice', 'repeat_after', 'reorder', 'tone_discrimination', 'proverb_fill'];
const challengeBySound = new Map();
const challengeIds = new Set();
for (const c of Array.isArray(challenges) ? challenges : []) {
  if (challengeIds.has(c.id)) errors.push(`challenge ${c.id}: ID 重复`);
  challengeIds.add(c.id);
  if (!soundIds.has(c.soundId)) errors.push(`challenge ${c.id}: soundId ${c.soundId} 不存在`);
  if (challengeBySound.has(c.soundId)) errors.push(`challenge ${c.id}: soundId ${c.soundId} 已有挑战`);
  challengeBySound.set(c.soundId, c.id);
  if (!TYPES.includes(c.type)) errors.push(`challenge ${c.id}: type ${c.type} 非法`);
  if (!c.prompt) errors.push(`challenge ${c.id}: 缺少 prompt`);
  if (c.type === 'reorder') {
    const ok = Array.isArray(c.tokens) && Array.isArray(c.answer) && c.answer.length === c.tokens.length
      && [...c.answer].sort().every((v, i) => v === i);
    if (!ok) errors.push(`challenge ${c.id}: reorder 的 tokens/answer 不匹配`);
  } else if (c.type !== 'repeat_after') {
    if (!Array.isArray(c.options) || c.options.length < 2) errors.push(`challenge ${c.id}: options 至少 2 项`);
    else if (typeof c.answer !== 'number' || c.answer < 0 || c.answer >= c.options.length) errors.push(`challenge ${c.id}: answer 越界`);
  }
}
for (const id of soundIds) if (!challengeBySound.has(id)) errors.push(`sound ${id}: 没有对应挑战`);

const quests = load('quests.json') ?? [];
for (const q of quests) {
  if (!sceneIds.has(q.sceneId)) errors.push(`quest ${q.id}: sceneId ${q.sceneId} 不存在`);
  if (!['collect_in_scene', 'minigame_win', 'collect_total'].includes(q.goal?.type)) errors.push(`quest ${q.id}: goal.type 非法`);
  if (q.goal?.type === 'collect_total' && q.goal.target > sounds.length) errors.push(`quest ${q.id}: 目标 ${q.goal.target} 超过声音总数 ${sounds.length}`);
}
load('glossary.json');

const knowledgeFile = load('knowledge.json');
const knowledge = Array.isArray(knowledgeFile) ? knowledgeFile : (knowledgeFile?.knowledge ?? []);
const KCATS = ['food', 'architecture', 'custom', 'craft', 'nature'];
const knowledgeIds = new Set();
const knowledgeByScene = new Map();
for (const k of knowledge) {
  for (const f of ['id', 'sceneId', 'title', 'tailo', 'category', 'prop', 'x', 'y', 'summary', 'body']) {
    if (k[f] === undefined || k[f] === '') errors.push(`knowledge ${k.id ?? '?'}: 缺少字段 ${f}`);
  }
  if (knowledgeIds.has(k.id)) errors.push(`knowledge ${k.id}: ID 重复`);
  knowledgeIds.add(k.id);
  if (!sceneIds.has(k.sceneId)) errors.push(`knowledge ${k.id}: sceneId ${k.sceneId} 不存在`);
  if (!KCATS.includes(k.category)) errors.push(`knowledge ${k.id}: category ${k.category} 非法`);
  if (!Array.isArray(k.body) || k.body.length === 0) errors.push(`knowledge ${k.id}: body 必须是非空数组`);
  if (typeof k.x !== 'number' || typeof k.y !== 'number' || k.x < 16 || k.x > 704 || k.y < 184 || k.y > 262) {
    errors.push(`knowledge ${k.id}: 坐标超出可行走范围`);
  }
  for (const w of k.words ?? []) {
    if (!w.hanzi || !w.tailo || !w.mandarin) errors.push(`knowledge ${k.id}: words 条目缺少 hanzi/tailo/mandarin`);
  }
  knowledgeByScene.set(k.sceneId, (knowledgeByScene.get(k.sceneId) ?? 0) + 1);
}
for (const id of sceneIds) {
  if ((knowledgeByScene.get(id) ?? 0) !== 4) errors.push(`scene ${id}: 科普点应为 4 个，实际 ${knowledgeByScene.get(id) ?? 0}`);
}

const pending = warns.filter((w) => w.includes('待核对')).length;
for (const w of warns.filter((w) => !w.includes('待核对'))) console.warn('WARN', w);
console.log(`场景 ${scenes.length}，声音 ${sounds.length}，挑战 ${challengeIds.size}，任务 ${quests.length}，科普 ${knowledge.length}；待方言顾问核对 ${pending} 条`);
if (errors.length) {
  for (const e of errors) console.error('ERROR', e);
  console.error(`校验失败：${errors.length} 个错误`);
  process.exit(1);
}
console.log('内容校验通过');
