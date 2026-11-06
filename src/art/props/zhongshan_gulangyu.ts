import { C, E, R, S, line, solid, steam, type PropSpec } from './base';

/** 中山路 + 鼓浪屿 的科普小物件 */
export const ZHONGSHAN_GULANGYU: Record<string, PropSpec> = {
  // 沙茶面：大碗面 + 红汤 + 冒热气
  shacha: {
    w: 32,
    h: 26,
    draw(g) {
      S(g, 16, 24, 15);
      E(g, C.ink, 16, 16, 15, 7);
      E(g, C.white, 16, 16, 14, 6);
      E(g, C.ink, 16, 14, 12, 4);
      E(g, '#b8422a', 16, 14, 11, 3);
      E(g, '#d4573a', 15, 13, 8, 2);
      // 面条与料
      for (let i = 0; i < 7; i++) {
        const x = 8 + i * 3;
        R(g, C.goldLight, x, 12 + (i % 2), 3, 1);
      }
      R(g, C.lacquer, 12, 11, 5, 2);
      R(g, C.leafDark, 19, 12, 4, 2);
      E(g, C.white, 11, 12, 2, 1);
      R(g, C.inkSoft, 29, 12, 3, 1);
      steam(g, 11, 9, 6);
      steam(g, 20, 8, 7);
    },
  },
  // 骑楼柱廊：南洋风拱券
  qilou: {
    w: 38,
    h: 40,
    draw(g) {
      S(g, 19, 38, 17);
      R(g, C.ink, 1, 0, 36, 4);
      R(g, C.creamDark, 2, 1, 34, 2);
      R(g, C.ink, 1, 4, 4, 34);
      R(g, C.ink, 33, 4, 4, 34);
      R(g, C.plaster, 2, 5, 2, 32);
      R(g, C.plasterDark, 34, 5, 2, 32);
      R(g, C.plaster, 34, 5, 1, 32);
      // 拱券
      E(g, C.ink, 19, 20, 13, 15);
      E(g, C.creamDark, 19, 20, 12, 14);
      E(g, C.plaster, 19, 21, 11, 13);
      E(g, C.plasterDark, 19, 22, 10, 12);
      // 券心石
      R(g, C.ink, 17, 5, 4, 3);
      R(g, C.cream, 18, 6, 2, 1);
      // 栏杆
      R(g, C.ink, 6, 9, 2, 8);
      R(g, C.ink, 30, 9, 2, 8);
      R(g, C.inkSoft, 6, 9, 26, 1);
      // 柱础
      R(g, C.stoneDark, 0, 34, 6, 4);
      R(g, C.stoneDark, 32, 34, 6, 4);
      R(g, C.stone, 1, 34, 4, 2);
      R(g, C.stone, 33, 34, 4, 2);
    },
  },
  // 花生汤：小碗 + 汤匙
  peanut: {
    w: 28,
    h: 22,
    draw(g) {
      S(g, 14, 20, 13);
      E(g, C.ink, 14, 14, 12, 5);
      E(g, C.white, 14, 14, 11, 4);
      E(g, C.ink, 13, 12, 9, 3);
      E(g, '#e8d8b4', 13, 12, 8, 2);
      for (const x of [7, 10, 13, 16, 19, 11, 15]) {
        R(g, C.ink, x, 12, 2, 2);
        R(g, '#c9a86a', x, 12, 2, 1);
      }
      line(g, C.inkSoft, 18, 5, 25, 2);
      R(g, C.graniteLight, 25, 1, 3, 2);
    },
  },
  // 鼓浪屿馅饼：油纸包着的酥饼
  pia: {
    w: 34,
    h: 26,
    draw(g) {
      S(g, 17, 24, 16);
      // 油纸包
      R(g, C.ink, 2, 12, 30, 11);
      R(g, '#e8cba0', 3, 13, 28, 9);
      R(g, C.lacquer, 3, 15, 28, 3);
      R(g, '#f2e0bd', 3, 13, 28, 1);
      // 印字
      R(g, C.cream, 14, 16, 6, 1);
      R(g, C.cream, 15, 15, 4, 3);
      // 两块酥饼露出
      for (const x of [7, 24]) {
        E(g, C.ink, x, 9, 6, 4);
        E(g, '#e9c07a', x, 9, 5, 3);
        E(g, '#f7dfae', x - 1, 8, 3, 1);
        for (let i = 0; i < 3; i++) R(g, C.inkSoft, x - 3 + i * 3, 9, 1, 1);
      }
    },
  },
  // 钢琴：岛上的老钢琴
  piano: {
    w: 36,
    h: 34,
    draw(g) {
      S(g, 18, 32, 17);
      solid(g, 2, 20, 32, 10, C.woodDark, C.wood, C.ink);
      R(g, C.ink, 4, 30, 3, 2);
      R(g, C.ink, 29, 30, 3, 2);
      // 琴盖翻起
      R(g, C.ink, 3, 0, 30, 12);
      R(g, C.wood, 4, 1, 28, 10);
      R(g, C.woodLight, 4, 1, 28, 1);
      line(g, C.woodDark, 5, 9, 30, 2);
      // 白键
      for (let i = 0; i < 12; i++) {
        const x = 5 + i * 2;
        R(g, C.ink, x, 13, 2, 6);
        R(g, C.white, x, 13, 1, 5);
      }
      // 黑键
      for (const x of [6, 8, 12, 14, 16, 20, 22, 26, 28]) R(g, C.ink, x, 13, 1, 3);
      // 谱架
      R(g, C.ink, 13, 4, 10, 5);
      R(g, C.cream, 14, 5, 8, 3);
      R(g, C.inkSoft, 15, 6, 6, 1);
    },
  },
  // 鼓浪屿老别墅：红瓦坡顶 + 白色柱廊
  villa: {
    w: 40,
    h: 38,
    draw(g) {
      S(g, 20, 36, 18);
      // 坡顶
      for (let i = 0; i < 10; i++) {
        const w = 34 - i * 2;
        R(g, i % 2 ? C.brick : C.brickLight, 20 - w / 2, 2 + i, w, 1);
      }
      R(g, C.ink, 2, 12, 36, 1);
      R(g, C.brickDark, 3, 12, 34, 2);
      // 墙身
      R(g, C.ink, 3, 13, 34, 23);
      R(g, C.cream, 4, 14, 32, 21);
      R(g, C.creamDark, 34, 14, 2, 21);
      // 阳台与柱
      R(g, C.plasterDark, 3, 22, 34, 2);
      for (const x of [7, 14, 22, 29]) {
        R(g, C.ink, x, 15, 2, 8);
        R(g, C.white, x, 15, 1, 8);
      }
      // 窗
      for (const x of [8, 17, 26]) {
        R(g, C.ink, x, 25, 6, 7);
        R(g, C.seaDeep, x + 1, 26, 4, 5);
        R(g, C.seaLight, x + 1, 26, 2, 2);
      }
      // 门
      R(g, C.ink, 16, 33, 8, 4);
      R(g, C.woodDark, 17, 33, 6, 3);
      R(g, C.leafDark, 2, 30, 3, 5);
      R(g, C.leaf, 2, 29, 3, 2);
      R(g, C.leafDark, 35, 29, 3, 6);
    },
  },
  // 三角梅：从墙头垂下的花枝
  bougain: {
    w: 34,
    h: 32,
    draw(g) {
      S(g, 17, 30, 15);
      R(g, C.ink, 2, 24, 30, 6);
      R(g, C.plaster, 3, 25, 28, 4);
      R(g, C.plasterDark, 3, 28, 28, 1);
      R(g, C.ink, 2, 23, 30, 1);
      // 枝
      line(g, C.woodDark, 8, 23, 22, 8);
      line(g, C.woodDark, 18, 14, 28, 20);
      line(g, C.woodDark, 14, 19, 6, 12);
      // 叶
      for (const [x, y] of [[12, 18], [19, 13], [23, 19], [9, 10], [26, 15]]) {
        E(g, C.leafDark, x, y, 3, 2);
        R(g, C.leaf, x - 2, y - 1, 3, 1);
      }
      // 花（三瓣）
      for (const [x, y, c] of [[16, 6, C.bougain], [11, 4, C.bougainLight], [21, 4, C.bougain], [6, 8, C.bougainDark], [25, 7, C.bougainLight], [29, 12, C.bougain]] as [number, number, string][]) {
        R(g, C.ink, x - 1, y - 1, 4, 4);
        R(g, c, x, y, 3, 2);
        R(g, C.goldLight, x + 1, y + 1, 1, 1);
      }
    },
  },
  // 日光岩：花岗岩巨石 + 小亭
  sunrock: {
    w: 38,
    h: 38,
    draw(g) {
      S(g, 19, 36, 17);
      R(g, C.ink, 2, 30, 34, 6);
      R(g, C.graniteDark, 3, 31, 32, 4);
      // 主岩
      for (let i = 0; i < 22; i++) {
        const t = i / 21;
        const w = Math.round(26 - t * 10);
        R(g, C.ink, 19 - w / 2 - 1, 8 + i, w + 2, 1);
      }
      for (let i = 0; i < 20; i++) {
        const t = i / 19;
        const w = Math.round(24 - t * 10);
        R(g, i < 4 ? C.graniteLight : C.granite, 19 - w / 2, 9 + i, w, 1);
      }
      line(g, C.graniteDark, 14, 12, 18, 26);
      line(g, C.graniteLight, 24, 12, 21, 24);
      // 顶部小亭
      R(g, C.ink, 14, 3, 11, 2);
      R(g, C.lacquer, 15, 4, 9, 1);
      for (const x of [15, 19, 23]) {
        R(g, C.ink, x, 5, 1, 4);
        R(g, C.cream, x + 1, 5, 1, 1);
      }
      R(g, C.ink, 13, 8, 13, 1);
    },
  },
};
