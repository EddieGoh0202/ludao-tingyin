import { PALETTE } from '../common';
import { Pen, Tone, hex, makeCanvas, outline, tone } from './kit';

const PORCELAIN: Tone = [hex(0xffffff), hex(0xf2f0e8), hex(0xc9c4b5)];
const BONE = tone(0xfaf6ea);
const WOOD = tone(PALETTE.wood);
const STRAW = tone(0xd9b46a);
const RED = tone(PALETTE.flame);
const BLUE = hex(0x3a6db0);
const GOLD = tone(PALETTE.gold);

type Painter = (p: Pen) => void;

/** 博饼瓷碗：碗里六颗骰子，其中一颗红四 */
function bobing(p: Pen): void {
  const cx = 20;
  // 骰子先画，碗口再压在上面
  const dice = [
    [11, 3], [17, 2], [23, 4], [14, 6], [21, 7], [26, 6],
  ];
  dice.forEach(([x, y], i) => {
    p.r(BONE[1], x, y, 4, 4);
    p.r(BONE[0], x, y, 4, 1);
    p.r(BONE[2], x + 3, y + 1, 1, 3);
    const d = i === 2 ? RED[1] : hex(0x2b1d16);
    p.r(d, x + 1, y + 1, 2, 2);
    if (i === 2) p.p(hex(0xffffff), x + 1, y + 1);
  });
  // 碗身
  p.trap(PORCELAIN[1], 11, 19, cx - 16, cx + 16, cx - 9, cx + 9);
  p.r(PORCELAIN[0], cx - 14, 12, 8, 3);
  p.r(PORCELAIN[2], cx + 6, 13, 9, 6);
  p.trap(PORCELAIN[2], 17, 19, cx - 14, cx + 13, cx - 9, cx + 8);
  // 青花缠枝纹
  p.r(BLUE, cx - 15, 11, 30, 1);
  for (let i = -12; i <= 10; i += 4) {
    p.r(BLUE, cx + i, 13, 2, 1);
    p.r(BLUE, cx + i + 1, 15, 2, 1);
  }
  // 碗底
  p.r(PORCELAIN[2], cx - 9, 19, 18, 1);
  p.r(PORCELAIN[1], cx - 6, 20, 12, 1);
}

/** 小摊：推车 + 遮阳棚 + 玻璃罩里的小吃 */
function stall(p: Pen): void {
  // 棚
  p.trap(RED[1], 0, 3, 4, 56, 0, 60);
  p.trap(RED[0], 0, 3, 4, 22, 0, 26);
  p.r(RED[2], 0, 3, 60, 1);
  for (let x = 6; x < 56; x += 12) p.r(hex(0xf6eeda), x, 1, 6, 2);
  p.r(WOOD[2], 3, 3, 1, 22);
  p.r(WOOD[2], 56, 3, 1, 22);
  // 台面
  p.r(WOOD[1], 2, 24, 56, 4);
  p.r(WOOD[0], 2, 24, 56, 1);
  p.r(WOOD[2], 2, 27, 56, 1);
  // 玻璃罩
  p.r(hex(0xcfe3e8), 8, 12, 20, 12);
  p.r(hex(0xffffff), 9, 13, 2, 9);
  p.r(hex(0xcfe3e8), 34, 14, 16, 10);
  p.r(hex(0xffffff), 35, 15, 1, 7);
  // 小吃
  p.eShade(tone(PALETTE.glaze), 15, 22, 4, 2);
  p.eShade(tone(PALETTE.glaze), 24, 22, 3, 2);
  p.eShade(BONE, 40, 21, 3, 2);
  p.r(STRAW[1], 37, 22, 10, 2);
  // 车斗与轮
  p.r(WOOD[1], 4, 28, 52, 9);
  p.r(WOOD[2], 4, 35, 52, 2);
  p.e(hex(0x2b1d16), 14, 37, 4, 4);
  p.e(hex(0x6a5a4a), 14, 37, 2, 2);
  p.e(hex(0x2b1d16), 46, 37, 4, 4);
  p.e(hex(0x6a5a4a), 46, 37, 2, 2);
  // 挂着的红灯笼
  p.eShade(RED, 52, 8, 3, 3);
  p.r(hex(PALETTE.gold), 51, 5, 5, 1);
}

/** 声波圈：金色同心圆 */
function wave(p: Pen): void {
  const c = 12;
  for (let r = 4; r <= 11; r += 3.5) {
    const col = r < 5 ? GOLD[0] : r < 9 ? GOLD[1] : GOLD[2];
    const R = Math.round(r);
    for (let a = 0; a < 24; a++) {
      const ang = (a / 24) * Math.PI * 2;
      p.p(col, Math.round(c + Math.cos(ang) * R), Math.round(c + Math.sin(ang) * R));
    }
  }
  p.r(GOLD[0], 11, 11, 2, 2);
}

/** 科普浮标：金色书本 + 感叹号 */
function knowMark(p: Pen): void {
  p.r(hex(0x2b1d16), 0, 0, 11, 13);
  p.r(GOLD[1], 1, 1, 9, 11);
  p.r(GOLD[0], 1, 1, 9, 2);
  p.r(GOLD[2], 1, 10, 9, 2);
  // 书本
  p.r(hex(0xffffff), 3, 4, 5, 5);
  p.r(hex(0xc9c4b5), 5, 4, 1, 5);
  p.r(BLUE, 3, 4, 2, 1);
  p.r(BLUE, 6, 4, 2, 1);
  // 感叹号
  p.r(hex(0xffffff), 3, 6, 1, 2);
  p.r(hex(0xffffff), 3, 9, 1, 1);
  p.r(GOLD[2], 2, 12, 7, 1);
}

export const OBJ_TEXTS: Record<string, { w: number; h: number; paint: Painter; glow?: boolean }> = {
  'obj-bobing': { w: 40, h: 22, paint: bobing },
  'obj-stall': { w: 60, h: 40, paint: stall },
  wave: { w: 24, h: 24, paint: wave, glow: true },
  'know-mark': { w: 11, h: 13, paint: knowMark, glow: true },
  spark: {
    w: 5,
    h: 5,
    glow: true,
    paint: (p) => {
      p.r(GOLD[2], 1, 0, 3, 5);
      p.r(GOLD[2], 0, 1, 5, 3);
      p.r(GOLD[1], 1, 1, 3, 3);
      p.r(GOLD[0], 2, 2, 1, 1);
    },
  },
};

/** 生成物件贴图（含 1px 描边），返回画布 */
export function objCanvas(key: string): HTMLCanvasElement | null {
  const d = OBJ_TEXTS[key];
  if (!d) return null;
  const [cv, g] = makeCanvas(d.w, d.h);
  d.paint(new Pen(g));
  if (!d.glow) outline(g, d.w, d.h);
  return cv;
}
