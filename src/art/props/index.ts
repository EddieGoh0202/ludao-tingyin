import Phaser from 'phaser';
import { LAOCUO_BASHI } from './laocuo_bashi';
import { ZHONGSHAN_GULANGYU } from './zhongshan_gulangyu';
import { ZENGCUOAN_NANPUTUO } from './zengcuoan_nanputuo';
import type { PropSpec } from './base';

/** 全部科普道具贴图：key 与 content/knowledge.json 的 prop 字段一一对应 */
export const PROP_SPECS: Record<string, PropSpec> = {
  ...LAOCUO_BASHI,
  ...ZHONGSHAN_GULANGYU,
  ...ZENGCUOAN_NANPUTUO,
};

/**
 * 一次生成所有 `prop-*` 贴图（Canvas 2D 逐像素绘制，关闭抗锯齿）。
 * 未在表中登记的道具会跳过，由场景退回 know-mark 占位，不会崩。
 */
export function generateProps(scene: Phaser.Scene): void {
  for (const [prop, spec] of Object.entries(PROP_SPECS)) {
    const key = `prop-${prop}`;
    if (scene.textures.exists(key)) continue;
    const tex = scene.textures.createCanvas(key, spec.w, spec.h);
    if (!tex) continue;
    const g = tex.getContext();
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, spec.w, spec.h);
    spec.draw(g);
    tex.refresh();
  }
}
