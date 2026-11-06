/** 科普小物件贴图的公用画笔：全部用 Canvas 2D 逐像素绘制，禁抗锯齿。 */
export type Ctx = CanvasRenderingContext2D;

export interface PropSpec {
  /** 画布宽高（世界像素） */
  w: number;
  h: number;
  draw: (g: Ctx) => void;
}

export const C = {
  ink: '#2b1d16',
  inkSoft: '#4a3629',
  cream: '#f6eeda',
  creamDark: '#e2d3b2',
  plaster: '#e9d3a1',
  plasterDark: '#cdb483',
  brick: '#b5432f',
  brickDark: '#8e2f22',
  brickLight: '#c9603f',
  gold: '#d9a441',
  goldLight: '#f0c869',
  goldDark: '#a87a2a',
  leaf: '#3f7d4a',
  leafDark: '#2c5c37',
  leafLight: '#6fa35b',
  sea: '#2f6f9f',
  seaDeep: '#214f74',
  seaLight: '#7fb6d6',
  flame: '#d8392b',
  wood: '#8a6231',
  woodLight: '#b08450',
  woodDark: '#5a3b20',
  stone: '#d8d2c4',
  stoneDark: '#a9a292',
  granite: '#b9b2a4',
  graniteDark: '#857e71',
  graniteLight: '#d6d0c2',
  lacquer: '#a8281e',
  temple: '#e3b44c',
  templeDark: '#b48632',
  glaze: '#e08a2e',
  glazeLight: '#f2b552',
  bougain: '#c2447a',
  bougainLight: '#e07aa6',
  bougainDark: '#8a2c57',
  white: '#fbf8ef',
  shadow: 'rgba(26,18,13,0.30)',
  shadowSoft: 'rgba(26,18,13,0.16)',
};

/** 实心矩形 */
export const R = (g: Ctx, c: string, x: number, y: number, w: number, h: number): void => {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** 1px 描边矩形（描在像素格内侧） */
export const O = (g: Ctx, c: string, x: number, y: number, w: number, h: number): void => {
  g.fillStyle = c;
  const X = Math.round(x);
  const Y = Math.round(y);
  const W = Math.round(w);
  const H = Math.round(h);
  g.fillRect(X, Y, W, 1);
  g.fillRect(X, Y + H - 1, W, 1);
  g.fillRect(X, Y, 1, H);
  g.fillRect(X + W - 1, Y, 1, H);
};

/** 像素椭圆 */
export const E = (g: Ctx, c: string, cx: number, cy: number, rx: number, ry: number): void => {
  g.fillStyle = c;
  const RY = Math.max(0, Math.round(ry));
  for (let dy = -RY; dy <= RY; dy++) {
    const k = 1 - (dy * dy) / ((RY + 0.5) * (RY + 0.5));
    if (k < 0) continue;
    const hw = Math.floor((rx + 0.5) * Math.sqrt(k));
    g.fillRect(Math.round(cx) - hw, Math.round(cy) + dy, hw * 2 + 1, 1);
  }
};

/** 底部投影 */
export const S = (g: Ctx, cx: number, y: number, rx: number): void => E(g, C.shadowSoft, cx, y, rx, 2);

/** 三阶明暗小方块：左上亮、右下暗、外描边 */
export function solid(
  g: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  mid: string,
  light: string,
  dark: string,
  edge = C.ink,
): void {
  R(g, edge, x, y, w, h);
  R(g, mid, x + 1, y + 1, w - 2, h - 2);
  R(g, light, x + 1, y + 1, w - 2, 1);
  R(g, light, x + 1, y + 1, 1, h - 2);
  R(g, dark, x + 1, y + h - 2, w - 2, 1);
  R(g, dark, x + w - 2, y + 1, 1, h - 2);
}

/** 斜线（1px 阶梯），用于屋脊、叶脉 */
export function line(g: Ctx, c: string, x0: number, y0: number, x1: number, y1: number): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const n = Math.max(dx, dy, 1);
  for (let i = 0; i <= n; i++) {
    R(g, c, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
  }
}

/** 一缕热气 */
export function steam(g: Ctx, x: number, y: number, h: number, c = 'rgba(255,255,255,0.55)'): void {
  for (let i = 0; i < h; i++) {
    const off = Math.round(Math.sin(i * 0.9) * 1.4);
    R(g, c, x + off, y - i, 1, 1);
  }
}
