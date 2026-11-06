/** 科普插图：中山路 + 鼓浪屿 */
import { P, INK, R, O, ooval, oval, tri, steam, bands, ridge, rng } from './kit';
import { KaDraw, tableBg, outdoorBg } from './ka_base';

/** 沙茶面 */
const shacha: KaDraw = (g) => {
  tableBg(g);
  ooval(g, 100, 78, 60, 20, P.white);
  ooval(g, 100, 68, 52, 12, '#b86a2e');
  oval(g, 100, 66, 44, 8, '#d9954a');
  const r = rng(3);
  for (let i = 0; i < 26; i++) R(g, 66 + r() * 60, 61 + r() * 10, 10, 1, '#f1dca0');
  ooval(g, 84, 64, 8, 5, '#e46a4a');
  R(g, 80, 62, 6, 1, '#f7a07c');
  ooval(g, 118, 64, 8, 5, P.white);
  oval(g, 118, 64, 3, 3, P.yellow);
  for (let i = 0; i < 6; i++) R(g, 96 + i * 3, 60, 2, 1, P.leafL);
  O(g, 150, 38, 3, 46, P.woodL, P.goldL);
  O(g, 158, 40, 3, 46, P.woodL, P.goldL);
  for (let i = 0; i < 3; i++) steam(g, 80 + i * 18, 54, 28, i * 3);
};

/** 骑楼：拱廊 + 店招 */
const qilou: KaDraw = (g) => {
  outdoorBg(g, ['#9fd0ea', '#cfe6ee'], '#c9b48e', 96);
  O(g, 10, 12, 180, 84, '#e8c88c', '#f6e2b8', '#c99a5a');
  O(g, 6, 4, 188, 9, '#c99a5a', '#e0b878', '#a87a40');
  for (let x = 12; x < 190; x += 10) R(g, x, 6, 5, 5, '#b5834a');
  for (let i = 0; i < 3; i++) {
    const x = 22 + i * 54;
    ooval(g, x + 20, 54, 20, 18, '#6a4630');
    R(g, x - 1, 54, 42, 42, INK);
    R(g, x, 54, 40, 42, '#6a4630');
    O(g, x + 6, 22, 28, 12, [P.red, '#2f5d4a', '#1f3f6a'][i]);
    R(g, x + 10, 27, 20, 2, P.goldL);
    R(g, x + 6, 70, 28, 26, '#b98a5e');
    O(g, x + 12, 76, 8, 12, '#f6dfa6');
    O(g, x + 22, 76, 8, 12, '#f6dfa6');
  }
  for (const x of [10, 64, 118, 172]) O(g, x, 12, 18, 84, '#f3e3bc', P.white, '#c9a873');
};

/** 花生汤配油条 */
const peanut: KaDraw = (g) => {
  tableBg(g);
  ooval(g, 100, 78, 50, 18, '#4f86a8');
  ooval(g, 100, 68, 44, 11, '#f3e6c4');
  oval(g, 100, 67, 36, 7, '#ead9b0');
  const r = rng(21);
  for (let i = 0; i < 14; i++) ooval(g, 74 + r() * 52, 62 + r() * 10, 3, 2, '#c9884a');
  O(g, 138, 36, 6, 34, P.greyL, P.white);
  ooval(g, 141, 72, 6, 3, P.greyL);
  O(g, 18, 70, 40, 8, '#d99a3a', P.goldL, '#a8702a');
  O(g, 22, 78, 40, 8, '#c98a2c', P.goldL, '#8a5a1e');
  for (let i = 0; i < 3; i++) steam(g, 84 + i * 16, 54, 26, i * 2);
};

/** 馅饼：整个与切开 */
const pia: KaDraw = (g) => {
  tableBg(g);
  O(g, 14, 76, 172, 8, '#e8d3a0', P.white, P.creamD);
  const r = rng(14);
  for (const x of [48, 100, 152]) {
    ooval(g, x, 60, 24, 14, '#d9a441');
    oval(g, x - 6, 55, 10, 4, P.goldL);
    if (x === 152) {
      oval(g, x, 60, 16, 7, '#5a2e18');
      oval(g, x - 4, 58, 6, 2, '#8a4a2a');
    } else {
      for (let i = 0; i < 12; i++) R(g, x - 16 + r() * 32, 52 + r() * 14, 2, 1, P.cream);
    }
  }
  O(g, 80, 30, 40, 14, P.red, P.redL, P.redD);
  R(g, 88, 36, 24, 2, P.goldL);
};

/** 钢琴 */
const piano: KaDraw = (g) => {
  tableBg(g, ['#f3e0e6', '#efd2de', '#e6c0d0'], 90);
  O(g, 40, 22, 120, 56, '#2b2622', '#4a403a', '#1a1612');
  O(g, 46, 12, 108, 10, '#3a332e', '#5a504a');
  O(g, 78, 26, 44, 26, P.white, undefined, P.creamD);
  for (let k = 0; k < 4; k++) R(g, 82, 31 + k * 5, 36, 1, INK);
  for (let k = 0; k < 8; k++) R(g, 86 + k * 4, 29 + (k % 3) * 5, 2, 2, INK);
  O(g, 34, 62, 132, 14, '#3a332e');
  for (let k = 0; k < 18; k++) R(g, 37 + k * 7, 65, 6, 10, P.white);
  for (let k = 0; k < 18; k++) if (k % 7 !== 2 && k % 7 !== 6) R(g, 41 + k * 7, 65, 4, 6, INK);
  O(g, 40, 76, 8, 28, '#2b2622');
  O(g, 152, 76, 8, 28, '#2b2622');
  O(g, 84, 88, 32, 8, P.wood, P.woodL, P.woodD);
};

/** 万国建筑·洋楼 */
const villa: KaDraw = (g) => {
  outdoorBg(g, ['#9fd0ea', '#c8e6ee', '#eef0d8'], '#c9b48e', 94);
  O(g, 36, 32, 128, 62, '#f1e3c6', P.white, '#cdb994');
  tri(g, 100, 8, 72, 24, INK);
  tri(g, 100, 9, 70, 22, '#d47a5a');
  ooval(g, 100, 24, 5, 5, '#6fb0cc');
  for (const y of [38, 64]) for (const x of [46, 70, 122, 146]) {
    ooval(g, x + 7, y, 7, 5, '#e9f2f0');
    O(g, x, y, 14, 18, '#4e7f8a', '#8fbcc4');
    R(g, x + 6, y, 2, 18, P.white);
  }
  O(g, 36, 58, 128, 4, P.cream, P.white);
  O(g, 90, 72, 20, 22, '#7a4a2c', P.woodL, P.woodD);
  ooval(g, 24, 80, 20, 14, P.leafD);
  for (let i = 0; i < 20; i++) R(g, 8 + ((i * 7) % 34), 72 + ((i * 5) % 18), 3, 2, i % 2 ? P.pink : P.pinkL);
};

/** 三角梅 */
const bougain: KaDraw = (g) => {
  outdoorBg(g, ['#9fd0ea', '#d6ecee'], '#c9b48e', 96);
  O(g, 10, 20, 180, 76, '#f1e3c6', P.white, '#cdb994');
  const r = rng(8);
  ooval(g, 100, 52, 84, 38, P.leafD);
  for (let i = 0; i < 260; i++) {
    const a = r() * 6.283;
    const d = Math.sqrt(r());
    const c = r() < 0.2 ? P.leaf : r() < 0.6 ? P.pink : r() < 0.85 ? P.pinkL : P.pinkD;
    R(g, 100 + Math.cos(a) * 84 * d, 52 + Math.sin(a) * 38 * d, 3, 2, c);
  }
  R(g, 96, 70, 8, 18, P.woodD);
  O(g, 84, 86, 32, 12, '#c0533a', P.redL, '#8e3424');
};

/** 日光岩 */
const sunrock: KaDraw = (g) => {
  bands(g, 0, 0, 200, 70, ['#9fd0ea', '#bfe0ee', '#e2f0f0']);
  R(g, 0, 70, 200, 50, P.sea);
  const r = rng(6);
  for (let i = 0; i < 24; i++) R(g, r() * 200, 72 + r() * 46, 5 + r() * 8, 1, P.seaL);
  ridge(g, 0, 200, 120, (x) => 64 + Math.pow(Math.abs(x - 100) / 100, 2) * 46, '#5f8a62');
  for (let i = 0; i < 30; i++) ooval(g, 20 + r() * 160, 90 + r() * 24, 3, 2, i % 2 ? P.leaf : P.leafD);
  ooval(g, 100, 44, 32, 22, P.stone);
  O(g, 74, 36, 52, 28, P.stone, P.stoneL, P.stoneD);
  O(g, 112, 22, 22, 20, P.stoneL, P.white, P.stone);
  for (let k = 0; k < 4; k++) R(g, 106, 40 + k * 6, 5, 4, P.red);
  O(g, 52, 62, 24, 16, P.stoneD, P.stone);
  O(g, 132, 66, 22, 14, P.stoneD, P.stone);
};

export const KA_B: Record<string, KaDraw> = { shacha, qilou, peanut, pia, piano, villa, bougain, sunrock };
