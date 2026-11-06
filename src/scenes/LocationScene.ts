import Phaser from 'phaser';
import { drawLocation } from '../art/sceneArt';
import { sceneBackdrop } from '../art/illustrations';
import { portrait } from '../art/portraits';
import { AudioManager, type BgmTrack } from '../core/AudioManager';
import { Content } from '../core/ContentRepository';
import { EventBus } from '../core/EventBus';
import { StateStore } from '../core/StateStore';
import { openBargain } from '../minigames/Bargain';
import { openBobing } from '../minigames/Bobing';
import type { HotspotDef, KnowledgeDef, SceneDef } from '../types';
import { runChallenge } from '../systems/challenge/ChallengeRunner';
import { CollectionSystem } from '../systems/collection/CollectionSystem';
import { DialogueSystem, type DialogueLine } from '../systems/dialogue/DialogueSystem';
import { KnowledgeSystem } from '../systems/knowledge/KnowledgeSystem';
import { QuestSystem } from '../systems/quest/QuestSystem';
import { RadioSystem } from '../systems/radio/RadioSystem';
import { TIME_TINT, TimeSystem } from '../systems/timeWeather/TimeSystem';
import { Hud } from '../ui/Hud';
import { RadioPanel } from '../ui/RadioPanel';
import { Stage, UIState, el } from '../ui/dom';
import { VoiceBank } from '../core/VoiceBank';

const WORLD_W = 720;
const WORLD_H = 270;
/** 各地点背景音乐：老厝用《阿嬷的话》，鼓浪屿用《流浪诗人》，其余使用《彼个所在》 */
const BGM_BY_SCENE: Record<string, BgmTrack> = { laocuo: 'amahuo', gulangyu: 'liulang' };
const SPEED = 74;
const MIN_X = 16;
const MAX_X = 704;
const MIN_Y = 184;
const MAX_Y = 262;
const TALK_RANGE = 56;
const KNOW_RANGE = 44;
const SPAWN = { x: 100, y: 236 };
/** 场景中人物（玩家与 NPC）相对场景的放大倍率 */
const CHAR_SCALE = 1.35;

/** 角色/物件深度：按脚底 y 排序，保持在地面层(4)与前景层(25)之间 */
const depthOf = (y: number) => 10 + (y - 150) / 200;

/** 本次会话内已播放过开场白的场景（不写入存档） */
const introShown = new Set<string>();

interface HotspotView {
  kind: 'hotspot' | 'knowledge';
  label: string;
  def?: HotspotDef;
  know?: KnowledgeDef;
  /** 精灵底部中心（世界坐标） */
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Image;
  tag: HTMLDivElement;
  mark?: Phaser.GameObjects.Image;
}

type KeyMap = Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'q' | 'e' | 'shift' | 'space' | 'enter' | 'esc' | 'm', Phaser.Input.Keyboard.Key>;

/** 关卡场景：行走 + 收音机调频 + NPC 交互 + 挑战收集 */
export class LocationScene extends Phaser.Scene {
  private sc!: SceneDef;
  private player!: Phaser.GameObjects.Sprite;
  private target: { x: number; y: number } | null = null;
  private pendingTalk: HotspotView | null = null;
  private hotspots: HotspotView[] = [];
  private hintTag!: HTMLDivElement;
  private bubble!: HTMLDivElement;
  private labelsRoot!: HTMLDivElement;
  private tint!: Phaser.GameObjects.Rectangle;
  private waves = new Map<string, Phaser.GameObjects.Image>();
  private radio!: RadioSystem;
  private panel!: RadioPanel;
  private hud!: Hud;
  private keys!: KeyMap;
  private offs: Array<() => void> = [];
  private challengeActive = false;
  private uiPaused = false;
  /** 最近一次处于弹窗/对话状态的时间，用于屏蔽关闭弹窗的同一次按键 */
  private lastModalAt = 0;
  private tuneHold = 0;
  private walkClock = 0;
  private nearest: HotspotView | null = null;

  constructor() {
    super('Location');
  }

  init(data: { sceneId?: string }): void {
    const id = data.sceneId && Content.scenes.some((s) => s.id === data.sceneId) ? data.sceneId : Content.scenes[0].id;
    this.sc = Content.scene(id);
    this.hotspots = [];
    this.waves = new Map();
    this.offs = [];
    this.target = null;
    this.pendingTalk = null;
    this.challengeActive = false;
    this.uiPaused = false;
    this.nearest = null;
  }

  create(): void {
    const sc = this.sc;
    StateStore.setScene(sc.id);
    EventBus.emit('scene:enter', { sceneId: sc.id });
    AudioManager.playBgm(BGM_BY_SCENE[sc.id] ?? 'peige');

    drawLocation(this, sc.palette);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);

    // 玩家
    this.player = this.add.sprite(SPAWN.x, SPAWN.y, 'player').setOrigin(0.5, 1).setScale(CHAR_SCALE).setDepth(depthOf(SPAWN.y));
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.setRoundPixels(true);

    // DOM 标签层
    this.labelsRoot = el('div');
    this.hintTag = el('div', { class: 'tag hint hidden', text: '空格 交谈' });
    this.bubble = el('div', { class: 'know-bubble hidden' });
    Stage.layer('labels').append(this.labelsRoot);
    this.labelsRoot.append(this.bubble, this.hintTag);

    this.createHotspots();
    this.createKnowledge();

    // 时段色调
    this.tint = this.add.rectangle(0, 0, 480, 270, 0xffffff, 0).setOrigin(0).setScrollFactor(0).setDepth(30);
    this.applyTint();

    this.refreshWaves();

    // 收音机
    this.radio = new RadioSystem();
    this.panel = new RadioPanel(this.radio);
    this.panel.mount();
    this.radio.setOn(true);

    this.hud = new Hud(sc.id, {
      onMap: () => this.scene.start('WorldMap'),
      onReset: () => {
        StateStore.loadOrNew(true);
        this.scene.start('Title');
      },
    });
    this.hud.mount();

    this.setupInput();

    this.offs.push(
      EventBus.on('time:changed', () => {
        this.applyTint();
        this.refreshWaves();
      }),
      EventBus.on('sound:collected', () => this.refreshWaves()),
      EventBus.on('radio:locked', ({ soundId }) => this.onLocked(soundId)),
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    if (!introShown.has(sc.id)) {
      introShown.add(sc.id);
      DialogueSystem.show({ speaker: sc.name, text: sc.storyIntro }, undefined, { bg: sceneBackdrop(sc.id), playerPortrait: portrait('player') });
    }
  }

  private textureFor(def: HotspotDef): string {
    const s = def.sprite;
    if (s) {
      const key = s.startsWith('obj-') ? s : `npc-${s}`;
      if (this.textures.exists(key)) return key;
    }
    if (def.action === 'minigame:bobing') return 'obj-bobing';
    return 'npc-tourist';
  }

  private bindClick(view: HotspotView, range: number): void {
    view.sprite.setInteractive({ useHandCursor: true });
    view.sprite.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      if (this.inputBlocked()) return;
      if (this.distanceTo(view) <= range) this.interact(view);
      else {
        this.pendingTalk = view;
        this.walkTo(view.x + (this.player.x < view.x ? -22 : 22), view.y + 10);
      }
    });
  }

  private createHotspots(): void {
    for (const def of this.sc.hotspots) {
      const x = def.x;
      const y = def.y;
      const sprite = this.add.image(x, y, this.textureFor(def)).setOrigin(0.5, 1).setDepth(depthOf(y));
      const isChar = !sprite.texture.key.startsWith('obj-');
      if (isChar) sprite.setScale(CHAR_SCALE);
      // 角色脚下的柔和阴影
      this.add.ellipse(x, y - 1, Math.min(sprite.displayWidth, 40), 6, 0x2b1d16, 0.28).setDepth(depthOf(y) - 0.01);
      const view: HotspotView = { kind: 'hotspot', label: def.label, def, x, y, sprite, tag: el('div', { class: 'tag', text: def.label }) };
      this.bindClick(view, TALK_RANGE);
      // 小幅呼吸动画，让 NPC 显得「活着」
      if (isChar) {
        this.tweens.add({ targets: sprite, scaleY: CHAR_SCALE * 1.03, duration: 800 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
      }
      this.labelsRoot.append(view.tag);
      this.hotspots.push(view);
    }
  }

  /** 闽南文化科普点：小物件 + 头顶标记，靠近弹出简介，空格/点击打开图文卡 */
  private createKnowledge(): void {
    for (const k of Content.knowledgeIn(this.sc.id)) {
      const key = this.textures.exists(`prop-${k.prop}`) ? `prop-${k.prop}` : 'know-mark';
      const sprite = this.add.image(k.x, k.y, key).setOrigin(0.5, 1).setDepth(depthOf(k.y));
      const mark = this.add.image(k.x, k.y - sprite.height - 8, 'know-mark').setDepth(24);
      this.tweens.add({ targets: mark, y: mark.y - 3, duration: 650, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
      const view: HotspotView = {
        kind: 'knowledge',
        label: k.title,
        know: k,
        x: k.x,
        y: k.y,
        sprite,
        mark,
        tag: el('div', { class: 'tag know', text: k.title }),
      };
      this.refreshMark(view);
      this.bindClick(view, KNOW_RANGE);
      this.labelsRoot.append(view.tag);
      this.hotspots.push(view);
    }
  }

  private refreshMark(v: HotspotView): void {
    if (!v.know || !v.mark) return;
    v.mark.setAlpha(KnowledgeSystem.isSeen(v.know.id) ? 0.45 : 1);
  }

  private rangeOf(v: HotspotView): number {
    return v.kind === 'knowledge' ? KNOW_RANGE : TALK_RANGE;
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    // enableCapture=false：不阻止浏览器默认行为，避免影响弹窗里的按钮 / 输入框
    const add = (code: number) => kb.addKey(code, false);
    this.keys = {
      up: add(K.UP), down: add(K.DOWN), left: add(K.LEFT), right: add(K.RIGHT),
      w: add(K.W), a: add(K.A), s: add(K.S), d: add(K.D),
      q: add(K.Q), e: add(K.E), shift: add(K.SHIFT),
      space: add(K.SPACE), enter: add(K.ENTER), esc: add(K.ESC), m: add(K.M),
    };

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.inputBlocked()) return;
      AudioManager.init();
      this.pendingTalk = null;
      this.walkTo(p.worldX, p.worldY);
    });
  }

  private inputBlocked(): boolean {
    return UIState.modalOpen || this.challengeActive || this.time.now - this.lastModalAt < 200;
  }

  private walkTo(x: number, y: number): void {
    this.target = {
      x: Phaser.Math.Clamp(x, MIN_X, MAX_X),
      y: Phaser.Math.Clamp(y, MIN_Y, MAX_Y),
    };
  }

  private distanceTo(h: HotspotView): number {
    return Math.hypot(h.x - this.player.x, (h.y - this.player.y) * 0.6);
  }

  private interact(h: HotspotView): void {
    this.target = null;
    this.pendingTalk = null;
    AudioManager.init();
    AudioManager.sfx('click');
    this.player.setFlipX(h.x < this.player.x);
    if (h.kind === 'knowledge' && h.know) {
      KnowledgeSystem.open(h.know, () => {
        this.lastModalAt = this.time.now;
        this.refreshMark(h);
      });
      return;
    }
    const def = h.def!;
    switch (def.action) {
      case 'npc': {
        const name = def.label.replace(/[（(].*$/, '');
        const lines: DialogueLine[] = def.dialogue?.length
          ? def.dialogue.map((d, n) => {
            const recordingId = `${this.sc.id}-${h.def?.id}-${String(n + 1).padStart(2, '0')}`;
            return {
              speaker: d.speaker ?? name,
              text: d.text,
              tailo: d.tailo,
              audio: VoiceBank.find(recordingId, d.text) ?? d.audio,
            };
          })
          : [{ speaker: name, text: def.npcLine ?? '……', audio: VoiceBank.find(`${this.sc.id}-${h.def?.id}-01`, def.npcLine) }];
        DialogueSystem.show(lines, undefined, {
          bg: sceneBackdrop(this.sc.id),
          portrait: def.sprite ? portrait(def.sprite) : null,
          playerPortrait: portrait('player'),
        });
        break;
      }
      case 'minigame:bargain':
        openBargain();
        break;
      case 'minigame:bobing':
        openBobing();
        break;
      default:
        break;
    }
  }

  private onLocked(soundId: string): void {
    if (this.challengeActive) return;
    this.challengeActive = true;
    this.target = null;
    this.radio.setPaused(true);
    runChallenge(
      soundId,
      (r) => {
        CollectionSystem.collect(soundId, r.stars);
        this.challengeActive = false;
        this.lastModalAt = this.time.now;
        this.radio.setPaused(false);
        QuestSystem.evaluate();
        this.refreshWaves();
        this.hud.refresh();
      },
      () => {
        // 放弃挑战：恢复收音，5 秒内不再锁定同一段声音
        this.challengeActive = false;
        this.lastModalAt = this.time.now;
        this.radio.snooze(soundId, 5);
        this.radio.setPaused(false);
      },
    );
  }

  private applyTint(): void {
    const t = TIME_TINT[TimeSystem.current];
    this.tint.setFillStyle(t.color, t.alpha);
  }

  /** 当前时段可听到、尚未收集的声源显示「声波」提示 */
  private refreshWaves(): void {
    const audible = Content.audibleIn(this.sc.id, TimeSystem.current).filter((s) => !StateStore.isCollected(s.id));
    const keep = new Set(audible.map((s) => s.id));
    for (const [id, img] of this.waves) {
      if (!keep.has(id)) {
        this.tweens.killTweensOf(img);
        img.destroy();
        this.waves.delete(id);
      }
    }
    for (const s of audible) {
      if (this.waves.has(s.id)) continue;
      const img = this.add.image(s.pos.x, s.pos.y - 14, 'wave').setDepth(15).setAlpha(0.35);
      this.tweens.add({
        targets: img,
        scale: { from: 0.7, to: 1.15 },
        alpha: { from: 0.45, to: 0.1 },
        duration: 1100 + (s.frequency % 1) * 600,
        repeat: -1,
        ease: 'Sine.easeOut',
      });
      this.waves.set(s.id, img);
    }
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    const modal = UIState.modalOpen;
    if (modal) this.lastModalAt = time;

    // 弹窗 / 对话期间暂停收音（挑战由 onLocked 单独暂停）
    const shouldPause = modal && !this.challengeActive;
    if (shouldPause !== this.uiPaused) {
      this.uiPaused = shouldPause;
      if (!this.challengeActive) this.radio.setPaused(shouldPause);
    }

    const blocked = this.inputBlocked();
    if (!blocked) {
      this.handleTuning(dt);
      this.handleMovement(dt);
      if (Phaser.Input.Keyboard.JustDown(this.keys.m)) {
        this.scene.start('WorldMap');
        return;
      }
    } else {
      this.setWalking(false);
      // 消耗掉弹窗期间的按键，避免关闭后误触发
      Phaser.Input.Keyboard.JustDown(this.keys.space);
      Phaser.Input.Keyboard.JustDown(this.keys.enter);
      Phaser.Input.Keyboard.JustDown(this.keys.q);
      Phaser.Input.Keyboard.JustDown(this.keys.e);
      Phaser.Input.Keyboard.JustDown(this.keys.m);
    }

    // 最近的可交互对象
    let best: HotspotView | null = null;
    let bestD = Infinity;
    for (const h of this.hotspots) {
      const d = this.distanceTo(h) / this.rangeOf(h);
      if (d < bestD) {
        bestD = d;
        best = h;
      }
    }
    this.nearest = best && bestD <= 1 ? best : null;

    if (this.pendingTalk && this.distanceTo(this.pendingTalk) <= this.rangeOf(this.pendingTalk) && !blocked) {
      this.interact(this.pendingTalk);
    } else if (!blocked && this.nearest) {
      const sp = Phaser.Input.Keyboard.JustDown(this.keys.space);
      const en = Phaser.Input.Keyboard.JustDown(this.keys.enter);
      if (sp || en) this.interact(this.nearest);
    } else if (!blocked) {
      Phaser.Input.Keyboard.JustDown(this.keys.space);
      Phaser.Input.Keyboard.JustDown(this.keys.enter);
    }

    // 收音机
    const sig = this.radio.update(
      dt,
      this.player.x,
      this.player.y,
      Content.audibleIn(this.sc.id, TimeSystem.current),
      (id) => StateStore.isCollected(id),
    );
    this.panel.render(sig);
    for (const [id, img] of this.waves) img.setTint(id === sig.nearestId ? 0xffffff : 0xd9a441);

    this.updateLabels();
  }

  private handleTuning(dt: number): void {
    const k = this.keys;
    const step = k.shift.isDown ? 1 : 0.1;
    if (Phaser.Input.Keyboard.JustDown(k.q)) {
      this.radio.tune(-step);
      this.tuneHold = 0;
    }
    if (Phaser.Input.Keyboard.JustDown(k.e)) {
      this.radio.tune(step);
      this.tuneHold = 0;
    }
    const dir = (k.e.isDown ? 1 : 0) - (k.q.isDown ? 1 : 0);
    if (dir === 0) {
      this.tuneHold = 0;
      return;
    }
    // 按住 0.35 秒后连续调频
    const prev = this.tuneHold;
    this.tuneHold += dt;
    if (this.tuneHold > 0.35) {
      const ticks = Math.floor((this.tuneHold - 0.35) / 0.06) - Math.floor(Math.max(0, prev - 0.35) / 0.06);
      if (ticks > 0) this.radio.tune(dir * step * ticks);
    }
  }

  private handleMovement(dt: number): void {
    const k = this.keys;
    let vx = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
    let vy = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);

    if (vx !== 0 || vy !== 0) {
      this.target = null;
      this.pendingTalk = null;
    } else if (this.target) {
      const dx = this.target.x - this.player.x;
      const dy = this.target.y - this.player.y;
      const d = Math.hypot(dx, dy);
      if (d < 1.5) {
        this.target = null;
      } else {
        vx = dx / d;
        vy = dy / d;
      }
    }

    if (vx === 0 && vy === 0) {
      this.setWalking(false);
      return;
    }
    const len = Math.hypot(vx, vy);
    const step = SPEED * dt;
    let nx = this.player.x + (vx / len) * step;
    let ny = this.player.y + (vy / len) * step * 0.75;
    if (this.target) {
      // 不越过目标点
      if (Math.abs(this.target.x - this.player.x) < Math.abs(nx - this.player.x)) nx = this.target.x;
      if (Math.abs(this.target.y - this.player.y) < Math.abs(ny - this.player.y)) ny = this.target.y;
    }
    this.player.x = Phaser.Math.Clamp(nx, MIN_X, MAX_X);
    this.player.y = Phaser.Math.Clamp(ny, MIN_Y, MAX_Y);
    this.player.setDepth(depthOf(this.player.y));
    if (vx !== 0) this.player.setFlipX(vx < 0);
    this.setWalking(true, dt);
  }

  private setWalking(walking: boolean, dt = 0): void {
    if (!walking) {
      if (this.player.texture.key !== 'player') this.player.setTexture('player');
      this.walkClock = 0;
      return;
    }
    this.walkClock += dt;
    const seq = this.textures.exists('player-walk2') ? ['player-walk', 'player', 'player-walk2', 'player'] : ['player-walk', 'player'];
    const frame = seq[Math.floor(this.walkClock / 0.14) % seq.length];
    if (this.player.texture.key !== frame) this.player.setTexture(frame);
  }

  private updateLabels(): void {
    const cam = this.cameras.main;
    const showHint = !!this.nearest && !this.inputBlocked();
    for (const h of this.hotspots) {
      const sx = h.x - cam.scrollX;
      const sy = h.y - h.sprite.displayHeight - 3 - cam.scrollY;
      // 科普点平时只显示头顶标记，靠近时才出现名字
      const visible = sx > -40 && sx < 520 && h.kind === 'hotspot';
      h.tag.classList.toggle('hidden', !visible || (showHint && h === this.nearest));
      if (visible) Stage.place(h.tag, sx, sy);
    }
    this.hintTag.classList.toggle('hidden', !showHint);
    const n = showHint ? this.nearest : null;
    if (n && n.kind === 'knowledge' && n.know) {
      const k = n.know;
      const html = `<b>${k.title}</b>${KnowledgeSystem.isSeen(k.id) ? ' <em>已读</em>' : ''}<br>${k.summary}`;
      if (this.bubble.dataset.id !== k.id) {
        this.bubble.dataset.id = k.id;
        this.bubble.innerHTML = html;
      }
      this.bubble.classList.remove('hidden');
      Stage.place(this.bubble, Phaser.Math.Clamp(n.x - cam.scrollX, 70, 410), n.y - n.sprite.displayHeight - 24 - cam.scrollY);
    } else {
      this.bubble.classList.add('hidden');
      this.bubble.dataset.id = '';
    }
    if (n) {
      const verb = n.kind === 'knowledge' ? '了解' : n.def?.action === 'npc' ? '交谈' : '开始';
      const text = `空格 ${verb}：${n.label}`;
      if (this.hintTag.textContent !== text) this.hintTag.textContent = text;
      this.hintTag.classList.toggle('know', n.kind === 'knowledge');
      Stage.place(this.hintTag, n.x - cam.scrollX, n.y - n.sprite.displayHeight - (n.kind === 'knowledge' ? 14 : 3) - cam.scrollY);
    }
  }

  private cleanup(): void {
    DialogueSystem.dismiss();
    this.offs.forEach((f) => f());
    this.offs = [];
    this.radio?.setOn(false);
    AudioManager.radioOn(false);
    this.hud?.destroy();
    this.panel?.destroy();
    this.labelsRoot?.remove();
    Stage.clear('labels');
    this.input.removeAllListeners();
    this.input.keyboard?.removeAllKeys(false);
  }
}
