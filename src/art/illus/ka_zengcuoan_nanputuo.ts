/** 科普插图：曾厝垵 + 南普陀 */
import { P, INK, R, O, ooval, oval, disc, tri, trap, bands, bricks, steam, ridge, rng } from './kit';
import { KaDraw, tableBg, outdoorBg } from './ka_base';

/** 烧肉粽：竹叶三角粽 + 蒸笼 */
const zongzi: KaDraw = (g) => {
  tableBg(g, ['#f6e2b8', '#efd3a0', '#e6c48c'], 80);
  O(g, 88, 60, 104, 36, '#d9b076', '#f0d3a0', '#a87a40');
  for (let x = 92; x < 190; x += 7) R(g, x, 62, 2, 32, '#c49a62');
  O(g, 84, 56, 112, 7, '#e8c88c', P.cream);
  tri(g, 140, 20, 33, 38, INK);
  tri(g, 140, 21, 31, 36, '#335f2a');
  tri(g, 140, 24, 25, 30, '#4f8a3c');
  tri(g, 140, 28, 17, 22, '#79b24f');
  R(g, 108, 42, 65, 1, P.gold);
  R(g, 116, 50, 49, 1, P.goldL);
  R(g, 139, 21, 1, 24, P.gold);
  for (let i = 0; i < 3; i++) steam(g, 116 + i * 22, 18, 14, i * 4);
  O(g, 10, 72, 46, 13, '#4f8a3c', '#79b24f', '#335f2a');
  O(g, 18, 83, 42, 10, '#6aa04a', '#79b24f', '#335f2a');
};

/** 石敢当：红字石碑 */
const shigandang: KaDraw = (g) => {
  outdoorBg(g, ['#a8d6ea', '#cbe6ee', '#eef0d8'], '#c9b48e', 88);
  bricks(g, 0, 46, 200, 44, '#c9b48e', '#bca680', '#8a7f6d', 12, 6);
  R(g, 0, 88, 200, 2, INK);
  // 碑座与碑身
  O(g, 62, 82, 76, 14, '#a89d8a', '#c4bba6', '#7d7361');
  O(g, 74, 18, 52, 66, '#b9ae9a', '#d4cbb6', '#8a7f6d');
  oval(g, 100, 19, 25, 6, '#d4cbb6');
  R(g, 74, 17, 52, 2, INK);
  g.fillStyle = P.red;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'bold 17px "Songti SC","SimSun",serif';
  g.fillText('石', 100, 36);
  g.fillText('敢', 100, 54);
  g.fillText('当', 100, 72);
  O(g, 158, 74, 26, 16, '#8a7f6d', '#b9ae9a', '#6b6253');
  for (let i = 0; i < 3; i++) R(g, 162 + i * 5, 64, 1, 10, P.woodD);
  steam(g, 168, 60, 12, 2, 'rgba(255,255,255,0.5)');
};

/** 王船：送王船彩船 */
const wangchuan: KaDraw = (g) => {
  bands(g, 0, 0, 200, 66, ['#f0c98b', '#f6dcb0', '#fbeccd']);
  R(g, 0, 66, 200, 54, P.sea);
  R(g, 0, 66, 200, 2, P.seaL);
  for (let i = 0; i < 20; i++) R(g, (i * 41) % 200, 72 + ((i * 17) % 40), 9, 1, P.seaL);
  trap(g, 100, 56, 63, 33, 18, INK);
  trap(g, 100, 57, 61, 31, 16, '#b5432f');
  trap(g, 100, 57, 61, 31, 4, P.gold);
  R(g, 68, 62, 64, 2, P.goldL);
  for (let i = 0; i < 6; i++) R(g, 66 + i * 11, 67, 9, 3, i % 2 ? P.cream : P.redL);
  // 船舱与桅杆
  O(g, 82, 40, 36, 18, '#e8c88c', '#f6e2b8', '#c99a5a');
  for (let i = 0; i < 4; i++) R(g, 84 + i * 9, 42, 2, 14, '#c99a5a');
  R(g, 96, 4, 2, 38, INK);
  tri(g, 96, 8, 12, 16, P.red);
  tri(g, 98, 8, 11, 15, P.goldL);
  for (const [x, c] of [[74, P.leaf], [86, P.gold], [108, P.pink], [120, P.sea]] as [number, string][]) {
    R(g, x, 22, 6, 1, INK);
    O(g, x - 3, 22, 8, 8, c, P.cream);
  }
};

/** 姜母鸭：砂锅 */
const gingerduck: KaDraw = (g) => {
  tableBg(g, ['#f6e2b8', '#efd3a0', '#e6c48c'], 80);
  ooval(g, 100, 88, 58, 10, 'rgba(43,29,22,0.22)');
  ooval(g, 100, 72, 48, 22, INK);
  ooval(g, 100, 71, 46, 20, '#a8552e');
  ooval(g, 100, 62, 44, 12, '#c4734a');
  oval(g, 100, 61, 38, 8, '#6f3418');
  for (const [x, y] of [[86, 60], [102, 63], [116, 59], [94, 66], [110, 67]]) {
    ooval(g, x, y, 9, 5, '#b8722e');
    R(g, x - 6, y - 2, 6, 1, '#d99a3a');
  }
  for (const [x, y] of [[78, 64], [124, 64], [100, 68]]) O(g, x, y, 8, 4, '#e9c24a', undefined, '#c99a2e');
  for (let i = 0; i < 3; i++) R(g, 68 + i * 3, 66, 2, 2, P.leaf);
  O(g, 96, 54, 8, 4, '#e8c88c');
  for (let i = 0; i < 3; i++) steam(g, 84 + i * 16, 50, 20, i * 3);
};

/** 素饼：纸盒里一叠起酥小圆饼，盖红印 */
const supia: KaDraw = (g) => {
  tableBg(g, ['#f4e4c2', '#ecd6a8', '#e2c690'], 78);
  O(g, 22, 62, 96, 34, '#d8c49a', '#ecdcb8', '#b49c6c');
  R(g, 24, 64, 92, 6, P.red);
  for (let k = 0; k < 3; k++) R(g, 40 + k * 26, 65, 12, 4, P.goldL);
  for (let i = 0; i < 4; i++) {
    const x = 36 + i * 22;
    ooval(g, x, 82, 10, 6, '#e9c88a');
    oval(g, x, 80, 9, 4, '#f6e2b0');
    R(g, x - 2, 79, 4, 3, P.red);
  }
  for (let k = 0; k < 4; k++) {
    const y = 84 - k * 9;
    ooval(g, 150, y, 20, 6, k % 2 ? '#e2bb78' : '#e9c88a');
    oval(g, 150, y - 2, 18, 3, '#f6e2b0');
  }
  R(g, 146, 55, 8, 5, P.red);
  R(g, 148, 56, 4, 3, P.goldL);
  ooval(g, 112, 104, 12, 5, '#e9c88a');
  for (let k = 0; k < 4; k++) R(g, 102, 101 + k * 2, 20, 1, k % 2 ? '#f6e2b0' : '#d9aa62');
  O(g, 176, 92, 14, 12, P.white, undefined, P.creamD);
  R(g, 178, 94, 10, 2, '#b07a3a');
  steam(g, 182, 88, 12, 2);
};

/** 香炉与敬香：铜鼎三足，香烟袅袅 */
const censer: KaDraw = (g) => {
  bands(g, 0, 0, 200, 80, ['#ecc95a', '#e2b84a', '#d6a83e']);
  for (let x = 0; x < 200; x += 40) R(g, x, 0, 1, 80, '#c99a2e');
  R(g, 0, 80, 200, 40, '#c9bfa8');
  R(g, 0, 80, 200, 1, INK);
  for (let y = 88; y < 120; y += 8) R(g, 0, y, 200, 1, '#a99f88');
  for (const x of [14, 176]) O(g, x, 0, 10, 82, P.red, P.redL, P.redD);
  ooval(g, 100, 104, 46, 7, 'rgba(43,29,22,0.25)');
  for (const x of [72, 98, 124]) O(g, x, 88, 6, 16, '#5e4a20', '#8a6a2c');
  ooval(g, 100, 78, 38, 16, '#8a6a2c');
  oval(g, 100, 74, 34, 10, '#b08a3a');
  R(g, 70, 82, 60, 2, '#5e4a20');
  for (let k = 0; k < 4; k++) { R(g, 80 + k * 12, 76, 6, 2, P.goldL); R(g, 82 + k * 12, 74, 2, 6, P.goldL); }
  for (const x of [56, 138]) O(g, x, 56, 6, 14, '#8a6a2c', P.gold);
  R(g, 60, 60, 80, 6, INK);
  R(g, 61, 61, 78, 4, P.gold);
  oval(g, 100, 60, 36, 3, '#6a5a3a');
  for (let i = 0; i < 9; i++) {
    const sx = 76 + i * 6;
    R(g, sx, 40, 1, 20, '#c9573a');
    R(g, sx, 39, 1, 1, '#ffd36b');
    steam(g, sx, 37, 34, sx, 'rgba(250,250,245,0.55)');
  }
  for (let k = 0; k < 3; k++) O(g, 150 + k * 6, 96 - k * 2, 18, 8, P.yellow, P.goldL);
};

/** 放生池：荷叶田田，红鲤与乌龟 */
const lotus: KaDraw = (g) => {
  bands(g, 0, 0, 200, 36, ['#bfe0ee', '#d4e9ee', '#e9eedc']);
  ridge(g, 0, 200, 36, (x) => 18 + Math.sin(x / 22) * 6, '#7f9e86');
  R(g, 0, 32, 200, 4, P.stoneL);
  for (let x = 4; x < 200; x += 20) O(g, x, 28, 6, 14, P.stoneL, P.white, P.stone);
  R(g, 0, 36, 200, 2, INK);
  bands(g, 0, 38, 200, 82, ['#5e9a8a', '#4f8a7c', '#3f7a6e']);
  const r = rng(91);
  for (let i = 0; i < 26; i++) R(g, r() * 200, 42 + r() * 76, 6 + r() * 8, 1, 'rgba(255,255,255,0.25)');
  for (const [x, y, s] of [[30, 70, 14], [64, 98, 12], [150, 60, 13], [178, 96, 10], [110, 108, 9]] as [number, number, number][]) {
    ooval(g, x, y, s, Math.round(s * 0.5), P.leafD);
    oval(g, x - 2, y - 1, s - 3, Math.round(s * 0.35), P.leaf);
    R(g, x, y - 1, Math.round(s * 0.6), 1, P.leafD);
  }
  for (const [x, y] of [[44, 50], [140, 40]] as [number, number][]) {
    R(g, x, y + 6, 1, 18, P.leafD);
    tri(g, x, y - 6, 6, 12, INK);
    tri(g, x, y - 5, 5, 10, P.pinkL);
    tri(g, x - 4, y - 1, 3, 6, P.pink);
    tri(g, x + 4, y - 1, 3, 6, P.pink);
    R(g, x, y + 2, 1, 2, P.goldL);
  }
  for (const [x, y, c] of [[92, 66, '#e0602f'], [118, 82, '#f3cf6e'], [80, 86, '#e0602f']] as [number, number, string][]) {
    ooval(g, x, y, 7, 3, c);
    tri(g, x + 9, y - 3, 3, 6, c);
    R(g, x - 5, y - 1, 1, 1, INK);
  }
  O(g, 160, 76, 30, 8, P.stone, P.stoneL, P.stoneD);
  ooval(g, 174, 72, 8, 4, '#5f6a3a');
  R(g, 170, 70, 3, 2, '#7f8a4a');
  R(g, 176, 70, 3, 2, '#7f8a4a');
  ooval(g, 184, 73, 2, 2, '#7f8a4a');
};

/** 「佛」字石刻：五老峰下的巨石 */
const fostone: KaDraw = (g) => {
  outdoorBg(g, ['#bfe0ee', '#d4e9ee', '#e9eedc'], '#c9bfa8', 96);
  ridge(g, 0, 200, 96, (x) => 40 + Math.sin(x / 30) * 12 + Math.sin(x / 9) * 3, '#7f9e86');
  ridge(g, 0, 200, 96, (x) => 62 + Math.sin(x / 21 + 1) * 6, '#5f8a62');
  const r = rng(17);
  for (let i = 0; i < 24; i++) disc(g, r() * 200, 70 + r() * 22, 3, '#4f7a52');
  ooval(g, 100, 70, 50, 32, '#a89d8a');
  oval(g, 98, 66, 48, 28, '#c4bba6');
  oval(g, 82, 52, 24, 12, '#d4cbb6');
  oval(g, 124, 88, 22, 8, '#8a7f6d');
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'bold 38px "Kaiti SC","KaiTi","STKaiti",serif';
  g.fillText('佛', 101, 69);
  g.fillStyle = P.red;
  g.fillText('佛', 100, 68);
  for (let k = 0; k < 4; k++) R(g, 136, 52 + k * 6, 3, 4, P.red);
  for (let k = 0; k < 3; k++) O(g, 60 - k * 10, 100 + k * 6, 80 + k * 20, 6, P.stoneL, P.white, P.stone);
  for (let i = 0; i < 4; i++) {
    const x = 22 + i * 54;
    R(g, x, 104, 1, 10, INK);
    R(g, x - 1, 102, 3, 2, P.gold);
  }
};

export const KA_C: Record<string, KaDraw> = { zongzi, shigandang, wangchuan, gingerduck, supia, censer, lotus, fostone };
