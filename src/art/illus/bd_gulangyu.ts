/** 对话背景：鼓浪屿·洋楼庭院 */
import { G, P, INK, R, O, bands, ooval, oval, ridge, shade, rng } from './kit';

function archWindow(g: G, x: number, y: number, w: number, h: number): void {
  const r = w / 2;
  for (let i = 0; i < r; i++) {
    const dx = Math.round(Math.sqrt(r * r - (r - i) * (r - i)));
    R(g, x + r - dx - 1, y + i, dx * 2 + 2, 1, INK);
    R(g, x + r - dx, y + i, dx * 2, 1, '#e9f2f0');
  }
  R(g, x - 1, y + r, w + 2, h - r + 1, INK);
  R(g, x, y + r, w, h - r, '#4e7f8a');
  R(g, x, y + r, w, 2, '#8fbcc4');
  R(g, x + r - 1, y + 2, 2, h - 2, P.white);
  R(g, x, y + r + 4, w, 2, P.white);
  O(g, x - 3, y + h, w + 6, 4, P.cream, P.white);
}

function bougainvillea(g: G, cx: number, cy: number, rx: number, ry: number, seed: number): void {
  const r = rng(seed);
  ooval(g, cx, cy, rx, ry, P.leafD);
  for (let i = 0; i < rx * ry * 0.9; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d;
    const c = r() < 0.18 ? P.leaf : r() < 0.55 ? P.pink : r() < 0.8 ? P.pinkL : P.pinkD;
    R(g, x, y, 2, 2, c);
  }
}

export function drawGulangyu(g: G): void {
  const r = rng(31);
  // 天空与海
  bands(g, 0, 0, 480, 120, ['#8fc8e6', '#a9d6ec', '#c6e4f0', '#e2f0f0']);
  for (let i = 0; i < 5; i++) {
    const cx = 40 + i * 110;
    oval(g, cx, 28 + (i % 2) * 10, 22, 5, P.white);
    oval(g, cx + 12, 24 + (i % 2) * 10, 12, 5, P.white);
  }
  // 远处厦门岛天际线
  ridge(g, 300, 480, 112, (x) => 100 - Math.abs(Math.sin(x / 9)) * 8 - (x % 23 < 6 ? 10 : 0), '#9ab4c2');
  R(g, 0, 112, 480, 26, P.sea);
  for (let i = 0; i < 40; i++) R(g, r() * 480, 114 + r() * 22, 4 + r() * 8, 1, P.seaL);
  // 洋楼主体
  O(g, 140, 30, 250, 150, '#f1e3c6', P.white, '#cdb994');
  R(g, 136, 26, 258, 8, INK);
  R(g, 137, 27, 256, 6, '#d47a5a');
  for (let x = 140; x < 390; x += 10) R(g, x + 2, 34, 6, 4, '#e2cfa8');
  // 山花
  for (let i = 0; i < 18; i++) R(g, 265 - i * 3, 8 + i, i * 6 + 1, 1, i === 0 ? INK : '#e9d6b0');
  R(g, 211, 26, 108, 1, INK);
  ooval(g, 265, 18, 5, 5, '#6fb0cc');
  // 拱窗两层
  for (const x of [156, 206, 296, 346]) {
    archWindow(g, x, 46, 26, 46);
    archWindow(g, x, 112, 26, 52);
  }
  // 中央门廊
  O(g, 244, 96, 44, 84, '#7a4a2c', P.woodL, P.woodD);
  R(g, 265, 98, 2, 80, P.woodD);
  R(g, 258, 140, 3, 3, P.gold);
  R(g, 271, 140, 3, 3, P.gold);
  for (const px of [236, 288]) O(g, px, 90, 8, 90, P.white, undefined, '#cdb994');
  // 二层阳台栏杆
  O(g, 140, 98, 250, 5, P.cream, P.white);
  for (let x = 144; x < 388; x += 6) O(g, x, 103, 4, 7, P.white);
  // 院墙与地面
  R(g, 0, 180, 480, 90, '#c9b48e');
  for (let y = 182; y < 270; y += 9) for (let x = (y / 9) % 2 ? 0 : 9; x < 480; x += 18) R(g, x, y, 17, 8, '#d8c6a0');
  R(g, 0, 178, 480, 3, INK);
  O(g, 0, 160, 130, 22, '#e7d6b4', P.white, '#bba57e');
  O(g, 400, 160, 80, 22, '#e7d6b4', P.white, '#bba57e');
  for (let x = 4; x < 128; x += 12) O(g, x, 152, 8, 9, '#d47a5a');
  // 老榕/三角梅
  bougainvillea(g, 60, 110, 70, 50, 5);
  bougainvillea(g, 440, 120, 56, 44, 9);
  bougainvillea(g, 120, 168, 26, 14, 13);
  R(g, 56, 150, 8, 30, P.woodD);
  // 钢琴琴凳一角（鼓浪屿琴岛）
  O(g, 330, 196, 70, 34, '#2b2622', '#4a403a');
  O(g, 330, 190, 70, 8, '#3a332e', '#5a504a');
  for (let k = 0; k < 9; k++) R(g, 334 + k * 7, 192, 5, 4, P.white);
  for (let k = 0; k < 6; k++) R(g, 338 + k * 10, 192, 3, 2, INK);
  // 花盆
  for (const x of [190, 220]) {
    O(g, x, 196, 18, 16, '#c0533a', P.redL);
    bougainvillea(g, x + 9, 190, 10, 8, x);
  }
  shade(g, 0, 0, 480, 270, 0.04, '255,180,200');
}
