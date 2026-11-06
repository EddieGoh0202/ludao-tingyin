import { AudioManager } from './AudioManager';
import { Content } from './ContentRepository';
import { VoiceBank } from './VoiceBank';

// 引用 Content 以确保词条录音已按文本登记到 VoiceBank。
void Content.sounds.length;

/** 播放一句台词：有真人录音（按 ID 或文本匹配）才播放，否则保持安静。 */
export function speak(text: string | undefined, _tailo: string | undefined, id?: string): void {
  const audio = VoiceBank.find(id, text);
  if (audio) AudioManager.playAudio(audio);
}

/** 是否已有真人录音。 */
export function hasVoice(text: string | undefined, id?: string): boolean {
  return Boolean(VoiceBank.find(id, text));
}
