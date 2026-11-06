// 把配音工具新导出的配音包合并进 public/recordings/voice/（同 ID 以新包为准）。
// 用法：node tools/merge-voice.mjs <配音包.zip 或 解压后的目录>
// 配音包结构：manifest.json + audio/<id>.<ext>（与「鹭岛听音配音」导出格式一致）。
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'public/recordings/voice');
const input = process.argv[2];
if (!input || !existsSync(input)) {
  console.error('用法：node tools/merge-voice.mjs <配音包.zip 或 解压后的目录>');
  process.exit(1);
}

let src = resolve(input);
let tmp = null;
if (statSync(src).isFile()) {
  tmp = mkdtempSync(join(tmpdir(), 'voice-'));
  execFileSync('tar', ['-xf', src, '-C', tmp]);
  src = tmp;
}
/** 找到包含 manifest.json 的目录（压缩包可能多套一层文件夹） */
function findManifest(dir, depth = 0) {
  if (existsSync(join(dir, 'manifest.json'))) return dir;
  if (depth > 2) return null;
  for (const name of readdirSync(dir)) {
    const sub = join(dir, name);
    if (statSync(sub).isDirectory()) {
      const hit = findManifest(sub, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}
const pkg = findManifest(src);
if (!pkg) {
  console.error('配音包里没有找到 manifest.json');
  process.exit(1);
}

const incoming = JSON.parse(readFileSync(join(pkg, 'manifest.json'), 'utf8'));
const current = existsSync(join(target, 'manifest.json'))
  ? JSON.parse(readFileSync(join(target, 'manifest.json'), 'utf8'))
  : { formatVersion: 1, items: [] };
const ID = /^[A-Za-z0-9_-]+$/;
const byId = new Map(current.items.map((it) => [it.id, it]));
mkdirSync(join(target, 'audio'), { recursive: true });
let added = 0;
let replaced = 0;
let skipped = 0;
for (const it of incoming.items ?? []) {
  if (!it.audio || !ID.test(it.id ?? '')) {
    skipped++;
    continue;
  }
  const from = join(pkg, it.audio);
  if (!existsSync(from)) {
    console.warn(`跳过 ${it.id}：音频文件不存在 ${it.audio}`);
    skipped++;
    continue;
  }
  const audio = `audio/${basename(it.audio)}`;
  copyFileSync(from, join(target, audio));
  if (byId.has(it.id)) replaced++;
  else added++;
  byId.set(it.id, { ...it, audio });
}
const items = [...byId.values()].map((it, i) => ({ ...it, number: i + 1 }));
const merged = {
  ...current,
  formatVersion: 1,
  exportedAt: new Date().toISOString(),
  total: items.length,
  recorded: items.filter((it) => it.audio).length,
  complete: items.every((it) => it.audio),
  items,
};
writeFileSync(join(target, 'manifest.json'), `${JSON.stringify(merged, null, 2)}\n`);
if (tmp) rmSync(tmp, { recursive: true, force: true });
console.log(`合并完成：新增 ${added}，覆盖 ${replaced}，跳过 ${skipped}；配音库共 ${items.length} 条`);
console.log('可运行 node tools/voice-coverage.mjs 查看剩余缺口');
