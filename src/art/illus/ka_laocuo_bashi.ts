/** 科普插图：外妈老厝 + 八市 */
import { P, INK, R, O, ooval, oval, bricks, steam, tiles, rng } from './kit';
import { KaDraw, tableBg, outdoorBg } from './ka_base';

/** 功夫茶：茶盘、紫砂壶、三杯 */
const tea: KaDraw = (g) => {
  tableBg(g);
  O(g, 30, 74, 140, 12, '#5a3a26', '#7a5236', '#3a2416');
  for (let x = 36; x < 166; x += 6) R(g, x, 76, 3, 1, '#3a2416');
  ooval(g, 70, 58, 18, 14, '#7a3f2e');
  R(g, 62, 50, 8, 4, '#9a5a44');
  O(g, 66, 40, 9, 6, '#6a3424');
  O(g, 86, 52, 14, 5, '#6a3424');
  O(g, 44, 50, 6, 14, '#6a3424');
  steam(g, 92, 50, 22, 2);
  for (const cx of [116, 136, 156]) {
    ooval(g, cx, 68, 7, 5, P.white);
    oval(g, cx, 65, 5, 1, '#c99a2e');
    steam(g, cx, 62, 14, cx);
  }
};

/** 出砖入石墙 */
const wall: KaDraw = (g) => {
  outdoorBg(g, ['#9fd0ea', '#cfe6ee'], P.stoneD, 100);
  const r = rng(11);
  R(g, 14, 10, 172, 90, INK);
  bricks(g, 15, 11, 170, 88, P.brick, P.brickD, '#6a2a1e', 10, 5);
  for (let i = 0; i < 16; i++) {
    const x = 18 + Math.floor(r() * 150), y = 14 + Math.floor(r() * 70);
    const w = 10 + Math.floor(r() * 14), h = 8 + Math.floor(r() * 8);
    O(g, x, y, w, h, ['#b9ae9a', '#a39784', '#d4cbb6'][i % 3], P.stoneL, P.stoneD);
  }
  tiles(g, 8, 2, 184, 10, '#8e3424', '#6a2a1e');
};

/** 古井 */
const well: KaDraw = (g) => {
  outdoorBg(g, ['#f3e2b8', '#ecd29a'], '#b9ae9a', 90);
  ooval(g, 100, 96, 46, 10, '#5e5446');
  O(g, 56, 62, 88, 34, P.stone, P.stoneL, P.stoneD);
  for (let x = 58; x < 144; x += 14) R(g, x, 63, 1, 32, P.stoneD);
  ooval(g, 100, 62, 42, 8, P.stoneL);
  oval(g, 100, 62, 34, 5, '#2c4a5a');
  oval(g, 92, 61, 8, 1, '#6fb0cc');
  for (const x of [60, 136]) O(g, x, 18, 6, 46, P.wood, P.woodL);
  O(g, 56, 14, 88, 7, P.woodD, P.wood);
  R(g, 100, 21, 1, 30, INK);
  O(g, 93, 48, 15, 12, '#7a4a2c', P.woodL, P.woodD);
  R(g, 94, 52, 13, 1, INK);
};

/** 菜脯（萝卜干）晒在竹匾 */
const caipo: KaDraw = (g) => {
  outdoorBg(g, ['#9fd0ea', '#d6ecee', '#f3eccf'], '#c9bfa8', 80);
  ooval(g, 100, 84, 78, 22, P.woodD);
  ooval(g, 100, 84, 74, 19, '#c99a5a');
  for (let k = -16; k <= 16; k += 4) oval(g, 100, 84 + k, 70 - Math.abs(k) * 2, 0, '#a87a42');
  const r = rng(5);
  for (let i = 0; i < 18; i++) {
    const x = 50 + r() * 96, y = 72 + r() * 22;
    O(g, x, y, 14, 5, i % 3 ? '#c9884a' : '#a86a34', '#e0a866');
  }
  O(g, 160, 30, 26, 34, '#8a6a4a', '#a8865c', '#5e4a30');
  R(g, 162, 26, 22, 4, INK);
  R(g, 166, 40, 14, 10, P.red);
  R(g, 170, 42, 6, 6, P.gold);
};

/** 土笋冻：碟中透明冻块 + 酱料 */
const tusundong: KaDraw = (g) => {
  tableBg(g, ['#d8eef0', '#c6e2e8', '#b4d4dc']);
  ooval(g, 100, 82, 66, 14, P.white);
  oval(g, 100, 80, 58, 10, P.creamD);
  for (const [x, y] of [[66, 66], [96, 62], [126, 66], [80, 76], [112, 76]]) {
    ooval(g, x, y, 13, 9, '#d8d2b8');
    oval(g, x - 3, y - 3, 5, 2, '#f2eedc');
    for (let k = 0; k < 4; k++) R(g, x - 6 + k * 4, y - 2 + (k % 2) * 3, 2, 1, '#8a7f6d');
  }
  ooval(g, 168, 82, 16, 7, P.white);
  oval(g, 168, 80, 12, 4, '#b5432f');
  O(g, 22, 70, 22, 14, '#e2d3b0');
  oval(g, 33, 72, 8, 2, '#4f8a3c');
};

/** 海蛎煎 */
const oyster: KaDraw = (g) => {
  tableBg(g, ['#f6dcb0', '#efc890']);
  ooval(g, 100, 74, 72, 22, '#3a3a3e');
  ooval(g, 100, 72, 62, 17, '#e0a656');
  const r = rng(9);
  for (let i = 0; i < 16; i++) ooval(g, 52 + r() * 96, 62 + r() * 18, 4, 3, '#b8b4a8');
  for (let i = 0; i < 18; i++) R(g, 50 + r() * 100, 60 + r() * 22, 3, 2, P.leafL);
  for (let i = 0; i < 6; i++) R(g, 60 + r() * 80, 64 + r() * 14, 6, 3, '#f3d27a');
  R(g, 168, 66, 26, 4, P.greyD);
  steam(g, 80, 54, 24, 1);
  steam(g, 120, 54, 24, 4);
};

/** 鱼鳞：鱼摊上的大鱼与刮鳞刀 */
const scale: KaDraw = (g) => {
  tableBg(g, ['#cfe3e8', '#b8d4dc'], 76);
  O(g, 10, 72, 180, 12, P.greyL, P.white, P.grey);
  ooval(g, 96, 60, 56, 16, '#9aa8b4');
  oval(g, 96, 66, 50, 8, '#d8e2e8');
  for (let y = 50; y < 70; y += 4) for (let x = 54 + (y % 8); x < 140; x += 8) R(g, x, y, 3, 1, '#6f7e8a');
  ooval(g, 52, 58, 4, 4, P.white);
  R(g, 51, 57, 2, 2, INK);
  for (let k = 0; k < 14; k++) R(g, 152 + k, 60 - k, 2, 2 + k * 2, INK);
  for (let k = 0; k < 12; k++) R(g, 153 + k, 61 - k, 1, k * 2, '#6f7e8a');
  O(g, 140, 24, 30, 8, P.greyL, P.white);
  O(g, 168, 22, 22, 12, P.woodD, P.wood);
  for (let i = 0; i < 10; i++) R(g, 120 + i * 6, 36 + (i % 3) * 3, 2, 2, '#e8f0f4');
};

/** 鱼丸汤 */
const fishball: KaDraw = (g) => {
  tableBg(g);
  ooval(g, 100, 74, 54, 20, P.white);
  ooval(g, 100, 66, 46, 12, '#e8d6a8');
  for (const [x, y] of [[78, 64], [96, 60], [116, 64], [88, 70], [108, 70], [126, 69]]) {
    ooval(g, x, y, 7, 6, '#f6f0e2');
    R(g, x - 3, y - 3, 3, 2, P.white);
  }
  for (let i = 0; i < 10; i++) R(g, 70 + i * 6, 58 + (i % 3) * 5, 2, 2, P.leafL);
  O(g, 140, 46, 46, 6, P.white, undefined, P.creamD);
  ooval(g, 144, 49, 6, 4, P.white);
  for (let i = 0; i < 3; i++) steam(g, 84 + i * 16, 52, 30, i * 3);
};

export const KA_A: Record<string, KaDraw> = { tea, wall, well, caipo, tusundong, oyster, scale, fishball };
