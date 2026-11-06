import { CAST, charCanvas } from './chars';
import { makeCanvas } from './chars/kit';

/**
 * 对话立绘：直接取行走小人的上半身放大，保证造型 / 配色与场景中完全一致。
 * 输出 96×128 透明 dataURL（24×30 裁切 → 4× 最近邻放大，底部对齐）。
 */
const W = 96;
const H = 128;
const CROP_W = 24;
const CROP_H = 30;
const SCALE = 4;

const cache = new Map<string, string | null>();

/** 取得角色立绘 dataURL；未知角色返回 null */
export function portrait(sprite: string): string | null {
  if (cache.has(sprite)) return cache.get(sprite) ?? null;
  const def = CAST[sprite];
  const src = def ? charCanvas(sprite, 0) : null;
  if (!def || !src) {
    cache.set(sprite, null);
    return null;
  }
  // 以身体中心为轴裁出上半身（含帽子、天线等头顶装饰）
  const cx = Math.round(def.w / 2) - 1 + (def.shiftX ?? 0);
  const [crop, cg] = makeCanvas(CROP_W, CROP_H);
  cg.drawImage(src, -(cx - CROP_W / 2), -1);

  const [cv, g] = makeCanvas(W, H);
  g.drawImage(crop, 0, 0, CROP_W, CROP_H, 0, H - CROP_H * SCALE, CROP_W * SCALE, CROP_H * SCALE);
  const url = cv.toDataURL();
  cache.set(sprite, url);
  return url;
}
