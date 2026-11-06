import { XIAMEN_TONE_CONTOUR, splitSyllables, toneOf } from '../../../learning/tailo';
import { el } from '../../../ui/dom';
import type { ChallengeCtx, ChallengeStrategy } from '../types';

const RECORD_MS = 2500;
/** RMS 超过此阈值即认为玩家开口了 */
const VOICE_RMS = 0.03;

/**
 * 跟读：麦克风录 2.5 秒，仅检测「有没有开口」，不评测发音准确度。
 * 麦克风不可用或被拒绝时退化为自评。
 */
export const RepeatAfter: ChallengeStrategy = {
  mount(root: HTMLElement, ctx: ChallengeCtx): void {
    const { sound } = ctx;
    const tones = splitSyllables(sound.tailo).map((s) => ({ syl: s.normalize('NFC'), name: XIAMEN_TONE_CONTOUR[toneOf(s)].name }));
    let done = false;

    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      recBtn.disabled = true;
      selfBtn.disabled = true;
      ctx.answer(ok);
    };

    const big = el('div', { class: 'ra-hanzi', text: sound.hanzi });
    const toneList = el(
      'div',
      { class: 'ra-tones' },
      tones.map((t) => el('span', { class: 'ra-tone', text: `${t.syl} · ${t.name}` })),
    );
    const normal = el('button', { class: 'btn small', text: '▶ 正常' });
    normal.addEventListener('click', () => ctx.play(1));
    const slow = el('button', { class: 'btn small ghost', text: '🐢 慢速' });
    slow.addEventListener('click', () => ctx.play(1.6));

    const meter = el('div', { class: 'ra-meter' }, [el('div', { class: 'ra-meter-fill' })]);
    const fill = meter.firstElementChild as HTMLDivElement;
    const status = el('div', { class: 'ch-status', text: '先听两遍，再按「开始跟读」大声说出来。' });
    const recBtn = el('button', { class: 'btn', text: '🎙 开始跟读' });
    const selfBtn = el('button', { class: 'btn small ghost', text: '我已跟读（自评）' });
    selfBtn.addEventListener('click', () => {
      status.textContent = '已记录自评。多跟读几遍，会越来越顺口！';
      finish(true);
    });

    recBtn.addEventListener('click', async () => {
      if (done) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        status.textContent = '当前浏览器不支持麦克风，请用「我已跟读」自评。';
        return;
      }
      recBtn.disabled = true;
      let stream: MediaStream | null = null;
      let ac: AudioContext | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        ac = new AudioContext();
        const src = ac.createMediaStreamSource(stream);
        const analyser = ac.createAnalyser();
        analyser.fftSize = 1024;
        src.connect(analyser);
        const buf = new Float32Array(analyser.fftSize);
        let peak = 0;
        const start = performance.now();
        status.textContent = '录音中……请跟读';
        await new Promise<void>((resolve) => {
          const tick = () => {
            analyser.getFloatTimeDomainData(buf);
            let sum = 0;
            for (const v of buf) sum += v * v;
            const rms = Math.sqrt(sum / buf.length);
            peak = Math.max(peak, rms);
            fill.style.width = `${Math.min(100, (rms / (VOICE_RMS * 3)) * 100)}%`;
            if (performance.now() - start < RECORD_MS) requestAnimationFrame(tick);
            else resolve();
          };
          tick();
        });
        fill.style.width = '0%';
        if (peak >= VOICE_RMS) {
          status.textContent = '听到你开口了！（本版只检测是否开口，不评测发音）';
          finish(true);
        } else {
          status.textContent = '好像没听到声音，靠近麦克风再试一次，或用「我已跟读」。';
          recBtn.disabled = false;
        }
      } catch {
        status.textContent = '没有拿到麦克风权限，请用「我已跟读」自评。';
        recBtn.disabled = false;
      } finally {
        stream?.getTracks().forEach((t) => t.stop());
        void ac?.close();
      }
    });

    root.append(
      big,
      toneList,
      el('div', { class: 'ra-play' }, [normal, slow]),
      meter,
      el('div', { class: 'ra-actions' }, [recBtn, selfBtn]),
      status,
      el('div', { class: 'note', text: '跟读只检测是否开口，不评测发音准确度。' }),
    );
  },
};
