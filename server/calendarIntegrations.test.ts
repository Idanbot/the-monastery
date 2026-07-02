// \@vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { pullCalendarTasks, pushTasksToCalDav } from './calendarIntegrations.js';

const event = (uid: string, summary: string) =>
  `BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:${uid}\nSUMMARY:${summary}\nDTSTART:20260702T090000Z\nDTEND:20260702T100000Z\nEND:VEVENT\nEND:VCALENDAR`;

describe('calendar integrations', () => {
  it('pulls and deduplicates ICS subscriptions and CalDAV events', async () => {
    const calDavBody = `<?xml version="1.0"?><d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:response><c:calendar-data>${event('shared', 'CalDAV copy')}</c:calendar-data></d:response><d:response><c:calendar-data>${event('caldav', 'Architecture review')}</c:calendar-data></d:response></d:multistatus>`;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(event('shared', 'Subscription copy'), { status: 200 }))
      .mockResolvedValueOnce(new Response(calDavBody, { status: 207 }));
    const tasks = await pullCalendarTasks(
      {
        icsSubscriptionUrls: ['https://calendar.example/feed.ics'],
        calDavUrl: 'https://calendar.example/caldav/',
        calDavUsername: 'idan',
        calDavPassword: 'secret'
      },
      fetchImpl
    );
    expect(tasks.map((task) => task.id)).toEqual(['shared', 'caldav']);
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://calendar.example/caldav/',
      expect.objectContaining({ method: 'REPORT', headers: expect.objectContaining({ Depth: '1' }) })
    );
  });

  it('pushes only scheduled tasks to CalDAV as VEVENT resources', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    const result = await pushTasksToCalDav(
      { calDavUrl: 'https://calendar.example/caldav', calDavUsername: 'idan', calDavPassword: 'secret' },
      [
        {
          id: 'architecture/review',
          title: 'Architecture, review',
          scheduledDate: '2026-07-02',
          scheduledStart: '09:00',
          scheduledEnd: '10:00'
        },
        { id: 'unscheduled', title: 'No date', scheduledDate: '', scheduledStart: '', scheduledEnd: '' }
      ],
      fetchImpl
    );
    expect(result).toEqual({ pushed: 1, failed: [] });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://calendar.example/caldav/architecture%2Freview.ics',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('SUMMARY:Architecture\\, review')
      })
    );
  });
});
