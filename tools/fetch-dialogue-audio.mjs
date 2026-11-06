import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { queryDictionary } from './dictionary-utils.mjs';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(project, 'public/recordings/dialogue');
const scenesPath = resolve(project, 'content/scenes.json');
const scenesFile = JSON.parse(await readFile(scenesPath, 'utf8'));
const scenes = scenesFile.scenes ?? [];
await mkdir(outputDir, { recursive: true });

const report = [];
for (const scene of scenes) {
  for (const hotspot of scene.hotspots ?? []) {
    for (const [lineIndex, line] of (hotspot.dialogue ?? []).entries()) {
      const id = `${scene.id}-${hotspot.id}-${String(lineIndex + 1).padStart(2, '0')}`;
      const result = await queryDictionary(line.text);
      const relativeAudio = `recordings/dialogue/${id}.mp3`;
      if (result.audioUrl) {
        const response = await fetch(result.audioUrl);
        if (!response.ok) throw new Error(`Download failed: ${id} HTTP ${response.status}`);
        await writeFile(resolve(project, 'public', relativeAudio), Buffer.from(await response.arrayBuffer()));
        line.audio = relativeAudio;
        report.push({ id, sceneId: scene.id, hotspotId: hotspot.id, lineIndex, text: line.text, query: result.queryText, audio: relativeAudio, status: 'found' });
      } else {
        delete line.audio;
        report.push({ id, sceneId: scene.id, hotspotId: hotspot.id, lineIndex, text: line.text, query: result.queryText, audio: null, status: 'missing' });
      }
      process.stdout.write(`[${report.length}] ${id} ${result.audioUrl ? 'found' : 'missing'} ${result.queryText}\n`);
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 120));
    }
  }
}

await writeFile(scenesPath, `${JSON.stringify(scenesFile, null, 2)}\n`);
await writeFile(resolve(outputDir, 'manifest.json'), `${JSON.stringify({
  source: 'https://sutian.moe.edu.tw',
  queryLanguage: 'zh-hant',
  generatedAt: new Date().toISOString(),
  total: report.length,
  found: report.filter((item) => item.status === 'found').length,
  missing: report.filter((item) => item.status === 'missing').length,
  items: report,
}, null, 2)}\n`);

console.log(`Dictionary dialogue audio: ${report.filter((item) => item.status === 'found').length}/${report.length}`);
