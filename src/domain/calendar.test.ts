import { describe, expect, it } from 'vitest';
import { parseIcsTasks } from './calendar';

describe('parseIcsTasks', () => {
  it('imports calendar events as scheduled tasks', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:focus-1',
      'SUMMARY:Deep Work',
      'DESCRIPTION:Ship profile flow',
      'DTSTART:20260620T090000Z',
      'DTEND:20260620T103000Z',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');
    const tasks = parseIcsTasks(ics);

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      id: 'focus-1',
      title: 'Deep Work',
      scheduledDate: '2026-06-20',
      scheduledStart: '09:00',
      scheduledEnd: '10:30',
      tags: ['calendar']
    });
  });
});
