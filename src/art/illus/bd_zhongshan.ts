/** 对话背景：中山路·骑楼廊下 */
import { G, P, INK, R, O, bands, bricks, ooval, lantern, shade } from './kit';

function arch(g: G, x: number, w: number, top: number, bottom: number, inner: string): void {
  const r = w / 2;
  for (let y = 0; y < r; y++) {
    const dx = Math.round(Math.sqrt(r * r - (r - y) * (r - y)));
    R(g, x + r - dx - 1, top + y, dx * 2 + 2, 1, INK);
    R(g, x + r - dx, top + y, dx * 2, 1, inner);
  }
  R(g, x - 1, top + r, w + 2, bottom - top - r, INK);
  R(g, x, top + r, w, bottom - top - r, inner);
}

export function drawZhongshan(g: G): void {
  // 骑楼外墙
  bands(g, 0, 0, 480, 210, ['#f0d9a8', '#e8c88c', '#ddb877']);
  // 顶部檐线与山花
  R(g, 0, 0, 480, 16, '#c99a5a');
  R(g, 0, 16, 480, 2, INK);
  for (let x = 0; x < 480; x += 12) R(g, x + 3, 4, 6, 8, '#b5834a');
  // 廊柱与拱，透出街景
  const xs = [-30, 110, 250, 390];
  for (const x of xs) {
    arch(g, x + 22, 96, 30, 196, '#f6dfa6');
    bands(g, x + 22, 80, 96, 116, ['#9fd0ea', '#c9e3ea', '#f3e2b8']);
    // 对面骑楼剪影
    R(g, x + 22, 120, 96, 76, '#d7a77a');
    for (let k = 0; k < 4; k++) O(g, x + 30 + k * 22, 132, 14, 18, '#7a4a2c', '#9c6438');
    R(g, x + 22, 164, 96, 32, '#b98a5e');
    for (let k = 0; k < 3; k++) arch(g, x + 30 + k * 30, 22, 166, 196, '#6a4630');
    // 重画上半拱，避免被覆盖
    const r = 48;
    for (let y = 0; y < r; y++) {
      const dx = Math.round(Math.sqrt(r * r - (r - y) * (r - y)));
      R(g, x + 22, 30 + y, r - dx, 1, '#e8c88c');
      R(g, x + 22 + r + dx, 30 + y, r - dx, 1, '#e8c88c');
      R(g, x + 22 + r - dx - 1, 30 + y, 1, 1, INK);
      R(g, x + 22 + r + dx, 30 + y, 1, 1, INK);
    }
  }
  for (const x of [0, 118, 258, 398]) {
    const px = x === 0 ? -8 : x - 6;
    O(g, px + 0, 18, 30, 192, '#f3e3bc', P.white, '#c9a873');
    R(g, px + 4, 20, 2, 188, '#fff4d6');
    R(g, px + 24, 20, 3, 188, '#d9bb84');
    O(g, px - 3, 28, 36, 8, '#e5cf9e', P.white);
    O(g, px - 3, 196, 36, 14, '#c9a873', '#e5cf9e');
  }
  // 店招
  const signs: [number, string, string][] = [[40, P.red, P.gold], [180, '#2f5d4a', P.goldL], [320, '#1f3f6a', P.goldL]];
  for (const [x, bg, fg] of signs) {
    O(g, x, 46, 72, 18, bg, undefined, INK);
    O(g, x + 2, 48, 68, 14, bg);
    for (let k = 0; k < 4; k++) {
      R(g, x + 10 + k * 15, 51, 8, 2, fg);
      R(g, x + 13 + k * 15, 50, 2, 9, fg);
      R(g, x + 10 + k * 15, 56, 8, 1, fg);
    }
  }
  // 竖招牌
  O(g, 238, 70, 14, 60, '#f6eeda', P.white, P.creamD);
  for (let k = 0; k < 4; k++) R(g, 242, 76 + k * 13, 6, 8, P.red);
  // 吊灯
  for (const x of [68, 208, 348]) {
    R(g, x, 30, 1, 52, INK);
    O(g, x - 7, 82, 15, 6, P.woodD);
    ooval(g, x, 92, 6, 5, '#ffe7a0');
    g.fillStyle = 'rgba(255,220,140,0.15)';
    g.fillRect(x - 24, 92, 49, 70);
  }
  lantern(g, 450, 74);
  // 廊下地面：花砖
  R(g, 0, 210, 480, 60, '#c9b48e');
  for (let y = 210; y < 270; y += 12)
    for (let x = (y / 12) % 2 ? 0 : 12; x < 480; x += 24) {
      O(g, x, y, 12, 12, '#b5432f', P.redL);
      R(g, x + 5, y + 5, 2, 2, P.goldL);
    }
  R(g, 0, 210, 480, 2, INK);
  // 店前货架：馅饼盒与花生汤
  O(g, 140, 172, 80, 38, P.wood, P.woodL, P.woodD);
  for (let k = 0; k < 4; k++) {
    O(g, 146 + k * 18, 160, 16, 12, '#e2a63b', P.goldL);
    R(g, 150 + k * 18, 164, 8, 2, P.red);
  }
  for (let k = 0; k < 3; k++) {
    O(g, 146 + k * 24, 184, 20, 10, P.cream, P.white);
    R(g, 148 + k * 24, 186, 16, 2, '#d4a96a');
  }
  // 墙脚砖
  bricks(g, 0, 200, 480, 10, '#c78a5a', '#a86e46', '#7a4a2c', 10, 5);
  ooval(g, 420, 200, 10, 4, '#3f86a8');
  shade(g, 0, 0, 480, 18, 0.15);
}
