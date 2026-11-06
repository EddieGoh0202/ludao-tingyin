/** 对话背景：八市·鱼摊近景 */
import { G, P, INK, R, O, bands, ooval, oval, tri, shade, rng } from './kit';

function fish(g: G, x: number, y: number, len: number, body: string, belly: string, flip: boolean): void {
  const d = flip ? -1 : 1;
  ooval(g, x, y, len, 4, body);
  R(g, x - len + 2, y + 1, len * 2 - 4, 2, belly);
  const tx = x - d * (len + 2);
  R(g, tx - 2, y - 4, 5, 9, INK);
  R(g, tx - 1, y - 3, 3, 7, body);
  R(g, x + d * (len - 4), y - 1, 2, 2, INK);
  R(g, x + d * (len - 4), y - 2, 1, 1, P.white);
}

function basin(g: G, cx: number, y: number, c: string, cd: string): void {
  R(g, cx - 30, y, 61, 4, INK);
  R(g, cx - 29, y + 1, 59, 2, c);
  for (let i = 0; i < 18; i++) {
    const w = 28 - Math.round(i / 3);
    R(g, cx - w - 1, y + 4 + i, w * 2 + 3, 1, INK);
    R(g, cx - w, y + 4 + i, w * 2 + 1, 1, i < 3 ? c : cd);
  }
}

function umbrella(g: G, cx: number, top: number, half: number, a: string, b: string): void {
  tri(g, cx, top - 1, half + 2, 32, INK);
  for (let i = 0; i < 30; i++) {
    const w = Math.round((half * (i + 1)) / 30);
    for (let x = -w; x <= w; x++) {
      const seg = Math.floor(((x + half) / (half * 2)) * 6);
      R(g, cx + x, top + i, 1, 1, seg % 2 ? a : b);
    }
  }
  for (let x = cx - half; x < cx + half; x += 8) R(g, x, top + 30, 5, 3, b);
  R(g, cx, top + 30, 2, 120, P.greyD);
}

export function drawBashi(g: G): void {
  const r = rng(77);
  // 天空与老街楼
  bands(g, 0, 0, 480, 70, ['#bfe0ea', '#d6ecef', '#eef3e6']);
  for (let i = 0; i < 6; i++) {
    const x = i * 84 - 10;
    const h = 50 + ((i * 37) % 30);
    const col = ['#d9c3a0', '#c9a98a', '#e3d2b0'][i % 3];
    O(g, x, 110 - h, 80, h + 20, col, P.white, P.stoneD);
    for (let wy = 120 - h; wy < 110; wy += 16)
      for (let wx = x + 8; wx < x + 72; wx += 18) {
        O(g, wx, wy, 10, 10, '#4c6d7c', '#86aebd');
        R(g, wx - 1, wy + 10, 12, 2, P.stoneD);
      }
  }
  // 晾衣绳
  R(g, 0, 58, 480, 1, INK);
  for (let x = 20; x < 480; x += 40) O(g, x, 59, 10, 13, ['#e07a5f', '#6fb0cc', '#f3cf6e', '#fbf6ea'][(x / 40) % 4 | 0]);
  // 遮阳伞
  umbrella(g, 110, 40, 100, P.red, P.white);
  umbrella(g, 380, 34, 110, '#2f6f9f', P.white);
  // 后排红蓝塑料盆
  basin(g, 60, 112, '#d84a3a', '#a4322a');
  basin(g, 420, 108, '#3b78b5', '#285a8c');
  oval(g, 60, 114, 26, 2, '#6fb0cc');
  for (let k = 0; k < 4; k++) R(g, 44 + k * 9, 113, 4, 1, P.white);
  ooval(g, 420, 111, 18, 3, '#2f2a25');
  for (let k = 0; k < 8; k++) ooval(g, 406 + k * 4, 110 + (k % 2), 2, 2, '#3a3a40');
  // 鱼摊冰台
  O(g, 70, 148, 340, 16, '#dfe9ee', P.white, '#9fb3bd');
  R(g, 66, 164, 348, 50, INK);
  R(g, 67, 165, 346, 48, '#7a8c96');
  for (let x = 72; x < 410; x += 20) R(g, x, 168, 14, 40, '#8e9fa8');
  for (let i = 0; i < 160; i++) R(g, 74 + r() * 330, 150 + r() * 12, 2, 1, 'rgba(255,255,255,0.9)');
  // 冰台上的鱼货
  const kinds: [string, string][] = [['#8fa7b5', '#dfe9ee'], ['#d97a55', '#f2c2a0'], ['#c7b58a', '#efe3c4'], ['#6e7f8c', '#cfd9de']];
  for (let k = 0; k < 11; k++) {
    const [b, be] = kinds[k % 4];
    fish(g, 96 + k * 29, 148 + (k % 2) * 6, 11 + (k % 3) * 2, b, be, k % 2 === 0);
  }
  // 虾与蟹篮
  O(g, 286, 126, 56, 22, '#c7a26a', '#e0c08a', P.woodD);
  for (let k = 0; k < 9; k++) {
    ooval(g, 294 + (k % 5) * 10, 132 + Math.floor(k / 5) * 8, 4, 2, '#e46a4a');
    R(g, 290 + (k % 5) * 10, 131 + Math.floor(k / 5) * 8, 2, 1, '#f7a07c');
  }
  O(g, 130, 124, 60, 24, '#8a6a3c', '#a88454', P.woodD);
  for (let k = 0; k < 4; k++) {
    ooval(g, 142 + k * 12, 133, 5, 4, '#4f5a3c');
    R(g, 138 + k * 12, 128, 2, 2, INK);
    R(g, 146 + k * 12, 128, 2, 2, INK);
  }
  // 价签
  for (const [x, t] of [[110, 1], [230, 2], [360, 3]] as [number, number][]) {
    R(g, x, 128, 1, 20, INK);
    O(g, x - 9, 118, 20, 12, P.yellow, P.goldL);
    for (let k = 0; k < t; k++) R(g, x - 5 + k * 5, 123, 3, 2, P.red);
  }
  // 秤与水管
  O(g, 26, 140, 34, 30, '#3f86a8', '#6fb0cc', P.seaD);
  O(g, 31, 146, 24, 10, '#cfe7c4');
  R(g, 34, 149, 18, 2, '#2b5a2a');
  O(g, 22, 136, 42, 6, P.greyL, P.white);
  // 湿地面
  R(g, 0, 214, 480, 56, '#6e6a60');
  for (let y = 214; y < 270; y += 10) R(g, 0, y, 480, 1, '#5a564e');
  for (let i = 0; i < 26; i++) oval(g, r() * 480, 222 + r() * 44, 6 + r() * 14, 1, 'rgba(160,200,215,0.45)');
  // 前景筐
  basin(g, 450, 200, '#e9c24a', '#c99a2e');
  shade(g, 0, 0, 480, 270, 0.04, '255,200,120');
}
