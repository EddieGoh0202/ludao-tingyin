import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const recordings = join(root, 'public', 'recordings');

function readManifest(dir) {
  return JSON.parse(readFileSync(join(recordings, dir, 'manifest.json'), 'utf8')).items ?? [];
}

function hasFile(dir, audio) {
  return Boolean(audio) && existsSync(join(recordings, dir, audio));
}

const missing = [];

for (const item of readManifest('voice')) {
  if (hasFile('voice', item.audio)) continue;
  missing.push({
    source: 'voice',
    id: item.id,
    sceneId: item.sceneId,
    kind: item.kind,
    text: item.text,
    mandarin: item.mandarin ?? '',
    tailo: item.tailo ?? '',
    suggestedAudio: `audio/${item.id}.webm`,
  });
}

for (const item of readManifest('dialogue')) {
  if (hasFile('dialogue', item.audio)) continue;
  missing.push({
    source: 'dialogue',
    id: item.id,
    sceneId: item.sceneId,
    hotspotId: item.hotspotId,
    lineIndex: item.lineIndex,
    text: item.text,
    query: item.query ?? '',
    suggestedAudio: item.audio ?? `audio/${item.id}.webm`,
  });
}

const outDir = join(root, 'outputs');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'missing-audio.json');
writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), total: missing.length, items: missing }, null, 2) + '\n', 'utf8');
console.log(`缺失音频 ${missing.length} 条，已写入 ${outFile}`);
