import { PALETTE } from '../common';
import { GREY_HAIR, SKIN, SKIN_OLD, BLACK_HAIR, type Outfit } from './body';
import type { CastDef } from './cast';
import { INK, hex, tone } from './kit';

const WOOD = tone(PALETTE.wood);
const RED = tone(PALETTE.flame);
const GOLD = tone(PALETTE.gold);
const DARK = tone(PALETTE.inkSoft);
const WHITE: Outfit['shirt'] = [hex(0xffffff), hex(0xf1eee4), hex(0xc9c4b5)];
const BASKET = tone(0xc9a05a);
const COLLAR = hex(0x5f5c52);

export const CAST3: Record<string, CastDef> = {
  monk: {
    w: 26,
    outfit: {
      skin: SKIN,
      hair: tone(0xd9b48f),
      hairStyle: 'bald',
      shirt: tone(0x8a8678),
      pants: tone(0x8a8678),
      shoe: tone(0x5a4a3a),
      sleeve: 'long',
      robe: true,
    },
    decor: (p, c) => {
      const { cx, shoulderY, hipY } = c;
      // 交领 + 黄色腰绦
      p.line(COLLAR, cx - 3, shoulderY, cx, shoulderY + 5);
      p.line(COLLAR, cx + 3, shoulderY, cx, shoulderY + 5);
      p.r(GOLD[1], cx - 5, hipY - 2, 10, 1);
      // 胸前合十
      p.r(SKIN[1], cx - 1, shoulderY + 5, 2, 3);
      p.p(SKIN[0], cx - 1, shoulderY + 5);
      // 佛珠
      const drop = [0, 1, 2, 3, 3, 2, 1, 0];
      drop.forEach((d, i) => p.p(i % 2 ? hex(0x8a4a2a) : hex(0x5a2a16), cx - 4 + i, shoulderY + 1 + d));
      // 光头高光与戒疤
      p.r(SKIN[0], c.cx - 2, c.eyeY - 4, 2, 1);
      p.p(SKIN[2], c.cx, c.eyeY - 3);
      p.p(SKIN[2], c.cx + 2, c.eyeY - 3);
    },
  },
  pilgrim: {
    w: 26,
    outfit: {
      skin: SKIN_OLD,
      hair: GREY_HAIR,
      hairStyle: 'bun',
      shirt: tone(0x7a4f8a),
      pants: DARK,
      shoe: DARK,
      sleeve: 'long',
    },
    decor: (p, c) => {
      const { cx, shoulderY, hipY } = c;
      // 提着的竹编香篮：红布 + 香 + 金纸
      const x = cx + 4;
      const y = hipY - 1;
      p.line(WOOD[2], x + 1, y, x + 4, y - 4);
      p.line(WOOD[2], x + 7, y, x + 4, y - 4);
      p.trap(BASKET[1], y, y + 5, x, x + 9, x + 1, x + 8);
      p.r(BASKET[0], x, y, 9, 1);
      p.r(BASKET[2], x + 1, y + 3, 7, 1);
      p.r(RED[1], x + 1, y - 1, 7, 1);
      p.r(GOLD[0], x + 2, y - 2, 2, 1);
      p.r(hex(0xc9603f), x + 6, y - 4, 1, 3);
      p.p(hex(PALETTE.glow), x + 6, y - 5);
      // 斜襟盘扣
      p.p(GOLD[1], cx - 1, shoulderY + 2);
      p.p(GOLD[1], cx - 1, shoulderY + 5);
    },
  },
  noodle: {
    w: 26,
    outfit: {
      skin: SKIN,
      hair: BLACK_HAIR,
      hairStyle: 'short',
      shirt: WHITE,
      pants: DARK,
      shoe: DARK,
      sleeve: 'short',
      apron: tone(0x3a3a3a),
    },
    decor: (p, c) => {
      const { cx, eyeY, shoulderY } = c;
      // 白色厨师帽
      p.r(WHITE[1], cx - 4, eyeY - 8, 8, 4);
      p.r(WHITE[0], cx - 4, eyeY - 8, 2, 4);
      p.r(WHITE[2], cx + 2, eyeY - 7, 2, 3);
      p.r(WHITE[1], cx - 5, eyeY - 4, 10, 1);
      p.r(WHITE[2], cx - 5, eyeY - 3, 10, 1);
      // 毛巾搭肩
      p.r(hex(0xd98a72), cx - 5, shoulderY, 2, 5);
      // 右手大汤勺
      p.r(hex(PALETTE.steelLight), cx + 6, shoulderY + 1, 1, 8);
      p.e(hex(PALETTE.steel), cx + 6, shoulderY + 10, 2, 1);
      // 小胡子
      p.r(INK, cx - 1, eyeY + 3, 3, 1);
    },
  },
};
