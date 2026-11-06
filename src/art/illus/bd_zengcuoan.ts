/** 对话背景：曾厝垵·渔村巷口傍晚 */
import { G, P, INK, R, O, bands, ooval, oval, tiles, swallowRidge, shade, rng } from './kit';

function shop(g: G, x: number, w: number, top: number, wall: string, awn: string, awn2: string): void {
  O(g, x, top, w, 196 - top, wall, '#fff3dc');
  // 二楼窗
  O(g, x + 10, top + 12, 22, 20, '#ffd98a', '#fff1c0');
  R(g, x + 20, top + 12, 2, 20, P.woodD);
  if (w > 70) O(g, x + w - 32, top + 12, 22, 20, '#ffd98a', '#fff1c0');
  // 雨篷
  for (let k = 0; k < Math.ceil(w / 10); k++) {
    R(g, x - 4 + k * 10, top + 44, 10, 12, k % 2 ? awn : awn2);
    R(g, x - 4 + k * 10, top + 56, 10, 3, k % 2 ? awn : awn2);
  }
  R(g, x - 4, top + 44, w + 8, 1, INK);
  R(g, x - 4, top + 59, w + 8, 1, INK);
  // 门面亮光
  R(g, x + 6, top + 62, w - 12, 196 - top - 62, '#ffe1a0');
  R(g, x + 6, top + 62, w - 12, 2, '#fff4d0');
  for (let k = 0; k < 3; k++) O(g, x + 10 + k * ((w - 28) / 2), 160, 10, 14, ['#e46a4a', '#6fb0cc', '#e9c24a'][k]);
}

export function drawZengcuoan(g: G): void {
  const r = rng(53);
  // 黄昏天空
  bands(g, 0, 0, 480, 120, ['#3a3260', '#5a3e70', '#a2507a', '#e07a5f', '#f3b56a']);
  for (let i = 0; i < 30; i++) R(g, r() * 480, r() * 40, 1, 1, '#fff3d0');
  ooval(g, 400, 96, 14, 14, '#ffd27a');
  // 远处海面
  R(g, 0, 108, 480, 14, '#6d5a8a');
  for (let i = 0; i < 24; i++) R(g, r() * 480, 110 + r() * 10, 6, 1, '#f3b56a');
  // 红砖古厝屋脊（背景）
  O(g, 150, 70, 180, 50, '#c0533a', '#d0603f', '#8e3424');
  tiles(g, 146, 60, 188, 12, '#8e3424', '#6a2a1e');
  swallowRidge(g, 140, 54, 200, '#7d2f25', 14);
  // 彩色小店
  shop(g, 0, 92, 74, '#e9c24a', P.white, '#3f86a8');
  shop(g, 96, 80, 92, '#6fb0cc', P.white, P.red);
  shop(g, 312, 76, 88, '#ec7aa8', P.white, '#4f8a3c');
  shop(g, 392, 90, 70, '#f0d9a8', '#e07a5f', P.white);
  // 巷子中段：石板路通向远方
  R(g, 176, 120, 136, 76, '#5a4060');
  for (let y = 124; y < 196; y += 10) R(g, 180, y, 128, 1, '#4a3450');
  O(g, 214, 128, 52, 68, '#c0533a', '#d0603f');
  O(g, 226, 150, 28, 46, '#3a2416');
  R(g, 238, 150, 2, 46, '#5a3a26');
  // 灯串
  for (let k = 0; k < 2; k++) {
    const y0 = 70 + k * 18;
    for (let x = 0; x < 480; x += 2) {
      const y = y0 + Math.round(Math.sin(((x % 160) / 160) * Math.PI) * 14);
      R(g, x, y, 2, 1, INK);
      if (x % 16 === 0) {
        R(g, x - 1, y + 1, 3, 3, ['#ffd27a', '#ff9a7a', '#a8e0ff', '#c8ffb0'][(x / 16) % 4]);
        g.fillStyle = 'rgba(255,220,140,0.18)';
        g.fillRect(x - 3, y - 1, 7, 7);
      }
    }
  }
  // 石板地
  R(g, 0, 196, 480, 74, '#8a7f6d');
  for (let y = 196, k = 0; y < 270; y += 10, k++) {
    R(g, 0, y, 480, 1, '#5e5446');
    for (let x = (k % 2) * 14; x < 480; x += 28) R(g, x, y + 1, 1, 9, '#5e5446');
  }
  for (let i = 0; i < 30; i++) oval(g, r() * 480, 206 + r() * 60, 8, 1, 'rgba(255,190,120,0.25)');
  // 石敢当
  O(g, 20, 150, 30, 46, '#a39784', P.stoneL, P.stoneD);
  R(g, 22, 150, 26, 6, '#8a7f6d');
  for (let k = 0; k < 3; k++) { R(g, 30, 160 + k * 10, 10, 2, P.red); R(g, 34, 158 + k * 10, 2, 7, P.red); }
  // 竹编灯笼与手作招牌
  O(g, 120, 140, 26, 16, P.woodL, P.gold, P.woodD);
  for (let k = 0; k < 3; k++) R(g, 125 + k * 7, 145, 4, 6, P.white);
  for (const x of [270, 440]) {
    R(g, x, 64, 1, 30, INK);
    ooval(g, x, 102, 7, 8, '#ffd27a');
    R(g, x - 7, 100, 15, 1, P.wood);
    R(g, x - 7, 104, 15, 1, P.wood);
  }
  // 前景：姜母鸭砂锅小摊
  O(g, 360, 214, 96, 30, P.woodD, P.wood);
  ooval(g, 384, 208, 14, 7, '#3a2a22');
  ooval(g, 384, 205, 11, 4, '#7a4a2c');
  ooval(g, 420, 208, 12, 6, '#3a2a22');
  for (let i = 0; i < 18; i++) {
    R(g, 384 + Math.round(Math.sin(i / 3) * 3), 200 - i, 2, 1, 'rgba(255,255,255,0.5)');
    R(g, 420 + Math.round(Math.sin(i / 3 + 1) * 3), 200 - i, 2, 1, 'rgba(255,255,255,0.45)');
  }
  shade(g, 0, 0, 480, 270, 0.08, '80,40,110');
}
