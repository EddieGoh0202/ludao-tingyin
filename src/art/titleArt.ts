import Phaser from 'phaser';
import { PALETTE, box, layer, poly } from './common';

const SKY = [0x2e2a4f, 0x433262, 0x623a69, 0x86456a, 0xab5462, 0xcd6a58, 0xe68a55, 0xf2ab5f, 0xf7c873];
const WATER = [0x8a4f60, 0x6e4560, 0x58405c, 0x463955, 0x37304b, 0x2b2840];
const HORIZON = 150;
const SILHOUETTE = 0x3a2640;

/** 标题画面：傍晚鹭江、落日、鼓浪屿剪影、骑楼栏杆与复古收音机（480×270）。 */
export function drawTitle(scene: Phaser.Scene): { radio: Phaser.GameObjects.Container } {
  // 天空：多条色带
  const sky = layer(scene, 0, 0);
  const bandH = Math.ceil(HORIZON / SKY.length);
  SKY.forEach((c, i) => box(sky, c, 0, i * bandH, 480, bandH + 1));
  // 色带之间的像素抖动过渡
  for (let i = 1; i < SKY.length; i++) {
    for (let x = (i % 2) * 2; x < 480; x += 4) box(sky, SKY[i], x, i * bandH - 1, 2, 1);
  }
  // 星点
  for (const [x, y] of [
    [40, 8],
    [120, 20],
    [210, 6],
    [380, 14],
    [450, 28],
  ]) {
    box(sky, PALETTE.cream, x, y, 1, 1, 0.8);
  }
  // 落日（下半被江面盖住）
  sky.fillStyle(0xffe39a, 0.35).fillCircle(318, 138, 26);
  sky.fillStyle(0xffd27a, 1).fillCircle(318, 138, 18);
  // 云带
  box(sky, 0xf0a0a0, 250, 112, 60, 2, 0.6);
  box(sky, 0xf0a0a0, 340, 118, 46, 2, 0.6);
  box(sky, 0xc77a8a, 60, 70, 80, 2, 0.5);

  // 远处大陆低矮剪影
  const far = layer(scene, 1, 0);
  poly(far, 0x6b3f60, [300, 150, 340, 142, 390, 144, 430, 138, 480, 141, 480, 150]);

  // 鼓浪屿剪影：日光岩 + 八卦楼圆顶 + 树冠
  poly(far, SILHOUETTE, [
    0, 150, 0, 132, 30, 124, 60, 118, 78, 104, 88, 96, 96, 98, 104, 108, 120, 118, 150, 126, 180,
    132, 215, 140, 235, 150,
  ]);
  box(far, SILHOUETTE, 86, 92, 6, 6); // 日光岩顶旗台
  box(far, SILHOUETTE, 88, 84, 1, 8);
  box(far, PALETTE.flame, 89, 84, 4, 3);
  far.fillStyle(SILHOUETTE, 1).fillCircle(165, 121, 9);
  box(far, SILHOUETTE, 152, 121, 26, 12);
  box(far, SILHOUETTE, 164, 108, 2, 5);
  for (const [x, y, r] of [
    [20, 126, 6],
    [44, 120, 7],
    [125, 120, 6],
    [196, 136, 6],
    [214, 141, 5],
  ]) {
    far.fillCircle(x, y, r);
  }
  // 剪影里的暖色窗灯
  for (const [x, y] of [
    [30, 138],
    [58, 132],
    [158, 128],
    [170, 128],
    [200, 142],
  ]) {
    box(far, PALETTE.gold, x, y, 2, 2, 0.9);
  }

  // 江面色带与落日倒影
  const water = layer(scene, 2, 0);
  const waterH = Math.ceil((270 - HORIZON) / WATER.length);
  WATER.forEach((c, i) => box(water, c, 0, HORIZON + i * waterH, 480, waterH + 1));
  for (let i = 0; i < 14; i++) {
    const y = HORIZON + 2 + i * 6;
    const w = Math.max(4, 40 - i * 2.4);
    box(water, 0xffd27a, 318 - w / 2 + ((i % 3) - 1) * 3, y, w, 2, 0.85 - i * 0.05);
  }
  // 鼓浪屿倒影
  box(water, SILHOUETTE, 0, HORIZON, 230, 4, 0.5);
  box(water, SILHOUETTE, 20, HORIZON + 6, 180, 2, 0.3);
  // 波光
  for (let i = 0; i < 40; i++) {
    const x = (i * 97) % 470;
    const y = HORIZON + 6 + ((i * 37) % 70);
    box(water, 0xe68a55, x, y, 4, 1, 0.5);
  }

  // 白鹭
  const birds = layer(scene, 3, 0);
  for (const [x, y] of [
    [150, 52],
    [164, 46],
    [176, 56],
    [260, 70],
  ]) {
    box(birds, PALETTE.cream, x, y, 1, 1);
    box(birds, PALETTE.cream, x + 1, y + 1, 2, 1);
    box(birds, PALETTE.cream, x + 3, y + 2, 1, 1);
    box(birds, PALETTE.cream, x + 4, y + 1, 2, 1);
    box(birds, PALETTE.cream, x + 6, y, 1, 1);
  }

  // 近景：骑楼屋檐（左上）与江边栏杆
  const near = layer(scene, 4, 0);
  poly(near, 0x22161f, [0, 0, 120, 0, 110, 10, 0, 14]);
  box(near, PALETTE.brickDark, 0, 10, 112, 3);
  for (let x = 6; x < 110; x += 14) box(near, 0x22161f, x, 13, 4, 4);
  box(near, 0x2a1d2a, 0, 236, 480, 34);
  box(near, 0x3c2a35, 0, 236, 480, 2);
  box(near, 0x2a1d2a, 0, 220, 480, 4);
  box(near, 0x4a3540, 0, 220, 480, 1);
  for (let x = 4; x < 480; x += 12) {
    box(near, 0x2a1d2a, x, 224, 3, 12);
    box(near, 0x4a3540, x, 224, 1, 12);
  }
  // 路灯
  box(near, 0x22161f, 60, 170, 2, 50);
  box(near, 0x22161f, 56, 168, 10, 3);
  near.fillStyle(0xffe39a, 0.25).fillCircle(61, 174, 8);
  box(near, 0xffe39a, 58, 171, 6, 3);

  // 复古收音机（独立 Container，主任务可做浮动动画）
  const radio = scene.add.container(400, 206);
  radio.setDepth(6);
  radio.setScrollFactor(0);
  const g = scene.add.graphics();
  // 天线
  g.lineStyle(1, PALETTE.stone, 1).lineBetween(28, -26, 46, -62);
  g.fillStyle(PALETTE.flame, 1).fillCircle(46, -62, 2);
  // 提手
  box(g, PALETTE.inkSoft, -24, -34, 48, 3);
  box(g, PALETTE.inkSoft, -24, -34, 3, 9);
  box(g, PALETTE.inkSoft, 21, -34, 3, 9);
  // 木壳
  box(g, 0x5a341d, -46, -26, 92, 62);
  box(g, 0x7a4a2a, -44, -24, 88, 58);
  box(g, 0x9a6438, -44, -24, 88, 3);
  box(g, 0x5a341d, -44, 30, 88, 4);
  // 喇叭格栅
  box(g, PALETTE.plasterDark, -39, -17, 42, 42);
  box(g, PALETTE.plaster, -37, -15, 38, 38);
  for (let y = -12; y < 22; y += 4) box(g, PALETTE.plasterDark, -35, y, 34, 1);
  box(g, PALETTE.gold, -20, 2, 4, 4, 0.9);
  // 琥珀刻度窗
  box(g, PALETTE.ink, 8, -17, 32, 16);
  box(g, 0xf0b040, 10, -15, 28, 12);
  box(g, 0xffd27a, 10, -15, 28, 3, 0.7);
  for (let x = 12; x < 38; x += 4) box(g, PALETTE.inkSoft, x, -6, 1, x % 8 === 0 ? 3 : 2);
  box(g, PALETTE.flame, 23, -15, 1, 12);
  // 旋钮
  for (const x of [16, 32]) {
    g.fillStyle(PALETTE.ink, 1).fillCircle(x, 14, 7);
    g.fillStyle(PALETTE.stone, 1).fillCircle(x, 13, 6);
    g.fillStyle(PALETTE.stoneDark, 1).fillCircle(x, 14, 3);
    box(g, PALETTE.ink, x, 8, 1, 4);
  }
  // 指示灯与脚座
  box(g, PALETTE.flame, 38, 26, 3, 2);
  box(g, PALETTE.inkSoft, -40, 36, 10, 3);
  box(g, PALETTE.inkSoft, 30, 36, 10, 3);
  radio.add(g);

  return { radio };
}
