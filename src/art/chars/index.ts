import { figure, geometry } from './body';
import { CAST1, type CastDef } from './cast';
import { CAST2 } from './cast2';
import { CAST3 } from './cast3';
import { Pen, makeCanvas, outline } from './kit';

/** 全部角色：player + 12 位 NPC */
export const CAST: Record<string, CastDef> = { ...CAST1, ...CAST2, ...CAST3 };

export const CHAR_H = 40;

/** 把角色画到给定画笔上（不描边）；pose：0 站立 / 1 迈左脚 / 2 迈右脚 */
export function paintChar(p: Pen, def: CastDef, pose: number): void {
  const c = geometry(def.w, CHAR_H, pose);
  c.cx += def.shiftX ?? 0;
  def.back?.(p, c);
  figure(p, c, def.outfit, def.decor);
}

/** 生成一帧行走小人（含 1px 自动描边），未知角色返回 null */
export function charCanvas(name: string, pose = 0): HTMLCanvasElement | null {
  const def = CAST[name];
  if (!def) return null;
  const [cv, g] = makeCanvas(def.w, CHAR_H);
  paintChar(new Pen(g), def, pose);
  outline(g, def.w, CHAR_H);
  return cv;
}
