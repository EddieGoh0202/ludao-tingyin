import { EventBus } from '../../core/EventBus';
import { StateStore } from '../../core/StateStore';
import type { TimeOfDay } from '../../types';

export const TIME_ORDER: TimeOfDay[] = ['morning', 'noon', 'dusk', 'night'];
export const TIME_LABEL: Record<TimeOfDay, string> = {
  morning: '早起',
  noon: '中昼',
  dusk: '下昏',
  night: '暗暝',
};
export const TIME_HINT: Record<TimeOfDay, string> = {
  morning: '早上',
  noon: '中午',
  dusk: '傍晚',
  night: '夜晚',
};
/** 每个时段的画面色调覆盖：颜色 + 透明度 */
export const TIME_TINT: Record<TimeOfDay, { color: number; alpha: number }> = {
  morning: { color: 0xfff1c4, alpha: 0.08 },
  noon: { color: 0xffffff, alpha: 0 },
  dusk: { color: 0xff7a3d, alpha: 0.22 },
  night: { color: 0x10183a, alpha: 0.5 },
};

export const TimeSystem = {
  get current(): TimeOfDay {
    return StateStore.data.timeOfDay;
  },
  advance(): TimeOfDay {
    const i = TIME_ORDER.indexOf(StateStore.data.timeOfDay);
    const next = TIME_ORDER[(i + 1) % TIME_ORDER.length];
    StateStore.setTime(next);
    EventBus.emit('time:changed', { time: next });
    return next;
  },
};
