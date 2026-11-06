import { C, E, R, S, line, solid, steam, type PropSpec } from './base';

/** 外妈老厝 + 八市 的科普小物件 */
export const LAOCUO_BASHI: Record<string, PropSpec> = {
  // 工夫茶：矮茶桌 + 茶盘 + 小茶壶 + 三个小杯
  tea: {
    w: 36,
    h: 30,
    draw(g) {
      S(g, 18, 28, 16);
      solid(g, 3, 14, 30, 4, C.wood, C.woodLight, C.woodDark);
      R(g, C.ink, 5, 18, 3, 10);
      R(g, C.woodDark, 6, 18, 1, 9);
      R(g, C.ink, 28, 18, 3, 10);
      R(g, C.woodDark, 29, 18, 1, 9);
      solid(g, 7, 11, 22, 4, C.woodDark, C.wood, C.ink);
      // 茶壶
      E(g, C.ink, 13, 7, 5, 4);
      E(g, C.brickDark, 13, 7, 4, 3);
      E(g, C.brick, 12, 6, 2, 1);
      R(g, C.ink, 12, 2, 3, 2);
      R(g, C.ink, 18, 5, 3, 1);
      R(g, C.ink, 7, 5, 2, 3);
      // 三个小杯
      for (const x of [20, 23, 26]) {
        R(g, C.ink, x, 8, 3, 3);
        R(g, C.white, x, 8, 2, 2);
        R(g, C.goldDark, x, 8, 2, 1);
      }
      steam(g, 24, 6, 5);
      steam(g, 14, 1, 1);
    },
  },
  // 出砖入石墙：红砖与花岗岩交错砌筑
  wall: {
    w: 34,
    h: 34,
    draw(g) {
      S(g, 17, 32, 16);
      R(g, C.ink, 1, 2, 32, 30);
      const stones = [
        [2, 3, 12, 6],
        [18, 9, 14, 5],
        [5, 15, 10, 6],
        [20, 21, 12, 5],
        [2, 25, 13, 6],
      ];
      for (let y = 3; y < 31; y += 3) {
        const off = (y / 3) % 2 ? 0 : 3;
        for (let x = 2 - off; x < 32; x += 6) {
          const xx = Math.max(2, x);
          const ww = Math.min(5, 32 - xx);
          R(g, (x + y) % 4 ? C.brick : C.brickLight, xx, y, ww, 2);
          R(g, C.brickDark, xx, y + 1, ww, 1);
        }
      }
      for (const [x, y, w, h] of stones) solid(g, x, y, w, h, C.granite, C.graniteLight, C.graniteDark);
      R(g, C.brickDark, 1, 0, 32, 3);
      R(g, C.ink, 0, 0, 34, 1);
    },
  },
  // 古井：花岗岩井栏 + 木辘轳 + 吊桶
  well: {
    w: 32,
    h: 34,
    draw(g) {
      S(g, 16, 32, 15);
      R(g, C.ink, 7, 2, 2, 20);
      R(g, C.ink, 23, 2, 2, 20);
      R(g, C.woodDark, 8, 3, 1, 18);
      R(g, C.woodDark, 24, 3, 1, 18);
      solid(g, 6, 1, 20, 3, C.wood, C.woodLight, C.woodDark);
      R(g, C.inkSoft, 16, 4, 1, 8);
      solid(g, 13, 11, 7, 6, C.wood, C.woodLight, C.woodDark);
      R(g, C.ink, 13, 13, 7, 1);
      E(g, C.ink, 16, 22, 14, 4);
      E(g, C.seaDeep, 16, 22, 11, 2);
      solid(g, 2, 22, 28, 9, C.granite, C.graniteLight, C.graniteDark);
      R(g, C.graniteDark, 10, 24, 1, 6);
      R(g, C.graniteDark, 21, 24, 1, 6);
      R(g, C.leafDark, 3, 29, 3, 1);
      R(g, C.leaf, 26, 29, 3, 1);
    },
  },
  // 菜脯：竹匾上晒着萝卜干
  caipo: {
    w: 38,
    h: 24,
    draw(g) {
      S(g, 19, 22, 17);
      R(g, C.ink, 6, 12, 2, 10);
      R(g, C.ink, 30, 12, 2, 10);
      line(g, C.woodDark, 7, 20, 31, 14);
      E(g, C.ink, 19, 11, 18, 5);
      E(g, C.goldDark, 19, 11, 17, 4);
      E(g, C.gold, 19, 10, 15, 3);
      for (let i = 0; i < 9; i++) {
        const x = 7 + i * 3;
        const y = 8 + (i % 3);
        R(g, C.ink, x, y, 3, 2);
        R(g, i % 2 ? C.glazeLight : C.glaze, x, y, 2, 1);
      }
      R(g, C.inkSoft, 4, 10, 30, 1);
    },
  },
  // 土笋冻：小瓷碗里半透明的冻 + 一碟酱
  tusundong: {
    w: 30,
    h: 22,
    draw(g) {
      S(g, 15, 20, 14);
      solid(g, 1, 13, 28, 6, C.wood, C.woodLight, C.woodDark);
      for (const x of [6, 15]) {
        E(g, C.ink, x + 2, 10, 5, 3);
        E(g, C.white, x + 2, 10, 4, 2);
        E(g, '#c9c7b8', x + 2, 9, 3, 1);
        R(g, C.inkSoft, x + 1, 9, 2, 1);
        R(g, C.inkSoft, x + 3, 8, 1, 1);
      }
      E(g, C.ink, 25, 11, 3, 2);
      E(g, C.flame, 25, 11, 2, 1);
    },
  },
  // 海蛎：竹篮里的生蚝壳
  oyster: {
    w: 30,
    h: 22,
    draw(g) {
      S(g, 15, 20, 14);
      E(g, C.ink, 15, 15, 13, 6);
      E(g, C.woodLight, 15, 15, 12, 5);
      for (let x = 4; x < 27; x += 3) R(g, C.wood, x, 12, 1, 8);
      R(g, C.woodDark, 3, 18, 24, 1);
      for (const [x, y] of [[7, 9], [12, 7], [17, 9], [22, 8], [10, 11], [19, 11]]) {
        E(g, C.ink, x, y, 3, 2);
        E(g, C.graniteLight, x, y, 2, 1);
        R(g, C.graniteDark, x, y + 1, 2, 1);
      }
    },
  },
  // 老杆秤：秤杆 + 秤砣 + 秤盘
  scale: {
    w: 34,
    h: 32,
    draw(g) {
      S(g, 17, 30, 15);
      R(g, C.ink, 15, 0, 2, 4);
      R(g, C.ink, 2, 4, 30, 3);
      R(g, C.woodLight, 3, 5, 28, 1);
      for (let x = 6; x < 30; x += 3) R(g, C.goldDark, x, 5, 1, 1);
      line(g, C.inkSoft, 5, 7, 2, 20);
      line(g, C.inkSoft, 5, 7, 9, 20);
      E(g, C.ink, 5, 21, 6, 2);
      E(g, C.stoneDark, 5, 21, 5, 1);
      R(g, C.inkSoft, 26, 7, 1, 6);
      solid(g, 23, 13, 7, 7, C.stoneDark, C.stone, C.graniteDark);
      solid(g, 1, 25, 32, 5, C.wood, C.woodLight, C.woodDark);
    },
  },
  // 鱼丸：一锅白鱼丸冒热气
  fishball: {
    w: 30,
    h: 26,
    draw(g) {
      S(g, 15, 24, 14);
      R(g, C.ink, 3, 10, 24, 13);
      R(g, C.graniteDark, 4, 11, 22, 11);
      R(g, C.graniteLight, 4, 11, 22, 2);
      R(g, C.ink, 1, 12, 3, 2);
      R(g, C.ink, 26, 12, 3, 2);
      E(g, C.ink, 15, 10, 12, 3);
      E(g, '#e9e0c7', 15, 10, 11, 2);
      for (const x of [8, 12, 16, 20, 14, 10, 18]) {
        R(g, C.ink, x, 7 + (x % 3), 3, 3);
        R(g, C.white, x, 7 + (x % 3), 2, 2);
      }
      steam(g, 9, 6, 6);
      steam(g, 20, 5, 5);
    },
  },
};
