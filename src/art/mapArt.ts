import Phaser from 'phaser';
import { PALETTE, box, disc, layer, oval, poly, px } from './common';

/**
 * 厦门本岛 / 鼓浪屿 / 大陆海岸轮廓，坐标与 content/scenes.json 的 mapPos 对齐（480×270）。
 * 本岛轮廓保留：西侧筼筜湖出海口、东北五缘湾凹湾、东南环岛路弧形海岸。
 */
const ISLAND = [
  205, 95, 212, 92, 219, 86, 224, 78, 238, 70, 247, 68, 255, 69, 263, 65, 278, 66, 286, 60,
  302, 61, 311, 64, 328, 64, 339, 69, 354, 69, 363, 75, 378, 78, 388, 86, 398, 89,
  405, 97, 409, 104, 404, 109, 396, 112, 393, 118, 399, 123, 410, 122, 419, 124, 421, 132,
  417, 138, 421, 147, 416, 159, 414, 172,
  406, 184, 397, 190, 394, 200, 381, 208, 376, 217, 362, 220, 349, 230, 337, 233,
  322, 230, 309, 232, 293, 226, 279, 224, 268, 218, 256, 216, 246, 210, 234, 205,
  226, 197, 216, 194, 206, 186, 199, 184, 194, 177, 186, 170, 185, 160, 188, 151,
  187, 141, 190, 129, 194, 121, 193, 114, 196, 109, 194, 104, 200, 102,
];
const GULANGYU = [138, 164, 146, 161, 152, 163, 158, 162, 164, 168, 163, 175, 167, 180, 160, 186, 155, 191, 147, 188, 140, 188, 135, 181, 133, 174, 136, 170];
const MAINLAND = [
  0, 0, 480, 0, 480, 30, 430, 40, 380, 42, 330, 38, 280, 44, 240, 50, 200, 60, 160, 80, 130, 110,
  100, 140, 70, 160, 40, 170, 0, 176,
];
/** 大屿岛（白鹭保护区）、火烧屿、金门方向小岛 */
const DAYU = [112, 203, 119, 199, 126, 201, 128, 207, 122, 211, 114, 210];
const HUOSHAO = [170, 122, 176, 119, 181, 122, 179, 127, 172, 127];
const KINMEN = [452, 196, 462, 190, 474, 191, 474, 214, 462, 216, 452, 208];

const LAND = 0xd9c99a;
const LAND_DARK = 0xc9b783;
const SAND = 0xeedcae;
const ROAD = 0xb59e72;
const SHALLOW = 0x79b1bd;

/** 连续折线保留道路弯折与海岸线细节。 */
function path(g: Phaser.GameObjects.Graphics, points: number[], color: number, width = 1, alpha = 1, close = false): void {
  g.lineStyle(width, color, alpha).beginPath().moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) g.lineTo(points[i], points[i + 1]);
  if (close) g.closePath();
  g.strokePath();
}

function tree(g: Phaser.GameObjects.Graphics, x: number, y: number, small = false): void {
  box(g, PALETTE.woodDark, x, y, 1, small ? 2 : 3);
  oval(g, PALETTE.leafDark, x, y - 2, small ? 2 : 3, small ? 2 : 2);
  box(g, PALETTE.leafLight, x - 1, y - 3, 2, 1, 0.85);
}

/** 环岛路椰子树 */
function palm(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  box(g, PALETTE.woodDark, x, y - 5, 1, 5);
  box(g, PALETTE.leaf, x - 3, y - 6, 3, 1);
  box(g, PALETTE.leaf, x + 1, y - 6, 3, 1);
  box(g, PALETTE.leafLight, x - 2, y - 7, 5, 1);
  px(g, PALETTE.leafDark, x - 4, y - 5);
  px(g, PALETTE.leafDark, x + 4, y - 5);
}

function house(g: Phaser.GameObjects.Graphics, x: number, y: number, w = 7, h = 5, roof: number = PALETTE.brick): void {
  box(g, PALETTE.woodDark, x + 1, y + 2, w, h, 0.16);
  box(g, PALETTE.plaster, x, y, w, h);
  box(g, PALETTE.plasterDark, x + w - 2, y, 2, h);
  poly(g, roof, [x - 1, y, x + w / 2, y - 3, x + w + 1, y, x + w, y + 1, x, y + 1]);
  box(g, PALETTE.inkSoft, x + 2, y + 2, 1, 2);
  if (w > 6) box(g, PALETTE.wood, x + w - 3, y + 2, 1, 2);
}

/** 闽南红砖厝：红砖墙 + 燕尾脊 */
function redHouse(g: Phaser.GameObjects.Graphics, x: number, y: number, w = 9): void {
  box(g, PALETTE.shadow, x + 1, y + 1, w, 5, 0.18);
  box(g, PALETTE.brick, x, y, w, 5);
  box(g, PALETTE.brickLight, x, y, w, 1);
  box(g, PALETTE.granite, x, y + 4, w, 1);
  box(g, PALETTE.stone, Math.floor(x + w / 2) - 1, y + 2, 2, 3);
  poly(g, PALETTE.lacquerDark, [x - 3, y - 4, x, y - 1, x + w, y - 1, x + w + 3, y - 4, x + w + 1, y, x - 1, y]);
  box(g, PALETTE.lacquer, x, y - 2, w, 1);
}

/** 鼓浪屿红顶洋楼 */
function villa(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  box(g, PALETTE.shadow, x + 1, y + 1, 7, 6, 0.2);
  box(g, PALETTE.cream, x, y, 7, 6);
  box(g, PALETTE.plasterDark, x + 5, y, 2, 6);
  poly(g, PALETTE.brickLight, [x - 1, y, x + 2, y - 3, x + 5, y - 3, x + 8, y]);
  for (const dx of [1, 4]) {
    box(g, PALETTE.seaDeep, x + dx, y + 2, 1, 2);
    box(g, PALETTE.seaDeep, x + dx, y + 4, 1, 1, 0.6);
  }
}

/** 南普陀：黄墙 + 双层翘檐琉璃顶 */
function temple(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  box(g, PALETTE.shadow, x - 6, y + 1, 14, 6, 0.2);
  box(g, PALETTE.templeYellow, x - 6, y, 13, 6);
  box(g, PALETTE.templeYellowDark, x - 6, y + 5, 13, 1);
  box(g, PALETTE.lacquer, x - 1, y + 2, 3, 4);
  poly(g, PALETTE.glaze, [x - 9, y - 3, x - 6, y - 1, x + 7, y - 1, x + 10, y - 3, x + 8, y + 1, x - 7, y + 1]);
  box(g, PALETTE.glazeLight, x - 6, y - 1, 13, 1);
  box(g, PALETTE.templeYellow, x - 3, y - 5, 7, 3);
  poly(g, PALETTE.glazeDark, [x - 6, y - 7, x - 3, y - 5, x + 4, y - 5, x + 7, y - 7, x + 5, y - 4, x - 4, y - 4]);
  px(g, PALETTE.gold, x, y - 8);
}

/** 世茂双子塔等玻璃高楼 */
function tower(g: Phaser.GameObjects.Graphics, x: number, y: number, h: number): void {
  box(g, PALETTE.shadow, x + 1, y - h + 2, 4, h, 0.2);
  box(g, PALETTE.steel, x, y - h, 4, h);
  box(g, PALETTE.steelLight, x, y - h, 1, h);
  box(g, PALETTE.steelDark, x + 3, y - h, 1, h);
  for (let yy = y - h + 2; yy < y - 1; yy += 3) box(g, PALETTE.seaLight, x + 1, yy, 2, 1, 0.8);
  box(g, PALETTE.steelDark, x + 1, y - h - 3, 2, 3);
  px(g, PALETTE.flame, x + 1, y - h - 4);
}

function lighthouse(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  oval(g, PALETTE.glowSoft, x, y - 9, 4, 2, 0.45);
  box(g, PALETTE.foam, x - 1, y - 8, 3, 8);
  box(g, PALETTE.flame, x - 1, y - 6, 3, 1);
  box(g, PALETTE.flame, x - 1, y - 3, 3, 1);
  box(g, PALETTE.glow, x - 1, y - 10, 3, 2);
  box(g, PALETTE.ink, x - 2, y - 11, 5, 1);
  box(g, PALETTE.granite, x - 3, y, 7, 1);
}

function plane(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  box(g, PALETTE.foam, x - 5, y, 11, 2);
  poly(g, PALETTE.foam, [x - 1, y, x + 2, y, x - 3, y - 5, x - 4, y - 5]);
  poly(g, PALETTE.foam, [x - 1, y + 2, x + 2, y + 2, x - 3, y + 7, x - 4, y + 7]);
  box(g, PALETTE.foamDark, x - 6, y - 2, 2, 3);
  box(g, PALETTE.plasticBlue, x - 3, y + 1, 7, 1);
}

/** 展翅白鹭：厦门别称“鹭岛” */
function egret(g: Phaser.GameObjects.Graphics, x: number, y: number, up = true): void {
  const c = PALETTE.foam;
  if (up) {
    px(g, c, x - 4, y - 3);
    box(g, c, x - 3, y - 2, 2, 1);
    box(g, c, x - 1, y - 1, 3, 1);
    box(g, c, x + 2, y - 2, 2, 1);
    px(g, c, x + 4, y - 3);
  } else {
    box(g, c, x - 4, y - 1, 3, 1);
    box(g, c, x - 1, y - 1, 3, 1);
    box(g, c, x + 2, y - 1, 3, 1);
    px(g, c, x - 5, y);
    px(g, c, x + 5, y);
  }
  box(g, c, x - 1, y, 4, 1);
  px(g, PALETTE.gold, x + 3, y);
}

/** 立在滩涂上的白鹭 */
function egretStand(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  box(g, PALETTE.foam, x, y - 4, 3, 2);
  px(g, PALETTE.foam, x + 2, y - 5);
  px(g, PALETTE.foam, x + 2, y - 6);
  px(g, PALETTE.gold, x + 3, y - 6);
  px(g, PALETTE.ink, x + 1, y - 2);
  px(g, PALETTE.ink, x + 1, y - 1);
}

function boat(g: Phaser.GameObjects.Graphics, x: number, y: number, sail = false): void {
  path(g, [x - 4, y + 4, x + 7, y + 4], PALETTE.seaLight, 1, 0.7);
  poly(g, PALETTE.woodDark, [x - 5, y, x + 6, y, x + 3, y + 3, x - 3, y + 3]);
  box(g, PALETTE.cream, x - 3, y - 2, 7, 2);
  if (sail) {
    box(g, PALETTE.wood, x, y - 12, 1, 12);
    poly(g, PALETTE.cream, [x - 1, y - 11, x - 1, y - 3, x - 6, y - 3]);
    poly(g, PALETTE.brickLight, [x + 1, y - 10, x + 1, y - 3, x + 6, y - 3]);
  } else {
    box(g, PALETTE.brick, x - 1, y - 4, 3, 2);
    box(g, PALETTE.seaDeep, x - 2, y - 2, 2, 1);
    box(g, PALETTE.seaDeep, x + 1, y - 2, 2, 1);
  }
}

/** 鹭江轮渡：白色双层客船 */
function ferry(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  path(g, [x - 9, y + 4, x + 9, y + 4], PALETTE.foam, 1, 0.6);
  poly(g, PALETTE.foam, [x - 8, y, x + 8, y, x + 6, y + 3, x - 6, y + 3]);
  box(g, PALETTE.plasticBlue, x - 7, y + 1, 14, 1);
  box(g, PALETTE.cream, x - 5, y - 3, 10, 3);
  for (let i = -4; i < 5; i += 2) px(g, PALETTE.seaDeep, x + i, y - 2);
  box(g, PALETTE.flame, x + 1, y - 5, 2, 2);
}

function cloud(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number): void {
  oval(g, PALETTE.seaDeep, x + 2, y + 4, w, 3, 0.18);
  oval(g, PALETTE.foam, x, y, w, 3, 0.9);
  oval(g, PALETTE.foam, x - w / 3, y - 2, w / 2, 3, 0.9);
  oval(g, PALETTE.foam, x + w / 4, y - 3, w / 2.5, 3, 0.9);
  box(g, PALETTE.foamDark, x - w + 2, y + 2, w * 2 - 4, 1, 0.7);
}

/** 八市菜市场：条纹雨棚摊位 */
function stall(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
  box(g, PALETTE.woodDark, x, y + 2, 1, 3);
  box(g, PALETTE.woodDark, x + 6, y + 2, 1, 3);
  for (let i = 0; i < 7; i++) box(g, i % 2 ? PALETTE.cream : color, x + i, y, 1, 2);
  box(g, PALETTE.glaze, x + 1, y + 3, 5, 1);
}

/** 中山路骑楼：连续拱廊街屋 */
function qilou(g: Phaser.GameObjects.Graphics, x: number, y: number, n: number): void {
  const w = n * 5 + 1;
  box(g, PALETTE.shadow, x + 1, y + 1, w, 8, 0.2);
  box(g, PALETTE.plaster, x, y, w, 8);
  box(g, PALETTE.brickLight, x, y - 1, w, 1);
  for (let i = 0; i < n; i++) {
    const sx = x + 1 + i * 5;
    box(g, i % 2 ? PALETTE.bougainLight : PALETTE.goldLight, sx, y - 2, 4, 1);
    box(g, PALETTE.seaDeep, sx + 1, y + 2, 2, 1);
    box(g, PALETTE.inkSoft, sx, y + 5, 4, 3);
    box(g, PALETTE.plaster, sx, y + 5, 4, 1);
  }
}

/** 日光岩：花岗岩巨石 + 观景旗 */
function sunRock(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  oval(g, PALETTE.graniteDark, x, y, 5, 3);
  oval(g, PALETTE.granite, x - 1, y - 1, 4, 2);
  px(g, PALETTE.graniteLight, x - 2, y - 2);
  box(g, PALETTE.ink, x + 1, y - 9, 1, 6);
  box(g, PALETTE.flame, x + 2, y - 9, 3, 2);
}

/** 三角梅花丛 */
function bougain(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  px(g, PALETTE.bougain, x, y);
  px(g, PALETTE.bougainLight, x + 1, y - 1);
  px(g, PALETTE.bougainDark, x + 2, y);
  px(g, PALETTE.leafLight, x + 1, y + 1);
}

/** 以质心为基准缩放多边形，用来做沙滩描边 / 内陆层次。 */
function shrink(points: number[], factor: number): number[] {
  let cx = 0;
  let cy = 0;
  const n = points.length / 2;
  for (let i = 0; i < points.length; i += 2) {
    cx += points[i];
    cy += points[i + 1];
  }
  cx /= n;
  cy /= n;
  return points.map((v, i) => (i % 2 === 0 ? cx + (v - cx) * factor : cy + (v - cy) * factor));
}

/** 简单的确定性伪随机，保证每次绘制的波纹位置一致。 */
function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** 在多边形区域内随机种树（点在多边形内判定） */
function inside(points: number[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = points.length - 2; i < points.length; j = i, i += 2) {
    const xi = points[i];
    const yi = points[i + 1];
    const xj = points[j];
    const yj = points[j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function forest(g: Phaser.GameObjects.Graphics, area: number[], count: number, seed: number): void {
  const rand = rng(seed);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < area.length; i += 2) {
    minX = Math.min(minX, area[i]);
    maxX = Math.max(maxX, area[i]);
    minY = Math.min(minY, area[i + 1]);
    maxY = Math.max(maxY, area[i + 1]);
  }
  const spots: Array<[number, number]> = [];
  for (let n = 0; n < count * 6 && spots.length < count; n++) {
    const x = Math.round(minX + rand() * (maxX - minX));
    const y = Math.round(minY + 3 + rand() * (maxY - minY - 3));
    if (inside(area, x, y)) spots.push([x, y]);
  }
  spots.sort((a, b) => a[1] - b[1]);
  for (const [x, y] of spots) tree(g, x, y, rand() < 0.4);
}

/** 480×270 像素风厦门地图，所有图层 scrollFactor 0、depth 0–8。 */
export function drawWorldMap(scene: Phaser.Scene): void {
  drawSea(scene);
  drawLand(scene);
  drawDistricts(scene);
  drawLandmarks(scene);
  drawSeaLife(scene);
  drawFrame(scene);
}

/** 0–1：海面、等深线、波纹 */
function drawSea(scene: Phaser.Scene): void {
  const sea = layer(scene, 0, 0);
  box(sea, PALETTE.sea, 0, 0, 480, 270);
  // 近岸浅、外海深：南侧台湾海峡方向逐级加深（无硬边色块）
  for (let i = 0; i < 7; i++) box(sea, PALETTE.seaDeep, 0, 206 + i * 9, 480, 9, 0.12 + i * 0.1);
  box(sea, 0x1b4466, 0, 256, 480, 14, 0.5);
  for (let x = 40; x < 480; x += 40) box(sea, PALETTE.seaLight, x, 0, 1, 270, 0.1);
  for (let y = 30; y < 270; y += 40) box(sea, PALETTE.seaLight, 0, y, 480, 1, 0.1);
  // 浅海等深线与潮汐带
  poly(sea, 0x3e7fa6, shrink(ISLAND, 1.2), 0.35);
  poly(sea, 0x548eab, shrink(ISLAND, 1.12), 0.48);
  poly(sea, SHALLOW, shrink(ISLAND, 1.055), 0.65);
  path(sea, shrink(ISLAND, 1.13), PALETTE.seaLight, 1, 0.3, true);
  path(sea, shrink(ISLAND, 1.22), PALETTE.seaLight, 1, 0.15, true);
  poly(sea, SHALLOW, shrink(GULANGYU, 1.4), 0.55);
  path(sea, shrink(GULANGYU, 1.65), PALETTE.seaLight, 1, 0.4, true);
  poly(sea, SHALLOW, shrink(DAYU, 1.6), 0.45);
  poly(sea, SHALLOW, shrink(HUOSHAO, 1.7), 0.45);
  poly(sea, SHALLOW, shrink(KINMEN, 1.3), 0.35);
  // 西海域 / 同安湾滩涂
  poly(sea, SHALLOW, [130, 110, 160, 82, 200, 62, 205, 92, 194, 104, 180, 112, 150, 115], 0.35);
  poly(sea, SHALLOW, [300, 44, 330, 40, 380, 44, 388, 60, 363, 70, 330, 62, 302, 58], 0.4);
  path(sea, [22, 194, 51, 184, 77, 176, 98, 161, 114, 140, 128, 120], PALETTE.seaLight, 1, 0.3);
  path(sea, [272, 247, 308, 253, 350, 249, 388, 232, 421, 204, 439, 173, 448, 132], PALETTE.seaLight, 1, 0.24);
  // 航道浮标
  for (const [x, y] of [[120, 160], [178, 214], [228, 232], [432, 120]]) {
    box(sea, PALETTE.flame, x, y - 2, 2, 3);
    box(sea, PALETTE.foam, x, y - 1, 2, 1);
  }

  const waves = layer(scene, 1, 0);
  const rand = rng(7);
  for (let i = 0; i < 110; i++) {
    const x = 10 + rand() * 460;
    const y = 14 + rand() * 248;
    if (inside(ISLAND, x, y) || inside(MAINLAND, x, y) || inside(shrink(ISLAND, 1.06), x, y)) continue;
    const a = 0.35 + rand() * 0.4;
    box(waves, PALETTE.seaLight, x, y, 3, 1, a);
    box(waves, PALETTE.seaLight, x + 3, y - 1, 2, 1, a);
    box(waves, PALETTE.seaLight, x + 5, y, 3, 1, a);
  }
  // 阳光反射
  for (let i = 0; i < 26; i++) {
    const x = 260 + rand() * 200;
    const y = 236 + rand() * 26;
    box(waves, PALETTE.glowSoft, x, y, 2 + Math.round(rand() * 3), 1, 0.35);
  }
  // 波纹缓慢起伏
  scene.tweens.add({ targets: waves, alpha: 0.55, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

/** 2：陆地（大陆、本岛、鼓浪屿和小岛），先铺沙滩再铺内陆 */
function drawLand(scene: Phaser.Scene): void {
  const land = layer(scene, 2, 0);
  poly(land, SAND, MAINLAND);
  poly(land, 0xc7b98a, [0, 0, 480, 0, 480, 24, 400, 32, 300, 30, 220, 42, 150, 72, 100, 120, 50, 150, 0, 162]);
  poly(land, PALETTE.leafDark, [0, 0, 120, 0, 80, 40, 30, 70, 0, 80], 0.55);
  poly(land, PALETTE.leafDark, [330, 0, 480, 0, 480, 18, 400, 22], 0.45);
  // 远山层叠（天马山 / 云顶山方向）
  for (const [x, w, h, c] of [
    [24, 30, 18, PALETTE.leafDark],
    [70, 34, 22, PALETTE.leaf],
    [130, 26, 14, PALETTE.leafDark],
    [372, 30, 14, PALETTE.leaf],
    [440, 32, 16, PALETTE.leafDark],
  ] as const) {
    poly(land, c, [x - w, 14 + h, x - w / 3, 14 + h / 4, x, 12, x + w / 3, 14 + h / 3, x + w, 14 + h], 0.6);
    path(land, [x - w / 3, 14 + h / 4, x, 12, x + w / 4, 14 + h / 4], PALETTE.leafLight, 1, 0.5);
  }

  poly(land, SAND, ISLAND);
  poly(land, LAND, shrink(ISLAND, 0.955));
  poly(land, LAND_DARK, shrink(ISLAND, 0.7), 0.35);
  poly(land, SAND, GULANGYU);
  poly(land, LAND, shrink(GULANGYU, 0.82));
  path(land, ISLAND, 0x7c835d, 1, 0.8, true);
  path(land, GULANGYU, 0x7c835d, 1, 0.8, true);
  for (const isle of [DAYU, HUOSHAO, KINMEN]) {
    poly(land, SAND, isle);
    poly(land, PALETTE.leaf, shrink(isle, 0.7), 0.9);
    path(land, isle, 0x7c835d, 1, 0.7, true);
  }
  // 筼筜湖出海口水道
  poly(land, SHALLOW, [192, 110, 205, 108, 222, 109, 222, 113, 205, 113, 193, 115]);
  // 五缘湾内湾
  poly(land, SHALLOW, [396, 113, 403, 110, 406, 116, 400, 120, 394, 118]);
  // 东海岸沙滩、礁石
  path(land, [417, 145, 413, 161, 410, 174, 401, 185, 391, 192, 387, 201, 372, 213, 361, 217], PALETTE.cream, 2, 0.8);
  path(land, [349, 229, 337, 232, 322, 229, 309, 231, 293, 225], PALETTE.cream, 2, 0.7);
  for (const [x, y] of [[168, 209], [180, 215], [428, 184], [236, 210], [425, 160]]) {
    poly(land, PALETTE.stoneDark, [x, y, x + 5, y - 3, x + 9, y, x + 6, y + 3, x + 2, y + 3]);
    box(land, PALETTE.stone, x + 3, y - 1, 3, 1);
  }
}

/** 3：山林、湖泊、街区与道路 */
function drawDistricts(scene: Phaser.Scene): void {
  const d = layer(scene, 3, 0);
  // 大陆丘陵与海沧、集美沿岸村落
  for (const [x, y] of [[43, 94], [61, 81], [76, 64], [92, 55], [110, 46], [143, 37], [184, 32], [396, 25], [420, 22]]) {
    poly(d, PALETTE.leafDark, [x - 13, y + 5, x - 4, y - 7, x + 2, y - 4, x + 7, y - 12, x + 19, y + 5], 0.35);
    path(d, [x - 4, y - 6, x + 1, y + 1, x + 7, y - 11, x + 11, y - 3], PALETTE.leafLight, 1, 0.45);
  }
  forest(d, [0, 20, 110, 20, 80, 50, 30, 76, 0, 86], 22, 11);
  forest(d, [330, 12, 470, 12, 470, 24, 400, 28], 10, 12);
  for (const [x, y] of [[104, 117], [111, 109], [118, 101], [127, 93], [137, 83], [155, 70], [171, 63], [231, 42], [243, 38]]) {
    house(d, x, y, 6, 4, PALETTE.brickDark);
  }
  // 集美学村（嘉庚风格红顶建筑）
  for (const [x, y] of [[282, 30], [292, 28], [302, 30], [314, 29]]) redHouse(d, x, y, 7);
  // 海沧工业港吊机
  for (const x of [70, 82]) {
    box(d, PALETTE.plasticRed, x, 140, 1, 10);
    box(d, PALETTE.plasticRed, x - 3, 140, 9, 1);
    box(d, PALETTE.ink, x + 4, 141, 1, 3);
  }
  for (const [x, c] of [[50, PALETTE.plasticBlue], [56, PALETTE.plasticRed], [62, PALETTE.glaze]] as const) box(d, c, x, 160, 5, 3);

  // 分区浅底色和细密街巷
  poly(d, 0xcdbb90, [204, 123, 224, 118, 244, 127, 247, 159, 227, 174, 201, 168], 0.58);
  poly(d, 0xe5d6ad, [293, 82, 329, 78, 358, 91, 354, 104, 313, 108, 293, 99], 0.6);
  for (let x = 226; x < 390; x += 12) path(d, [x, 123, x + 5, 137, x + 3, 158, x + 10, 173], 0xc2ad81, 1, 0.55);
  path(d, [226, 124, 268, 128, 300, 120, 339, 128, 382, 119], 0xc2ad81, 1, 0.6);
  path(d, [230, 144, 268, 143, 301, 139, 343, 148, 390, 140], 0xc2ad81, 1, 0.6);
  path(d, [227, 165, 268, 158, 307, 168, 351, 163, 391, 158], 0xc2ad81, 1, 0.6);
  // 城区楼群小方块
  const blocks = rng(23);
  for (let i = 0; i < 70; i++) {
    const x = 228 + Math.round(blocks() * 170);
    const y = 115 + Math.round(blocks() * 55);
    if (!inside(shrink(ISLAND, 0.9), x, y)) continue;
    if (Math.abs(x - 300) < 14 && Math.abs(y - 150) < 16) continue;
    const c = blocks() < 0.3 ? PALETTE.brickLight : blocks() < 0.5 ? PALETTE.stone : PALETTE.plaster;
    box(d, PALETTE.shadow, x + 1, y + 1, 3, 2, 0.2);
    box(d, c, x, y, 3, 2, 0.9);
  }

  // 万石山 / 南普陀后山
  const wanshi = [235, 175, 260, 165, 295, 170, 310, 190, 290, 205, 255, 200];
  poly(d, PALETTE.leaf, wanshi, 0.85);
  poly(d, PALETTE.leafDark, [255, 178, 272, 172, 290, 182, 278, 194, 260, 190], 0.8);
  const huandao = [299, 175, 319, 162, 341, 170, 350, 188, 377, 185, 390, 195, 366, 207, 342, 201, 316, 207, 299, 198];
  poly(d, PALETTE.leaf, huandao, 0.8);
  poly(d, PALETTE.leafDark, [308, 183, 321, 170, 337, 179, 331, 190, 344, 196, 316, 199], 0.65);
  path(d, [243, 186, 254, 177, 269, 175, 285, 182, 291, 193], PALETTE.leafLight, 1, 0.8);
  path(d, [306, 187, 319, 177, 328, 183, 326, 191, 343, 197, 361, 193, 374, 197], PALETTE.leafLight, 1, 0.8);
  // 狐尾山 / 仙岳山
  const huwei = [250, 95, 280, 88, 300, 100, 285, 112, 255, 110];
  const xianyue = [330, 110, 360, 104, 372, 120, 350, 130, 332, 124];
  poly(d, PALETTE.leaf, huwei, 0.8);
  poly(d, PALETTE.leafLight, xianyue, 0.8);
  forest(d, wanshi, 26, 31);
  forest(d, huandao, 26, 32);
  forest(d, huwei, 12, 33);
  forest(d, xianyue, 12, 34);
  // 狐尾山气象台
  box(d, PALETTE.foam, 270, 88, 3, 4);
  disc(d, PALETTE.foam, 271, 87, 2);
  // 鼓浪屿绿荫
  poly(d, PALETTE.leaf, [141, 167, 150, 165, 157, 170, 152, 177, 143, 176], 0.85);

  // 筼筜湖 + 白鹭洲
  poly(d, PALETTE.seaLight, [222, 108, 240, 104, 248, 112, 236, 118, 220, 116]);
  path(d, [220, 110, 232, 106, 243, 111, 235, 115, 224, 115], PALETTE.cream, 1, 0.6);
  oval(d, PALETTE.leafLight, 233, 111, 3, 1);
  poly(d, PALETTE.seaLight, [271, 102, 276, 99, 282, 101, 280, 108, 274, 108]);
  // 五缘湾湿地
  for (const [x, y] of [[392, 108], [398, 124], [390, 121]]) tree(d, x, y, true);

  // 高崎机场跑道
  box(d, PALETTE.stoneDark, 352, 76, 52, 6);
  box(d, PALETTE.ink, 352, 78, 52, 2, 0.75);
  for (let x = 355; x < 402; x += 6) box(d, PALETTE.foam, x, 78, 3, 1);
  box(d, PALETTE.steel, 374, 84, 10, 4);
  box(d, PALETTE.steelLight, 374, 84, 10, 1);

  // 道路：主干道加白色中线
  const roads = [
    [200, 160, 215, 128], [215, 128, 260, 72], [215, 128, 300, 150], [200, 160, 300, 150],
    [300, 150, 400, 130], [300, 150, 330, 215], [265, 200, 330, 215], [200, 160, 265, 200],
    [330, 215, 395, 190], [400, 130, 395, 190], [260, 72, 300, 150], [300, 150, 375, 86],
  ];
  d.lineStyle(3, PALETTE.woodDark, 0.25);
  for (const [a, b, c, e] of roads) d.lineBetween(a, b + 1, c, e + 1);
  d.lineStyle(2, ROAD, 1);
  for (const [a, b, c, e] of roads) d.lineBetween(a, b, c, e);
  d.lineStyle(1, PALETTE.cream, 0.5);
  for (const [a, b, c, e] of roads) d.lineBetween(a, b, c, e);
  // 环岛路滨海步道
  d.lineStyle(1, 0xfff1c8, 0.9);
  d.lineBetween(300, 226, 365, 220);
  d.lineBetween(365, 220, 398, 193);
  d.lineBetween(398, 193, 412, 160);
}

/** 4：地标建筑与跨海大桥（避开各地点标记及其下方标签） */
function drawLandmarks(scene: Phaser.Scene): void {
  const g = layer(scene, 4, 0);
  // 厦门大桥 + 海沧大桥
  g.lineStyle(2, PALETTE.stoneDark, 1);
  g.lineBetween(262, 66, 258, 45);
  g.lineBetween(194, 112, 137, 100);
  g.lineStyle(1, PALETTE.cream, 1);
  g.lineBetween(262, 66, 258, 45);
  g.lineBetween(194, 112, 137, 100);
  for (let i = 1; i < 4; i++) {
    box(g, PALETTE.ink, 262 - i, 66 - i * 5, 3, 2);
    box(g, PALETTE.ink, 194 - i * 14, 112 - i * 3, 2, 3);
  }
  // 海沧大桥悬索主塔与拉索
  for (const x of [158, 174]) {
    const y = x === 158 ? 104 : 108;
    box(g, PALETTE.flame, x, y - 8, 1, 8);
    box(g, PALETTE.flame, x + 3, y - 7, 1, 8);
    box(g, PALETTE.flame, x, y - 8, 4, 1);
  }
  path(g, [146, 101, 158, 96, 166, 104, 174, 100, 186, 110], PALETTE.foam, 1, 0.7);
  // 演武大桥：贴海面绕行的观景桥
  path(g, [224, 203, 238, 214, 258, 222, 280, 228, 296, 232], PALETTE.stoneDark, 2, 1);
  path(g, [224, 202, 238, 213, 258, 221, 280, 227, 296, 231], PALETTE.foam, 1, 0.9);
  for (const [x, y] of [[238, 214], [258, 222], [280, 228]]) box(g, PALETTE.ink, x, y + 1, 1, 2);

  // 世茂双子塔（演武大桥北端）+ 观音山商务区
  tower(g, 225, 199, 16);
  tower(g, 231, 201, 14);
  tower(g, 403, 156, 10);
  tower(g, 408, 158, 8);

  // 南普陀寺 + 厦门大学红顶群楼
  temple(g, 250, 190);
  for (const [x, y] of [[291, 213], [300, 215], [309, 218]]) redHouse(g, x, y, 7);
  disc(g, PALETTE.seaLight, 300, 206, 2);

  // 外妈老厝：一片红砖厝
  redHouse(g, 279, 139);
  redHouse(g, 313, 131);
  redHouse(g, 324, 141, 8);
  bougain(g, 292, 144);
  bougain(g, 322, 135);

  // 八市：条纹雨棚摊位
  stall(g, 196, 121, PALETTE.plasticRed);
  stall(g, 225, 122, PALETTE.plasticBlue);
  // 中山路骑楼街
  qilou(g, 222, 152, 3);
  // 第一码头 / 轮渡码头
  box(g, PALETTE.granite, 186, 163, 6, 3);
  box(g, PALETTE.ink, 187, 166, 1, 2);
  box(g, PALETTE.ink, 190, 166, 1, 2);

  // 鼓浪屿：红顶洋楼、日光岩、三角梅
  villa(g, 139, 167);
  villa(g, 156, 166);
  sunRock(g, 147, 167);
  for (const [x, y] of [[143, 177], [160, 176], [137, 175]]) bougain(g, x, y);

  // 曾厝垵渔村 + 环岛路椰林
  house(g, 343, 205, 7, 5, PALETTE.brick);
  house(g, 352, 210, 6, 4, PALETTE.brickDark);
  for (const [x, y] of [[366, 222], [376, 216], [386, 208], [394, 199], [402, 188], [408, 175], [312, 233], [300, 230]]) palm(g, x, y);
  // 胡里山炮台
  box(g, PALETTE.graniteDark, 268, 219, 8, 3);
  box(g, PALETTE.ink, 275, 218, 4, 1);

  // 高崎机场起飞的飞机
  plane(g, 416, 66);
  for (let i = 0; i < 4; i++) box(g, PALETTE.foam, 404 - i * 4, 71 + i, 2, 1, 0.5 - i * 0.1);

  // 灯塔（大屿岛礁石 / 东南外海）
  lighthouse(g, 183, 214);
  lighthouse(g, 440, 128);
}

/** 5：船只、白鹭与云 */
function drawSeaLife(scene: Phaser.Scene): void {
  const g = layer(scene, 5, 0);
  ferry(g, 174, 172);
  // 鹭江轮渡航线
  for (let i = 0; i < 4; i++) box(g, PALETTE.cream, 166 + i * 6, 180 - i * 3, 3, 1, 0.75);
  boat(g, 360, 242, true);
  boat(g, 412, 228, true);
  boat(g, 205, 236, true);
  boat(g, 318, 246, false);
  boat(g, 112, 186, false);
  boat(g, 214, 52, false);
  // 海沧港集装箱货轮
  poly(g, PALETTE.ink, [86, 176, 112, 176, 108, 181, 89, 181]);
  for (const [x, c] of [[90, PALETTE.plasticRed], [95, PALETTE.plasticBlue], [100, PALETTE.glaze]] as const) box(g, c, x, 172, 4, 4);
  box(g, PALETTE.foam, 105, 170, 4, 6);

  // 白鹭：大屿岛滩涂停栖 + 海面飞翔
  egretStand(g, 116, 205);
  egretStand(g, 122, 204);
  for (const [x, y, up] of [[100, 214, true], [130, 222, false], [440, 150, true], [452, 160, false], [236, 88, true], [372, 100, false], [178, 140, true]] as const) {
    egret(g, x, y, up);
  }

  // 漂动的云
  const clouds = layer(scene, 6, 0);
  cloud(clouds, 236, 12, 12);
  cloud(clouds, 442, 46, 10);
  cloud(clouds, 70, 196, 9);
  scene.tweens.add({ targets: clouds, x: 8, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // 白鹭缓慢上下
  scene.tweens.add({ targets: g, y: -1, duration: 1200, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
}

/** 7：罗盘、比例尺与复古地图边框 */
function drawFrame(scene: Phaser.Scene): void {
  const deco = layer(scene, 7, 0);
  // 罗盘（西南外海）
  const cx = 36;
  const cy = 228;
  deco.fillStyle(PALETTE.cream, 0.92).fillCircle(cx, cy, 17);
  deco.lineStyle(1, PALETTE.inkSoft, 1).strokeCircle(cx, cy, 17);
  deco.lineStyle(1, PALETTE.plasterDark, 1).strokeCircle(cx, cy, 13);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    px(deco, PALETTE.inkSoft, cx + Math.cos(a) * 15, cy + Math.sin(a) * 15);
  }
  poly(deco, PALETTE.inkSoft, [cx, cy, cx + 12, cy - 2, cx + 2, cy]);
  poly(deco, PALETTE.inkSoft, [cx, cy, cx - 12, cy + 2, cx - 2, cy]);
  poly(deco, PALETTE.inkSoft, [cx - 3, cy, cx, cy + 14, cx + 3, cy]);
  poly(deco, PALETTE.flame, [cx - 3, cy, cx, cy - 14, cx + 3, cy]);
  poly(deco, PALETTE.plasterDark, [cx, cy, cx + 6, cy - 6, cx + 1, cy - 1], 0.9);
  poly(deco, PALETTE.plasterDark, [cx, cy, cx - 6, cy + 6, cx - 1, cy + 1], 0.9);
  box(deco, PALETTE.gold, cx - 1, cy - 1, 2, 2);
  // 北向 “N”
  box(deco, PALETTE.flame, cx - 2, cy - 23, 1, 5);
  box(deco, PALETTE.flame, cx + 2, cy - 23, 1, 5);
  px(deco, PALETTE.flame, cx - 1, cy - 22);
  px(deco, PALETTE.flame, cx, cy - 21);
  px(deco, PALETTE.flame, cx + 1, cy - 20);

  // 比例尺
  box(deco, PALETTE.cream, 62, 252, 44, 5, 0.85);
  for (let i = 0; i < 4; i++) box(deco, i % 2 ? PALETTE.cream : PALETTE.inkSoft, 64 + i * 10, 254, 10, 2);
  box(deco, PALETTE.inkSoft, 64, 252, 1, 4);
  box(deco, PALETTE.inkSoft, 104, 252, 1, 4);

  // 米黄纸边框：外框 + 墨线 + 回纹 + 角花
  box(deco, PALETTE.plaster, 0, 0, 480, 6);
  box(deco, PALETTE.plaster, 0, 264, 480, 6);
  box(deco, PALETTE.plaster, 0, 0, 6, 270);
  box(deco, PALETTE.plaster, 474, 0, 6, 270);
  for (let x = 10; x < 470; x += 8) {
    box(deco, PALETTE.plasterDark, x, 2, 4, 1);
    box(deco, PALETTE.plasterDark, x + 3, 2, 1, 2);
    box(deco, PALETTE.plasterDark, x, 267, 4, 1);
    box(deco, PALETTE.plasterDark, x + 3, 266, 1, 2);
  }
  for (let y = 10; y < 260; y += 8) {
    box(deco, PALETTE.plasterDark, 2, y, 1, 4);
    box(deco, PALETTE.plasterDark, 2, y + 3, 2, 1);
    box(deco, PALETTE.plasterDark, 477, y, 1, 4);
    box(deco, PALETTE.plasterDark, 476, y + 3, 2, 1);
  }
  box(deco, PALETTE.plasterDark, 0, 0, 480, 1);
  box(deco, PALETTE.plasterDark, 0, 269, 480, 1);
  box(deco, PALETTE.plasterDark, 0, 0, 1, 270);
  box(deco, PALETTE.plasterDark, 479, 0, 1, 270);
  deco.lineStyle(1, PALETTE.inkSoft, 1).strokeRect(6.5, 6.5, 467, 257);
  deco.lineStyle(1, PALETTE.brickDark, 0.8).strokeRect(8.5, 8.5, 463, 253);
  for (const [x, y] of [[0, 0], [470, 0], [0, 260], [470, 260]]) {
    box(deco, PALETTE.brick, x, y, 10, 10);
    box(deco, PALETTE.gold, x + 2, y + 2, 6, 6);
    box(deco, PALETTE.brickDark, x + 4, y + 4, 2, 2);
  }
}
