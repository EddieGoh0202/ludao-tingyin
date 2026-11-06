import Phaser from 'phaser';
import type { ScenePalette } from '../types';
import { PALETTE as P, bevel, box, disc, framed, mix, oval, poly, px, seeded, trap, vgrad } from './common';

/**
 * v0.2 正式美术：六个场景的分层像素背景。
 * 每层先画进离屏 Graphics，再烘焙为贴图（bg-<palette>-<layer>），之后场景重进直接复用。
 */

type G = Phaser.GameObjects.Graphics;
type Rng = () => number;

const W = 720;
const H = 270;
/** y >= GROUND 的区域可行走 */
export const GROUND = 176;

interface LayerDef {
  id: 'sky' | 'far' | 'mid' | 'main' | 'ground' | 'front';
  sf: number;
  depth: number;
  draw: (g: G, w: number) => void;
}

/** 视差层只需覆盖相机实际能看到的宽度：480 + (720-480)*sf */
function layerWidth(sf: number): number {
  return sf >= 1 ? W : Math.ceil(480 + (W - 480) * sf) + 4;
}

function bake(scene: Phaser.Scene, palette: ScenePalette, layers: LayerDef[]): void {
  for (const L of layers) {
    const key = `bg-${palette}-${L.id}`;
    const w = layerWidth(L.sf);
    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      L.draw(g, w);
      g.generateTexture(key, w, H);
      g.destroy();
    }
    scene.add.image(0, 0, key).setOrigin(0).setScrollFactor(L.sf).setDepth(L.depth);
  }
}

function stack(sky: LayerDef['draw'], far: LayerDef['draw'], mid: LayerDef['draw'], main: LayerDef['draw'], ground: LayerDef['draw'], front: LayerDef['draw']): LayerDef[] {
  return [
    { id: 'sky', sf: 0.2, depth: 0, draw: sky },
    { id: 'far', sf: 0.35, depth: 1, draw: far },
    { id: 'mid', sf: 0.6, depth: 2, draw: mid },
    { id: 'main', sf: 1, depth: 3, draw: main },
    { id: 'ground', sf: 1, depth: 4, draw: ground },
    { id: 'front', sf: 1, depth: 25, draw: front },
  ];
}

// ———————————————————— 通用像素原语 ————————————————————

/** 下垂的线（电线、灯笼绳、晾衣绳），返回按 t 取点的函数 */
function sag(g: G, c: number, x0: number, y0: number, x1: number, y1: number, depth: number, alpha = 1): (t: number) => [number, number] {
  const at = (t: number): [number, number] => [Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t + depth * 4 * t * (1 - t))];
  const n = Math.max(2, Math.abs(x1 - x0));
  for (let i = 0; i <= n; i++) {
    const [x, y] = at(i / n);
    px(g, c, x, y, alpha);
  }
  return at;
}

/** 像素圆环（车轮、铜锣） */
function ring(g: G, c: number, cx: number, cy: number, r: number): void {
  const n = Math.max(12, Math.round(r * 8));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    px(g, c, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r));
  }
}

/** 半圆拱顶矩形（拱窗、拱门、券廊） */
function archFill(g: G, c: number, x: number, y: number, w: number, h: number, alpha = 1): void {
  const r = w / 2;
  for (let i = 0; i < h; i++) {
    let hw = r;
    if (i < r) {
      const d = r - i - 0.5;
      hw = Math.sqrt(Math.max(0, r * r - d * d));
    }
    const l = Math.round(x + r - hw);
    const rr = Math.round(x + r + hw);
    if (rr > l) box(g, c, l, y + i, rr - l, 1, alpha);
  }
}

/** 带 1px 描边的拱 */
function archFramed(g: G, edge: number, fill: number, x: number, y: number, w: number, h: number): void {
  archFill(g, edge, x - 1, y - 1, w + 2, h + 1);
  archFill(g, fill, x, y, w, h);
}

/** 山体 / 起伏轮廓：按列填充，fn(x) 返回顶端 y */
function hills(g: G, c: number, w: number, bottom: number, fn: (x: number) => number, top?: number, alpha = 1): void {
  for (let x = 0; x < w; x++) {
    const y = Math.round(fn(x));
    if (y < bottom) box(g, c, x, y, 1, bottom - y, alpha);
    if (top !== undefined) px(g, top, x, y, alpha);
  }
}

function cloud(g: G, x: number, y: number, w: number, light: number, shade: number, alpha = 1): void {
  const h = Math.max(5, Math.round(w / 4.5));
  oval(g, shade, x + w / 2, y + h * 0.72, w / 2, h * 0.38, alpha);
  oval(g, light, x + w * 0.34, y + h * 0.45, w * 0.24, h * 0.42, alpha);
  oval(g, light, x + w * 0.6, y + h * 0.32, w * 0.22, h * 0.5, alpha);
  oval(g, light, x + w * 0.8, y + h * 0.55, w * 0.14, h * 0.3, alpha);
  box(g, light, x + w * 0.12, y + h * 0.55, w * 0.76, h * 0.25, alpha);
}

/** 远飞的鸟（像素“V”） */
function bird(g: G, c: number, x: number, y: number): void {
  px(g, c, x, y);
  px(g, c, x + 1, y + 1);
  px(g, c, x + 2, y);
  px(g, c, x - 1, y - 1);
  px(g, c, x + 3, y - 1);
}

/** 树冠：暗、中、亮三层簇团 + 叶点 */
function canopy(g: G, cx: number, cy: number, r: number, rng: Rng, dark: number = P.leafDark, mid: number = P.leaf, light: number = P.leafLight, edge: number = P.ink): void {
  const blobs: Array<[number, number, number]> = [];
  for (let i = 0; i < 9; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * r * 0.62;
    blobs.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, r * (0.38 + rng() * 0.2)]);
  }
  for (const [x, y, rr] of blobs) disc(g, edge, x, y, rr + 1);
  for (const [x, y, rr] of blobs) disc(g, dark, x, y, rr);
  for (const [x, y, rr] of blobs) disc(g, mid, x - 1, y - 2, rr * 0.78);
  for (const [x, y, rr] of blobs) disc(g, light, x - rr * 0.3, y - rr * 0.4, rr * 0.35);
  for (let i = 0; i < r * 2; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * r * 0.8;
    px(g, rng() < 0.5 ? light : dark, Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d * 0.7));
  }
}

/** 伪汉字笔画：用小矩形暗示招牌字、门联、匾额 */
function glyphs(g: G, c: number, x: number, y: number, n: number, size: number, vertical: boolean, rng: Rng): void {
  for (let i = 0; i < n; i++) {
    const gx = vertical ? x : x + i * (size + 2);
    const gy = vertical ? y + i * (size + 2) : y;
    const s = size;
    const kind = Math.floor(rng() * 4);
    box(g, c, gx, gy + Math.floor(s / 3), s, 1);
    if (kind !== 1) box(g, c, gx + Math.floor(s / 2), gy, 1, s);
    if (kind === 1 || kind === 3) box(g, c, gx, gy + s - 1, s, 1);
    if (kind === 2) box(g, c, gx + 1, gy + Math.floor((s * 2) / 3), s - 2, 1);
    if (kind !== 0) px(g, c, gx + (rng() < 0.5 ? 0 : s - 1), gy + s - 2);
    if (kind === 3) box(g, c, gx, gy, 1, s);
  }
}

/** 红灯笼：x 为中心，y 为挂绳顶；glow 时带暖色光晕 */
function lantern(g: G, x: number, y: number, r: number, glow = false, body: number = P.flame): void {
  const cy = y + 3 + Math.round(r * 0.85);
  if (glow) {
    disc(g, P.glow, x, cy, r * 3.2, 0.08);
    disc(g, P.glow, x, cy, r * 2.2, 0.14);
  }
  box(g, P.ink, x, y, 1, 2);
  box(g, P.goldDark, x - Math.ceil(r / 2), y + 1, Math.ceil(r / 2) * 2 + 1, 2);
  oval(g, P.ink, x, cy, r + 1, Math.round(r * 0.85) + 1);
  oval(g, mix(body, P.shadow, 0.35), x, cy, r, Math.round(r * 0.85));
  oval(g, body, x - 1, cy - 1, r - 1, Math.round(r * 0.85) - 1);
  oval(g, glow ? P.glow : mix(body, P.cream, 0.4), x - Math.round(r / 3), cy - Math.round(r / 3), Math.max(1, Math.round(r / 3)), Math.max(1, Math.round(r / 3)));
  for (let k = -1; k <= 1; k += 2) box(g, mix(body, P.shadow, 0.45), x + k * Math.round(r / 2), cy - Math.round(r * 0.6), 1, Math.round(r * 1.2));
  const by = cy + Math.round(r * 0.85);
  box(g, P.goldDark, x - Math.ceil(r / 2), by, Math.ceil(r / 2) * 2 + 1, 2);
  box(g, P.gold, x, by + 2, 1, Math.max(2, Math.round(r / 2) + 1));
  box(g, body, x - 1, by + 2 + Math.max(2, Math.round(r / 2)), 3, 2);
}

/** 一串灯笼（沿下垂绳） */
function lanternString(g: G, x0: number, y0: number, x1: number, y1: number, depth: number, count: number, r: number, glow: boolean): void {
  const at = sag(g, P.ink, x0, y0, x1, y1, depth);
  for (let i = 1; i <= count; i++) {
    const [x, y] = at(i / (count + 1));
    lantern(g, x, y, r, glow);
  }
}

/** 上升的蒸汽 / 香烟 */
function steam(g: G, x: number, y: number, h: number, rng: Rng, c: number = P.cream, alpha = 0.35): void {
  for (let i = 0; i < h; i += 3) {
    const t = i / h;
    const dx = Math.round(Math.sin(i * 0.35 + rng() * 0.6) * (2 + t * 4));
    disc(g, c, x + dx, y - i, 1.5 + t * 3, alpha * (1 - t * 0.7));
  }
}

/** 盆栽：pot 为盆口宽 */
function potPlant(g: G, x: number, y: number, pot: number, rng: Rng, flower?: number): void {
  const ph = Math.round(pot * 0.8);
  trap(g, P.ink, y - ph - 1, y, x - 1, x + pot + 1, x + 1, x + pot - 1);
  trap(g, P.brickLight, y - ph, y - 1, x, x + pot, x + 2, x + pot - 2);
  box(g, P.brickDark, x + 2, y - 3, pot - 4, 2);
  box(g, P.brick, x, y - ph, pot, 2);
  const cx = x + pot / 2;
  const r = pot * 0.75;
  canopy(g, cx, y - ph - r * 0.55, r, rng);
  if (flower !== undefined) {
    for (let i = 0; i < pot; i++) px(g, flower, Math.round(cx + (rng() - 0.5) * r * 1.6), Math.round(y - ph - r * 0.55 + (rng() - 0.6) * r));
  }
}

/** 坐着的猫 */
function cat(g: G, x: number, y: number, fur: number, dark: number): void {
  box(g, P.ink, x - 1, y - 8, 8, 9);
  box(g, fur, x, y - 7, 6, 7);
  box(g, P.ink, x + 1, y - 12, 6, 5);
  box(g, fur, x + 2, y - 11, 4, 4);
  px(g, P.ink, x + 1, y - 13);
  px(g, P.ink, x + 6, y - 13);
  px(g, P.leafLight, x + 3, y - 10);
  px(g, P.leafLight, x + 5, y - 10);
  box(g, dark, x, y - 3, 6, 2);
  box(g, P.ink, x - 4, y - 2, 4, 1);
  box(g, fur, x - 4, y - 3, 3, 1);
}

/** 鸡 */
function chicken(g: G, x: number, y: number, body: number, flip = false): void {
  const d = flip ? -1 : 1;
  oval(g, P.ink, x, y - 5, 5, 4);
  oval(g, body, x, y - 5, 4, 3);
  box(g, P.ink, x + d * 3 - 1, y - 11, 4, 5);
  box(g, body, x + d * 3, y - 10, 2, 3);
  px(g, P.flame, x + d * 3, y - 12);
  px(g, P.flame, x + d * 4, y - 12);
  px(g, P.gold, x + d * 5, y - 9);
  px(g, P.ink, x + d * 4, y - 9);
  box(g, mix(body, P.shadow, 0.3), x - d * 3, y - 8, 2, 3);
  px(g, P.goldDark, x - 1, y - 1);
  px(g, P.goldDark, x + 1, y - 1);
  px(g, P.goldDark, x - 1, y);
  px(g, P.goldDark, x + 1, y);
}

/** 自行车（侧面） */
function bicycle(g: G, x: number, y: number, frame: number): void {
  ring(g, P.ink, x + 5, y - 5, 5);
  ring(g, P.ink, x + 21, y - 5, 5);
  ring(g, P.steel, x + 5, y - 5, 4);
  ring(g, P.steel, x + 21, y - 5, 4);
  const pts: Array<[number, number, number, number]> = [
    [x + 5, y - 5, x + 12, y - 5],
    [x + 12, y - 5, x + 19, y - 12],
    [x + 9, y - 12, x + 19, y - 12],
    [x + 9, y - 12, x + 12, y - 5],
    [x + 5, y - 5, x + 9, y - 12],
    [x + 19, y - 12, x + 21, y - 5],
  ];
  for (const [a, b, c, d] of pts) {
    const n = Math.max(Math.abs(c - a), Math.abs(d - b));
    for (let i = 0; i <= n; i++) px(g, frame, Math.round(a + ((c - a) * i) / n), Math.round(b + ((d - b) * i) / n));
  }
  box(g, P.ink, x + 7, y - 14, 5, 2);
  box(g, P.ink, x + 18, y - 15, 1, 3);
  box(g, P.ink, x + 16, y - 15, 5, 1);
  box(g, P.woodLight, x + 1, y - 13, 7, 3);
}

/** 挂着的灯泡 */
function bulb(g: G, x: number, y0: number, len: number, glow: boolean): void {
  box(g, P.ink, x, y0, 1, len);
  box(g, P.steelDark, x - 2, y0 + len, 5, 2);
  if (glow) {
    disc(g, P.glow, x, y0 + len + 4, 16, 0.08);
    disc(g, P.glow, x, y0 + len + 4, 9, 0.16);
  }
  disc(g, P.ink, x, y0 + len + 4, 3);
  disc(g, glow ? P.glowSoft : P.cream, x, y0 + len + 4, 2);
  px(g, P.cream, x - 1, y0 + len + 3);
}

/** 招牌：带边框与伪文字 */
function signboard(g: G, x: number, y: number, w: number, h: number, bg: number, fg: number, rng: Rng, vertical = false): void {
  framed(g, bg, x, y, w, h);
  box(g, mix(bg, P.cream, 0.25), x + 1, y + 1, w - 2, 1);
  box(g, mix(bg, P.shadow, 0.3), x + 1, y + h - 2, w - 2, 1);
  if (vertical) {
    const s = Math.max(3, w - 5);
    const n = Math.max(1, Math.floor((h - 4) / (s + 2)));
    glyphs(g, fg, x + Math.floor((w - s) / 2), y + 3, n, s, true, rng);
  } else {
    const s = Math.max(3, h - 6);
    const n = Math.max(1, Math.floor((w - 6) / (s + 2)));
    const total = n * (s + 2) - 2;
    glyphs(g, fg, x + Math.floor((w - total) / 2), y + 3, n, s, false, rng);
  }
}

/** 门联：门两侧的竖条红纸 */
function couplet(g: G, x: number, y: number, h: number, rng: Rng): void {
  framed(g, P.flame, x, y, 7, h, P.lacquerDark);
  glyphs(g, P.ink, x + 2, y + 3, Math.floor((h - 4) / 5), 3, true, rng);
}

/** 燕尾脊的单侧尾翘 */
function swallowTail(g: G, x0: number, y0: number, dir: 1 | -1, len: number, fill: number, light: number): void {
  const k = len * 0.9;
  for (let i = 0; i <= len; i++) {
    const xx = x0 + dir * i;
    const yy = Math.round(y0 - (i * i) / k);
    const th = Math.max(2, Math.round(5 - (i / len) * 3));
    box(g, P.ink, xx, yy - 1, 1, th + 2);
    box(g, fill, xx, yy, 1, th);
    px(g, light, xx, yy);
  }
  const tx = x0 + dir * len;
  const ty = Math.round(y0 - (len * len) / k);
  // 分叉的燕尾尖
  box(g, P.ink, tx + dir, ty - 4, 1, 4);
  box(g, fill, tx + dir, ty - 3, 1, 2);
  box(g, P.ink, tx + dir * 2, ty - 6, 1, 3);
  box(g, P.ink, tx + dir * 2, ty + 1, 1, 2);
  px(g, fill, tx + dir * 2, ty);
}

interface RoofColors {
  tile: number;
  tileDark: number;
  tileLight: number;
  ridge: number;
  ridgeLight: number;
  /** 屋脊上剪瓷雕的点缀色 */
  ornament?: number[];
}

const RED_ROOF: RoofColors = {
  tile: P.brick,
  tileDark: P.brickDark,
  tileLight: P.brickLight,
  ridge: P.brickDark,
  ridgeLight: P.brickLight,
  ornament: [P.sea, P.leafLight, P.gold, P.cream],
};

/** 闽南大厝正立面屋顶：瓦面 + 瓦当 + 燕尾脊 */
function swallowRoof(g: G, x: number, y: number, w: number, h: number, c: RoofColors, tail = 14, rng?: Rng): void {
  trap(g, P.ink, y, y + h + 1, x - 1, x + w + 1, x - 8, x + w + 8);
  trap(g, c.tile, y, y + h, x, x + w, x - 7, x + w + 7);
  // 筒瓦竖列
  for (let cx = x + 2; cx < x + w - 1; cx += 4) {
    box(g, c.tileDark, cx, y + 1, 1, h - 2);
    box(g, c.tileLight, cx + 1, y + 1, 1, h - 3);
  }
  // 檐口瓦当
  box(g, c.tileDark, x - 7, y + h - 3, w + 14, 3);
  for (let cx = x - 6; cx < x + w + 6; cx += 4) box(g, c.tileLight, cx, y + h - 3, 2, 2);
  box(g, P.shadow, x - 7, y + h, w + 14, 1, 0.5);
  // 屋脊
  box(g, P.ink, x - 2, y - 7, w + 4, 8);
  box(g, c.ridge, x - 1, y - 6, w + 2, 6);
  box(g, c.ridgeLight, x - 1, y - 6, w + 2, 1);
  box(g, mix(c.ridge, P.shadow, 0.3), x - 1, y - 1, w + 2, 1);
  if (c.ornament && rng) {
    for (let cx = x + 6; cx < x + w - 6; cx += 6) px(g, c.ornament[Math.floor(rng() * c.ornament.length)], cx, y - 4);
    // 脊中央的宝珠
    const mx = Math.round(x + w / 2);
    disc(g, P.ink, mx, y - 10, 3);
    disc(g, c.ornament[0], mx, y - 10, 2);
    px(g, P.cream, mx - 1, y - 11);
  }
  swallowTail(g, x - 1, y - 4, -1, tail, c.ridge, c.ridgeLight);
  swallowTail(g, x + w, y - 4, 1, tail, c.ridge, c.ridgeLight);
}

/** 红砖墙（白灰缝 + 砖色微差） */
function brickWall(g: G, x: number, y: number, w: number, h: number, rng: Rng, base: number = P.brick, mortar: number = mix(P.brick, P.plaster, 0.45)): void {
  box(g, base, x, y, w, h);
  const bh = 4;
  const bw = 10;
  for (let r = 0; r * bh < h; r++) {
    const yy = y + r * bh;
    const rowH = Math.min(bh, y + h - yy);
    box(g, mortar, x, yy + bh - 1, w, 1);
    const off = r % 2 ? bw / 2 : 0;
    for (let xx = x - off; xx < x + w; xx += bw) {
      const l = Math.max(x, xx);
      const rr = Math.min(x + w, xx + bw - 1);
      if (xx >= x) box(g, mortar, xx + bw - 1 <= x + w ? xx + bw - 1 : xx, yy, 1, rowH - 1);
      if (rr <= l) continue;
      const t = rng();
      if (t < 0.22) box(g, P.brickLight, l, yy, rr - l, rowH - 1);
      else if (t > 0.85) box(g, P.brickDark, l, yy, rr - l, rowH - 1);
      else box(g, P.brickLight, l, yy, rr - l, 1, 0.5);
    }
  }
}

/** 花岗岩块墙（石厝、台基） */
function graniteWall(g: G, x: number, y: number, w: number, h: number, rng: Rng, light: number = P.graniteLight, mid: number = P.granite, dark: number = P.graniteDark): void {
  box(g, mix(dark, P.shadow, 0.35), x, y, w, h);
  let yy = y;
  let row = 0;
  while (yy < y + h) {
    const rh = Math.min(6 + Math.floor(rng() * 4), y + h - yy);
    let xx = x - (row % 2 ? 6 : 0);
    while (xx < x + w) {
      const bw = 12 + Math.floor(rng() * 12);
      const l = Math.max(x, xx);
      const r = Math.min(x + w, xx + bw - 1);
      if (r - l >= 2 && rh >= 2) {
        const tone = rng();
        const m = tone < 0.3 ? mix(mid, light, 0.35) : tone > 0.8 ? mix(mid, dark, 0.35) : mid;
        bevel(g, l, yy, r - l, rh - 1, light, m, dark);
        for (let s = 0; s < (r - l) / 4; s++) px(g, rng() < 0.5 ? dark : light, l + 1 + Math.floor(rng() * (r - l - 2)), yy + 1 + Math.floor(rng() * Math.max(1, rh - 3)));
      }
      xx += bw;
    }
    yy += rh;
    row++;
  }
}

/** 出砖入石：花岗岩块与红砖片交错砌筑 */
function chuzhuanWall(g: G, x: number, y: number, w: number, h: number, rng: Rng): void {
  brickWall(g, x, y, w, h, rng);
  for (let yy = y + 1; yy < y + h - 4; yy += 9) {
    for (let xx = x + Math.floor(rng() * 6); xx < x + w - 6; xx += 10 + Math.floor(rng() * 10)) {
      const sw = 7 + Math.floor(rng() * 8);
      const sh = 5 + Math.floor(rng() * 4);
      const cw = Math.min(sw, x + w - xx);
      const ch = Math.min(sh, y + h - yy);
      if (cw < 4 || ch < 3) continue;
      box(g, P.ink, xx, yy, cw, ch, 0.5);
      bevel(g, xx, yy, cw - 1, ch - 1, P.graniteLight, rng() < 0.5 ? P.granite : P.stone, P.graniteDark);
    }
  }
}

/** 闽南“花窗”：绿釉瓷格栅 */
function glazedWindow(g: G, x: number, y: number, w: number, h: number, frame: number = P.graniteLight): void {
  framed(g, frame, x, y, w, h);
  box(g, P.graniteDark, x + 1, y + h - 2, w - 2, 1);
  box(g, P.shadow, x + 3, y + 3, w - 6, h - 6);
  const tile = 6;
  for (let yy = y + 3; yy < y + h - 4; yy += tile) {
    for (let xx = x + 3; xx < x + w - 4; xx += tile) {
      box(g, P.leafDark, xx, yy, tile - 1, tile - 1);
      box(g, P.leafLight, xx + 1, yy + 1, tile - 3, tile - 3);
      box(g, P.leaf, xx + 2, yy + 2, tile - 5 > 0 ? tile - 5 : 1, tile - 5 > 0 ? tile - 5 : 1);
      px(g, P.cream, xx + 1, yy + 1);
    }
  }
}

/** 带百叶窗的拱窗（骑楼、洋楼） */
function shutterArch(g: G, x: number, y: number, w: number, h: number, frame: number, shutter: number, glass: number): void {
  archFramed(g, P.ink, frame, x - 2, y - 2, w + 4, h + 3);
  archFill(g, glass, x, y, w, h);
  archFill(g, mix(glass, P.cream, 0.4), x + 2, y + 2, w - 4, Math.floor(h / 3));
  const half = Math.floor(w / 2);
  const sy = y + Math.floor(w / 2);
  for (const sx of [x - half + 1, x + w - 1]) {
    framed(g, shutter, sx, sy, half, h - Math.floor(w / 2));
    for (let yy = sy + 2; yy < y + h - 1; yy += 2) box(g, mix(shutter, P.shadow, 0.35), sx + 1, yy, half - 2, 1);
  }
  box(g, P.ink, x + half, y + 1, 1, h - 1);
  box(g, frame, x - 3, y + h, w + 6, 2);
  box(g, P.shadow, x - 3, y + h + 2, w + 6, 1, 0.4);
}

/** 透视铺地：越靠近镜头行越高、砖越宽 */
function paving(
  g: G,
  rng: Rng,
  o: { base: number; light: number; dark: number; seam: number; row0: number; tile0: number; vary?: number; from?: number; to?: number },
): void {
  const from = o.from ?? 0;
  const to = o.to ?? W;
  box(g, o.base, from, GROUND, to - from, H - GROUND);
  let y = GROUND;
  let row = 0;
  while (y < H) {
    const k = (y - GROUND) / (H - GROUND);
    const rh = Math.round(o.row0 * (1 + k * 1.2));
    const tw = Math.round(o.tile0 * (1 + k * 0.8));
    const off = row % 2 ? Math.floor(tw / 2) : 0;
    for (let x = from - off; x < to; x += tw) {
      const l = Math.max(from, x);
      const r = Math.min(to, x + tw - 1);
      if (r <= l) continue;
      const v = rng();
      const fill = v < 0.25 ? mix(o.base, o.light, o.vary ?? 0.35) : v > 0.82 ? mix(o.base, o.dark, o.vary ?? 0.35) : o.base;
      box(g, fill, l, y, r - l, rh - 1);
      box(g, o.light, l, y, r - l, 1, 0.6);
      box(g, o.seam, r, y, 1, rh);
    }
    box(g, o.seam, from, y + rh - 1, to - from, 1);
    y += rh;
    row++;
  }
  // 墙根的接触阴影
  box(g, P.shadow, from, GROUND, to - from, 2, 0.35);
  box(g, P.shadow, from, GROUND + 2, to - from, 3, 0.15);
}

/** 草丛（前景/墙角） */
function tuft(g: G, x: number, y: number, rng: Rng, c1: number = P.leaf, c2: number = P.leafLight): void {
  for (let i = 0; i < 7; i++) {
    const h = 3 + Math.floor(rng() * 6);
    const xx = x + i * 2 - 6 + Math.floor(rng() * 2);
    box(g, P.leafDark, xx, y - h, 1, h);
    px(g, i % 2 ? c1 : c2, xx, y - h);
  }
}

// ———————————————————— 1. 外妈老厝 Guā-má ê lāu-tshù ————————————————————
function laocuoLayers(): LayerDef[] {
  const sky: LayerDef['draw'] = (g, w) => {
    vgrad(g, 0, 0, w, GROUND + 6, 0x8fbcd6, 0xf7e3bb, 9);
    disc(g, 0xfff3d0, 596, 44, 30, 0.18);
    disc(g, 0xfff7e2, 596, 44, 20, 0.4);
    disc(g, 0xfffdf2, 596, 44, 12);
    disc(g, 0xffffff, 594, 42, 6);
    cloud(g, 40, 34, 96, 0xfffbf0, 0xdfe8ea, 0.75);
    cloud(g, 250, 66, 72, 0xffffff, 0xe6e9e4, 0.5);
    cloud(g, 392, 22, 60, 0xffffff, 0xe6e9e4, 0.4);
    for (const [x, y] of [[320, 30], [338, 24], [352, 34]] as const) bird(g, 0x8a8f7d, x, y);
  };

  const far: LayerDef['draw'] = (g, w) => {
    hills(g, 0xb9c9b4, w, GROUND, (x) => 138 - Math.sin(x / 96) * 12 - Math.sin(x / 41) * 5, 0xa2b79e);
    hills(g, 0x93ab8f, w, GROUND, (x) => 152 - Math.sin(x / 63 + 1.6) * 9 - Math.sin(x / 27) * 3, 0x81997d);
    const rng = seeded(11);
    // 远处的红瓦小村
    for (let i = 0; i < 9; i++) {
      const x = i * 84 + 8;
      const bh = 20 + Math.floor(rng() * 12);
      box(g, 0xc9b99a, x, GROUND - bh, 62, bh);
      box(g, 0xb0a084, x, GROUND - 6, 62, 6);
      trap(g, 0xa8634f, GROUND - bh - 8, GROUND - bh + 1, x - 3, x + 65, x - 1, x + 63);
      box(g, 0x8e5342, x - 3, GROUND - bh - 9, 68, 2);
      for (let k = 0; k < 3; k++) box(g, 0x7d6f57, x + 8 + k * 18, GROUND - bh + 6, 7, 8);
      if (i % 3 === 0) canopy(g, x + 68, GROUND - bh - 4, 15, rng, 0x5d7a52, 0x6f8f60, 0x87a574, 0x7d8b6f);
    }
    box(g, 0xa9bea3, 0, GROUND - 3, w, 3);
    box(g, 0x93aa8d, 0, GROUND - 1, w, 1, 0.6);
  };

  const mid: LayerDef['draw'] = (g, w) => {
    const rng = seeded(23);
    // 邻家护厝
    box(g, 0xcdbb9b, 40, 96, 168, GROUND - 96);
    box(g, 0xb9a585, 40, GROUND - 14, 168, 14);
    trap(g, 0xa8634f, 88, 110, 34, 216, 30, 220);
    box(g, 0x8e5342, 32, 88, 190, 3);
    box(g, 0x8e5342, 30, 84, 6, 5);
    box(g, 0x8e5342, 214, 84, 6, 5);
    for (let x = 44; x < 206; x += 6) box(g, 0x96604d, x, 90, 1, 20);
    box(g, 0x8d7f68, 0, 96, 40, GROUND - 96);
    for (let y = 100; y < GROUND; y += 7) box(g, 0x7d7059, 0, y, 40, 1);
    // 瓦顶上晾的干货
    box(g, 0xc9a15f, 96, 92, 22, 4);
    box(g, 0xd98b4a, 100, 90, 5, 3);
    box(g, 0xb5652f, 110, 90, 5, 3);

    box(g, 0xcdbb9b, 548, 84, 176, GROUND - 84);
    trap(g, 0x9d5a49, 74, 100, 540, 730, 534, 730);
    box(g, 0x83493c, 534, 72, 190, 3);
    for (let x = 552; x < 720; x += 6) box(g, 0x8f5b4a, x, 76, 1, 24);
    for (const wx of [578, 636]) {
      framed(g, 0x7d6f57, wx, 108, 26, 20);
      box(g, 0x5b6b66, wx + 2, 110, 22, 16);
      box(g, 0x7d6f57, wx + 12, 110, 2, 16);
    }
    // 竹丛与晾衣绳
    for (let i = 0; i < 5; i++) {
      const bx = 214 + i * 5;
      box(g, P.leafDark, bx, 116, 2, 60);
      for (let k = 0; k < 4; k++) box(g, P.leaf, bx - 2 - k * 2, 122 + k * 9, 6, 1);
    }
    sag(g, 0x6d6152, 24, 60, 236, 54, 8);
    const at = sag(g, 0x6d6152, 24, 60, 236, 54, 8);
    for (const t of [0.24, 0.52, 0.78]) {
      const [cx, cy] = at(t);
      box(g, 0xe8e2d0, cx - 5, cy, 10, 12);
      box(g, 0x8fb2bd, cx - 5, cy + 8, 10, 2);
    }
    // 电线杆与燕子
    box(g, 0x6d6152, 470, 30, 3, 146);
    box(g, 0x6d6152, 456, 40, 32, 2);
    sag(g, 0x5b5148, 0, 44, 470, 40, 14);
    sag(g, 0x5b5148, 471, 40, 730, 36, 12);
    for (const [x, y] of [[120, 62], [132, 56], [300, 50], [312, 58], [600, 46]] as const) bird(g, 0x4a3629, x, y);
    // 瓦面与墙面的斑驳（让远景也有颗粒）
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(rng() * w);
      const y = 100 + Math.floor(rng() * 70);
      px(g, rng() < 0.5 ? 0xb9a585 : 0xdfcfb0, x, y, 0.5);
    }
  };

  const main: LayerDef['draw'] = (g) => {
    const rng = seeded(37);
    // 左护厝
    box(g, 0xd9c8a8, -10, 96, 168, GROUND - 96);
    chuzhuanWall(g, -10, 116, 168, GROUND - 116, rng);
    box(g, P.plaster, -10, 96, 168, 8);
    box(g, P.plasterDark, -10, 104, 168, 2);
    trap(g, P.ink, 96, 116, -22, 168, -18, 168);
    trap(g, P.brick, 98, 114, -20, 166, -16, 168);
    for (let x = -14; x < 166; x += 5) box(g, P.brickDark, x, 100, 1, 14);
    box(g, P.brickDark, -20, 95, 190, 3);
    swallowTail(g, 156, 98, 1, 12, P.brickDark, P.brickLight);
    glazedWindow(g, 44, 128, 40, 34);
    box(g, P.graniteDark, 44, 162, 40, 3);
    // 护厝里透出的一点暖光
    framed(g, P.woodDark, 104, 132, 34, 44);
    box(g, 0x6b4a35, 106, 134, 30, 42);
    box(g, 0xe7b877, 108, 136, 26, 30, 0.55);

    // 正身
    box(g, P.plaster, 150, 88, 460, GROUND - 88);
    brickWall(g, 150, 88, 460, GROUND - 88, rng);
    box(g, P.graniteDark, 150, GROUND - 12, 460, 12);
    graniteWall(g, 150, GROUND - 12, 460, 12, rng);
    box(g, P.graniteDark, 150, GROUND - 13, 460, 2);
    box(g, P.plaster, 150, 88, 460, 6);
    box(g, P.plasterDark, 150, 94, 460, 1);
    // 檐下彩绘带
    box(g, P.ink, 150, 96, 460, 9);
    box(g, 0x8c4a3a, 151, 97, 458, 7);
    for (let x = 154; x < 606; x += 11) {
      box(g, [P.sea, P.gold, P.leafLight, P.cream][Math.floor(rng() * 4)], x, 98, 8, 5);
      px(g, P.flame, x + 3, 100);
    }
    // 凹寿门廊
    box(g, P.ink, 358, 104, 92, 74);
    box(g, 0x6b3b2c, 360, 106, 88, 72);
    box(g, 0x79432f, 360, 106, 88, 4);
    box(g, P.graniteLight, 364, 140, 80, 38);
    box(g, P.granite, 366, 142, 76, 36);
    framed(g, P.ink, 378, 118, 52, 58, P.lacquerDark);
    box(g, P.lacquer, 380, 120, 48, 54);
    box(g, P.ink, 404, 120, 2, 54);
    box(g, P.gold, 398, 146, 5, 5);
    box(g, P.gold, 408, 146, 5, 5);
    box(g, P.goldLight, 399, 147, 3, 3);
    // 门印“春”
    poly(g, P.cream, [386, 132, 392, 126, 398, 132, 392, 138]);
    // 门联
    couplet(g, 366, 120, 52, rng);
    couplet(g, 438, 120, 52, rng);
    // 匾额
    framed(g, P.ink, 384, 104, 46, 13, P.woodDark);
    box(g, P.woodDark, 385, 105, 44, 11);
    glyphs(g, P.gold, 389, 107, 4, 6, false, rng);
    // 门楣挂灯
    lantern(g, 352, 100, 5, true);
    lantern(g, 456, 100, 5, true);
    // 两侧花窗
    glazedWindow(g, 196, 118, 46, 40);
    glazedWindow(g, 520, 118, 46, 40);
    box(g, P.graniteDark, 196, 158, 46, 3);
    box(g, P.graniteDark, 520, 158, 46, 3);
    // 正身屋顶
    swallowRoof(g, 138, 84, 484, 26, RED_ROOF, 15, rng);
    // 瓦上长的小草
    for (const [x, y] of [[220, 70], [300, 74], [470, 72], [556, 69]] as const) tuft(g, x, y, rng);
    // 墙脚小物
    framed(g, P.ink, 300, 132, 26, 30, P.woodDark);
    box(g, P.wood, 302, 134, 22, 26);
    box(g, P.woodLight, 304, 136, 18, 10);
    box(g, P.ink, 306, 150, 14, 2);
    // 扫帚
    box(g, P.woodDark, 344, 140, 2, 34);
    trap(g, 0xc9a15f, 172, 176, 336, 350, 340, 346);

    // 右护厝 + 埕墙
    box(g, 0xd9c8a8, 610, 96, 130, 80);
    chuzhuanWall(g, 610, 116, 130, 60, rng);
    box(g, P.plaster, 610, 96, 130, 8);
    trap(g, P.brick, 610, 112, 608, 742, 606, 742);
    for (let x = 612; x < 738; x += 5) box(g, P.brickDark, x, 100, 1, 12);
    box(g, P.brickDark, 604, 93, 138, 3);
    glazedWindow(g, 648, 126, 34, 30);

    // 天井埕墙（低矮，露出后面龙眼树）
    box(g, P.ink, 470, 126, 250, 52);
    box(g, P.plaster, 471, 127, 248, 50);
    box(g, P.plasterDark, 471, 172, 248, 5);
    box(g, P.brickDark, 468, 123, 254, 4);
    for (let x = 470; x < 718; x += 9) box(g, P.brickLight, x, 123, 5, 2);
    // 埕墙花窗
    for (const wx of [628, 686]) {
      box(g, P.graniteDark, wx, 140, 30, 24);
      box(g, P.cream, wx + 2, 142, 26, 20);
      for (let k = 0; k < 3; k++) box(g, P.brick, wx + 6 + k * 8, 142, 2, 20);
      box(g, P.brick, wx + 2, 150, 26, 2);
    }

    // 龙眼树
    box(g, P.ink, 686, 40, 14, 96);
    box(g, 0x6b4a2f, 688, 40, 10, 96);
    box(g, 0x855c3a, 689, 40, 3, 96);
    for (const [bx, by] of [[674, 76], [700, 66], [660, 92]] as const) {
      const n = Math.abs(by - 76);
      for (let i = 0; i < n; i++) px(g, 0x6b4a2f, Math.round(bx + ((684 - bx) * i) / n), by + i);
    }
    canopy(g, 690, 52, 46, rng);
    canopy(g, 620, 62, 32, rng);
    canopy(g, 716, 78, 28, rng);
    for (let i = 0; i < 14; i++) {
      const x = 600 + Math.floor(rng() * 120);
      const y = 74 + Math.floor(rng() * 50);
      disc(g, 0x7a5a3a, x, y, 2);
      px(g, 0xc9a15f, x - 1, y - 1);
    }

    // 阿公的藤椅（呼应 x≈540）
    box(g, P.ink, 514, 138, 34, 40);
    box(g, 0xa87a45, 515, 139, 32, 38);
    for (let y = 142; y < 172; y += 3) box(g, 0x8a6231, 517, y, 28, 1);
    box(g, P.woodDark, 514, 152, 34, 3);
    box(g, 0x8a6231, 510, 158, 4, 20);
    box(g, 0x8a6231, 548, 158, 4, 20);
    box(g, P.ink, 508, 176, 8, 2);
    box(g, P.ink, 546, 176, 8, 2);
    // 藤椅边的小竹凳 + 茶壶
    box(g, P.ink, 560, 159, 13, 19);
    box(g, 0xc9a15f, 561, 160, 11, 17);
    box(g, 0xa87a45, 559, 156, 15, 3);
    box(g, P.brickLight, 563, 150, 7, 6);
    box(g, P.brick, 564, 151, 5, 4);
    box(g, P.ink, 569, 152, 3, 2);

    // 水缸
    box(g, P.ink, 570, 148, 24, 30);
    oval(g, 0x9d7a55, 582, 164, 11, 13);
    oval(g, 0x6f5232, 582, 158, 10, 5);
    box(g, P.cream, 572, 162, 20, 2, 0.4);
    box(g, 0x8a6231, 576, 152, 12, 2, 0.5);

    // 晒菜脯的竹架
    box(g, P.ink, 600, 146, 2, 32);
    box(g, P.ink, 664, 146, 2, 32);
    box(g, P.wood, 598, 148, 70, 2);
    for (const [sx, sy] of [[602, 152], [636, 156], [600, 160]] as const) {
      oval(g, P.ink, sx + 14, sy + 3, 16, 5);
      oval(g, 0xc9a15f, sx + 14, sy + 3, 15, 4);
      for (let k = 0; k < 6; k++) box(g, 0xd98b4a, sx + 4 + k * 4, sy + 2 + (k % 2), 3, 2);
      box(g, 0xa87a45, sx + 1, sy + 3, 26, 1, 0.5);
    }
    // 靠墙的柴垛
    for (let i = 0; i < 7; i++) {
      disc(g, P.ink, 302 + i * 4, 172 - (i % 2) * 4, 3);
      disc(g, P.wood, 302 + i * 4, 172 - (i % 2) * 4, 2);
    }
    // 鸡
    chicken(g, 200, 176, P.cream);
    chicken(g, 218, 178, 0xe0c48a, true);
    // 埕墙上的猫
    cat(g, 486, 124, 0xe3b978, 0xbf8b4a);
    // 檐下燕子窝
    box(g, 0x8a6231, 500, 92, 12, 6);
    box(g, P.ink, 502, 93, 8, 3);
    px(g, P.cream, 504, 95);
    px(g, P.cream, 508, 95);
  };

  const ground: LayerDef['draw'] = (g) => {
    const rng = seeded(53);
    paving(g, rng, {
      base: 0xb08060,
      light: 0xc79a76,
      dark: 0x8f6549,
      seam: 0x7d5740,
      row0: 8,
      tile0: 24,
      vary: 0.3,
    });
    // 石板边与苔痕
    box(g, P.granite, 0, GROUND, W, 3);
    box(g, P.graniteLight, 0, GROUND, W, 1);
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(rng() * W);
      const y = GROUND + 4 + Math.floor(rng() * (H - GROUND - 6));
      box(g, 0x7f8f5f, x, y, 2 + Math.floor(rng() * 4), 1, 0.5);
    }
    // 阳光斜照的暖斑
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(rng() * W);
      const y = GROUND + 4 + Math.floor(rng() * (H - GROUND));
      box(g, 0xe0b58a, x, y, 6 + Math.floor(rng() * 10), 1, 0.12);
    }
    // 排水沟槽
    box(g, 0x8f6549, 0, 250, W, 1, 0.6);
    // 天井里的水痕
    oval(g, 0x9a7050, 260, 236, 34, 5, 0.35);
    oval(g, 0xa87c58, 262, 235, 28, 3, 0.35);
  };

  const front: LayerDef['draw'] = (g) => {
    const rng = seeded(71);
    // 左下角落的大盆栽
    box(g, P.ink, -14, 246, 44, 26);
    box(g, P.brickDark, -12, 248, 40, 22);
    box(g, P.brick, -10, 250, 36, 4);
    canopy(g, 8, 244, 20, rng);
    // 右侧角落的三角梅陶盆
    box(g, P.ink, 676, 244, 46, 28);
    box(g, 0xa85a3c, 678, 246, 42, 24);
    box(g, P.brickLight, 680, 248, 38, 3);
    canopy(g, 700, 242, 22, rng, P.bougainDark, P.bougain, P.bougainLight);
    for (let i = 0; i < 16; i++) px(g, i % 2 ? P.bougainLight : P.bougain, 682 + Math.floor(rng() * 38), 216 + Math.floor(rng() * 26));
    // 最底边一排鹅卵石
    for (let x = 0; x < W; x += 7) {
      oval(g, P.graniteDark, x, 267, 4, 3, 0.5);
    }
    // 左右两端的低矮花丛，避开中间槽位
    tuft(g, 40, 268, rng);
    tuft(g, 660, 268, rng);
    box(g, P.ink, 632, 262, 18, 3);
    box(g, P.steelDark, 634, 262, 14, 1);
  };

  return stack(sky, far, mid, main, ground, front);
}

// ———————————————————— 2. 八市 Pat-tshī ————————————————————
/** 泡沫箱 */
function foamBox(g: G, x: number, y: number, w: number, h: number, ice = false): void {
  framed(g, P.foam, x, y - h, w, h, P.foamDark);
  box(g, P.foamDark, x + 1, y - 3, w - 2, 2);
  box(g, 0xffffff, x + 1, y - h + 1, w - 2, 1);
  if (ice) {
    for (let i = 2; i < w - 2; i += 3) px(g, 0xd9eef5, x + i, y - h - 1);
  }
}

/** 红/蓝塑料盆（俯侧视） */
function basin(g: G, cx: number, y: number, r: number, c: number, fill?: number): void {
  oval(g, P.ink, cx, y - 3, r + 1, 4);
  trap(g, P.ink, y - 3, y + 1, cx - r - 1, cx + r + 2, cx - r + 2, cx + r - 1);
  trap(g, mix(c, P.shadow, 0.3), y - 3, y, cx - r, cx + r + 1, cx - r + 3, cx + r - 2);
  oval(g, c, cx, y - 4, r, 3);
  oval(g, fill ?? mix(c, P.shadow, 0.45), cx, y - 4, r - 2, 2);
}

/** 小鱼（侧面） */
function fish(g: G, x: number, y: number, len: number, body: number, flip = false): void {
  const d = flip ? -1 : 1;
  oval(g, P.ink, x, y, len / 2 + 1, 2);
  oval(g, body, x, y, len / 2, 1);
  px(g, mix(body, 0xffffff, 0.5), x - d * Math.round(len / 4), y - 1);
  px(g, P.ink, x + d * Math.round(len / 2 - 2), y);
  box(g, P.ink, x - d * Math.round(len / 2 + 2), y - 2, 1, 5);
  box(g, body, x - d * Math.round(len / 2 + 1), y - 1, 1, 3);
}

/** 遮阳伞（侧视半圆） */
function parasol(g: G, cx: number, top: number, r: number, a: number, b: number): void {
  archFill(g, P.ink, cx - r - 1, top - 1, r * 2 + 2, Math.round(r * 0.55) + 2);
  for (let i = 0; i < 6; i++) {
    const x0 = cx - r + Math.round((i * r * 2) / 6);
    const x1 = cx - r + Math.round(((i + 1) * r * 2) / 6);
    for (let x = x0; x < x1; x++) {
      const dx = (x - cx + 0.5) / r;
      const t = Math.round(top + Math.round(r * 0.55) * (1 - Math.sqrt(Math.max(0, 1 - dx * dx))));
      box(g, i % 2 ? a : b, x, t, 1, top + Math.round(r * 0.55) - t + 1);
    }
  }
  for (let x = cx - r; x < cx + r; x += 4) archFill(g, P.ink, x, top + Math.round(r * 0.55), 4, 3, 0.6);
  box(g, P.steelDark, cx, top + Math.round(r * 0.55), 1, 40);
}

function bashiLayers(): LayerDef[] {
  const sky: LayerDef['draw'] = (g, w) => {
    vgrad(g, 0, 0, w, GROUND, 0xb7cbd2, 0xeae3cf, 8);
    disc(g, 0xfff4da, 120, 40, 22, 0.35);
    disc(g, 0xfff8e8, 120, 40, 12, 0.7);
    cloud(g, 200, 30, 110, 0xf4f1e8, 0xd6dad6, 0.7);
    cloud(g, 20, 60, 70, 0xf4f1e8, 0xd6dad6, 0.5);
    cloud(g, 380, 44, 80, 0xf4f1e8, 0xd6dad6, 0.55);
    for (const [x, y] of [[300, 40], [314, 34], [326, 44]] as const) bird(g, 0x7a7f78, x, y);
  };

  const far: LayerDef['draw'] = (g, w) => {
    const rng = seeded(101);
    // 老城的公寓楼剪影
    let x = -6;
    while (x < w) {
      const bw = 40 + Math.floor(rng() * 40);
      const bh = 50 + Math.floor(rng() * 50);
      const c = rng() < 0.5 ? 0xb9bfb8 : 0xc8c4b6;
      box(g, c, x, GROUND - bh, bw, bh);
      box(g, mix(c, 0xffffff, 0.25), x, GROUND - bh, bw, 2);
      for (let yy = GROUND - bh + 6; yy < GROUND - 8; yy += 9) {
        for (let xx = x + 4; xx < x + bw - 6; xx += 8) box(g, rng() < 0.15 ? 0xe8d9a8 : 0x8e9893, xx, yy, 4, 5);
      }
      // 屋顶水塔、天线、晾衣
      if (rng() < 0.5) box(g, 0x9aa09a, x + 6, GROUND - bh - 8, 10, 8);
      if (rng() < 0.5) box(g, 0x8e9893, x + bw - 10, GROUND - bh - 14, 1, 14);
      x += bw + 2;
    }
    box(g, 0xa9b0a8, 0, GROUND - 4, w, 4);
  };

  const mid: LayerDef['draw'] = (g, w) => {
    const rng = seeded(117);
    // 骑楼老街的二楼立面（远一层）
    box(g, 0xd6c49c, 0, 70, w, GROUND - 70);
    for (let x = 0; x < w; x += 60) {
      box(g, 0xc6b289, x, 70, 2, GROUND - 70);
      shutterArch(g, x + 18, 92, 22, 30, 0xe9dcbc, 0x5f8f7c, 0x5b6b66);
    }
    box(g, 0xb9a585, 0, 66, w, 6);
    for (let x = 0; x < w; x += 8) box(g, 0xe9dcbc, x + 2, 64, 4, 3);
    // 二楼伸出的晾衣竹竿
    for (const bx of [40, 220, 400]) {
      box(g, P.woodLight, bx, 126, 46, 1);
      for (let i = 0; i < 4; i++) {
        const c = [0xe8e2d0, 0x8fb2bd, 0xc96f5a, 0xf2c94c][Math.floor(rng() * 4)];
        box(g, c, bx + 4 + i * 10, 127, 7, 10 + Math.floor(rng() * 4));
      }
    }
    // 空调外机与水管
    for (const ax of [130, 330, 510]) {
      framed(g, 0xd8d8d0, ax, 128, 20, 14, 0x8a8a80);
      disc(g, 0x8a8a80, ax + 13, 135, 4);
      box(g, 0x7a7a70, ax + 22, 130, 1, GROUND - 130);
    }
    sag(g, 0x4a4a44, 0, 60, w, 56, 10);
    sag(g, 0x4a4a44, 0, 64, w, 62, 6);
    for (let i = 0; i < 18; i++) px(g, 0xb9a585, Math.floor(rng() * w), 75 + Math.floor(rng() * 90), 0.6);
  };

  const main: LayerDef['draw'] = (g) => {
    const rng = seeded(131);
    // 骑楼柱廊：深色店面 + 柱子
    box(g, 0x4a3a2e, 0, 96, W, GROUND - 96);
    box(g, 0x5a4636, 0, 96, W, 3);
    for (let x = 0; x < W; x += 30) box(g, 0x3e3026, x, 100, 1, GROUND - 100);
    // 檐口与“八市”匾
    box(g, P.ink, 0, 82, W, 16);
    box(g, 0xd6c49c, 0, 83, W, 13);
    box(g, 0xb9a585, 0, 94, W, 2);
    signboard(g, 290, 60, 140, 22, P.lacquer, P.gold, rng);
    lantern(g, 280, 82, 5, false);
    lantern(g, 440, 82, 5, false);
    for (let x = 30; x < W; x += 90) {
      bevel(g, x, 96, 12, GROUND - 96, 0xe9dcbc, 0xd6c49c, 0xa9967a, P.ink);
      box(g, 0xb9a585, x - 2, 96, 16, 4);
      box(g, 0xa9967a, x - 1, GROUND - 6, 14, 6);
    }
    // 店内货架与吊灯
    for (const sx of [56, 236, 506, 626]) {
      box(g, P.woodDark, sx, 110, 50, 2);
      box(g, P.woodDark, sx, 128, 50, 2);
      for (let k = 0; k < 8; k++) box(g, [P.plasticRed, P.goldLight, P.cream, P.leafLight][Math.floor(rng() * 4)], sx + 2 + k * 6, 104 + (k % 2), 4, 6);
      for (let k = 0; k < 6; k++) box(g, [0xc9a15f, 0xd98b4a, P.foam][Math.floor(rng() * 3)], sx + 3 + k * 8, 122, 6, 6);
      bulb(g, sx + 25, 99, 4, true);
    }
    // 不锈钢鱼摊（x≈160）
    framed(g, P.steelLight, 128, 146, 66, 8, P.steelDark);
    box(g, P.steel, 132, 154, 4, 22);
    box(g, P.steel, 186, 154, 4, 22);
    box(g, 0xd9eef5, 130, 142, 62, 5);
    for (let k = 0; k < 6; k++) fish(g, 138 + k * 9, 142 - (k % 2), 8, k % 3 ? 0x9fb3bd : 0xd7a07a, k % 2 === 1);
    for (const tx of [140, 168]) {
      framed(g, P.cream, tx, 132, 12, 8);
      box(g, P.flame, tx + 2, 135, 8, 1);
    }
    // 头家娘海鲜摊（x≈340）
    parasol(g, 340, 104, 40, P.plasticRed, P.cream);
    foamBox(g, 306, 176, 22, 14, true);
    foamBox(g, 330, 176, 22, 14, true);
    foamBox(g, 354, 176, 22, 14, true);
    basin(g, 317, 160, 9, P.plasticRed, 0x5f8f9c);
    basin(g, 341, 160, 9, P.plasticBlue, 0x5f8f9c);
    basin(g, 365, 160, 9, P.plasticRed, 0x5f8f9c);
    for (const [x, y] of [[314, 155], [344, 155], [362, 156]] as const) fish(g, x, y, 7, 0xa8b8b8);
    // 蛏、螃蟹点缀
    for (let k = 0; k < 5; k++) px(g, 0xd98b4a, 336 + k * 2, 156);
    framed(g, P.steelLight, 378, 150, 14, 8, P.steelDark);
    box(g, 0x7fd36a, 381, 152, 8, 2);
    for (let k = 0; k < 3; k++) box(g, [P.plasticRed, 0xf2f2f2, P.plasticBlue][k], 386 + k * 3, 140, 2, 8, 0.85);
    // 干货铺（x≈494–600）：麻袋 + 挂着的鱿鱼干
    for (let k = 0; k < 4; k++) {
      const bx = 494 + k * 26;
      trap(g, P.ink, 152, 177, bx - 1, bx + 21, bx - 3, bx + 23);
      trap(g, 0xc8ad7c, 153, 176, bx, bx + 20, bx - 2, bx + 22);
      box(g, 0xa98d5c, bx, 158, 20, 1);
      oval(g, [0xd98b4a, 0xb5652f, 0xe8d3a1, 0x8e5a3a][k], bx + 10, 153, 9, 3);
      for (let i = 0; i < 6; i++) px(g, P.cream, bx + 3 + Math.floor(rng() * 14), 152 + Math.floor(rng() * 3), 0.6);
    }
    box(g, P.woodDark, 488, 112, 116, 2);
    for (let k = 0; k < 9; k++) {
      const sx = 492 + k * 12;
      box(g, P.ink, sx + 3, 114, 1, 3);
      trap(g, 0xd9a86a, 117, 134, sx, sx + 8, sx + 1, sx + 7);
      box(g, 0xb57d45, sx + 1, 130, 6, 4);
      for (let i = 0; i < 3; i++) box(g, 0xb57d45, sx + 1 + i * 2, 134, 1, 3);
    }
    signboard(g, 520, 98, 60, 12, P.goldDark, P.cream, rng);
    // 左侧水桶与扁担
    for (const bx of [16, 40]) {
      trap(g, P.ink, 160, 177, bx - 1, bx + 15, bx + 1, bx + 13);
      trap(g, P.plasticBlue, 161, 176, bx, bx + 14, bx + 2, bx + 12);
      box(g, mix(P.plasticBlue, P.cream, 0.4), bx, 161, 14, 1);
    }
    box(g, P.woodLight, 6, 154, 56, 2);
    bicycle(g, 210, 176, P.plasticBlue);
    foamBox(g, 584, 176, 20, 10);
    cat(g, 590, 166, 0xe8e2d0, 0xa09a90);
    potPlant(g, 676, 176, 16, rng);
    // 地上的电线与招牌灯
    for (const [x, y] of [[100, 92], [460, 92], [640, 92]] as const) px(g, P.glow, x, y);
  };

  const ground: LayerDef['draw'] = (g) => {
    const rng = seeded(149);
    paving(g, rng, { base: 0x8f9590, light: 0xa8aea8, dark: 0x6f7570, seam: 0x5d625e, row0: 7, tile0: 20, vary: 0.3 });
    // 骑楼台阶边
    box(g, P.graniteDark, 0, GROUND, W, 3);
    box(g, P.graniteLight, 0, GROUND, W, 1);
    // 排水沟盖板
    for (let x = 4; x < W; x += 34) {
      framed(g, 0x5d625e, x, 190, 28, 5, P.ink);
      for (let k = 2; k < 26; k += 3) box(g, P.ink, x + k, 191, 1, 3);
    }
    // 水洼与倒影
    for (const [x, y, r] of [[120, 226, 26], [400, 246, 34], [610, 218, 20]] as const) {
      oval(g, 0x7e98a3, x, y, r, 4, 0.55);
      oval(g, 0xb7cbd2, x - 4, y - 1, r * 0.6, 2, 0.5);
      box(g, P.plasticRed, x - 2, y - 1, 4, 1, 0.5);
    }
    // 湿地上的水光
    for (let i = 0; i < 50; i++) px(g, 0xdfe7e4, Math.floor(rng() * W), GROUND + 6 + Math.floor(rng() * (H - GROUND - 8)), 0.55);
    // 散落的鱼鳞与菜叶
    for (let i = 0; i < 14; i++) box(g, i % 2 ? P.leafLight : 0xc9d3d3, Math.floor(rng() * W), 200 + Math.floor(rng() * 60), 2, 1, 0.7);
  };

  const front: LayerDef['draw'] = (g) => {
    const rng = seeded(163);
    // 左下角翻倒的蓝筐
    box(g, P.ink, -6, 250, 46, 22);
    box(g, P.plasticBlue, -4, 252, 42, 18);
    for (let x = -2; x < 36; x += 5) box(g, mix(P.plasticBlue, P.shadow, 0.4), x, 254, 3, 14);
    box(g, mix(P.plasticBlue, P.cream, 0.4), -4, 252, 42, 1);
    // 右下角泡沫箱堆
    foamBox(g, 676, 272, 40, 16, true);
    foamBox(g, 684, 256, 30, 12);
    // 底边菜叶
    for (let i = 0; i < 10; i++) box(g, i % 2 ? P.leaf : P.leafLight, 60 + Math.floor(rng() * 600), 264 + Math.floor(rng() * 5), 4, 2, 0.8);
  };

  return stack(sky, far, mid, main, ground, front);
}

// @@SCENES@@

// ———————————————————— 3. 中山路 Tiong-san-lōo ————————————————————
function zhongshanLayers(): LayerDef[] {
  const sky: LayerDef['draw'] = (g, w) => {
    const rng = seeded(201);
    vgrad(g, 0, 0, w, 120, 0x7a5a8c, 0xf2b46a, 10);
    box(g, 0xf6c97e, 0, 120, w, H - 120);
    disc(g, P.glowSoft, w * 0.72, 96, 22, 0.25);
    disc(g, P.glow, w * 0.72, 96, 14);
    disc(g, P.glowSoft, w * 0.72 - 3, 93, 6);
    cloud(g, 40, 34, 90, 0xf8d7a0, 0xd99a78, 0.85);
    cloud(g, w * 0.45, 22, 70, 0xf8d7a0, 0xd99a78, 0.7);
    cloud(g, w * 0.82, 58, 60, 0xf6c98e, 0xcf8a6a, 0.6);
    for (let i = 0; i < 5; i++) bird(g, 0x5a3e4a, 120 + Math.floor(rng() * (w - 200)), 40 + Math.floor(rng() * 30));
  };

  const far: LayerDef['draw'] = (g, w) => {
    const rng = seeded(211);
    // 鹭江与对岸鼓浪屿的剪影
    hills(g, 0x8a6a7a, w, 140, (x) => 116 - Math.sin(x / 38) * 8 - (x > w * 0.55 && x < w * 0.7 ? 14 : 0), 0xb08a8a);
    box(g, 0x6e5a72, Math.round(w * 0.6), 96, 6, 12);
    box(g, 0xd8a070, 0, 140, w, 40);
    for (let i = 0; i < 40; i++) box(g, 0xf8d7a0, Math.floor(rng() * w), 142 + Math.floor(rng() * 34), 6 + Math.floor(rng() * 10), 1, 0.6);
    // 渡轮
    framed(g, P.cream, Math.round(w * 0.3), 146, 30, 6);
    box(g, P.sea, Math.round(w * 0.3) + 2, 148, 26, 1);
    box(g, P.cream, Math.round(w * 0.3) + 8, 141, 14, 5);
  };

  const mid: LayerDef['draw'] = (g, w) => {
    const rng = seeded(223);
    // 远处一排南洋骑楼的三层立面
    const tones = [0xe8c79a, 0xd99a7a, 0xc9d3b0, 0xe9dcbc, 0xd6a86a];
    let x = -4;
    let i = 0;
    while (x < w) {
      const bw = 54 + Math.floor(rng() * 16);
      const top = 54 + Math.floor(rng() * 14);
      const c = tones[i % tones.length];
      box(g, c, x, top, bw, GROUND - top);
      box(g, mix(c, P.shadow, 0.25), x, top, bw, 3);
      // 山花女儿墙
      archFill(g, c, x + bw / 2 - 12, top - 10, 24, 12);
      box(g, mix(c, P.cream, 0.4), x + bw / 2 - 2, top - 7, 4, 4);
      for (const k of [0, 1]) shutterArch(g, x + 8 + k * 24, top + 12, 14, 22, mix(c, P.cream, 0.4), 0x4f8a7a, 0x4a5a6a);
      x += bw + 1;
      i++;
    }
    for (let k = 0; k < 20; k++) px(g, P.inkSoft, Math.floor(rng() * w), 60 + Math.floor(rng() * 80), 0.4);
  };

  const main: LayerDef['draw'] = (g) => {
    const rng = seeded(231);
    // 近处骑楼：二楼立面
    box(g, 0xe9c8a0, 0, 40, W, 60);
    box(g, P.ink, 0, 36, W, 6);
    box(g, 0xd6a86a, 0, 37, W, 4);
    for (let x = 0; x < W; x += 6) box(g, 0xf6e2bc, x + 1, 42, 3, 2);
    for (let x = 22; x < W; x += 90) {
      shutterArch(g, x, 52, 18, 30, 0xf6e2bc, 0x3f7f6a, 0x3e4a58);
      shutterArch(g, x + 44, 52, 18, 30, 0xf6e2bc, 0x3f7f6a, 0x3e4a58);
      box(g, 0xc9a07a, x + 30, 46, 2, 50);
    }
    // 竖招牌
    const vs: Array<[number, number]> = [[8, P.lacquer], [196, 0x2f5f8f], [372, P.leafDark], [606, P.lacquer]];
    for (const [vx, c] of vs) signboard(g, vx, 46, 14, 46, c, P.goldLight, rng, true);
    // 骑楼廊下
    box(g, P.ink, 0, 98, W, 8);
    box(g, 0xd6a86a, 0, 99, W, 6);
    box(g, 0x4a3428, 0, 106, W, GROUND - 106);
    box(g, 0x5e4434, 0, 106, W, 4);
    for (let x = 0; x < W; x += 90) archFill(g, 0x6a4c3a, x + 18, 112, 58, GROUND - 112);
    // 每开间的横招牌
    const shopC = [P.lacquer, 0x2f6f5f, P.goldDark, 0x6a3a7a, P.lacquer, 0x2f5f8f, P.lacquerDark, 0x2f6f5f];
    for (let i = 0; i < 8; i++) signboard(g, i * 90 + 22, 110, 50, 12, shopC[i], P.goldLight, rng);
    // 廊柱
    for (let x = 0; x < W; x += 90) {
      bevel(g, x + 2, 106, 14, GROUND - 106, 0xf6e2bc, 0xe9c8a0, 0xb08a64, P.ink);
      box(g, 0xd6a86a, x, 106, 18, 4);
      box(g, 0xb08a64, x + 1, GROUND - 8, 16, 8);
    }
    lanternString(g, 0, 104, W, 104, 4, 12, 4, true);
    // ① 沙茶面店（x≈70）
    framed(g, P.woodDark, 40, 150, 62, 26);
    box(g, P.wood, 42, 152, 58, 3);
    box(g, P.ink, 52, 138, 22, 12);
    box(g, 0xb84a2a, 53, 139, 20, 10);
    box(g, 0xe07a3a, 54, 140, 18, 3);
    steam(g, 63, 136, 26, rng);
    for (let k = 0; k < 3; k++) {
      oval(g, P.ink, 82 + k * 7, 147, 4, 2);
      oval(g, P.cream, 82 + k * 7, 147, 3, 1);
    }
    bulb(g, 70, 124, 6, true);
    // ② 骑楼柱上的门牌与灯（x≈250）
    framed(g, P.cream, 236, 130, 30, 8);
    glyphs(g, P.sea, 240, 132, 4, 4, false, rng);
    lantern(g, 256, 140, 4, true);
    // ③ 骑楼下的博饼桌（x≈340）
    oval(g, P.ink, 340, 160, 30, 6);
    oval(g, P.lacquer, 340, 159, 29, 5);
    oval(g, P.cream, 340, 157, 9, 3);
    oval(g, P.flame, 340, 157, 7, 2);
    for (let k = 0; k < 6; k++) px(g, k % 3 ? P.ink : P.flame, 336 + k * 2 - 1, 156 + (k % 2));
    box(g, P.woodDark, 316, 165, 3, 11);
    box(g, P.woodDark, 362, 165, 3, 11);
    for (const sx of [300, 372]) framed(g, P.plasticRed, sx, 162, 10, 6);
    for (let k = 0; k < 5; k++) framed(g, [P.gold, P.cream, P.flame][k % 3], 316 + k * 10, 150, 6, 4);
    // ④ 花生汤推车（x≈430）
    framed(g, P.steelLight, 408, 152, 46, 16, P.steelDark);
    ring(g, P.ink, 414, 170, 5);
    ring(g, P.ink, 446, 170, 5);
    framed(g, P.foam, 414, 136, 16, 16, P.foamDark);
    framed(g, P.foam, 434, 140, 14, 12, P.foamDark);
    steam(g, 422, 134, 22, rng);
    signboard(g, 410, 154, 40, 10, P.cream, P.lacquer, rng);
    // ⑤ 馅饼铺玻璃柜（x≈640）
    framed(g, P.woodDark, 608, 140, 66, 36);
    box(g, 0xcfe0e0, 610, 142, 62, 18);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 7; k++) {
      oval(g, P.goldDark, 616 + k * 8, 150 + r * 6, 3, 2);
      oval(g, P.goldLight, 616 + k * 8, 149 + r * 6, 2, 1);
    }
    for (let k = 0; k < 4; k++) framed(g, k % 2 ? P.lacquer : P.gold, 612 + k * 15, 164, 12, 10);
    bulb(g, 640, 120, 6, true);
    // 其余开间里的货架
    for (const sx of [130, 470, 520]) {
      box(g, P.woodDark, sx, 134, 30, 2);
      for (let k = 0; k < 5; k++) box(g, [P.plasticRed, P.goldLight, P.cream, P.leafLight][Math.floor(rng() * 4)], sx + 1 + k * 6, 128, 4, 6);
    }
  };

  const ground: LayerDef['draw'] = (g) => {
    const rng = seeded(241);
    paving(g, rng, { base: 0xc9b496, light: 0xe0cfb2, dark: 0xa8946f, seam: 0x8a7658, row0: 8, tile0: 30 });
    // 骑楼廊下的阴影带
    box(g, P.shadow, 0, GROUND, W, 8, 0.18);
    // 夕照斜光
    for (let i = 0; i < 30; i++) box(g, P.glow, Math.floor(rng() * W), GROUND + 10 + Math.floor(rng() * 80), 8 + Math.floor(rng() * 12), 1, 0.15);
    // 井盖与盲道
    disc(g, 0x8a7658, 300, 236, 8);
    disc(g, 0x9e8a6a, 300, 236, 6);
    for (let x = 0; x < W; x += 12) box(g, 0xe0b84a, x, 200, 10, 4, 0.5);
  };

  const front: LayerDef['draw'] = (g) => {
    const rng = seeded(251);
    // 左下角停着的自行车
    bicycle(g, 2, 268, P.sea);
    bicycle(g, 24, 270, P.flame);
    // 右下角老路灯
    box(g, P.ink, 702, 200, 4, 70);
    box(g, P.steelDark, 703, 200, 2, 70);
    lantern(g, 704, 196, 6, true, P.glow);
    potPlant(g, 670, 270, 14, rng, P.bougain);
  };

  return stack(sky, far, mid, main, ground, front);
}

// ———————————————————— 4. 鼓浪屿 Kóo-lōng-sū ————————————————————
/** 万国建筑风的洋楼立面 */
function villa(g: G, x: number, y: number, w: number, wall: number, rng: Rng): void {
  const h = GROUND - y;
  box(g, P.ink, x - 1, y - 1, w + 2, h + 1);
  box(g, wall, x, y, w, h);
  box(g, mix(wall, P.cream, 0.35), x, y, w, 2);
  // 红瓦坡顶
  trap(g, P.ink, y - 15, y, x + 6, x + w - 6, x - 6, x + w + 6);
  trap(g, P.brick, y - 14, y - 1, x + 7, x + w - 7, x - 5, x + w + 5);
  for (let k = y - 12; k < y - 1; k += 3) box(g, P.brickDark, x - 4, k, w + 8, 1, 0.5);
  // 两层拱券外廊
  const n = Math.max(2, Math.floor(w / 22));
  const step = Math.floor((w - 8) / n);
  for (let i = 0; i < n; i++) {
    shutterArch(g, x + 6 + i * step + Math.floor((step - 14) / 2), y + 10, 12, 22, P.cream, 0x3f7f6a, 0x4a6a7a);
    archFramed(g, P.ink, mix(wall, P.shadow, 0.45), x + 4 + i * step + Math.floor((step - 16) / 2), y + 46, 16, h - 46);
  }
  // 腰线与栏杆
  box(g, P.cream, x, y + 40, w, 3);
  for (let k = x + 2; k < x + w - 2; k += 4) box(g, P.cream, k, y + 36, 2, 4);
  if (rng() < 0.6) box(g, P.ink, x + w - 10, y - 24, 6, 12);
}

function gulangyuLayers(): LayerDef[] {
  const sky: LayerDef['draw'] = (g, w) => {
    const rng = seeded(301);
    vgrad(g, 0, 0, w, 130, 0x5aa6d8, 0xcfe8f2, 8);
    box(g, 0xcfe8f2, 0, 130, w, H - 130);
    cloud(g, 30, 26, 100, 0xffffff, 0xd6e6ee);
    cloud(g, w * 0.55, 14, 80, 0xffffff, 0xd6e6ee, 0.9);
    cloud(g, w * 0.8, 50, 60, 0xffffff, 0xd6e6ee, 0.8);
    for (let i = 0; i < 4; i++) bird(g, 0x5a7080, 80 + Math.floor(rng() * (w - 160)), 30 + Math.floor(rng() * 30));
  };

  const far: LayerDef['draw'] = (g, w) => {
    const rng = seeded(311);
    // 海面
    box(g, P.sea, 0, 128, w, 60);
    box(g, P.seaLight, 0, 128, w, 2);
    for (let i = 0; i < 50; i++) box(g, P.seaLight, Math.floor(rng() * w), 132 + Math.floor(rng() * 44), 4 + Math.floor(rng() * 8), 1, 0.7);
    // 日光岩：巨石叠在山顶
    const cx = Math.round(w * 0.62);
    hills(g, P.leafDark, w, 140, (x) => 132 - Math.max(0, 40 - Math.abs(x - cx) * 0.55), P.leaf);
    oval(g, P.ink, cx, 88, 22, 14);
    oval(g, 0xc9b08a, cx, 88, 21, 13);
    oval(g, 0xe0caa0, cx - 6, 84, 10, 6);
    oval(g, P.ink, cx + 14, 98, 14, 9);
    oval(g, 0xb89a74, cx + 14, 98, 13, 8);
    box(g, P.flame, cx - 1, 66, 1, 8);
    box(g, P.flame, cx, 66, 5, 3);
    // 远处的帆船
    for (const sx of [Math.round(w * 0.18), Math.round(w * 0.4)]) {
      poly(g, P.cream, [sx, 150, sx, 136, sx + 8, 150]);
      box(g, P.ink, sx - 4, 150, 14, 2);
    }
  };

  const mid: LayerDef['draw'] = (g, w) => {
    const rng = seeded(323);
    // 山坡上错落的红顶洋楼与绿树
    hills(g, P.leaf, w, GROUND, (x) => 128 - Math.sin(x / 50) * 6, P.leafLight);
    for (let x = 10; x < w; x += 64) {
      const bw = 30 + Math.floor(rng() * 12);
      const top = 104 + Math.floor(rng() * 14);
      const c = [0xf2e2c4, 0xe9c8a0, 0xf6eeda, 0xd8c0a0][Math.floor(rng() * 4)];
      box(g, c, x, top, bw, 40);
      trap(g, P.brick, top - 8, top, x + 4, x + bw - 4, x - 2, x + bw + 2);
      for (let k = 0; k < 3; k++) archFill(g, 0x5a6a7a, x + 4 + k * 10, top + 8, 6, 10);
      canopy(g, x + bw + 14, top + 22, 12, rng);
    }
  };

  const main: LayerDef['draw'] = (g) => {
    const rng = seeded(331);
    // 通长的低矮花园围墙（白灰墙帽 + 红砖）
    brickWall(g, 0, 150, W, 26, rng);
    box(g, P.ink, 0, 146, W, 5);
    box(g, P.cream, 0, 147, W, 3);
    for (let x = 4; x < W; x += 30) {
      bevel(g, x, 140, 8, 12, P.cream, 0xe9dcbc, 0xc9b896, P.ink);
      box(g, P.cream, x - 1, 138, 10, 3);
    }
    // ① 钢琴之家（x≈70）：小洋楼 + 敞开的窗内钢琴
    villa(g, 22, 70, 96, 0xf2e2c4, rng);
    framed(g, 0x3e4a58, 52, 118, 36, 26);
    box(g, P.ink, 56, 128, 28, 10);
    for (let k = 0; k < 13; k++) box(g, P.cream, 57 + k * 2, 134, 1, 4);
    for (let k = 0; k < 6; k++) box(g, P.ink, 58 + k * 4, 134, 1, 2);
    box(g, P.woodDark, 56, 124, 28, 4);
    // 飘出来的音符
    for (const [nx, ny] of [[92, 112], [100, 104], [108, 112]] as [number, number][]) {
      box(g, P.ink, nx, ny - 6, 1, 7);
      oval(g, P.ink, nx - 1, ny + 1, 2, 1);
      px(g, P.ink, nx + 1, ny - 6);
      px(g, P.ink, nx + 2, ny - 5);
    }
    // NPC 站位（x≈160）后面只有矮墙和一棵细棕榈
    box(g, P.woodDark, 182, 96, 3, 50);
    for (let k = -3; k <= 3; k++) {
      const at = sag(g, P.leafDark, 183, 96, 183 + k * 9, 104 + Math.abs(k) * 2, -2);
      const [ex, ey] = at(1);
      px(g, P.leafLight, ex, ey);
    }
    // ② 万国建筑（x≈250）：带穹顶的大洋楼
    villa(g, 206, 56, 92, 0xe9c8a0, rng);
    disc(g, P.ink, 252, 40, 13);
    disc(g, P.seaLight, 252, 40, 12);
    box(g, P.seaLight, 240, 40, 25, 8);
    disc(g, P.cream, 248, 36, 3);
    box(g, P.ink, 251, 22, 2, 7);
    // ③ 中段（x≈340）：老榕树 + 路牌
    box(g, P.woodDark, 330, 92, 12, 54);
    box(g, P.wood, 332, 92, 4, 54);
    for (let k = 0; k < 7; k++) box(g, P.woodDark, 312 + k * 8, 96 + (k % 3) * 4, 1, 40 + (k % 2) * 6);
    canopy(g, 336, 74, 46, rng);
    box(g, P.ink, 366, 120, 2, 30);
    framed(g, 0x2f5f8f, 352, 112, 34, 10, P.cream);
    glyphs(g, P.cream, 356, 115, 4, 4, false, rng);
    // ④ 三角梅花墙（x≈430）
    graniteWall(g, 398, 110, 66, 40, rng);
    canopy(g, 416, 104, 22, rng, P.bougainDark, P.bougain, P.bougainLight);
    canopy(g, 446, 112, 20, rng, P.bougainDark, P.bougain, P.bougainLight);
    for (let k = 0; k < 18; k++) px(g, P.bougainLight, 400 + Math.floor(rng() * 64), 120 + Math.floor(rng() * 26));
    archFramed(g, P.ink, 0x3f7f6a, 420, 124, 20, 26);
    // NPC 站位（x≈540）后面：铁艺栏杆 + 远眺
    for (let x = 490; x < 590; x += 5) box(g, P.ink, x, 128, 1, 20);
    box(g, P.ink, 488, 126, 104, 2);
    for (let x = 492; x < 590; x += 10) ring(g, P.ink, x + 2, 136, 2);
    // ⑤ 日光岩脚下的礁石（x≈640）
    oval(g, P.ink, 640, 136, 44, 26);
    oval(g, 0xc9b08a, 640, 136, 43, 25);
    oval(g, 0xe0caa0, 628, 126, 22, 12);
    oval(g, 0xa88a66, 662, 150, 22, 10);
    for (let k = 0; k < 6; k++) box(g, 0x9a7c58, 608 + k * 12, 132 + (k % 2) * 8, 6, 1);
    signboard(g, 618, 130, 40, 10, P.flame, P.cream, rng);
    canopy(g, 690, 112, 18, rng);
  };

  const ground: LayerDef['draw'] = (g) => {
    const rng = seeded(341);
    paving(g, rng, { base: 0xd8cfbe, light: 0xeee6d6, dark: 0xb3a892, seam: 0x968b76, row0: 7, tile0: 22 });
    // 三角梅落瓣
    for (let i = 0; i < 70; i++) px(g, rng() < 0.6 ? P.bougain : P.bougainLight, 380 + Math.floor(rng() * 120), GROUND + 2 + Math.floor(rng() * 40));
    for (let i = 0; i < 30; i++) px(g, P.bougainLight, Math.floor(rng() * W), GROUND + 6 + Math.floor(rng() * 80), 0.7);
    // 榕树投影
    oval(g, P.shadow, 336, 192, 60, 10, 0.18);
    // 地上的音符地砖
    for (const sx of [60, 96]) {
      framed(g, P.cream, sx, 214, 18, 10, 0x968b76);
      box(g, P.ink, sx + 9, 216, 1, 5);
      oval(g, P.ink, sx + 8, 221, 2, 1);
    }
  };

  const front: LayerDef['draw'] = (g) => {
    const rng = seeded(351);
    // 左下角三角梅花丛
    canopy(g, 12, 262, 22, rng, P.bougainDark, P.bougain, P.bougainLight);
    // 右下角礁石与海浪
    oval(g, P.ink, 704, 264, 26, 14);
    oval(g, 0xb89a74, 704, 264, 25, 13);
    oval(g, 0xd8c0a0, 696, 258, 10, 5);
    for (let k = 0; k < 4; k++) box(g, P.foam, 676 + k * 10, 268, 6, 1, 0.8);
    tuft(g, 60, 270, rng);
    tuft(g, 650, 270, rng);
  };

  return stack(sky, far, mid, main, ground, front);
}

// ———————————————————— 5. 曾厝垵 Tsan-tshù-uann ————————————————————
/** 石厝小店：花岗岩墙 + 彩色门脸 */
function stoneShop(g: G, x: number, y: number, w: number, face: number, rng: Rng): void {
  graniteWall(g, x, y, w, GROUND - y, rng);
  box(g, P.ink, x - 2, y - 6, w + 4, 7);
  box(g, P.brick, x - 1, y - 5, w + 2, 5);
  box(g, P.brickLight, x - 1, y - 5, w + 2, 1);
  framed(g, face, x + 6, y + 18, w - 12, GROUND - y - 18);
  box(g, mix(face, P.glow, 0.5), x + 8, y + 20, w - 16, 10, 0.9);
  signboard(g, x + 4, y + 4, w - 8, 11, face, P.cream, rng);
}

function zengcuoanLayers(): LayerDef[] {
  const sky: LayerDef['draw'] = (g, w) => {
    const rng = seeded(401);
    vgrad(g, 0, 0, w, 140, 0x26304f, 0xe0866a, 10);
    box(g, 0xe0866a, 0, 140, w, H - 140);
    for (let i = 0; i < 40; i++) px(g, P.glowSoft, Math.floor(rng() * w), Math.floor(rng() * 60), 0.4 + rng() * 0.5);
    disc(g, P.glowSoft, w * 0.2, 36, 8, 0.9);
    disc(g, 0x3a4468, w * 0.2 + 3, 34, 7);
    cloud(g, w * 0.5, 70, 90, 0xe9a07e, 0xa0607a, 0.6);
  };

  const far: LayerDef['draw'] = (g, w) => {
    const rng = seeded(411);
    // 环岛路外的海与对岸灯火
    box(g, 0x4a4f78, 0, 132, w, 50);
    for (let i = 0; i < 40; i++) box(g, 0xf2a07a, Math.floor(rng() * w), 136 + Math.floor(rng() * 40), 4 + Math.floor(rng() * 8), 1, 0.5);
    hills(g, 0x3a3f60, w, 134, (x) => 124 - Math.sin(x / 30) * 3, 0x4a4f78);
    for (let i = 0; i < 24; i++) px(g, P.glow, Math.floor(rng() * w), 124 + Math.floor(rng() * 8));
  };

  const mid: LayerDef['draw'] = (g, w) => {
    const rng = seeded(423);
    // 层叠的民宿屋顶与晾台
    let x = -6;
    while (x < w) {
      const bw = 40 + Math.floor(rng() * 20);
      const top = 92 + Math.floor(rng() * 20);
      const c = [0x8a7e8e, 0x9a8a8a, 0x7a7090, 0xa08a7a][Math.floor(rng() * 4)];
      box(g, c, x, top, bw, GROUND - top);
      box(g, mix(c, P.shadow, 0.3), x, top, bw, 2);
      for (let k = x + 6; k < x + bw - 6; k += 10) box(g, rng() < 0.6 ? P.glow : 0x5a5070, k, top + 10, 5, 7, 0.9);
      if (rng() < 0.5) {
        box(g, P.leafDark, x + bw - 14, top - 6, 10, 6);
        disc(g, P.leaf, x + bw - 9, top - 6, 5);
      }
      x += bw + 2;
    }
  };

  const main: LayerDef['draw'] = (g) => {
    const rng = seeded(431);
    // 横跨窄巷的彩色灯串
    for (let k = 0; k < 3; k++) {
      const at = sag(g, P.ink, 0, 34 + k * 14, W, 30 + k * 14, 8);
      for (let i = 1; i < 40; i++) {
        const [bx, by] = at(i / 40);
        disc(g, P.glow, bx, by + 2, 3, 0.15);
        px(g, [P.glow, P.bougainLight, P.seaLight, P.leafLight][i % 4], bx, by + 1);
        px(g, P.glowSoft, bx, by + 2);
      }
    }
    // ① 烧肉粽摊（x≈70）
    stoneShop(g, 14, 76, 112, P.lacquer, rng);
    framed(g, P.steelLight, 40, 140, 58, 22, P.steelDark);
    oval(g, P.ink, 69, 140, 18, 5);
    oval(g, P.steel, 69, 139, 17, 4);
    for (let k = 0; k < 7; k++) {
      poly(g, P.leafDark, [52 + k * 5, 140, 55 + k * 5, 132, 58 + k * 5, 140]);
      px(g, P.leafLight, 55 + k * 5, 135);
    }
    steam(g, 66, 130, 30, rng);
    steam(g, 78, 132, 24, rng);
    box(g, P.woodDark, 44, 162, 3, 14);
    box(g, P.woodDark, 92, 162, 3, 14);
    lantern(g, 34, 120, 5, true);
    lantern(g, 106, 120, 5, true);
    // NPC 站位（x≈160）：矮石阶 + 盆栽
    graniteWall(g, 136, 160, 48, 16, rng);
    potPlant(g, 140, 160, 10, rng, P.bougainLight);
    potPlant(g, 168, 160, 10, rng);
    // ② 石敢当（x≈250）：转角石墙上的石碑
    graniteWall(g, 198, 88, 110, GROUND - 88, rng);
    box(g, P.ink, 196, 82, 114, 7);
    box(g, P.brick, 197, 83, 112, 5);
    bevel(g, 238, 120, 22, 48, P.graniteLight, 0xcfc8b8, P.graniteDark, P.ink);
    trap(g, P.ink, 112, 121, 240, 258, 236, 262);
    trap(g, 0xcfc8b8, 113, 120, 241, 257, 238, 260);
    box(g, P.flame, 242, 126, 14, 4);
    glyphs(g, P.flame, 246, 133, 3, 6, true, rng);
    oval(g, P.shadow, 249, 170, 14, 2, 0.4);
    // 墙上的小黑板与涂鸦
    framed(g, 0x2f3f3a, 270, 112, 30, 22, P.woodDark);
    glyphs(g, P.cream, 273, 116, 4, 4, false, rng);
    glyphs(g, P.goldLight, 273, 124, 3, 4, false, rng);
    disc(g, P.bougain, 212, 108, 6);
    disc(g, P.goldLight, 220, 102, 4);
    // ③ 中段（x≈340）：文艺小店 + 风铃
    stoneShop(g, 316, 84, 52, 0x2f8f8a, rng);
    for (let k = 0; k < 4; k++) {
      box(g, P.ink, 326 + k * 9, 116, 1, 8 + k);
      box(g, [P.seaLight, P.goldLight, P.bougainLight, P.cream][k], 325 + k * 9, 124 + k, 3, 4);
    }
    // ④ 王船（x≈430）
    box(g, P.ink, 380, 160, 104, 2);
    poly(g, P.ink, [382, 140, 482, 140, 470, 162, 394, 162]);
    poly(g, P.lacquer, [384, 141, 480, 141, 469, 160, 395, 160]);
    box(g, P.goldLight, 386, 144, 92, 2);
    for (let k = 0; k < 6; k++) disc(g, P.gold, 396 + k * 14, 152, 3);
    poly(g, P.ink, [380, 140, 372, 124, 388, 140]);
    poly(g, P.lacquer, [382, 139, 375, 127, 386, 139]);
    disc(g, P.cream, 400, 151, 2);
    px(g, P.ink, 400, 151);
    box(g, P.woodDark, 430, 84, 3, 56);
    box(g, P.woodDark, 410, 104, 3, 36);
    const flags: Array<[number, number]> = [
      [P.flame, 90],
      [P.goldLight, 100],
      [P.leafLight, 110],
      [P.seaLight, 120],
    ];
    for (const [c, fy] of flags) {
      poly(g, P.ink, [433, fy - 1, 448, fy + 4, 433, fy + 9]);
      poly(g, c, [434, fy, 446, fy + 4, 434, fy + 8]);
    }
    poly(g, P.flame, [413, 104, 424, 108, 413, 112]);
    // NPC 站位（x≈540）：民宿门口的木长椅与猫
    stoneShop(g, 498, 92, 84, 0x6a3a7a, rng);
    box(g, P.woodDark, 510, 164, 56, 4);
    box(g, P.woodDark, 514, 168, 3, 8);
    box(g, P.woodDark, 560, 168, 3, 8);
    cat(g, 548, 164, 0xe0a050, 0xa86a2a);
    // ⑤ 姜母鸭砂锅店（x≈640）
    stoneShop(g, 594, 80, 104, P.goldDark, rng);
    for (let k = 0; k < 3; k++) {
      const cx = 616 + k * 24;
      framed(g, P.inkSoft, cx - 9, 156, 18, 12, P.ink);
      oval(g, P.ink, cx, 150, 9, 6);
      oval(g, 0x5a3e30, cx, 150, 8, 5);
      oval(g, 0x7a5040, cx - 2, 148, 4, 2);
      box(g, P.flame, cx - 5, 160, 10, 3);
      box(g, P.glow, cx - 3, 160, 6, 1);
      steam(g, cx, 142, 20, rng);
    }
    lantern(g, 600, 118, 5, true);
    lantern(g, 690, 118, 5, true);
  };

  const ground: LayerDef['draw'] = (g) => {
    const rng = seeded(441);
    paving(g, rng, { base: 0x8a8278, light: 0xa8a092, dark: 0x6a6258, seam: 0x544c44, row0: 8, tile0: 26 });
    // 灯火投在石板路上的暖光
    for (const lx of [69, 249, 340, 430, 540, 640]) oval(g, P.glow, lx, 196, 40, 8, 0.12);
    for (let i = 0; i < 24; i++) box(g, P.glow, Math.floor(rng() * W), GROUND + 12 + Math.floor(rng() * 80), 6 + Math.floor(rng() * 8), 1, 0.15);
  };

  const front: LayerDef['draw'] = (g) => {
    const rng = seeded(451);
    // 左右两端的灯笼柱
    for (const lx of [10, 708]) {
      box(g, P.ink, lx - 2, 210, 4, 60);
      box(g, P.woodDark, lx - 1, 210, 2, 60);
      lantern(g, lx, 204, 6, true);
    }
    potPlant(g, 30, 270, 14, rng, P.bougainLight);
    tuft(g, 680, 270, rng);
  };

  return stack(sky, far, mid, main, ground, front);
}

// ———————————————————— 6. 南普陀 Lâm-phóo-tô ————————————————————
const TEMPLE_ROOF: RoofColors = {
  tile: P.templeYellow,
  tileDark: P.templeYellowDark,
  tileLight: P.templeYellowLight,
  ridge: P.lacquer,
  ridgeLight: P.flame,
  ornament: [P.leafLight, P.seaLight, P.goldLight, P.cream],
};

function nanputuoLayers(): LayerDef[] {
  const sky: LayerDef['draw'] = (g, w) => {
    const rng = seeded(501);
    vgrad(g, 0, 0, w, 140, 0x9cc4dc, 0xf8e6c8, 9);
    box(g, 0xf8e6c8, 0, 140, w, H - 140);
    disc(g, P.glowSoft, w * 0.3, 70, 24, 0.4);
    disc(g, 0xfff4da, w * 0.3, 70, 13);
    cloud(g, w * 0.55, 30, 90, 0xffffff, 0xe6dcd0, 0.8);
    cloud(g, 20, 54, 70, 0xffffff, 0xe6dcd0, 0.6);
    for (let i = 0; i < 4; i++) bird(g, 0x6a7a80, 100 + Math.floor(rng() * (w - 200)), 34 + Math.floor(rng() * 30));
  };

  const far: LayerDef['draw'] = (g, w) => {
    // 五老峰：五个山头 + 晨雾
    const peaks = [0.12, 0.3, 0.5, 0.68, 0.86];
    hills(
      g,
      0x7a9a8a,
      w,
      150,
      (x) => 150 - Math.max(...peaks.map((p, i) => 64 - (i % 2) * 10 - Math.abs(x - p * w) * 0.75)),
      0x9ab8a6,
    );
    hills(g, 0x5f8a6e, w, 150, (x) => 132 - Math.sin(x / 26) * 5, 0x7aa08a);
    box(g, P.mist, 0, 120, w, 30, 0.45);
    box(g, P.mist, 0, 134, w, 16, 0.5);
  };

  const mid: LayerDef['draw'] = (g, w) => {
    const rng = seeded(523);
    // 山坡上的松树与远处殿宇屋脊
    hills(g, P.leafDark, w, GROUND, (x) => 132 - Math.sin(x / 44) * 6, P.leaf);
    for (let x = 6; x < w; x += 28 + Math.floor(rng() * 16)) canopy(g, x, 124 + Math.floor(rng() * 10), 10, rng);
    for (const bx of [Math.round(w * 0.22), Math.round(w * 0.72)]) {
      box(g, P.lacquer, bx, 110, 40, 22);
      swallowRoof(g, bx, 100, 40, 10, TEMPLE_ROOF, 8);
    }
    box(g, P.mist, 0, 136, w, 20, 0.3);
  };

  const main: LayerDef['draw'] = (g) => {
    const rng = seeded(531);
    // 天王殿：黄墙、红柱、黄琉璃燕尾脊
    box(g, 0xe8c27a, 0, 92, W, GROUND - 92);
    box(g, mix(0xe8c27a, P.cream, 0.3), 0, 92, W, 3);
    box(g, P.ink, 0, 150, W, 2);
    graniteWall(g, 0, 152, W, GROUND - 152, rng);
    swallowRoof(g, 180, 54, 360, 28, TEMPLE_ROOF, 22, rng);
    swallowRoof(g, 14, 78, 120, 14, TEMPLE_ROOF, 12, rng);
    swallowRoof(g, 586, 78, 120, 14, TEMPLE_ROOF, 12, rng);
    // 斗拱带
    box(g, P.ink, 172, 84, 376, 8);
    for (let x = 176; x < 544; x += 8) {
      box(g, P.sea, x, 85, 6, 3);
      box(g, P.leafLight, x + 1, 88, 4, 3);
    }
    // 红柱（避开 NPC 站位）
    for (const cx of [196, 300, 410, 486, 512]) {
      bevel(g, cx, 92, 10, 60, P.flame, P.lacquer, P.lacquerDark, P.ink);
      box(g, P.granite, cx - 2, 146, 14, 6);
    }
    // 中央匾额与殿门
    framed(g, P.lacquerDark, 320, 96, 80, 18, P.gold);
    glyphs(g, P.goldLight, 334, 100, 4, 10, false, rng);
    framed(g, P.lacquer, 316, 118, 88, 34);
    for (let k = 0; k < 4; k++) {
      box(g, P.lacquerDark, 320 + k * 21, 120, 1, 30);
      for (let r = 0; r < 3; r++) disc(g, P.gold, 330 + k * 21, 126 + r * 9, 1);
    }
    couplet(g, 306, 116, 34, rng);
    couplet(g, 406, 116, 34, rng);
    // ① 素饼店（x≈70）
    framed(g, P.woodDark, 26, 100, 88, 52);
    box(g, P.wood, 28, 102, 84, 48);
    signboard(g, 34, 104, 72, 12, P.cream, P.lacquer, rng);
    framed(g, 0xd8e4e0, 34, 120, 72, 24, P.woodDark);
    for (let r = 0; r < 2; r++)
      for (let k = 0; k < 7; k++) {
        disc(g, P.cream, 40 + k * 10, 127 + r * 9, 3);
        px(g, P.flame, 40 + k * 10, 127 + r * 9);
      }
    for (let k = 0; k < 3; k++) framed(g, P.flame, 32 + k * 28, 164, 22, 10, P.lacquerDark);
    // ② 香炉（x≈250）
    oval(g, P.shadow, 250, 174, 24, 3, 0.35);
    trap(g, P.ink, 136, 166, 232, 268, 228, 272);
    trap(g, 0x6a5a3a, 137, 165, 233, 267, 229, 271);
    box(g, 0x8a7a4a, 233, 140, 34, 3);
    box(g, P.ink, 226, 132, 48, 6);
    box(g, 0x8a7a4a, 227, 133, 46, 4);
    for (const lx of [234, 262]) box(g, 0x6a5a3a, lx, 126, 4, 7);
    for (const lx of [230, 266]) box(g, P.ink, lx, 166, 4, 10);
    for (let k = 0; k < 5; k++) {
      box(g, P.lacquer, 242 + k * 4, 118, 1, 14);
      px(g, P.glow, 242 + k * 4, 118);
    }
    steam(g, 250, 116, 60, rng, 0xe6e0d4, 0.4);
    // ③ 殿门前（x≈340）的蒲团
    for (const bx of [326, 354]) {
      oval(g, P.ink, bx, 170, 8, 4);
      oval(g, P.templeYellowDark, bx, 169, 7, 3);
    }
    // ④ 放生池（x≈430）：池栏 + 荷叶荷花
    graniteWall(g, 392, 150, 84, 26, rng);
    box(g, P.seaDeep, 396, 154, 76, 18);
    for (let k = 0; k < 8; k++) {
      const lx = 400 + k * 9;
      oval(g, P.leafDark, lx, 158 + (k % 2) * 6, 5, 2);
      oval(g, P.leaf, lx - 1, 157 + (k % 2) * 6, 3, 1);
    }
    for (const [lx, ly] of [
      [410, 148],
      [440, 146],
      [462, 150],
    ] as Array<[number, number]>) {
      box(g, P.leafDark, lx, ly, 1, 8);
      disc(g, P.lotus, lx, ly - 2, 3);
      px(g, P.cream, lx, ly - 3);
    }
    for (let x = 392; x < 476; x += 12) bevel(g, x, 142, 6, 10, P.graniteLight, P.granite, P.graniteDark, P.ink);
    box(g, P.granite, 390, 148, 88, 3);
    // NPC 站位（x≈540）旁的菩提树
    box(g, P.woodDark, 566, 110, 8, 42);
    canopy(g, 570, 96, 26, rng);
    // ⑤ “佛”字巨石（x≈640）
    oval(g, P.ink, 642, 136, 44, 36);
    oval(g, 0xb8ae9a, 642, 136, 43, 35);
    oval(g, 0xd0c8b4, 630, 122, 22, 16);
    oval(g, 0x9a9080, 662, 156, 22, 10);
    framed(g, P.flame, 628, 118, 28, 32, P.lacquerDark);
    glyphs(g, P.cream, 632, 122, 1, 20, false, rng);
    for (let k = 0; k < 4; k++) tuft(g, 606 + k * 22, 172, rng);
  };

  const ground: LayerDef['draw'] = (g) => {
    const rng = seeded(541);
    paving(g, rng, { base: 0xcfc6b2, light: 0xe6ddc8, dark: 0xaaa08a, seam: 0x8e846e, row0: 9, tile0: 36 });
    // 中轴的花岗岩御路
    trap(g, 0xe6ddc8, GROUND, H, 330, 390, 310, 410, 0.5);
    for (let y = GROUND + 6; y < H; y += 14) box(g, P.goldDark, 340, y, 40, 1, 0.3);
    // 晨光与落叶
    for (let i = 0; i < 26; i++) box(g, P.glowSoft, Math.floor(rng() * W), GROUND + 8 + Math.floor(rng() * 80), 10 + Math.floor(rng() * 14), 1, 0.3);
    for (let i = 0; i < 30; i++) px(g, rng() < 0.5 ? P.leafLight : P.goldDark, Math.floor(rng() * W), GROUND + 4 + Math.floor(rng() * 86));
  };

  const front: LayerDef['draw'] = (g) => {
    const rng = seeded(551);
    // 左下角石灯笼
    bevel(g, 6, 236, 20, 6, P.graniteLight, P.granite, P.graniteDark, P.ink);
    bevel(g, 10, 242, 12, 28, P.graniteLight, P.granite, P.graniteDark, P.ink);
    framed(g, P.glow, 12, 224, 8, 12, P.ink);
    trap(g, P.ink, 216, 225, 10, 22, 4, 28);
    // 右下角荷花缸
    trap(g, P.ink, 250, 270, 672, 716, 678, 710);
    trap(g, 0x6a5a3a, 251, 270, 673, 715, 679, 709);
    oval(g, P.leafDark, 686, 250, 8, 3);
    oval(g, P.leaf, 702, 249, 7, 2);
    disc(g, P.lotus, 694, 244, 3);
    tuft(g, 40, 270, rng);
  };

  return stack(sky, far, mid, main, ground, front);
}

export function drawLocation(scene: Phaser.Scene, palette: ScenePalette): void {
  const builders: Record<ScenePalette, () => LayerDef[]> = {
    laocuo: laocuoLayers,
    bashi: bashiLayers,
    zhongshan: zhongshanLayers,
    gulangyu: gulangyuLayers,
    zengcuoan: zengcuoanLayers,
    nanputuo: nanputuoLayers,
  };
  bake(scene, palette, (builders[palette] ?? laocuoLayers)());
}
