import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bundled = await build({
  absWorkingDir: project, entryPoints: ['src/core/AudioManager.ts'],
  bundle: true, write: false, format: 'esm', platform: 'browser',
  define: { 'import.meta.env.BASE_URL': JSON.stringify('./') },
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`;
const flush = () => new Promise((done) => setImmediate(done));
const sound = (id, audio = `recordings/laocuo/audio/${id}.webm`) => ({ id, tailo: 'Lí hó', audio });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
let instance = 0;

async function fixture() {
  const sources = [], oscillators = [], requests = [], decodes = [];
  const waits = new Map(), failures = new Set(), timers = new Map();
  let timerId = 0;
  const param = () => ({ value: 0, setTargetAtTime() {}, setValueAtTime() {}, linearRampToValueAtTime() {} });
  class Node {
    constructor(kind) {
      this.kind = kind;
      this.connections = [];
      this.gain = param(); this.frequency = param(); this.Q = param(); this.playbackRate = param();
    }
    connect(target) { this.connections.push(target); return target; }
    disconnect() { this.disconnected = true; }
    start() { this.started = true; }
    stop() { this.stopped = true; queueMicrotask(() => this.onended?.()); }
    finish() { this.onended?.(); }
  }
  class Context {
    currentTime = 0;
    sampleRate = 100;
    destination = new Node('destination');
    resume() { return Promise.resolve(); }
    createGain() { return new Node('gain'); }
    createBiquadFilter() { return new Node('filter'); }
    createBuffer(_channels, length) { return { getChannelData: () => new Float32Array(length) }; }
    createBufferSource() { const node = new Node('source'); sources.push(node); return node; }
    createOscillator() { const node = new Node('oscillator'); oscillators.push(node); return node; }
    async decodeAudioData(bytes) {
      const key = new TextDecoder().decode(bytes);
      decodes.push(key);
      if (waits.has(key)) await waits.get(key).promise;
      return { duration: 1, recording: true, key };
    }
  }
  globalThis.window = {
    AudioContext: Context,
    setTimeout(callback, delay) { timers.set(++timerId, { callback, delay }); return timerId; },
    clearTimeout(id) { timers.delete(id); },
  };
  globalThis.document = { baseURI: 'https://example.test/games/minnan/index.html' };
  globalThis.fetch = async (url) => {
    const key = new URL(url).pathname.split('/').at(-1).replace('.webm', '');
    requests.push(String(url));
    return { ok: !failures.has(key), status: failures.has(key) ? 404 : 200,
      arrayBuffer: async () => new TextEncoder().encode(key).buffer };
  };
  const { AudioManager: audio } = await import(`${moduleUrl}#${++instance}`);
  audio.init();
  const recorded = () => sources.filter((source) => source.started && source.buffer?.recording);
  const destination = (source) => source.connections[0];
  return { audio, sources, oscillators, requests, decodes, waits, failures, timers, recorded, destination };
}

const originals = Object.fromEntries(['window', 'document', 'fetch'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
const originalWarn = console.warn;
const warnings = [];
let passed = 0;
async function check(name, test) {
  await test(await fixture());
  passed++;
  console.log(`PASS ${name}`);
}

try {
  console.warn = (...args) => warnings.push(args);
  await check('清晰播放、慢速与子目录资源路径', async (f) => {
    f.audio.playSound(sound('lc01'), 1.6);
    await flush();
    const source = f.recorded()[0];
    assert.equal(source.playbackRate.value, 1 / 1.6);
    assert.equal(f.destination(source).kind, 'gain');
    assert.equal(f.destination(source).connections[0].connections[0].kind, 'destination');
    assert.equal(f.requests[0], 'https://example.test/games/minnan/recordings/laocuo/audio/lc01.webm');
  });
  await check('收音机与清晰播放并发共享加载缓存、声道独立', async (f) => {
    f.waits.set('lc01', deferred());
    f.audio.setVoiceLoop(sound('lc01'));
    f.audio.playSound(sound('lc01'));
    await flush();
    assert.equal(f.requests.length, 1);
    assert.equal(f.decodes.length, 1);
    f.waits.get('lc01').resolve();
    await flush();
    assert.equal(f.recorded().length, 2);
    assert.deepEqual(f.recorded().map((source) => f.destination(source).kind).sort(), ['filter', 'gain']);
    const radio = f.recorded().find((source) => f.destination(source).kind === 'filter');
    assert.equal(f.destination(radio).type, 'lowpass');
    f.audio.playSound(sound('lc01'));
    await flush();
    assert.equal(f.requests.length, 1);
    assert.equal(f.decodes.length, 1);
  });
  await check('收音机切换停止旧录音，关闭停止当前录音及循环', async (f) => {
    f.audio.setVoiceLoop(sound('lc01'));
    await flush();
    const first = f.recorded()[0];
    f.audio.setVoiceLoop(sound('lc02'));
    assert.equal(first.stopped, true);
    await flush();
    const second = f.recorded()[1];
    assert.equal(second.buffer.key, 'lc02');
    second.finish();
    assert.equal(f.timers.size, 1);
    const [{ callback, delay }] = f.timers.values();
    assert.equal(delay, 800);
    f.audio.radioOn(false);
    assert.equal(f.timers.size, 0);
    callback(); // 已进入事件队列的旧回调也不得重新播放。
    assert.equal(f.recorded().length, 2);
    f.audio.setVoiceLoop(sound('lc02'));
    await flush();
    const third = f.recorded()[2];
    f.audio.radioOn(false);
    assert.equal(third.stopped, true);
    await flush();
    assert.equal(f.timers.size, 0);
  });
  await check('旧目标与关闭前未完成的 decode 不会恢复收音', async (f) => {
    f.waits.set('lc01', deferred());
    f.audio.setVoiceLoop(sound('lc01'));
    await flush();
    f.audio.setVoiceLoop(sound('lc02'));
    await flush();
    f.waits.get('lc01').resolve();
    await flush();
    assert.deepEqual(f.recorded().map((source) => source.buffer.key), ['lc02']);
    f.waits.set('lc03', deferred());
    f.audio.setVoiceLoop(sound('lc03'));
    await flush();
    f.audio.radioOn(false);
    f.waits.get('lc03').resolve();
    await flush();
    assert.equal(f.recorded().length, 1);
    assert.equal(f.timers.size, 0);
  });
  await check('连续清晰请求只播放最新结果，替换时停止旧录音', async (f) => {
    f.waits.set('lc01', deferred());
    f.audio.playSound(sound('lc01'));
    await flush();
    f.audio.playSound(sound('lc02'));
    await flush();
    f.waits.get('lc01').resolve();
    await flush();
    assert.deepEqual(f.recorded().map((source) => source.buffer.key), ['lc02']);
    f.audio.playSound(sound('lc03'));
    assert.equal(f.recorded()[0].stopped, true);
    await flush();
    assert.deepEqual(f.recorded().map((source) => source.buffer.key), ['lc02', 'lc03']);
  });
  await check('无录音条目保持静音，并取消旧清晰请求', async (f) => {
    f.waits.set('lc01', deferred());
    f.audio.playSound(sound('lc01'));
    await flush();
    f.audio.playSound({ ...sound('other-chapter'), audio: undefined });
    assert.equal(f.oscillators.length, 0);
    f.waits.get('lc01').resolve();
    await flush();
    assert.equal(f.recorded().length, 0);
    f.audio.setVoiceLoop({ ...sound('other-chapter'), audio: undefined });
    assert.equal(f.timers.size, 0);
    f.audio.radioOn(false);
    assert.equal(f.timers.size, 0);
  });
  await check('加载失败保持静音，失败缓存可重试且旧收音请求不回退', async (f) => {
    f.failures.add('lc01');
    const beforeWarnings = warnings.length;
    f.audio.playSound(sound('lc01'));
    await flush();
    assert.equal(f.oscillators.length, 0);
    assert.equal(warnings.length, beforeWarnings + 1);
    f.failures.delete('lc01');
    f.audio.playSound(sound('lc01'));
    await flush();
    assert.equal(f.requests.length, 2);
    assert.equal(f.recorded().length, 1);
    f.failures.add('lc02');
    const before = f.oscillators.length;
    f.audio.setVoiceLoop(sound('lc02'));
    f.audio.setVoiceLoop(null);
    await flush();
    assert.equal(f.oscillators.length, before);
    f.audio.setVoiceLoop(sound('lc02'));
    await flush();
    assert.equal(f.oscillators.length, before);
    assert.equal(f.timers.size, 0);
    f.audio.radioOn(false);
  });
} finally {
  console.warn = originalWarn;
  for (const [key, descriptor] of Object.entries(originals)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
}
console.log(`音频行为回归通过：${passed} 项`);
