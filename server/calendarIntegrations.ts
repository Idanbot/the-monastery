import { decodeXML } from 'entities';

export type CalendarIntegrationConfig = {
  icsSubscriptionUrls?: string[];
  calDavUrl?: string;
  calDavUsername?: string;
  calDavPassword?: string;
};
type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type CalendarTask = {
  id: string;
  title: string;
  scheduledDate: string;
  scheduledStart: string;
  scheduledEnd: string;
};

const parseIcsDate = (value = '') => {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
  return match
    ? { date: `${match[1]}-${match[2]}-${match[3]}`, time: match[4] ? `${match[4]}:${match[5]}` : '' }
    : { date: '', time: '' };
};
const decodeIcsText = (value = '') => {
  const slash = String.fromCharCode(92);
  return value
    .split(slash + 'n')
    .join(' ')
    .split(slash + ',')
    .join(',')
    .split(slash + ';')
    .join(';')
    .trim();
};
const parseIcsTasks = (text: string) =>
  text
    .replace(/\r\n/g, '\n')
    .split('BEGIN:VEVENT')
    .slice(1)
    .map((block) => {
      const values = Object.fromEntries(
        block
          .split('\n')
          .map((line) => {
            const separator = line.indexOf(':');
            return separator < 0
              ? ['', '']
              : [line.slice(0, separator).split(';')[0].toUpperCase(), line.slice(separator + 1).trim()];
          })
          .filter(([key]) => key)
      );
      const start = parseIcsDate(values.DTSTART);
      const end = parseIcsDate(values.DTEND);
      const description = decodeIcsText(values.DESCRIPTION);
      return {
        id: values.UID || `calendar-${Math.random().toString(36).slice(2, 9)}`,
        title: decodeIcsText(values.SUMMARY) || 'Imported calendar event',
        createdAt: new Date().toISOString(),
        status: 'backlog',
        urgency: 5,
        tags: ['calendar'],
        scheduledDate: start.date,
        scheduledStart: start.time,
        scheduledEnd: end.time,
        recurrence: 'none',
        recurrenceRootId: null,
        subtasks: [],
        logs: [],
        activeLogStart: null,
        activity: [
          {
            id: `activity-${Math.random().toString(36).slice(2, 9)}`,
            type: 'system',
            text: description ? `Imported from calendar: ${description}` : 'Imported from calendar',
            timestamp: new Date().toISOString()
          }
        ]
      };
    });

const authHeaders = (config: CalendarIntegrationConfig) =>
  config.calDavUsername || config.calDavPassword
    ? {
        Authorization: `Basic ${Buffer.from(`${config.calDavUsername || ''}:${config.calDavPassword || ''}`).toString('base64')}`
      }
    : {};
const decodeXml = (value: string) =>
  value
    .split(/(<!\[CDATA\[[\s\S]*?\]\]>)/g)
    .map((segment) =>
      segment.startsWith('<![CDATA[') ? segment.slice('<![CDATA['.length, -']]>'.length) : decodeXML(segment)
    )
    .join('');
const extractCalendarData = (xml: string) => {
  const calendars: string[] = [];
  const pattern = /<(?:[\w-]+:)?calendar-data(?:\s[^>]*)?>([\s\S]*?)<\/(?:[\w-]+:)?calendar-data>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(xml))) calendars.push(decodeXml(match[1]));
  return calendars;
};
const requireOk = async (response: Response, label: string) => {
  if (!response.ok) throw new Error(`${label} failed with HTTP ${response.status}.`);
  return response.text();
};

export const pullCalendarTasks = async (config: CalendarIntegrationConfig, fetchImpl: FetchLike = fetch) => {
  const calendars: string[] = [];
  for (const url of config.icsSubscriptionUrls || []) {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'text/calendar' },
      signal: AbortSignal.timeout(15_000)
    });
    calendars.push(await requireOk(response, 'ICS subscription'));
  }
  if (config.calDavUrl) {
    const response = await fetchImpl(config.calDavUrl, {
      method: 'REPORT',
      headers: { ...authHeaders(config), Depth: '1', 'Content-Type': 'application/xml; charset=utf-8' },
      body: `<?xml version="1.0" encoding="utf-8" ?><c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:getetag/><c:calendar-data/></d:prop><c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="VEVENT"/></c:comp-filter></c:filter></c:calendar-query>`,
      signal: AbortSignal.timeout(15_000)
    });
    calendars.push(...extractCalendarData(await requireOk(response, 'CalDAV sync')));
  }
  const tasks = calendars.flatMap(parseIcsTasks);
  return Array.from(new Map(tasks.map((task) => [task.id, task])).values());
};

const escapeIcsText = (value: string) => {
  const slash = String.fromCharCode(92);
  return value
    .split(slash)
    .join(slash + slash)
    .split('\n')
    .join(slash + 'n')
    .split(',')
    .join(slash + ',')
    .split(';')
    .join(slash + ';');
};
const toIcsDateTime = (date: string, time: string) =>
  `${date.replace(/-/g, '')}T${(time || '00:00').replace(':', '')}00`;
const taskToIcs = (task: CalendarTask) =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Monastery//Calendar Sync//EN',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(task.id)}`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')}`,
    `DTSTART:${toIcsDateTime(task.scheduledDate, task.scheduledStart)}`,
    `DTEND:${toIcsDateTime(task.scheduledDate, task.scheduledEnd || task.scheduledStart)}`,
    `SUMMARY:${escapeIcsText(task.title)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    ''
  ].join('\r\n');

export const pushTasksToCalDav = async (
  config: CalendarIntegrationConfig,
  tasks: CalendarTask[],
  fetchImpl: FetchLike = fetch
) => {
  if (!config.calDavUrl) throw new Error('CalDAV is not configured.');
  const scheduled = tasks.filter((task) => task.scheduledDate && task.scheduledStart);
  const failed: string[] = [];
  const baseUrl = config.calDavUrl.endsWith('/') ? config.calDavUrl : `${config.calDavUrl}/`;
  for (const task of scheduled) {
    try {
      const response = await fetchImpl(`${baseUrl}${encodeURIComponent(task.id)}.ics`, {
        method: 'PUT',
        headers: { ...authHeaders(config), 'Content-Type': 'text/calendar; charset=utf-8' },
        body: taskToIcs(task),
        signal: AbortSignal.timeout(15_000)
      });
      if (!response.ok) failed.push(task.id);
    } catch {
      failed.push(task.id);
    }
  }
  return { pushed: scheduled.length - failed.length, failed };
};
export const calendarStatus = (config: CalendarIntegrationConfig) => ({
  subscriptions: (config.icsSubscriptionUrls || []).length,
  calDav: Boolean(config.calDavUrl)
});
