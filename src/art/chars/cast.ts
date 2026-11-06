import { PALETTE } from '../common';
import { BLACK_HAIR, GREY_HAIR, Outfit, SKIN, SKIN_OLD, STEEL, WHITE_HAIR, type Decor } from './body';
import { Tone, hex, tone } from './kit';

/** 一个角色的完整定义：行走小人 + 半身像共用 */
export interface CastDef {
  w: number;
  outfit: Outfit;
  /** 画在身体之前（背后的物件：收音机、背包） */
  back?: Decor;
  /** 画在身体之后（帽子、眼镜、手持物） */
  decor?: Decor;
  /** 身体中心相对默认值的水平偏移（推车等需要让位） */
  shiftX?: number;
}

const WOOD = tone(PALETTE.wood);
const GOLD = tone(PALETTE.gold);
const CREAM = tone(PALETTE.cream);
const STRAW = tone(0xd9b46a);
const RED = tone(PALETTE.flame);
const SEA = tone(PALETTE.sea);
const DARK = tone(PALETTE.inkSoft);
const WHITE: Tone = [hex(0xffffff), hex(0xf1eee4), hex(0xc9c4b5)];
const PINK = hex(0xf3c6d2);

export const CAST1: Record<string, CastDef> = {
  player: {
    w: 24,
    outfit: {
      skin: SKIN,
      hair: BLACK_HAIR,
      hairStyle: 'short',
      shirt: CREAM,
      pants: SEA,
      shoe: DARK,
      sleeve: 'short',
    },
    back: (p, c) => {
      // 背在右肩后的老收音机 + 斜拉天线
      const x = c.cx + 3;
      const y = c.shoulderY - 2;
      p.shade(WOOD, x, y, 7, 9);
      p.r(WOOD[0], x, y, 7, 1);
      p.r(GOLD[1], x + 4, y + 2, 2, 3);
      p.p(GOLD[0], x + 4, y + 2);
      p.line(STEEL[1], x + 6, y - 1, x + 9, y - 9);
      p.p(GOLD[0], x + 9, y - 10);
    },
    decor: (p, c) => {
      // 背带 + 胸前红色收音机徽标
      p.r(WOOD[2], c.cx - 3, c.shoulderY, 1, 7);
      p.r(WOOD[2], c.cx + 2, c.shoulderY, 1, 4);
      p.r(RED[1], c.cx - 2, c.shoulderY + 4, 2, 2);
      p.p(RED[0], c.cx - 2, c.shoulderY + 4);
      // 刘海
      p.r(BLACK_HAIR[1], c.cx - 4, c.eyeY - 3, 3, 1);
      p.p(BLACK_HAIR[1], c.cx + 2, c.eyeY - 3);
    },
  },
  ama: {
    w: 26,
    outfit: {
      skin: SKIN_OLD,
      hair: WHITE_HAIR,
      hairStyle: 'bun',
      shirt: tone(0x5b7fa8),
      pants: DARK,
      shoe: DARK,
      sleeve: 'long',
    },
    decor: (p, c) => {
      // 碎花：错落的粉白小点
      const pts = [
        [-3, 2], [1, 1], [3, 4], [-1, 5], [-4, 7], [2, 7], [0, 3], [-2, 9], [3, 9], [-6, 4], [5, 6],
      ];
      for (const [dx, dy] of pts) p.p(PINK, c.cx + dx, c.shoulderY + dy);
      p.p('#ffffff', c.cx + 1, c.shoulderY + 1);
      p.p('#ffffff', c.cx - 4, c.shoulderY + 7);
      // 盘扣斜襟
      p.line(hex(0x3d5a7d), c.cx - 1, c.shoulderY + 1, c.cx + 3, c.shoulderY + 4);
      // 玉簪
      p.r(hex(0x6fbf8f), c.cx + 3, c.eyeY - 5, 4, 1);
    },
  },
  akong: {
    w: 26,
    outfit: {
      skin: SKIN_OLD,
      hair: GREY_HAIR,
      hairStyle: 'short',
      shirt: WHITE,
      pants: tone(0x6f6a5c),
      shoe: DARK,
      sleeve: 'short',
    },
    decor: (p, c) => {
      const { cx, eyeY, shoulderY } = c;
      // 背心：露出肩膀
      p.r(SKIN_OLD[1], cx - 5, shoulderY, 2, 2);
      p.r(SKIN_OLD[2], cx + 3, shoulderY, 2, 2);
      p.r(SKIN_OLD[1], cx - 2, shoulderY, 4, 2);
      // 老花镜
      p.r(hex(0x6a4a2a), cx - 3, eyeY - 1, 3, 1);
      p.r(hex(0x6a4a2a), cx + 1, eyeY - 1, 3, 1);
      p.r(hex(0x6a4a2a), cx - 3, eyeY + 1, 3, 1);
      p.r(hex(0x6a4a2a), cx + 1, eyeY + 1, 3, 1);
      p.p(hex(0x6a4a2a), cx, eyeY - 1);
      // 蒲扇（右手）
      p.eShade(STRAW, cx + 8, shoulderY + 7, 3, 3);
      p.line(STRAW[2], cx + 6, shoulderY + 6, cx + 10, shoulderY + 8);
      p.r(WOOD[2], cx + 6, shoulderY + 9, 1, 3);
    },
  },
  uncle: {
    w: 26,
    outfit: {
      skin: [hex(0xe8b483), hex(0xd39a66), hex(0xa8703f)],
      hair: BLACK_HAIR,
      hairStyle: 'short',
      shirt: tone(0x6d7f8c),
      pants: DARK,
      shoe: tone(0x2f5a44),
      sleeve: 'long',
      apron: tone(0xe0b33b),
    },
    decor: (p, c) => {
      const { cx, eyeY, groundY } = c;
      // 斗笠
      p.trap(STRAW[1], eyeY - 9, eyeY - 3, cx - 1, cx + 1, cx - 8, cx + 9);
      p.trap(STRAW[0], eyeY - 9, eyeY - 5, cx - 1, cx, cx - 4, cx - 1);
      p.r(STRAW[2], cx - 8, eyeY - 3, 17, 1);
      p.r(WOOD[1], cx - 3, eyeY - 6, 7, 1);
      // 雨靴
      p.shade(tone(0x2f5a44), cx - 4, groundY - 6, 3, 4);
      p.shade(tone(0x2f5a44), cx + 1, groundY - 6, 3, 4);
      // 围裙挂鱼鳞反光
      p.p(hex(0xfff0b0), cx - 2, c.shoulderY + 6);
      p.p(hex(0xfff0b0), cx + 1, c.shoulderY + 8);
    },
  },
};
