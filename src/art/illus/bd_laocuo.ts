/** 对话背景：外妈老厝·红砖大厝厅堂内景 */
import { G, P, INK, R, O, bands, bricks, ooval, lantern, steam, shade } from './kit';

/** 透光花窗 + 斜射光柱 */
function flowerWindow(g: G, x: number, y: number, w: number, h: number, dir: number): void {
  O(g, x - 5, y - 5, w + 10, h + 10, P.woodL, P.gold, P.woodD);
  R(g, x, y, w, h, '#fff1c8');
  for (let i = 0; i <= w - 2; i += 7) R(g, x + i, y, 2, h, P.wood);
  for (let j = 0; j <= h - 2; j += 7) R(g, x, y + j, w, 2, P.wood);
  ooval(g, x + w / 2, y + h / 2, 11, 11, P.redD);
  ooval(g, x + w / 2, y + h / 2, 5, 5, P.gold);
  g.fillStyle = 'rgba(255,236,180,0.14)';
  for (let r = 0; r < 110; r++) g.fillRect(Math.round(x + r * dir * 0.7), y + h + 5 + r, w, 1);
}

export function drawLaocuo(g: G): void {
  // 屋架梁木
  R(g, 0, 0, 480, 42, P.woodD);
  for (let i = 0; i < 5; i++) R(g, 0, 3 + i * 8, 480, 4, i % 2 ? P.wood : P.woodL);
  for (let x = 24; x < 480; x += 96) O(g, x, 0, 12, 42, P.wood, P.woodL, P.woodD);
  R(g, 0, 40, 480, 2, INK);
  // 白灰墙 + 腰线石 + 红砖墙裙
  bands(g, 0, 42, 480, 112, ['#efe3c8', '#e6d6b4', '#dcc89f']);
  bricks(g, 0, 156, 480, 46, P.brick, P.brickD, '#6a2a1e');
  R(g, 0, 152, 480, 4, P.stoneL);
  R(g, 0, 151, 480, 1, INK);
  R(g, 0, 156, 480, 1, INK);
  // 红地砖
  R(g, 0, 202, 480, 68, '#a9442f');
  for (let y = 202, k = 0; y < 270; y += 11, k++) {
    R(g, 0, y, 480, 1, '#6e281c');
    for (let x = (k % 2) * 12; x < 480; x += 24) {
      R(g, x, y + 1, 1, 10, '#6e281c');
      R(g, x + 1, y + 1, 22, 1, '#c25a3e');
    }
  }
  // 花窗
  flowerWindow(g, 38, 66, 70, 58, 1);
  flowerWindow(g, 372, 66, 70, 58, -1);
  // 对联
  for (const cx of [148, 318]) {
    O(g, cx, 56, 14, 90, P.red, P.redL, P.redD);
    for (let k = 0; k < 6; k++) {
      R(g, cx + 4, 64 + k * 13, 6, 2, P.gold);
      R(g, cx + 6, 62 + k * 13, 2, 8, P.gold);
    }
  }
  // 神龛
  O(g, 172, 48, 136, 104, P.wood, P.woodL, P.woodD);
  R(g, 168, 42, 144, 12, INK);
  R(g, 169, 43, 142, 10, P.red);
  R(g, 169, 43, 142, 2, P.redL);
  for (let x = 174; x < 306; x += 8) R(g, x, 47, 4, 4, P.gold);
  R(g, 186, 60, 108, 74, '#2e1a12');
  g.fillStyle = 'rgba(255,190,110,0.16)';
  g.fillRect(186, 96, 108, 38);
  for (let x = 186; x < 294; x += 6) R(g, x, 60, 6, 6 + ((x / 6) % 2) * 3, P.redD);
  R(g, 186, 60, 108, 2, P.gold);
  for (const [tx, th] of [[206, 50], [233, 60], [260, 50]]) {
    O(g, tx, 130 - th, 14, th, P.redD, P.red);
    R(g, tx + 6, 136 - th, 2, th - 14, P.gold);
    O(g, tx - 3, 127, 20, 6, P.gold, P.goldL);
  }
  R(g, 176, 136, 128, 14, P.woodD);
  for (let x = 180; x < 300; x += 10) { R(g, x, 139, 6, 2, P.gold); R(g, x + 2, 141, 2, 6, P.gold); }
  // 八仙桌
  O(g, 128, 158, 224, 9, P.woodL, '#b27a48', P.woodD);
  O(g, 138, 166, 204, 10, P.wood, undefined, P.woodD);
  for (let x = 150; x < 330; x += 16) R(g, x, 169, 8, 4, P.woodD);
  for (const lx of [140, 332]) O(g, lx, 175, 8, 50, P.wood, P.woodL);
  // 烛台
  for (const cx of [154, 326]) {
    O(g, cx - 5, 150, 11, 8, P.gold, P.goldL);
    O(g, cx - 2, 126, 6, 25, P.red, P.redL);
    ooval(g, cx + 1, 121, 2, 4, P.goldL);
    R(g, cx + 1, 119, 1, 3, P.white);
    g.fillStyle = 'rgba(255,210,120,0.18)';
    g.fillRect(cx - 10, 110, 22, 22);
  }
  // 香炉
  ooval(g, 240, 150, 13, 7, '#8a6a2c');
  R(g, 228, 143, 25, 3, P.gold);
  R(g, 230, 156, 3, 3, INK);
  R(g, 247, 156, 3, 3, INK);
  for (const sx of [236, 240, 244]) {
    R(g, sx, 128, 1, 15, '#c9573a');
    R(g, sx, 127, 1, 1, P.goldL);
    steam(g, sx, 125, 34, sx);
  }
  // 功夫茶具
  O(g, 266, 152, 58, 7, '#5a3a26', '#7a5236');
  ooval(g, 280, 145, 8, 6, '#7a3f2e');
  R(g, 276, 141, 4, 2, '#9a5a44');
  R(g, 279, 137, 3, 3, INK);
  R(g, 288, 143, 5, 2, INK);
  R(g, 270, 143, 2, 5, INK);
  for (const cx of [300, 310, 318]) { ooval(g, cx, 149, 3, 2, P.white); R(g, cx - 1, 148, 2, 1, '#c99a2e'); }
  steam(g, 300, 145, 16, 3);
  // 灯笼
  lantern(g, 120, 46);
  lantern(g, 360, 46);
  // 暗角
  shade(g, 0, 42, 22, 160, 0.18);
  shade(g, 458, 42, 22, 160, 0.18);
}
