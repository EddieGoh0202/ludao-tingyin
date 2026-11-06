import { PALETTE, mix } from '../common';

/** 三阶色：亮 / 中 / 暗 */
export type Tone = [string, string, string];

export const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

/** 由中间色推出亮、暗两阶，保证全体角色明暗规律一致 */
export function tone(mid: number): Tone {
  return [hex(mix(mid, 0xfff4dc, 0.32)), hex(mid), hex(mix(mid, PALETTE.ink, 0.38))];
}

export const INK = hex(PALETTE.ink);

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return [cv, g];
}

/** 像素画笔：全部取整，不产生半像素 */
export class Pen {
  constructor(public g: CanvasRenderingContext2D) {}

  r(c: string, x: number, y: number, w: number, h: number): void {
    if (w <= 0 || h <= 0) return;
    this.g.fillStyle = c;
    this.g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  p(c: string, x: number, y: number): void {
    this.r(c, x, y, 1, 1);
  }

  /** 逐行填充的像素椭圆 */
  e(c: string, cx: number, cy: number, rx: number, ry: number): void {
    const R = Math.max(0, Math.round(ry));
    for (let dy = -R; dy <= R; dy++) {
      const k = 1 - (dy * dy) / ((R + 0.5) * (R + 0.5));
      if (k < 0) continue;
      const hw = Math.floor((rx + 0.5) * Math.sqrt(k));
      this.r(c, Math.round(cx) - hw, Math.round(cy) + dy, hw * 2 + 1, 1);
    }
  }

  /** 三阶明暗矩形：中间色打底，左列亮、右列暗 */
  shade(t: Tone, x: number, y: number, w: number, h: number, band = 1): void {
    this.r(t[1], x, y, w, h);
    this.r(t[0], x, y, band, h);
    this.r(t[2], x + w - band, y, band, h);
  }

  /** 三阶明暗椭圆：暗色底，中间色偏左上，亮色小块高光 */
  eShade(t: Tone, cx: number, cy: number, rx: number, ry: number): void {
    this.e(t[2], cx, cy, rx, ry);
    this.e(t[1], cx - 1, cy - 1, Math.max(0, rx - 1), Math.max(0, ry - 1));
    this.e(t[0], cx - Math.ceil(rx / 3), cy - Math.ceil(ry / 3), Math.max(1, Math.floor(rx / 3)), Math.max(1, Math.floor(ry / 3)));
  }

  /** 逐行梯形：上边 [l0, r0)，下边 [l1, r1) */
  trap(c: string, y0: number, y1: number, l0: number, r0: number, l1: number, r1: number): void {
    const h = Math.round(y1 - y0);
    for (let i = 0; i < h; i++) {
      const t = h <= 1 ? 0 : i / (h - 1);
      const l = Math.round(l0 + (l1 - l0) * t);
      const r = Math.round(r0 + (r1 - r0) * t);
      this.r(c, l, y0 + i, r - l, 1);
    }
  }

  line(c: string, x0: number, y0: number, x1: number, y1: number): void {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.p(c, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n));
  }

  /** 粗线（t×t 笔头） */
  thick(c: string, x0: number, y0: number, x1: number, y1: number, t: number): void {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.r(c, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), t, t);
  }

  clear(x: number, y: number, w = 1, h = 1): void {
    this.g.clearRect(Math.round(x), Math.round(y), w, h);
  }
}

/** 自动描边：所有与不透明像素四邻接的透明像素补 1px 墨线 */
export function outline(g: CanvasRenderingContext2D, w: number, h: number, color = PALETTE.ink): void {
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = d[i * 4 + 3] > 0 ? 1 : 0;
  const r = (color >> 16) & 255;
  const gg = (color >> 8) & 255;
  const b = color & 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solid[i]) continue;
      const near =
        (x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w]);
      if (!near) continue;
      d[i * 4] = r;
      d[i * 4 + 1] = gg;
      d[i * 4 + 2] = b;
      d[i * 4 + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}
