import { PALETTE } from '../common';
import { INK, Pen, Tone, hex, tone } from './kit';

export const SKIN: Tone = [hex(0xf7d3a8), hex(0xefbf8d), hex(0xc9905f)];
export const SKIN_OLD: Tone = [hex(0xf2cba2), hex(0xe0b184), hex(0xb8834f)];
export const WHITE_HAIR: Tone = tone(0xd8d4cb);
export const BLACK_HAIR: Tone = tone(0x2f2622);
export const GREY_HAIR: Tone = tone(0x9a938a);
export const STEEL: Tone = tone(PALETTE.steel);

export type HairStyle = 'bun' | 'short' | 'bald' | 'long' | 'cap' | 'bob';

export interface Outfit {
  skin: Tone;
  hair: Tone;
  hairStyle: HairStyle;
  shirt: Tone;
  pants: Tone;
  shoe: Tone;
  /** 长袖 or 短袖 */
  sleeve: 'long' | 'short';
  /** 长衫 / 长裙：下半身用 shirt 色铺满 */
  robe?: boolean;
  /** 围裙色（可选） */
  apron?: Tone;
  /** 头巾色（可选，会盖住发型） */
  scarf?: Tone;
}

export interface FigCtx {
  /** 画布宽高 */
  w: number;
  h: number;
  cx: number;
  /** 头顶（含头发）y */
  top: number;
  /** 眼线 y */
  eyeY: number;
  /** 肩线 y */
  shoulderY: number;
  /** 髋部 y */
  hipY: number;
  groundY: number;
  pose: number;
}

export type Decor = (p: Pen, c: FigCtx) => void;

function hair(p: Pen, c: FigCtx, o: Outfit): void {
  const { cx, eyeY } = c;
  const t = o.hair;
  switch (o.hairStyle) {
    case 'bald':
      p.r(t[0], cx - 3, eyeY - 5, 6, 2);
      p.r(t[2], cx + 3, eyeY - 4, 2, 3);
      p.p(t[0], cx - 2, eyeY - 5);
      break;
    case 'bun':
      p.eShade(t, cx + 5, eyeY - 4, 3, 3);
      p.r(t[1], cx - 4, eyeY - 5, 8, 3);
      p.r(t[0], cx - 4, eyeY - 5, 8, 1);
      p.r(t[2], cx - 4, eyeY - 3, 8, 1);
      break;
    case 'long':
      p.r(t[1], cx - 4, eyeY - 5, 8, 3);
      p.r(t[0], cx - 4, eyeY - 5, 8, 1);
      p.r(t[1], cx - 5, eyeY - 4, 2, 9);
      p.r(t[1], cx + 3, eyeY - 4, 2, 9);
      p.shade(t, cx - 5, eyeY - 4, 1, 9);
      break;
    case 'cap':
      p.r(t[1], cx - 4, eyeY - 5, 9, 3);
      p.r(t[0], cx - 4, eyeY - 5, 9, 1);
      p.r(t[2], cx + 1, eyeY - 2, 6, 1);
      break;
    case 'bob':
      p.r(t[1], cx - 5, eyeY - 5, 10, 4);
      p.r(t[0], cx - 5, eyeY - 5, 10, 1);
      p.r(t[1], cx - 5, eyeY - 2, 2, 4);
      p.r(t[1], cx + 3, eyeY - 2, 2, 4);
      break;
    default:
      p.r(t[1], cx - 4, eyeY - 5, 8, 2);
      p.r(t[0], cx - 4, eyeY - 5, 8, 1);
      p.r(t[2], cx - 4, eyeY - 3, 2, 1);
  }
}

/** 画一个 26×40 标准人体，各角色在这个骨架上加装饰 */
export function figure(p: Pen, c: FigCtx, o: Outfit, decor?: Decor): void {
  const { cx, eyeY, shoulderY, hipY, groundY, pose } = c;
  const lift = pose === 0 ? 0 : 2;
  const leftUp = pose === 1;
  const rightUp = pose === 2;

  // —— 腿 ——
  const legY = hipY;
  const legH = groundY - legY - 2;
  if (o.robe) {
    p.trap(o.shirt[1], legY - 2, groundY - 2, cx - 6, cx + 6, cx - 7, cx + 7);
    p.r(o.shirt[2], cx - 7, groundY - 3, 3, 2);
  } else {
    // 迈步：抬起的那条腿短 lift 像素，并向外摆 1px
    const lh = leftUp ? legH - lift : legH;
    const rh = rightUp ? legH - lift : legH;
    p.shade(o.pants, cx - 4 + (leftUp ? -1 : 0), legY, 3, lh);
    p.shade(o.pants, cx + 1 + (rightUp ? 1 : 0), legY, 3, rh);
    p.r(o.pants[2], cx - 2, legY, 3, 1);
  }
  // 鞋
  const sL = leftUp ? -1 : 0;
  const sR = rightUp ? 1 : 0;
  const yL = groundY - 2 - (leftUp ? lift : 0);
  const yR = groundY - 2 - (rightUp ? lift : 0);
  p.r(o.shoe[1], cx - 5 + sL, yL, 4, 2);
  p.r(o.shoe[2], cx - 5 + sL, yL + 1, 4, 1);
  p.r(o.shoe[1], cx + 1 + sR, yR, 4, 2);
  p.r(o.shoe[2], cx + 1 + sR, yR + 1, 4, 1);

  // —— 躯干 ——
  p.r(o.shirt[1], cx - 5, shoulderY, 10, hipY - shoulderY + 1);
  p.r(o.shirt[2], cx + 3, shoulderY + 1, 2, hipY - shoulderY);
  p.r(o.shirt[0], cx - 5, shoulderY, 2, hipY - shoulderY);
  // 领口
  p.r(o.skin[2], cx - 2, shoulderY - 1, 4, 2);
  p.r(o.skin[1], cx - 1, shoulderY - 1, 2, 1);

  // —— 手臂 ——
  const armTop = shoulderY + 1;
  const armBot = shoulderY + (o.sleeve === 'long' ? 9 : 4);
  const armC = o.sleeve === 'long' ? o.shirt : o.skin;
  const la = leftUp ? -1 : 0;
  const ra = rightUp ? -1 : 0;
  p.shade(armC, cx - 7, armTop + la, 2, armBot - armTop);
  p.shade(armC, cx + 5, armTop + ra, 2, armBot - armTop);
  if (o.sleeve === 'short') {
    p.r(o.skin[1], cx - 7, armBot + la, 2, 3);
    p.r(o.skin[1], cx + 5, armBot + ra, 2, 3);
    p.r(o.skin[2], cx + 6, armBot + 2 + ra, 1, 1);
  }

  // —— 围裙 ——
  if (o.apron) {
    p.r(o.apron[1], cx - 4, shoulderY + 4, 8, hipY - shoulderY - 2);
    p.r(o.apron[0], cx - 4, shoulderY + 4, 2, hipY - shoulderY - 2);
    p.r(o.apron[2], cx + 3, shoulderY + 5, 1, hipY - shoulderY - 3);
    p.p(INK, cx - 4, shoulderY + 4);
    p.p(INK, cx + 4, shoulderY + 4);
  }

  // —— 头 ——
  p.eShade(o.skin, cx, eyeY, 4, 4);
  p.e(o.skin[2], cx + 3, eyeY + 1, 2, 3);
  p.r(o.skin[1], cx - 3, eyeY + 4, 6, 1);
  p.r(o.skin[2], cx - 2, eyeY + 5, 4, 1); // 下巴阴影
  // 耳朵
  p.r(o.skin[2], cx - 5, eyeY, 1, 2);
  p.r(o.skin[2], cx + 4, eyeY, 1, 2);

  // 五官
  p.p(INK, cx - 2, eyeY);
  p.p(INK, cx + 2, eyeY);
  p.p('#ffffff', cx - 2, eyeY);
  p.p('#ffffff', cx + 2, eyeY);
  p.p(INK, cx - 2, eyeY);
  p.p(INK, cx + 2, eyeY);
  p.r(o.skin[2], cx - 1, eyeY + 2, 3, 1); // 鼻影
  p.r(hex(0x8a4a3a), cx - 1, eyeY + 4, 3, 1); // 嘴
  p.r(hex(0xd98a72), cx - 3, eyeY + 3, 1, 1); // 腮红
  p.r(hex(0xd98a72), cx + 3, eyeY + 3, 1, 1);

  if (o.hairStyle !== 'bald') hair(p, c, o);
  if (o.scarf) {
    p.r(o.scarf[1], cx - 5, eyeY - 5, 10, 3);
    p.r(o.scarf[0], cx - 5, eyeY - 5, 10, 1);
    p.r(o.scarf[2], cx - 5, eyeY - 2, 4, 2);
    p.p(o.scarf[0], cx + 3, eyeY + 3);
    p.p(o.scarf[1], cx + 4, eyeY + 3);
  }
  decor?.(p, c);
}

/** 通用几何：给定画布尺寸算出骨架关键点 */
export function geometry(w: number, h: number, pose: number): FigCtx {
  const cx = Math.round(w / 2) - 1;
  return {
    w,
    h,
    cx,
    top: h - 36,
    eyeY: h - 27,
    shoulderY: h - 21,
    hipY: h - 12,
    groundY: h - 1,
    pose,
  };
}
