import { C, E, R, S, line, solid, steam, type PropSpec } from './base';

/** 曾厝垵 + 南普陀 的科普小物件 */
export const ZENGCUOAN_NANPUTUO: Record<string, PropSpec> = {
  // 烧肉粽：竹叶包裹，解开一角露出糯米
  zongzi: {
    w: 32,
    h: 26,
    draw(g) {
      S(g, 16, 24, 15);
      // 叶包三角
      for (let i = 0; i < 16; i++) {
        const w = 6 + i * 1.2;
        R(g, C.ink, 16 - w / 2, 6 + i, w, 1);
      }
      for (let i = 0; i < 14; i++) {
        const w = 5 + i * 1.15;
        R(g, i < 3 ? C.leafLight : i < 9 ? C.leaf : C.leafDark, 16 - w / 2, 7 + i, w, 1);
      }
      line(g, C.leafDark, 9, 12, 15, 8);
      line(g, C.leafLight, 17, 9, 22, 15);
      // 棉线
      line(g, C.cream, 6, 17, 26, 11);
      line(g, C.cream, 8, 11, 24, 18);
      // 露出的米
      E(g, C.ink, 24, 16, 5, 4);
      E(g, C.cream, 24, 16, 4, 3);
      R(g, C.woodDark, 22, 15, 2, 1);
      R(g, C.lacquer, 25, 17, 2, 1);
      steam(g, 24, 11, 4);
    },
  },
  // 石敢当：立在巷口的刻字石碑
  shigandang: {
    w: 26,
    h: 34,
    draw(g) {
      S(g, 13, 32, 11);
      solid(g, 5, 3, 16, 27, C.granite, C.graniteLight, C.graniteDark);
      R(g, C.graniteLight, 6, 4, 14, 2);
      // 刻字格
      R(g, C.graniteDark, 8, 7, 10, 1);
      for (let i = 0; i < 3; i++) {
        const y = 9 + i * 5;
        R(g, C.inkSoft, 9, y, 8, 1);
        R(g, C.inkSoft, 12, y - 1, 2, 3);
        R(g, C.inkSoft, 9, y + 2, 8, 1);
      }
      // 碑座
      solid(g, 2, 30, 22, 4, C.graniteDark, C.granite, C.ink);
      R(g, C.leafDark, 2, 28, 3, 2);
      R(g, C.leaf, 21, 28, 3, 2);
    },
  },
  // 望春风：老式点心铺木牌 + 一碟凤梨酥（老铺招牌意象）
  wangchuan: {
    w: 36,
    h: 30,
    draw(g) {
      S(g, 18, 28, 16);
      // 木招牌
      solid(g, 2, 2, 32, 14, C.woodDark, C.wood, C.ink);
      R(g, C.cream, 4, 4, 28, 10);
      R(g, C.lacquer, 4, 4, 28, 2);
      R(g, C.ink, 7, 8, 3, 4);
      R(g, C.ink, 12, 8, 3, 4);
      R(g, C.ink, 17, 8, 3, 4);
      R(g, C.ink, 22, 8, 3, 4);
      R(g, C.ink, 27, 8, 3, 4);
      // 吊绳
      line(g, C.inkSoft, 5, 16, 3, 21);
      line(g, C.inkSoft, 31, 16, 33, 21);
      // 桌上点心碟
      solid(g, 6, 21, 24, 5, C.white, C.cream, C.creamDark);
      for (const x of [10, 16, 22]) {
        E(g, C.ink, x, 19, 3, 2);
        E(g, C.gold, x, 19, 2, 1);
        R(g, C.goldLight, x - 1, 18, 2, 1);
      }
    },
  },
  // 姜母鸭：砂锅炖鸭 + 老姜
  gingerduck: {
    w: 32,
    h: 26,
    draw(g) {
      S(g, 16, 24, 15);
      R(g, C.ink, 2, 11, 28, 12);
      R(g, '#8c4a2f', 3, 12, 26, 10);
      R(g, '#a85c39', 3, 12, 26, 2);
      R(g, C.inkSoft, 3, 20, 26, 2);
      // 锅把手
      R(g, C.ink, 0, 13, 3, 3);
      R(g, C.ink, 29, 13, 3, 3);
      // 汤面
      E(g, C.ink, 16, 11, 13, 3);
      E(g, '#c9762f', 16, 10, 12, 2);
      E(g, '#e09a4a', 15, 9, 8, 1);
      // 鸭块与姜片
      for (const [x, y] of [[9, 9], [14, 8], [19, 9], [23, 8]]) {
        R(g, C.ink, x, y, 4, 3);
        R(g, '#b3663c', x, y, 3, 2);
      }
      for (const x of [11, 17, 21]) {
        R(g, C.ink, x, 6 + (x % 2), 3, 2);
        R(g, C.gold, x, 6 + (x % 2), 2, 1);
      }
      steam(g, 11, 5, 5);
      steam(g, 21, 4, 6);
    },
  },
  // 素饼：南普陀的绿豆素饼
  supia: {
    w: 32,
    h: 24,
    draw(g) {
      S(g, 16, 22, 15);
      // 纸盒
      solid(g, 2, 12, 28, 9, C.cream, C.white, C.creamDark);
      R(g, C.lacquer, 2, 14, 28, 2);
      R(g, C.ink, 13, 17, 6, 1);
      R(g, C.ink, 15, 16, 2, 3);
      // 三块饼
      for (const x of [8, 16, 24]) {
        E(g, C.ink, x, 8, 5, 4);
        E(g, '#e9d9a8', x, 8, 4, 3);
        E(g, C.white, x - 1, 7, 2, 1);
        R(g, C.inkSoft, x - 2, 8, 1, 1);
        R(g, C.inkSoft, x + 1, 8, 1, 1);
      }
    },
  },
  // 香炉：南普陀的青铜大香炉
  censer: {
    w: 34,
    h: 34,
    draw(g) {
      S(g, 17, 32, 15);
      // 三足
      R(g, C.ink, 7, 25, 3, 7);
      R(g, C.ink, 24, 25, 3, 7);
      R(g, C.ink, 16, 25, 3, 7);
      R(g, C.woodDark, 8, 26, 1, 5);
      R(g, C.woodDark, 25, 26, 1, 5);
      // 炉身
      E(g, C.ink, 17, 19, 15, 8);
      E(g, '#7d6a3c', 17, 19, 14, 7);
      E(g, '#9c874f', 16, 17, 11, 4);
      R(g, C.lacquer, 9, 22, 16, 2);
      // 双耳
      R(g, C.ink, 0, 13, 4, 8);
      R(g, C.goldDark, 1, 14, 2, 6);
      R(g, C.ink, 30, 13, 4, 8);
      R(g, C.goldDark, 31, 14, 2, 6);
      // 炉口与香
      E(g, C.ink, 17, 11, 12, 3);
      E(g, '#c9a24a', 17, 11, 11, 2);
      for (const x of [13, 17, 21]) {
        R(g, C.ink, x, 6, 1, 5);
        R(g, '#ffd36b', x, 6, 1, 1);
      }
      steam(g, 13, 5, 5, 'rgba(240,240,230,0.5)');
      steam(g, 21, 4, 4, 'rgba(240,240,230,0.5)');
    },
  },
  // 莲花池：荷叶 + 粉荷
  lotus: {
    w: 36,
    h: 28,
    draw(g) {
      S(g, 18, 26, 16);
      E(g, C.seaDeep, 18, 22, 17, 5);
      E(g, C.sea, 18, 22, 15, 4);
      E(g, C.seaLight, 14, 21, 6, 1);
      // 荷叶
      for (const [x, y, r] of [[8, 18, 6], [28, 17, 5], [19, 21, 7]] as [number, number, number][]) {
        E(g, C.ink, x, y, r, Math.max(2, r - 2));
        E(g, C.leafDark, x, y, r - 1, Math.max(1, r - 3));
        E(g, C.leaf, x - 1, y - 1, r - 3, Math.max(1, r - 4));
        R(g, C.leafDark, x - 1, y, 3, 1);
      }
      // 荷茎与花
      line(g, C.leafDark, 24, 16, 25, 6);
      for (const [x, y, c] of [[25, 5, '#f2a7b8'], [23, 3, '#f7c4cf'], [27, 3, '#e88fa4']] as [number, number, string][]) {
        R(g, C.ink, x - 1, y - 1, 3, 3);
        R(g, c, x, y, 2, 2);
      }
      R(g, C.goldLight, 25, 4, 1, 1);
      // 蜻蜓
      R(g, C.inkSoft, 6, 9, 1, 3);
      R(g, C.seaLight, 4, 8, 2, 1);
      R(g, C.seaLight, 7, 8, 2, 1);
    },
  },
  // 放生石 / 禅石：刻「佛」的花岗岩
  fostone: {
    w: 30,
    h: 32,
    draw(g) {
      S(g, 15, 30, 14);
      // 石身（不规则）
      for (let i = 0; i < 22; i++) {
        const t = i / 21;
        const w = Math.round(18 + Math.sin(t * 3) * 4);
        R(g, C.ink, 15 - w / 2 - 1, 6 + i, w + 2, 1);
      }
      for (let i = 0; i < 20; i++) {
        const t = i / 19;
        const w = Math.round(16 + Math.sin(t * 3) * 4);
        R(g, i < 3 ? C.graniteLight : C.granite, 15 - w / 2, 7 + i, w, 1);
      }
      R(g, C.graniteDark, 11, 24, 10, 2);
      // 刻字
      R(g, C.inkSoft, 12, 13, 7, 1);
      R(g, C.inkSoft, 12, 17, 7, 1);
      R(g, C.inkSoft, 14, 12, 1, 7);
      R(g, C.inkSoft, 17, 12, 1, 7);
      // 底座与青苔
      solid(g, 4, 27, 22, 3, C.graniteDark, C.granite, C.ink);
      R(g, C.leafDark, 5, 26, 4, 2);
      R(g, C.leaf, 22, 26, 3, 1);
    },
  },
};
