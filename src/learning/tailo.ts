/**
 * 台罗（Tâi-lô）工具：拆音节、解析调类。
 * 调号：´=2  `=3  ^=5  ˇ=6  ¯=7  ̍=8；无调号且以 p/t/k/h 收尾为 4，否则为 1。
 */
const TONE_MARKS: Record<string, number> = {
  '\u0301': 2,
  '\u0300': 3,
  '\u0302': 5,
  '\u030C': 6,
  '\u0304': 7,
  '\u030D': 8,
};

export function splitSyllables(tailo: string): string[] {
  return tailo
    .normalize('NFD')
    .toLowerCase()
    .split(/[\s\-?？!！,，.。…]+/)
    .filter((s) => /[a-z]/.test(s));
}

export function toneOf(syllable: string): number {
  for (const ch of syllable) {
    const t = TONE_MARKS[ch];
    if (t) return t;
  }
  const letters = syllable.replace(/[^a-z]/g, '');
  return /[ptkh]$/.test(letters) ? 4 : 1;
}

export function tonesOf(tailo: string): number[] {
  return splitSyllables(tailo).map(toneOf);
}

/** 厦门腔调值（五度标记），用于占位合成音和声调教学 */
export const XIAMEN_TONE_CONTOUR: Record<number, { from: number; to: number; short: boolean; name: string }> = {
  1: { from: 4, to: 4, short: false, name: '阴平 44' },
  2: { from: 5, to: 3, short: false, name: '上声 53' },
  3: { from: 2, to: 1, short: false, name: '阴去 21' },
  4: { from: 3, to: 2, short: true, name: '阴入 32' },
  5: { from: 2, to: 4, short: false, name: '阳平 24' },
  6: { from: 2, to: 2, short: false, name: '阳去 22' },
  7: { from: 2, to: 2, short: false, name: '阳去 22' },
  8: { from: 4, to: 4, short: true, name: '阳入 4' },
};
