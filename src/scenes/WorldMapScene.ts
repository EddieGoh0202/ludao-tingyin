import Phaser from 'phaser';
import { drawWorldMap } from '../art/mapArt';
import { AudioManager } from '../core/AudioManager';
import { Content } from '../core/ContentRepository';
import { EventBus } from '../core/EventBus';
import { StateStore } from '../core/StateStore';
import { CollectionSystem } from '../systems/collection/CollectionSystem';
import { Stage, el } from '../ui/dom';

/** 地图地名注记（游戏坐标），避开各地点标记 */
const MAP_NAMES: Array<{ text: string; x: number; y: number; kind: 'sea' | 'land' | 'spot' }> = [
  { text: '台湾海峡', x: 400, y: 252, kind: 'sea' },
  { text: '厦门港', x: 168, y: 238, kind: 'sea' },
  { text: '鹭江', x: 176, y: 150, kind: 'sea' },
  { text: '西海域', x: 120, y: 128, kind: 'sea' },
  { text: '同安湾', x: 440, y: 92, kind: 'sea' },
  { text: '海沧', x: 60, y: 118, kind: 'land' },
  { text: '集美', x: 300, y: 18, kind: 'land' },
  { text: '金门', x: 463, y: 222, kind: 'land' },
  { text: '厦门岛', x: 340, y: 108, kind: 'land' },
  { text: '高崎机场', x: 378, y: 70, kind: 'spot' },
  { text: '筼筜湖', x: 236, y: 100, kind: 'spot' },
  { text: '环岛路', x: 404, y: 210, kind: 'spot' },
  { text: '演武大桥', x: 262, y: 236, kind: 'spot' },
  { text: '海沧大桥', x: 160, y: 92, kind: 'spot' },
  { text: '厦门大桥', x: 280, y: 52, kind: 'spot' },
  { text: '日光岩', x: 128, y: 160, kind: 'spot' },
  { text: '大屿 · 白鹭栖地', x: 120, y: 218, kind: 'spot' },
];

/** 厦门地图：已解锁地点可前往，未解锁显示门槛，后续地点「敬请期待」 */
export class WorldMapScene extends Phaser.Scene {
  private root: HTMLDivElement | null = null;

  constructor() {
    super('WorldMap');
  }

  create(): void {
    AudioManager.playBgm('peige');
    drawWorldMap(this);
    this.renderDom();
    const offs = [
      EventBus.on('scene:unlocked', () => this.renderDom()),
      EventBus.on('sound:collected', () => this.renderDom()),
    ];

    const esc = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    esc?.on('down', () => this.scene.start('Location', { sceneId: StateStore.data.currentScene }));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offs.forEach((off) => off());
      this.root?.remove();
      this.root = null;
    });
  }

  /** 构建（或重建）地图上的 DOM 节点，解锁/收集变化时调用 */
  private renderDom(): void {
    this.root?.remove();
    const data = StateStore.data;
    const count = StateStore.collectedCount();
    this.root = el('div');
    this.root.append(el('div', { class: 'map-title', text: `厦门 · Ē-mn̂g  （已收集 ${count}/${CollectionSystem.total()}）` }));
    for (const n of MAP_NAMES) {
      const tag = el('div', { class: `map-name ${n.kind}`, text: n.text });
      Stage.place(tag, n.x, n.y);
      this.root.append(tag);
    }

    for (const sc of Content.scenes) {
      const unlocked = data.unlockedScenes.includes(sc.id);
      const current = sc.id === data.currentScene;
      const sub = unlocked
        ? `${CollectionSystem.countInScene(sc.id)}/${Content.soundsIn(sc.id).length} 段`
        : `收集 ${sc.unlock.requireCollected} 段解锁`;
      const label = el('div', { class: 'map-label' }, [sc.name, el('small', { text: sub })]);
      const pin = el('button', { class: `map-pin ${current ? 'current' : ''} ${unlocked ? '' : 'locked'}`, title: sc.desc }, [
        el('div', { class: 'map-dot' }),
        label,
      ]);
      Stage.place(pin, sc.mapPos.x, sc.mapPos.y);
      pin.addEventListener('click', () => {
        if (!unlocked) {
          AudioManager.sfx('bad');
          EventBus.emit('toast', { text: `${sc.name}：再收集 ${sc.unlock.requireCollected - count} 段声音就能解锁` });
          return;
        }
        AudioManager.sfx('click');
        this.scene.start('Location', { sceneId: sc.id });
      });
      this.root.append(pin);
    }

    for (const up of Content.upcoming) {
      const pin = el('div', { class: 'map-pin upcoming' }, [
        el('div', { class: 'map-dot' }),
        el('div', { class: 'map-label' }, [up.name, el('small', { text: '敬请期待' })]),
      ]);
      Stage.place(pin, up.x, up.y);
      this.root.append(pin);
    }

    const back = el('button', { class: 'btn map-back', text: '返回' });
    back.addEventListener('click', () => {
      AudioManager.sfx('click');
      this.scene.start('Location', { sceneId: data.currentScene });
    });
    this.root.append(back);
    Stage.layer('labels').append(this.root);
  }
}
