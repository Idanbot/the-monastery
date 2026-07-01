import { describe, expect, it } from 'vitest';
import {
  getWeekDates,
  getTasksForDate,
  getUnscheduledTasks,
  snapToSlot,
  clockTimeToMinutes,
  formatClockTime,
  minutesToClockTime
} from './calendarView';
import type { Task } from './types';

describe('calendarView domain', () => {
  describe('getWeekDates', () => {
    it('returns 7 dates starting from Monday', () => {
      const date = new Date('2026-06-29T12:00:00'); // Monday
      const week = getWeekDates(date);
      expect(week).toHaveLength(7);
      expect(week[0].getDay()).toBe(1); // Monday
      expect(week[0].getDate()).toBe(29);
      expect(week[6].getDay()).toBe(0); // Sunday
      expect(week[6].getDate()).toBe(5);
    });

    it('handles Sunday correctly', () => {
      const date = new Date('2026-06-28T12:00:00'); // Sunday
      const week = getWeekDates(date);
      expect(week).toHaveLength(7);
      expect(week[0].getDay()).toBe(1); // Monday
      expect(week[0].getDate()).toBe(22);
      expect(week[6].getDay()).toBe(0); // Sunday
      expect(week[6].getDate()).toBe(28);
    });
  });

  describe('getTasksForDate', () => {
    it('filters tasks with correct scheduledDate and active status', () => {
      const tasks: Partial<Task>[] = [
        { id: '1', status: 'backlog', scheduledDate: '2026-06-29', scheduledStart: '09:00' },
        { id: '2', status: 'done', scheduledDate: '2026-06-29', scheduledStart: '10:00' },
        { id: '3', status: 'backlog', scheduledDate: '2026-06-30', scheduledStart: '09:00' },
        { id: '4', status: 'backlog', scheduledDate: '2026-06-29', scheduledStart: '' }
      ];
      const result = getTasksForDate(tasks as Task[], '2026-06-29');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('getUnscheduledTasks', () => {
    it('returns backlog/in-progress tasks with no date or time', () => {
      const tasks: Partial<Task>[] = [
        { id: '1', status: 'backlog', scheduledDate: '', scheduledStart: '' },
        { id: '2', status: 'backlog', scheduledDate: '2026-06-29', scheduledStart: '' }, // Unscheduled since start is empty
        { id: '3', status: 'backlog', scheduledDate: '2026-06-29', scheduledStart: '09:00' }, // Scheduled
        { id: '4', status: 'done', scheduledDate: '', scheduledStart: '' } // Excluded status
      ];
      const result = getUnscheduledTasks(tasks as Task[]);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['1', '2']);
    });
  });

  describe('snapToSlot', () => {
    it('snaps minutes to nearest slot size', () => {
      expect(snapToSlot(14, 15)).toBe(15);
      expect(snapToSlot(7, 15)).toBe(0);
      expect(snapToSlot(8, 15)).toBe(15);
      expect(snapToSlot(22, 15)).toBe(15);
      expect(snapToSlot(23, 15)).toBe(30);
    });
  });

  describe('clockTimeToMinutes', () => {
    it('parses HH:MM strings to minutes', () => {
      expect(clockTimeToMinutes('00:00')).toBe(0);
      expect(clockTimeToMinutes('01:30')).toBe(90);
      expect(clockTimeToMinutes('23:59')).toBe(1439);
      expect(clockTimeToMinutes('')).toBe(0);
    });
  });

  describe('minutesToClockTime', () => {
    it('formats minutes to HH:MM strings', () => {
      expect(minutesToClockTime(0)).toBe('00:00');
      expect(minutesToClockTime(90)).toBe('01:30');
      expect(minutesToClockTime(1439)).toBe('23:59');
      expect(minutesToClockTime(1500)).toBe('23:59'); // clamped
      expect(minutesToClockTime(-10)).toBe('00:00'); // clamped
    });
  });
});

describe('formatClockTime', () => {
  it('formats stored clock values using the selected display mode', () => {
    expect(formatClockTime('00:00', '24h')).toBe('00:00');
    expect(formatClockTime('13:30', '24h')).toBe('13:30');
    expect(formatClockTime('00:00', '12h')).toBe('12:00 AM');
    expect(formatClockTime('13:30', '12h')).toBe('1:30 PM');
  });
});
