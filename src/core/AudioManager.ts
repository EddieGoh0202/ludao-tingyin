import { XIAMEN_TONE_CONTOUR } from '../learning/tailo';
import type { SoundEntry } from '../types';

export type Sfx = 'click' | 'lock' | 'ok' | 'bad' | 'collect' | 'dice' | 'unlock';

/** 背景音乐曲目（文件位于 public/audio/bgm/） */
export type BgmTrack = 'peige' | 'amahuo' | 'liulang';
const BGM_FILES: Record<BgmTrack, string> = {
  peige: 'bgm-peige.mp3',
  amahuo: 'bgm-amahuo.wav',
  liulang: 'bgm-liulang.wav',
};
/** 背景音乐相对主音量的比例，保证台语录音与收音机声音仍然清楚 */
const BGM_GAIN = 0.3;

/**
 * 音频管理：真人录音 + 收音机杂音和低通滤波。
 * 没有录音的条目保持安静（不再用锯齿波占位音），只有调型练习保留示意音。
 */
class AudioManagerImpl {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private noiseGain!: GainNode;
  private voiceGain!: GainNode;
  private voiceFilter!: BiquadFilterNode;
  private cleanBus!: GainNode;
  private noiseSrc: AudioBufferSourceNode | null = null;
  private loopKey: string | null = null;
  private loopTimer: number | null = null;
  private volume = 0.8;
  private recordings = new Map<string, Promise<AudioBuffer>>();
  private loopGeneration = 0;
  private loopSource: AudioBufferSourceNode | null = null;
  private phraseRequest = 0;
  private phraseSource: AudioBufferSourceNode | null = null;
  private bgm: HTMLAudioElement | null = null;
  private bgmTrack: BgmTrack | null = null;
  private bgmRetry: (() => void) | null = null;

  get ready(): boolean {
    return this.ctx !== null;
  }

  /** 必须在用户手势中调用 */
  init(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(ctx.destination);

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0;
    const noiseBand = ctx.createBiquadFilter();
    noiseBand.type = 'bandpass';
    noiseBand.frequency.value = 2200;
    noiseBand.Q.value = 0.4;
    this.noiseGain.connect(noiseBand).connect(this.master);

    this.voiceFilter = ctx.createBiquadFilter();
    this.voiceFilter.type = 'lowpass';
    this.voiceFilter.frequency.value = 400;
    this.voiceGain = ctx.createGain();
    this.voiceGain.gain.value = 0;
    this.voiceFilter.connect(this.voiceGain).connect(this.master);

    this.cleanBus = ctx.createGain();
    this.cleanBus.gain.value = 1;
    this.cleanBus.connect(this.master);
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    if (this.bgm) this.bgm.volume = this.bgmVolume();
  }

  private bgmVolume(): number {
    return this.volume * BGM_GAIN;
  }

  /**
   * 循环播放背景音乐（HTMLAudioElement 流式播放，不走 AudioContext 整段解码）。
   * 同一曲目已在播放时不重复开始；浏览器拦截自动播放时，等待下一次用户操作再尝试。
   */
  playBgm(track: BgmTrack): void {
    if (this.bgmTrack === track && this.bgm && !this.bgm.paused) return;
    this.bgmTrack = track;
    if (!this.bgm) {
      this.bgm = new Audio();
      this.bgm.loop = true;
      this.bgm.preload = 'auto';
    }
    const bgm = this.bgm;
    const base = new URL(import.meta.env.BASE_URL, document.baseURI);
    bgm.src = new URL(`audio/bgm/${BGM_FILES[track]}`, base).href;
    bgm.volume = this.bgmVolume();
    this.clearBgmRetry();
    void bgm.play().catch(() => {
      if (this.bgm !== bgm) return;
      const retry = () => {
        this.clearBgmRetry();
        if (this.bgm === bgm) void bgm.play().catch(() => undefined);
      };
      this.bgmRetry = retry;
      window.addEventListener('pointerdown', retry);
      window.addEventListener('keydown', retry);
    });
  }

  /** 停止背景音乐并清空进度（返回标题或手动静音时调用） */
  stopBgm(): void {
    this.clearBgmRetry();
    this.bgmTrack = null;
    const bgm = this.bgm;
    if (!bgm) return;
    bgm.pause();
    bgm.currentTime = 0;
  }

  /** 当前曲目（未播放为 null），供场景判断是否需要切换 */
  get currentBgm(): BgmTrack | null {
    return this.bgm && !this.bgm.paused ? this.bgmTrack : null;
  }

  private clearBgmRetry(): void {
    if (!this.bgmRetry) return;
    window.removeEventListener('pointerdown', this.bgmRetry);
    window.removeEventListener('keydown', this.bgmRetry);
    this.bgmRetry = null;
  }

  radioOn(on: boolean): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (on && !this.noiseSrc) {
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(this.noiseGain);
      src.start();
      this.noiseSrc = src;
    } else if (!on) {
      this.noiseSrc?.stop();
      this.noiseSrc = null;
      this.setVoiceLoop(null);
      this.setMix(0, 0, 400);
    }
  }

  /** 杂音音量、人声音量、低通截止频率 */
  setMix(noise: number, voice: number, cutoff: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    // 轻微压低收音机底噪，保留空间感但避免沙沙声盖住录音（杂音增益已再降 25%）。
    this.noiseGain.gain.setTargetAtTime(noise * 0.225, t, 0.05);
    this.voiceGain.gain.setTargetAtTime(voice, t, 0.05);
    this.voiceFilter.frequency.setTargetAtTime(cutoff, t, 0.05);
  }

  /** 在收音机通道中循环播放某句话（经过滤波） */
  setVoiceLoop(sound: SoundEntry | null): void {
    if (!this.ctx) return;
    const key = sound?.id ?? null;
    if (key === this.loopKey) return;
    const generation = ++this.loopGeneration;
    if (this.loopTimer !== null) window.clearTimeout(this.loopTimer);
    this.loopTimer = null;
    this.loopSource?.stop();
    this.loopSource = null;
    this.loopKey = key;
    if (!sound) return;
    const current = () => generation === this.loopGeneration;
    const schedule = (loop: () => void, delay: number) => {
      if (current()) this.loopTimer = window.setTimeout(loop, delay);
    };
    // 没有真人录音的条目不循环播放（不再使用占位合成）
    if (!sound.audio) return;
    void this.loadRecording(sound.audio).then((buffer) => {
      const recordedLoop = () => {
        if (!current()) return;
        const source = this.startRecording(buffer, this.voiceFilter);
        this.loopSource = source;
        source.onended = () => {
          source.disconnect();
          if (this.loopSource === source) this.loopSource = null;
          schedule(recordedLoop, 800);
        };
      };
      recordedLoop();
    }).catch((error: unknown) => {
      if (!current()) return;
      console.warn(`录音 ${sound.id} 加载失败，已静音`, error);
    });
  }

  /** 播放条目录音；rate 沿用时长倍率，1.6 表示慢速。 */
  playSound(sound: SoundEntry, rate = 1): void {
    if (!sound.audio) {
      // 点了没有录音的条目：停掉正在播的上一句，保持安静
      this.stopPhrase();
      return;
    }
    this.playAudio(sound.audio, rate, `录音 ${sound.id} 加载失败`);
  }

  /** 播放对话等非词条实体录音；没有录音或加载失败时保持安静。 */
  playAudio(path: string, rate = 1, warningLabel = '台语录音加载失败'): void {
    if (!this.ctx) return;
    void this.ctx.resume();
    const request = this.stopPhrase();
    void this.loadRecording(path).then((buffer) => {
      if (request !== this.phraseRequest) return;
      const source = this.startRecording(buffer, this.cleanBus, rate);
      this.phraseSource = source;
      source.onended = () => {
        source.disconnect();
        if (this.phraseSource === source) this.phraseSource = null;
      };
    }).catch((error: unknown) => {
      if (request !== this.phraseRequest) return;
      console.warn(`${warningLabel}，已静音`, error);
    });
  }

  private stopPhrase(): number {
    this.phraseSource?.stop();
    this.phraseSource = null;
    return ++this.phraseRequest;
  }

  /** 停止当前台词录音（对话翻页 / 关闭时调用） */
  stopVoice(): void {
    if (this.ctx) this.stopPhrase();
  }

  private loadRecording(path: string): Promise<AudioBuffer> {
    const cached = this.recordings.get(path);
    if (cached) return cached;
    const base = new URL(import.meta.env.BASE_URL, document.baseURI);
    const pending = fetch(new URL(path, base)).then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
      return this.ctx!.decodeAudioData(await response.arrayBuffer());
    }).catch((error: unknown) => {
      this.recordings.delete(path);
      throw error;
    });
    this.recordings.set(path, pending);
    return pending;
  }

  private startRecording(buffer: AudioBuffer, dest: AudioNode, rate = 1): AudioBufferSourceNode {
    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1 / rate;
    source.connect(dest);
    source.start();
    return source;
  }

  /** 播放单个调类的示意音 */
  playTone(tone: number): number {
    if (!this.ctx) return 0;
    return this.synthSyllables([tone], this.cleanBus, 1.4);
  }

  /** 占位合成：按厦门腔调值生成音高轮廓（不是真人发音） */
  private synthSyllables(tones: number[], dest: AudioNode, rate: number): number {
    const ctx = this.ctx!;
    let t = ctx.currentTime + 0.05;
    const pitch = (level: number) => 130 * Math.pow(2, (level - 1) / 4);
    for (const tone of tones) {
      const c = XIAMEN_TONE_CONTOUR[tone] ?? XIAMEN_TONE_CONTOUR[1];
      const dur = (c.short ? 0.16 : 0.32) * rate;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch(c.from), t);
      osc.frequency.linearRampToValueAtTime(pitch(c.to), t + dur);
      const formant = ctx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.value = 900;
      formant.Q.value = 1.2;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.9, t + 0.03);
      env.gain.setValueAtTime(0.9, t + dur - (c.short ? 0.02 : 0.08));
      env.gain.linearRampToValueAtTime(0, t + dur);
      osc.connect(formant).connect(env).connect(dest);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur + 0.07 * rate;
    }
    return t - ctx.currentTime;
  }

  sfx(kind: Sfx): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const seq: Record<Sfx, Array<[number, number]>> = {
      click: [[880, 0.04]],
      lock: [[660, 0.08], [990, 0.12]],
      ok: [[784, 0.08], [1046, 0.14]],
      bad: [[220, 0.18]],
      collect: [[523, 0.08], [659, 0.08], [784, 0.08], [1046, 0.2]],
      dice: [[300, 0.03], [420, 0.03], [360, 0.03]],
      unlock: [[392, 0.1], [523, 0.1], [784, 0.25]],
    };
    let t = ctx.currentTime;
    for (const [f, d] of seq[kind]) {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      osc.connect(g).connect(this.cleanBus);
      osc.start(t);
      osc.stop(t + d);
      t += d;
    }
  }
}

export const AudioManager = new AudioManagerImpl();
