const fs = require('fs');
const path = require('path');

const scenes = [
  ['laocuo', '外妈老厝'],
  ['bashi', '八市'],
  ['zhongshan', '中山路'],
  ['gulangyu', '鼓浪屿'],
  ['zengcuoan', '曾厝垵'],
  ['nanputuo', '南普陀'],
];

const read = p =>
  JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));

const sceneData = read(path.join('content', 'scenes.json'));
const definitions = sceneData.scenes || sceneData;
const rows = [];
let soundCount = 0;
let dialogueCount = 0;

for (const [sceneId, sceneName] of scenes) {
  const sounds = read(path.join('content', 'sounds', `${sceneId}.json`));

  for (const s of sounds) {
    rows.push({
      scene: sceneName,
      type: '声音条目',
      id: s.id,
      speaker: s.speaker || '',
      chinese: s.mandarin || s.hanzi,
      original: s.hanzi,
      tailo: s.tailo || '',
    });
    soundCount++;
  }

  const scene = definitions.find(s => s.id === sceneId);
  for (const hotspot of scene?.hotspots || []) {
    for (const [index, line] of (hotspot.dialogue || []).entries()) {
      rows.push({
        scene: sceneName,
        type: '人物对话',
        id: `${sceneId}-${hotspot.id}-${String(index + 1).padStart(2, '0')}`,
        speaker: line.speaker || hotspot.label || '',
        chinese: line.mandarin || line.text,
        original: line.text,
        tailo: line.tailo || '',
      });
      dialogueCount++;
    }
  }
}

const numbered = rows.map((r, i) => ({
  number: String(i + 1).padStart(3, '0'),
  ...r,
  filename: `${String(i + 1).padStart(3, '0')}_${r.id}.mp3`,
}));

const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
const headers = [
  '序号', '场景', '类型', '条目ID', '说话人',
  '中文含义或对话原文', '游戏原文', '台罗参考', '切片文件名',
];

const csv = [
  headers,
  ...numbered.map(r => [
    r.number, r.scene, r.type, r.id, r.speaker,
    r.chinese, r.original, r.tailo, r.filename,
  ]),
].map(row => row.map(csvCell).join(',')).join('\r\n');

const txt = numbered.map(r => [
  `${r.number}｜${r.scene}｜${r.type}｜${r.id}`,
  `台词：${r.original}`,
  `中文含义或原文：${r.chinese}`,
  `台罗：${r.tailo}`,
  `文件名：${r.filename}`,
].join('\r\n')).join('\r\n\r\n');

fs.writeFileSync('完整台词切片对应表.csv', '\uFEFF' + csv, 'utf8');
fs.writeFileSync('完整台词切片对应表.txt', '\uFEFF' + txt, 'utf8');
fs.writeFileSync(
  '连续台词原文.txt',
  '\uFEFF' + numbered.map(r => r.original).join('\r\n\r\n'),
  'utf8'
);

console.log(`声音条目 ${soundCount}，人物对话 ${dialogueCount}，合计 ${rows.length} 段。`);
console.log('已生成 CSV 对应表、TXT 对应表、连续台词原文。');
