/**
 * 插画（DOM 侧）：对话背景 480×270、科普卡插图 200×120。
 * 正式美术由 illus/ 目录下的程序化像素插画绘制，本模块只负责缓存与分发。
 */
import { drawLaocuo } from './illus/bd_laocuo';
import { drawBashi } from './illus/bd_bashi';
import { drawZhongshan } from './illus/bd_zhongshan';
import { drawGulangyu } from './illus/bd_gulangyu';
import { drawZengcuoan } from './illus/bd_zengcuoan';
import { drawNanputuo } from './illus/bd_nanputuo';
import { KA_A } from './illus/ka_laocuo_bashi';
import { KA_B } from './illus/ka_zhongshan_gulangyu';
import { KA_C } from './illus/ka_zengcuoan_nanputuo';
import { frame, genericCard } from './illus/ka_base';
import { make, type G } from './illus/kit';

const BACKDROPS: Record<string, (g: G) => void> = {
  laocuo: drawLaocuo,
  bashi: drawBashi,
  zhongshan: drawZhongshan,
  gulangyu: drawGulangyu,
  zengcuoan: drawZengcuoan,
  nanputuo: drawNanputuo,
};

const KNOWLEDGE_ART = { ...KA_A, ...KA_B, ...KA_C };

const cache = new Map<string, string>();

export function sceneBackdrop(sceneId: string): string {
  const draw = BACKDROPS[sceneId] ?? drawLaocuo;
  return make(cache, `bd-${sceneId}`, 480, 270, draw);
}

export function knowledgeArt(prop: string): string {
  const draw = KNOWLEDGE_ART[prop] ?? genericCard;
  return make(cache, `ka-${prop}`, 200, 120, (g) => {
    draw(g);
    frame(g);
  });
}
