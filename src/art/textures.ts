import Phaser from 'phaser';
import { CAST, charCanvas } from './chars';
import { OBJ_TEXTS, objCanvas } from './chars/objects';

/**
 * 角色与物件贴图：Canvas 2D 程序化像素画（chars/ 目录），
 * 统一 1px 墨线描边、三阶明暗。贴图底部中心为脚底，阴影由场景另绘。
 */
function put(scene: Phaser.Scene, key: string, src: HTMLCanvasElement | null): void {
  if (!src || scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, src.width, src.height);
  if (!tex) return;
  tex.getContext().drawImage(src, 0, 0);
  tex.refresh();
}

export function generateTextures(scene: Phaser.Scene): void {
  put(scene, 'player', charCanvas('player', 0));
  put(scene, 'player-walk', charCanvas('player', 1));
  put(scene, 'player-walk2', charCanvas('player', 2));
  for (const name of Object.keys(CAST)) {
    if (name !== 'player') put(scene, `npc-${name}`, charCanvas(name, 0));
  }
  for (const key of Object.keys(OBJ_TEXTS)) put(scene, key, objCanvas(key));
}
