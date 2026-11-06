import { PALETTE } from '../common';
import { BLACK_HAIR, SKIN, type Outfit } from './body';
import type { CastDef } from './cast';
import { INK, hex, tone } from './kit';

const WOOD = tone(PALETTE.wood);
const STRAW = tone(0xd9b46a);
const RED = tone(PALETTE.flame);
const DARK = tone(PALETTE.inkSoft);
const TAN: Outfit['skin'] = [hex(0xe8b483), hex(0xd39a66), hex(0xa8703f)];

export const CAST2: Record<string, CastDef> = {
  boss: {
    w: 26,
    outfit: {
      skin: SKIN,
      hair: BLACK_HAIR,
      hairStyle: 'bob',
      shirt: tone(0xe8c56b),
      pants: tone(0x384c6b),
      shoe: DARK,
      sleeve: 'short',
      apron: RED,
      scarf: tone(PALETTE.leaf),
    },
    decor: (p, c) => {
      const { cx, eyeY, shoulderY } = c;
      // 花头巾上的白点
      p.p(hex(0xf6eeda), cx - 3, eyeY - 4);
      p.p(hex(0xf6eeda), cx + 1, eyeY - 5);
      p.p(hex(0xf6eeda), cx + 3, eyeY - 3);
      // 围裙口袋 + 别着的记账笔
      p.r(RED[2], cx - 2, shoulderY + 7, 4, 2);
      p.r(hex(0x3a6db0), cx + 2, shoulderY + 5, 1, 3);
      // 金耳环
      p.p(hex(PALETTE.goldLight), cx - 5, eyeY + 2);
    },
  },
  tourist: {
    w: 26,
    outfit: {
      skin: SKIN,
      hair: tone(PALETTE.sea),
      hairStyle: 'cap',
      shirt: tone(0xf2c94c),
      pants: tone(0x6b8e6b),
      shoe: [hex(0xffffff), hex(0xeeeeea), hex(0xb9b9b2)],
      sleeve: 'short',
    },
    back: (p, c) => {
      // 双肩包从两侧露出
      p.shade(tone(0x8a5a3c), c.cx - 8, c.shoulderY + 1, 3, 8);
      p.shade(tone(0x8a5a3c), c.cx + 5, c.shoulderY + 1, 3, 8);
    },
    decor: (p, c) => {
      const { cx, shoulderY } = c;
      // 背包带
      p.r(hex(0x6b4329), cx - 4, shoulderY, 1, 8);
      p.r(hex(0x6b4329), cx + 3, shoulderY, 1, 8);
      // 胸前相机
      p.r(INK, cx - 2, shoulderY + 4, 5, 4);
      p.r(hex(0x5a5a5a), cx - 1, shoulderY + 5, 3, 2);
      p.p(hex(0x9fd0ea), cx, shoulderY + 5);
      p.p(RED[1], cx + 2, shoulderY + 4);
      p.line(INK, cx - 2, shoulderY + 4, cx - 1, shoulderY + 1);
      p.line(INK, cx + 2, shoulderY + 4, cx + 1, shoulderY + 1);
    },
  },
  pianist: {
    w: 26,
    outfit: {
      skin: SKIN,
      hair: BLACK_HAIR,
      hairStyle: 'long',
      shirt: tone(0x3f5f8f),
      pants: tone(0x3f5f8f),
      shoe: DARK,
      sleeve: 'short',
      robe: true,
    },
    decor: (p, c) => {
      const { cx, shoulderY, hipY } = c;
      // 白蕾丝领 + 腰带 + 裙摆褶
      p.r(hex(0xf6eeda), cx - 3, shoulderY, 6, 1);
      p.r(hex(0xf6eeda), cx - 2, shoulderY + 1, 4, 1);
      p.r(hex(PALETTE.gold), cx - 5, hipY - 3, 10, 1);
      for (let i = -4; i <= 4; i += 3) p.r(hex(0x2c4468), cx + i, hipY + 1, 1, 7);
      // 发上的三角梅
      p.p(hex(PALETTE.bougain), cx + 3, c.eyeY - 5);
      p.p(hex(PALETTE.bougainLight), cx + 4, c.eyeY - 4);
    },
  },
  islander: {
    w: 26,
    outfit: {
      skin: TAN,
      hair: BLACK_HAIR,
      hairStyle: 'short',
      shirt: tone(PALETTE.bougain),
      pants: tone(0xc9b48a),
      shoe: tone(0x8a6231),
      sleeve: 'short',
    },
    decor: (p, c) => {
      const { cx, eyeY, shoulderY } = c;
      // 宽檐草帽
      p.r(STRAW[1], cx - 8, eyeY - 4, 17, 2);
      p.r(STRAW[2], cx - 8, eyeY - 3, 17, 1);
      p.eShade(STRAW, cx, eyeY - 6, 4, 2);
      p.r(RED[1], cx - 4, eyeY - 5, 9, 1);
      // 花衬衫：白色扶桑花
      p.p(hex(0xf6eeda), cx - 3, shoulderY + 2);
      p.p(hex(0xf6eeda), cx + 2, shoulderY + 5);
      p.p(hex(0xf6eeda), cx - 1, shoulderY + 7);
      p.r(hex(PALETTE.bougainDark), cx, shoulderY + 1, 1, 8);
    },
  },
  vendor: {
    w: 26,
    shiftX: -4,
    outfit: {
      skin: TAN,
      hair: BLACK_HAIR,
      hairStyle: 'short',
      shirt: tone(0xf1eee4),
      pants: DARK,
      shoe: DARK,
      sleeve: 'short',
      apron: tone(0x3f7fb5),
    },
    decor: (p, c) => {
      const { cx, eyeY, shoulderY, groundY } = c;
      // 头上毛巾
      p.r(hex(0xf6eeda), cx - 4, eyeY - 5, 8, 2);
      p.r(hex(0xd8d2c4), cx + 3, eyeY - 4, 2, 2);
      // 推车：车斗 + 玻璃罩 + 轮子
      const x = cx + 6;
      p.shade(tone(PALETTE.wood), x, shoulderY + 6, 9, 7);
      p.r(WOOD[0], x, shoulderY + 6, 9, 1);
      p.r(hex(0xcfe3e8), x + 1, shoulderY + 1, 7, 5);
      p.r(hex(0xffffff), x + 2, shoulderY + 2, 1, 3);
      p.r(hex(PALETTE.glaze), x + 4, shoulderY + 4, 3, 2);
      p.r(RED[1], x, shoulderY + 8, 9, 1);
      p.e(INK, x + 5, groundY - 3, 2, 2);
      p.p(hex(PALETTE.steelLight), x + 5, groundY - 3);
      p.r(WOOD[2], x - 1, shoulderY + 6, 1, 1);
    },
  },
  fisher: {
    w: 26,
    outfit: {
      skin: TAN,
      hair: BLACK_HAIR,
      hairStyle: 'short',
      shirt: tone(0x2f4f6f),
      pants: tone(0x4a5a5a),
      shoe: tone(0x2f5a44),
      sleeve: 'long',
      scarf: tone(0xd8d2c4),
    },
    decor: (p, c) => {
      const { cx, shoulderY, hipY } = c;
      // 卷起的裤脚
      p.r(TAN[1], cx - 4, hipY + 6, 3, 2);
      p.r(TAN[1], cx + 1, hipY + 6, 3, 2);
      // 斜挎渔网
      p.line(STRAW[2], cx - 5, shoulderY + 1, cx + 4, hipY - 1);
      p.eShade(STRAW, cx + 5, hipY, 3, 2);
      p.p(STRAW[2], cx + 4, hipY);
      p.p(STRAW[2], cx + 6, hipY - 1);
      // 钓竿
      p.line(WOOD[2], cx - 7, shoulderY + 9, cx - 11, 1);
    },
  },
};
