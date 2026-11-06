/** 对话背景：南普陀·寺庙殿前（黄墙、燕尾脊、香炉烟、五老峰） */
import { G, P, INK, R, O, bands, ooval, oval, ridge, tiles, swallowRidge, lantern, steam, shade, rng } from './kit';

export function drawNanputuo(g: G): void {
  const r = rng(71);
  // 晴空
  bands(g, 0, 0, 480, 100, ['#bfe0ee', '#d4e9ee', '#e9eedc', '#f4ecd0']);
  for (let i = 0; i < 4; i++) {
    const cx = 40 + i * 130, cy = 18 + (i % 2) * 12;
    oval(g, cx, cy, 22, 4, '#fbf6ea');
    oval(g, cx + 12, cy - 3, 12, 4, '#fbf6ea');
  }
  // 五老峰
  ridge(g, 0, 480, 110, (x) => 52 + Math.sin(x / 38) * 14 + Math.sin(x / 13) * 4 - (x > 140 && x < 340 ? 14 : 0), '#7f9e86');
  ridge(g, 0, 480, 110, (x) => 70 + Math.sin(x / 27 + 1) * 8 + Math.sin(x / 9) * 2, '#5f8a62');
  for (let i = 0; i < 40; i++) oval(g, r() * 480, 80 + r() * 28, 4, 2, '#4f7a52');
  // 黄墙
  bands(g, 0, 100, 480, 96, ['#ecc95a', '#e2b84a', '#d6a83e']);
  R(g, 0, 100, 480, 1, INK);
  for (let x = 0; x < 480; x += 60) R(g, x, 101, 1, 95, '#c99a2e');
  // 大殿：重檐 + 燕尾脊
  O(g, 120, 62, 240, 30, '#c0533a', '#d0603f', '#8e3424');
  tiles(g, 100, 50, 280, 14, '#d9a441', '#b5832c');
  swallowRidge(g, 92, 44, 296, P.redD, 18);
  ooval(g, 240, 40, 6, 5, P.gold);
  R(g, 239, 30, 3, 6, P.gold);
  tiles(g, 84, 92, 312, 12, '#d9a441', '#b5832c');
  swallowRidge(g, 76, 88, 328, P.redD, 16);
  // 殿身：红柱 + 槅扇门
  R(g, 108, 104, 264, 92, '#7d2f25');
  for (let x = 116; x < 372; x += 44) {
    O(g, x, 104, 8, 92, P.red, P.redL, P.redD);
    if (x + 44 < 372) {
      O(g, x + 10, 112, 30, 80, '#8a4a2a', '#a8623a');
      for (let j = 0; j < 5; j++) R(g, x + 12, 116 + j * 9, 26, 1, '#5a2e18');
      for (let k = 0; k < 4; k++) R(g, x + 14 + k * 7, 116, 1, 44, '#5a2e18');
      R(g, x + 12, 166, 26, 2, P.gold);
    }
  }
  // 匾额
  O(g, 196, 104, 88, 18, '#2e3a5a', '#45557a');
  R(g, 194, 102, 92, 2, P.gold);
  for (let k = 0; k < 4; k++) { R(g, 206 + k * 18, 109, 10, 2, P.gold); R(g, 210 + k * 18, 107, 2, 10, P.gold); }
  // 檐下红灯笼
  for (const x of [134, 346]) lantern(g, x, 108);
  // 石阶与殿前广场
  for (let k = 0; k < 4; k++) O(g, 100 - k * 14, 196 + k * 5, 280 + k * 28, 6, P.stoneL, P.white, P.stone);
  R(g, 0, 216, 480, 54, '#c9bfa8');
  for (let y = 216, k = 0; y < 270; y += 9, k++) {
    R(g, 0, y, 480, 1, '#a99f88');
    for (let x = (k % 2) * 16; x < 480; x += 32) R(g, x, y + 1, 1, 8, '#a99f88');
  }
  // 两侧：菩提树与放生池栏杆
  for (const [cx, dir] of [[30, 1], [450, -1]] as const) {
    O(g, cx - 5, 120, 10, 96, P.wood, P.woodL, P.woodD);
    for (let i = 0; i < 14; i++) ooval(g, cx + dir * (r() * 30 - 6), 70 + r() * 60, 14, 9, i % 3 ? P.leaf : P.leafL);
  }
  for (let x = 0; x < 80; x += 12) O(g, x, 196, 4, 20, P.stoneL, P.white);
  R(g, 0, 200, 80, 3, P.stone);
  for (let x = 404; x < 480; x += 12) O(g, x, 196, 4, 20, P.stoneL, P.white);
  R(g, 400, 200, 80, 3, P.stone);
  // 大香炉
  ooval(g, 240, 226, 34, 8, '#6a5a3a');
  O(g, 212, 196, 56, 30, '#8a6a2c', '#b08a3a', '#5e4a20');
  R(g, 206, 192, 68, 5, INK);
  R(g, 207, 193, 66, 3, P.gold);
  for (const lx of [216, 260]) O(g, lx, 224, 6, 10, '#5e4a20');
  for (let k = 0; k < 3; k++) { R(g, 226 + k * 12, 204, 6, 2, P.goldL); R(g, 228 + k * 12, 202, 2, 8, P.goldL); }
  for (let i = 0; i < 7; i++) {
    const sx = 222 + i * 6;
    R(g, sx, 178, 1, 15, '#c9573a');
    R(g, sx, 177, 1, 1, P.goldL);
    steam(g, sx, 175, 60 + (i % 3) * 10, sx, 'rgba(250,250,245,0.5)');
  }
  // 薄烟雾气
  for (let i = 0; i < 6; i++) oval(g, 210 + r() * 60, 100 + r() * 40, 18, 3, 'rgba(255,255,255,0.18)');
  shade(g, 0, 0, 480, 270, 0.05, '200,150,60');
}
