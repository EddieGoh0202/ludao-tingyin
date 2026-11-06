import Phaser from 'phaser';
import { generateTextures } from '../art/textures';
import { generateProps } from '../art/props';

/** 生成全部程序化像素贴图，然后进入标题 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    generateProps(this);
    this.scene.start('Title');
  }
}
