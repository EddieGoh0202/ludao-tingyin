import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { LocationScene } from './scenes/LocationScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { QuestSystem } from './systems/quest/QuestSystem';
import { installCollectToast } from './ui/Panels';
import { installToast } from './ui/Toast';
import { Stage, VIEW_H, VIEW_W } from './ui/dom';

QuestSystem.init();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: VIEW_W,
  height: VIEW_H,
  parent: 'game',
  pixelArt: true,
  backgroundColor: '#1a120d',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, WorldMapScene, LocationScene],
});

// 覆盖层必须在任何场景使用图层之前建立；Boot 的 create 在下一帧才执行
Stage.init(game);
installToast();
installCollectToast();

if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
