import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const folder = resolve(project, 'public/recordings/laocuo');
const manifest = JSON.parse(readFileSync(resolve(folder, 'manifest.json'), 'utf8'));
const sounds = JSON.parse(readFileSync(resolve(project, 'content/sounds/laocuo.json'), 'utf8'));
const byId = new Map(sounds.map((sound) => [sound.id, sound]));
const ids = new Set();

assert.equal(manifest.formatVersion, 1, '不支持的配音 manifest 版本');
assert.equal(manifest.complete, true, '第一章节配音必须完整');
assert.equal(manifest.total, sounds.length, 'manifest 总数与第一章条目数不符');
assert.equal(manifest.items.length, sounds.length, 'manifest 条目数不符');
assert.equal(manifest.recorded, sounds.length, '第一章存在未录音条目');

for (const item of manifest.items) {
  assert.ok(!ids.has(item.id), `重复录音 ID: ${item.id}`);
  ids.add(item.id);
  const sound = byId.get(item.id);
  assert.ok(sound, `未知第一章录音 ID: ${item.id}`);
  assert.equal(item.sceneId, sound.sceneId, `${item.id}: 章节不符`);
  assert.equal(item.text, sound.hanzi, `${item.id}: 台词不符`);
  assert.equal(item.tailo.normalize('NFC'), sound.tailo.normalize('NFC'), `${item.id}: 台罗不符`);
  assert.equal(item.audio, `audio/${item.id}.webm`, `${item.id}: 录音路径不符`);
  assert.equal(item.mime, 'audio/webm;codecs=opus', `${item.id}: 音频格式不符`);
  const path = resolve(folder, item.audio);
  assert.ok(path.startsWith(folder + sep), `${item.id}: 录音路径越界`);
  const bytes = readFileSync(path);
  assert.ok(bytes.length > 4 && bytes.readUInt32BE(0) === 0x1a45dfa3, `${item.id}: 无效 WebM 文件`);
  assert.ok(bytes.includes(Buffer.from('OpusHead')), `${item.id}: 缺少 Opus 音轨`);
}
for (const sound of sounds) assert.ok(ids.has(sound.id), `${sound.id}: 缺少录音`);
console.log(`第一章节录音校验通过：${ids.size}/${sounds.length}，ID、台词、路径及 WebM/Opus 文件有效`);

// 真人配音总库：public/recordings/voice（游戏运行时实际使用）
const voiceDir = resolve(project, 'public/recordings/voice');
const voice = JSON.parse(readFileSync(resolve(voiceDir, 'manifest.json'), 'utf8'));
const voiceIds = new Set();
for (const item of voice.items) {
  assert.match(item.id, /^[A-Za-z0-9_-]+$/, `配音 ID 非法: ${item.id}`);
  assert.ok(!voiceIds.has(item.id), `重复配音 ID: ${item.id}`);
  voiceIds.add(item.id);
  if (!item.audio) continue;
  const path = resolve(voiceDir, item.audio);
  assert.ok(path.startsWith(voiceDir + sep), `${item.id}: 配音路径越界`);
  assert.ok(readFileSync(path).length > 1024, `${item.id}: 配音文件为空或过小`);
}
for (const scene of ['laocuo', 'gulangyu']) {
  for (const sound of JSON.parse(readFileSync(resolve(project, `content/sounds/${scene}.json`), 'utf8'))) {
    assert.ok(voiceIds.has(sound.id), `${sound.id}: 词条未接入真人配音`);
  }
}
console.log(`真人配音总库校验通过：${voiceIds.size} 条，文件均存在`);
