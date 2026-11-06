import Phaser from 'phaser';

/** 闽南红砖厝与骑楼体系的主色板，所有场景共用，保证整体色调统一。 */
export const PALETTE = {
  brick: 0xb5432f,
  brickDark: 0x8e2f22,
  brickLight: 0xc9603f,
  plaster: 0xe9d3a1,
  plasterDark: 0xcdb483,
  stone: 0xd8d2c4,
  stoneDark: 0xa9a292,
  ink: 0x2b1d16,
  inkSoft: 0x4a3629,
  sea: 0x2f6f9f,
  seaDeep: 0x214f74,
  seaLight: 0x7fb6d6,
  flame: 0xd8392b,
  leaf: 0x3f7d4a,
  leafDark: 0x2c5c37,
  leafLight: 0x6fa35b,
  cream: 0xf6eeda,
  gold: 0xd9a441,
  night: 0x1d2a3a,
  // —— v0.2 正式美术追加色 ——
  goldLight: 0xf0c869,
  goldDark: 0xa87a2a,
  bougain: 0xc2447a,
  bougainLight: 0xe07aa6,
  bougainDark: 0x8a2c57,
  wood: 0x8a6231,
  woodLight: 0xb08450,
  woodDark: 0x5a3b20,
  granite: 0xb9b2a4,
  graniteLight: 0xd6d0c2,
  graniteDark: 0x857e71,
  templeYellow: 0xe3b44c,
  templeYellowLight: 0xf2d27a,
  templeYellowDark: 0xb48632,
  lacquer: 0xa8281e,
  lacquerDark: 0x741a14,
  glaze: 0xe08a2e,
  glazeLight: 0xf2b552,
  glazeDark: 0xa85b1c,
  glow: 0xffd47a,
  glowSoft: 0xfff0c2,
  foam: 0xf0f2ec,
  foamDark: 0xc9cfc8,
  plasticRed: 0xd8402c,
  plasticBlue: 0x3f7fb5,
  steel: 0x8b9ea2,
  steelDark: 0x5f7276,
  steelLight: 0xb7c6c8,
  shadow: 0x1a120d,
  mist: 0xe4eee8,
  sand: 0xe6d2a4,
  lotus: 0xf2a7b8,
} as const;

/** 两个 0xRRGGBB 颜色线性混合，t=0 取 a，t=1 取 b。 */
export function mix(a: number, b: number, t: number): number {
  const k = Math.max(0, Math.min(1, t));
  const ch = (shift: number) => {
    const x = (a >> shift) & 255;
    const y = (b >> shift) & 255;
    return Math.round(x + (y - x) * k);
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** 可复现的伪随机数（mulberry32），让烘焙出来的细节每次都一样。 */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 单个像素 */
export function px(g: Phaser.GameObjects.Graphics, color: number, x: number, y: number, alpha = 1): void {
  box(g, color, x, y, 1, 1, alpha);
}

/** 无抗锯齿的像素椭圆（逐行填充），比 fillEllipse 更“像素”。 */
export function oval(
  g: Phaser.GameObjects.Graphics,
  color: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  alpha = 1,
): void {
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);
  const R = Math.max(0, Math.round(ry));
  for (let dy = -R; dy <= R; dy++) {
    const k = 1 - (dy * dy) / ((R + 0.5) * (R + 0.5));
    if (k < 0) continue;
    const hw = Math.floor((rx + 0.5) * Math.sqrt(k));
    box(g, color, x0 - hw, y0 + dy, hw * 2 + 1, 1, alpha);
  }
}

/** 像素圆 */
export function disc(g: Phaser.GameObjects.Graphics, color: number, cx: number, cy: number, r: number, alpha = 1): void {
  oval(g, color, cx, cy, r, r, alpha);
}

/** 逐行填充的梯形：上边 [l0,r0)、下边 [l1,r1)，用于屋面、山体、透视巷道。 */
export function trap(
  g: Phaser.GameObjects.Graphics,
  color: number,
  y0: number,
  y1: number,
  l0: number,
  r0: number,
  l1: number,
  r1: number,
  alpha = 1,
): void {
  const h = Math.round(y1 - y0);
  for (let i = 0; i < h; i++) {
    const t = h <= 1 ? 0 : i / (h - 1);
    const l = Math.round(l0 + (l1 - l0) * t);
    const r = Math.round(r0 + (r1 - r0) * t);
    if (r > l) box(g, color, l, y0 + i, r - l, 1, alpha);
  }
}

/** 1px 描边 + 填充 */
export function framed(
  g: Phaser.GameObjects.Graphics,
  fill: number,
  x: number,
  y: number,
  w: number,
  h: number,
  edge: number = PALETTE.ink,
): void {
  box(g, edge, x, y, w, h);
  box(g, fill, x + 1, y + 1, w - 2, h - 2);
}

/** 三阶明暗块：左上亮、右下暗，可选 1px 描边。 */
export function bevel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  light: number,
  mid: number,
  dark: number,
  edge?: number,
): void {
  let X = x;
  let Y = y;
  let bw = w;
  let bh = h;
  if (edge !== undefined) {
    box(g, edge, x, y, w, h);
    X += 1;
    Y += 1;
    bw -= 2;
    bh -= 2;
  }
  if (bw <= 0 || bh <= 0) return;
  box(g, mid, X, Y, bw, bh);
  box(g, light, X, Y, bw, 1);
  box(g, light, X, Y, 1, bh);
  box(g, dark, X, Y + bh - 1, bw, 1);
  box(g, dark, X + bw - 1, Y + 1, 1, bh - 1);
}

/** 分段色带渐变（像素风天空常用的“色阶”效果） */
export function vgrad(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  top: number,
  bottom: number,
  bands = 8,
): void {
  for (let i = 0; i < bands; i++) {
    const a = y + Math.floor((h * i) / bands);
    const b = y + Math.floor((h * (i + 1)) / bands);
    box(g, mix(top, bottom, bands === 1 ? 0 : i / (bands - 1)), x, a, w, b - a);
  }
}

/**
 * 创建一个属于场景美术的 Graphics。
 * depth 固定低于 10，保证角色 / NPC 永远画在地形之上。
 */
export function layer(
  scene: Phaser.Scene,
  depth: number,
  scrollFactor = 1,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.setDepth(Math.min(depth, 9));
  g.setScrollFactor(scrollFactor);
  return g;
}

/** 整数坐标矩形，像素画统一入口，避免半像素导致模糊。 */
export function box(
  g: Phaser.GameObjects.Graphics,
  color: number,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 1,
): void {
  g.fillStyle(color, alpha).fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** 整数坐标多边形，用于燕尾脊、屋脊、山体等斜线造型。 */
export function poly(
  g: Phaser.GameObjects.Graphics,
  color: number,
  points: number[],
  alpha = 1,
): void {
  g.fillStyle(color, alpha).fillPoints(
    points.reduce<Phaser.Geom.Point[]>((acc, _value, index) => {
      if (index % 2 === 0) acc.push(new Phaser.Geom.Point(points[index], points[index + 1]));
      return acc;
    }, []),
    true,
  );
}
