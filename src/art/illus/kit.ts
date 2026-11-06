/** 插画通用画笔：像素描边 #2b1d16，暖色三阶明暗。 */
export type G = CanvasRenderingContext2D;
export const INK = '#2b1d16';
export const P = {
  red: '#b5432f', redL: '#d0603f', redD: '#7d2f25', brick: '#c0533a', brickD: '#8e3424',
  gold: '#e2a63b', goldL: '#f3cf6e', cream: '#f6eeda', creamD: '#e2d3b0', white: '#fbf6ea',
  wood: '#7a4a2c', woodL: '#9c6438', woodD: '#55311d', stone: '#b9ae9a', stoneL: '#d4cbb6',
  stoneD: '#8a7f6d', sea: '#3f86a8', seaL: '#6fb0cc', seaD: '#2c6687', leaf: '#4f8a3c',
  leafL: '#79b24f', leafD: '#335f2a', pink: '#d0477f', pinkL: '#ec7aa8', pinkD: '#962d5a',
  yellow: '#e9c24a', yellowD: '#c99a2e', grey: '#8f99a3', greyL: '#c4ccd2', greyD: '#5e6870',
};

export function make(cache: Map<string, string>, key: string, w: number, h: number, draw: (g: G) => void): string {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  draw(g);
  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}

export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export function R(g: G, x: number, y: number, w: number, h: number, c: string): void {
  if (w <= 0 || h <= 0) return;
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** 带 1px 描边的矩形，可选顶部高光、底部暗部 */
export function O(g: G, x: number, y: number, w: number, h: number, fill: string, hi?: string, lo?: string): void {
  R(g, x, y, w, h, INK);
  R(g, x + 1, y + 1, w - 2, h - 2, fill);
  if (hi) R(g, x + 1, y + 1, w - 2, 1, hi);
  if (lo) R(g, x + 1, y + h - 2, w - 2, 1, lo);
}

/** 竖向分阶渐变，交界处棋盘抖动 */
export function bands(g: G, x: number, y: number, w: number, h: number, cols: string[]): void {
  const n = cols.length;
  for (let i = 0; i < n; i++) {
    const y0 = y + Math.round((h * i) / n);
    const y1 = y + Math.round((h * (i + 1)) / n);
    R(g, x, y0, w, y1 - y0, cols[i]);
    if (i > 0) checker(g, x, y0 - 2, w, 2, cols[i]);
  }
}

export function checker(g: G, x: number, y: number, w: number, h: number, c: string): void {
  g.fillStyle = c;
  for (let j = 0; j < h; j++) for (let i = (j % 2); i < w; i += 2) g.fillRect(x + i, y + j, 1, 1);
}

export function oval(g: G, cx: number, cy: number, rx: number, ry: number, c: string): void {
  g.fillStyle = c;
  for (let dy = -ry; dy <= ry; dy++) {
    const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry || 1))));
    g.fillRect(Math.round(cx - dx), Math.round(cy + dy), dx * 2 + 1, 1);
  }
}

export function ooval(g: G, cx: number, cy: number, rx: number, ry: number, c: string): void {
  oval(g, cx, cy, rx + 1, ry + 1, INK);
  oval(g, cx, cy, rx, ry, c);
}

export function disc(g: G, cx: number, cy: number, r: number, c: string): void {
  oval(g, cx, cy, r, r, c);
}

export function odisc(g: G, cx: number, cy: number, r: number, c: string, hi?: string): void {
  ooval(g, cx, cy, r, r, c);
  if (hi) R(g, cx - Math.ceil(r / 2), cy - Math.ceil(r / 2), Math.max(1, r >> 1), Math.max(1, r >> 1), hi);
}

/** 等腰三角（尖朝上） */
export function tri(g: G, cx: number, top: number, half: number, h: number, c: string): void {
  g.fillStyle = c;
  for (let i = 0; i < h; i++) {
    const w = Math.round((half * (i + 1)) / h);
    g.fillRect(Math.round(cx - w), top + i, w * 2 + 1, 1);
  }
}

/** 梯形（上窄下宽或反之） */
export function trap(g: G, cx: number, y: number, topHalf: number, botHalf: number, h: number, c: string): void {
  g.fillStyle = c;
  for (let i = 0; i < h; i++) {
    const w = Math.round(topHalf + ((botHalf - topHalf) * i) / Math.max(1, h - 1));
    g.fillRect(Math.round(cx - w), y + i, w * 2 + 1, 1);
  }
}

/** 按列填充山脊/轮廓：f(x) 为顶部 y */
export function ridge(g: G, x0: number, x1: number, base: number, f: (x: number) => number, c: string): void {
  g.fillStyle = c;
  for (let x = x0; x < x1; x++) {
    const t = Math.round(f(x));
    if (t < base) g.fillRect(x, t, 1, base - t);
  }
}

export function bricks(g: G, x: number, y: number, w: number, h: number, a: string, b: string, mortar: string, bw = 8, bh = 4): void {
  R(g, x, y, w, h, mortar);
  let k = 0;
  for (let r = 0; r * bh < h; r++) {
    const off = r % 2 ? bw / 2 : 0;
    for (let cx = -off; cx < w; cx += bw) {
      const x0 = Math.max(0, cx);
      const x1 = Math.min(w, cx + bw - 1);
      R(g, x + x0, y + r * bh, x1 - x0, Math.min(bh - 1, h - r * bh), k++ % 5 === 2 ? b : a);
    }
  }
}

/** 竖向瓦垄屋面 */
export function tiles(g: G, x: number, y: number, w: number, h: number, c: string, dark: string): void {
  R(g, x, y, w, h, c);
  for (let i = 1; i < w; i += 3) R(g, x + i, y, 1, h, dark);
  R(g, x, y + h - 1, w, 1, INK);
}

/** 燕尾脊：两端上翘 */
export function swallowRidge(g: G, x: number, y: number, w: number, c: string, span = 10): void {
  R(g, x + span, y, w - span * 2, 4, INK);
  R(g, x + span, y + 1, w - span * 2, 2, c);
  for (let k = 0; k <= span; k++) {
    const up = Math.round((k * k) / (span * 0.9));
    R(g, x + span - k - 1, y - up, 3, 4, INK);
    R(g, x + span - k, y - up + 1, 1, 2, c);
    R(g, x + w - span + k - 2, y - up, 3, 4, INK);
    R(g, x + w - span + k - 1, y - up + 1, 1, 2, c);
  }
}

export function lantern(g: G, x: number, y: number, c = P.red): void {
  R(g, x, y - 4, 1, 4, INK);
  ooval(g, x, y + 5, 5, 6, c);
  R(g, x - 2, y + 2, 1, 5, P.redL);
  R(g, x - 3, y - 1, 7, 2, P.gold);
  R(g, x - 3, y + 10, 7, 2, P.gold);
  R(g, x, y + 12, 1, 4, P.gold);
}

/** 袅袅白烟/蒸汽 */
export function steam(g: G, x: number, y: number, h: number, seed = 1, c = 'rgba(255,255,255,0.55)'): void {
  for (let i = 0; i < h; i++) {
    const dx = Math.round(Math.sin((i + seed * 7) / 4) * 3);
    R(g, x + dx, y - i, 2, 1, c);
  }
}

export function shade(g: G, x: number, y: number, w: number, h: number, a = 0.25, c = '43,29,22'): void {
  R(g, x, y, w, h, `rgba(${c},${a})`);
}
