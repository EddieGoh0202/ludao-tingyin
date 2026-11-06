import Phaser from 'phaser';
import { drawTitle } from '../art/titleArt';
import { AudioManager } from '../core/AudioManager';
import { Content } from '../core/ContentRepository';
import { SaveManager } from '../core/SaveManager';
import { StateStore } from '../core/StateStore';
import { DialogueSystem } from '../systems/dialogue/DialogueSystem';
import { QuestSystem } from '../systems/quest/QuestSystem';
import { Stage, el } from '../ui/dom';

export class TitleScene extends Phaser.Scene {
  private root: HTMLDivElement | null = null;

  constructor() {
    super('Title');
  }

  create(): void {
    AudioManager.playBgm('peige');
    const { radio } = drawTitle(this);
    this.tweens.add({ targets: radio, y: radio.y - 2, duration: 900, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });

    const hasSave = SaveManager.hasSave();
    const newBtn = el('button', { class: 'btn', text: '新的旅程' });
    const contBtn = el('button', { class: 'btn ghost', text: '继续收听' });
    contBtn.disabled = !hasSave;
    newBtn.addEventListener('click', () => this.startNew(hasSave));
    contBtn.addEventListener('click', () => this.continueGame());

    this.root = el('div', { class: 'interactive' }, [
      el('div', { class: 'title-box' }, [
        el('div', { class: 'title-main', text: '鹭岛听音' }),
        el('div', { class: 'title-sub', text: 'Lōo-tó thiann-im' }),
        el('div', { class: 'title-tag', text: '带上阿公的老收音机，在厦门街巷里收集闽南话' }),
      ]),
      el('div', { class: 'title-menu' }, [newBtn, contBtn]),
    ]);
    Stage.layer('hud').append(this.root);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.root?.remove();
      this.root = null;
    });
  }

  private prepareAudio(): void {
    AudioManager.init();
    AudioManager.setVolume(StateStore.data.settings.volume);
    AudioManager.sfx('click');
  }

  private startNew(hasSave: boolean): void {
    if (hasSave && !window.confirm('开始新的旅程会覆盖现有进度，确定吗？')) return;
    StateStore.loadOrNew(true);
    this.prepareAudio();
    SaveManager.save(StateStore.data);
    this.root?.classList.add('hidden');
    const first = Content.scenes[0];
    DialogueSystem.show(
      [
        { speaker: '旁白', text: '暑假，你回到厦门的外妈家。' },
        { speaker: '阿公', text: '这台老收音机，听会着厝边头尾的声。', tailo: 'tshù-pinn thâu-bué' },
        { speaker: '旁白', text: '转动旋钮，对准频率，把散落在街巷里的闽南话一段一段收集回来吧。' },
      ],
      () => this.scene.start('Location', { sceneId: first.id }),
    );
  }

  private continueGame(): void {
    StateStore.loadOrNew(false);
    this.prepareAudio();
    QuestSystem.evaluate();
    const data = StateStore.data;
    const sceneId = data.unlockedScenes.includes(data.currentScene) ? data.currentScene : Content.scenes[0].id;
    this.scene.start('Location', { sceneId });
  }
}
