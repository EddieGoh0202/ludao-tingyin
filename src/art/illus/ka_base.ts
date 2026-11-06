/** 科普卡插图通用底板：200×120，上方背景渐变，下方桌面/地面 */
import { G, P, INK, R, bands, checker } from './kit';

export type KaDraw = (g: G) => void;

/** 室内桌面：暖墙 + 木桌 */
export function tableBg(g: G, wall = ['#f6e2b8', '#efd3a0', '#e6c48c'], top = 84): void {
  bands(g, 0, 0, 200, top, wall);
  R(g, 0, top, 200, 2, INK);
  R(g, 0, top + 2, 200, 120 - top - 2, P.wood);
  R(g, 0, top + 2, 200, 2, P.woodL);
  for (let x = 6; x < 200; x += 26) R(g, x, top + 7, 14, 1, P.woodD);
  checker(g, 0, 116, 200, 4, P.woodD);
}

/** 户外：天空 + 地面 */
export function outdoorBg(g: G, sky = ['#a8d6ea', '#c8e6ee', '#eef0d8'], ground = P.stone, top = 92): void {
  bands(g, 0, 0, 200, top, sky);
  R(g, 0, top, 200, 1, INK);
  R(g, 0, top + 1, 200, 120 - top - 1, ground);
  for (let y = top + 6; y < 120; y += 7) R(g, 0, y, 200, 1, 'rgba(43,29,22,0.15)');
}

/** 外框：1px 墨线 + 内金线 */
export function frame(g: G): void {
  R(g, 0, 0, 200, 1, INK);
  R(g, 0, 119, 200, 1, INK);
  R(g, 0, 0, 1, 120, INK);
  R(g, 199, 0, 1, 120, INK);
  g.strokeStyle = 'rgba(226,166,59,0.55)';
  g.lineWidth = 1;
  g.strokeRect(2.5, 2.5, 195, 115);
}

/** 未知 prop：通用卡片（窗花 + 印章） */
export function genericCard(g: G): void {
  tableBg(g);
  R(g, 70, 18, 60, 60, INK);
  R(g, 71, 19, 58, 58, P.red);
  for (let i = 0; i < 58; i += 8) { R(g, 71 + i, 19, 2, 58, P.redD); R(g, 71, 19 + i, 58, 2, P.redD); }
  R(g, 90, 38, 20, 20, P.gold);
  R(g, 94, 42, 12, 12, P.red);
}
