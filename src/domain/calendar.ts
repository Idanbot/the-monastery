import type { Task } from './types';
import { generateId, normalizeTask } from './tasks';

const unfoldIcsLines = (text: string) =>
  text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .reduce<string[]>((lines, line) => {
      if (/^[ \t]/.test(line) && lines.length) {
        lines[lines.length - 1] += line.slice(1);
      } else {
        lines.push(line.trimEnd());
      }
      return lines;
    }, []);

const parseIcsDate = (value = '') => {
  const raw = value.trim();
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
  if (!match) return { date: '', time: '' };
  const [, year, month, day, hour, minute] = match;
  return {
    date: `${year}-${month}-${day}`,
    time: hour && minute ? `${hour}:${minute}` : ''
  };
};

const decodeIcsText = (value = '') =>
  value.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();

const readProperty = (line: string) => {
  const separator = line.indexOf(':');
  if (separator === -1) return null;
  const name = line.slice(0, separator).split(';')[0].toUpperCase();
  const value = line.slice(separator + 1);
  return { name, value };
};

export const parseIcsTasks = (text: string): Task[] => {
  const tasks: Task[] = [];
  let event: Record<string, string> | null = null;

  for (const line of unfoldIcsLines(text)) {
    if (line === 'BEGIN:VEVENT') {
      event = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (event) {
        const start = parseIcsDate(event.DTSTART);
        const end = parseIcsDate(event.DTEND);
        const title = decodeIcsText(event.SUMMARY || 'Imported calendar event');
        const description = decodeIcsText(event.DESCRIPTION || '');
        tasks.push(
          normalizeTask({
            id: event.UID || generateId(),
            title,
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
                id: generateId(),
                type: 'system',
                text: description ? 'Imported from calendar: ' + description : 'Imported from calendar',
                timestamp: new Date().toISOString()
              }
            ]
          })
        );
      }
      event = null;
      continue;
    }
    if (!event) continue;
    const property = readProperty(line);
    if (property) event[property.name] = property.value;
  }

  return tasks;
};
