import { formatDateInputValue } from './tasks';

type QuickAddParseOptions = {
  now?: Date;
};

const urlPattern = /https?:\/\/\S+/gi;
const tagPattern = /(^|\s)#([a-z0-9][a-z0-9_-]*)/gi;
const urgencyPattern = /(^|\s)!([1-9]|10)(?=\s|$)/i;
const timeRangePattern =
  /(^|\s)([01]?\d|2[0-3])(?::([0-5]\d))?\s*[-–]\s*([01]?\d|2[0-3])(?::([0-5]\d))?(?=\s|$)/i;

const toTimeValue = (hour: string, minute = '00') => {
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
};

const dateFromKeyword = (keyword: string, now: Date) => {
  const date = new Date(now);
  if (keyword.toLowerCase() === 'tomorrow') date.setDate(date.getDate() + 1);
  return formatDateInputValue(date);
};

export function parseQuickAddTask(input: string, options: QuickAddParseOptions = {}) {
  const now = options.now || new Date();
  let title = input.trim();
  const urls = Array.from(title.matchAll(urlPattern), (match) => match[0]);
  const tags = Array.from(title.matchAll(tagPattern), (match) => match[2]);
  const urgencyMatch = title.match(urgencyPattern);
  const timeMatch = title.match(timeRangePattern);
  const dateMatch = title.match(/(^|\s)(today|tomorrow)(?=\s|$)/i);

  title = title
    .replace(urlPattern, ' ')
    .replace(tagPattern, ' ')
    .replace(urgencyPattern, ' ')
    .replace(timeRangePattern, ' ')
    .replace(/(^|\s)(today|tomorrow)(?=\s|$)/i, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const overrides: Record<string, unknown> = {
    title,
    tags
  };

  if (urgencyMatch) overrides.urgency = Number(urgencyMatch[2]);
  if (dateMatch) overrides.scheduledDate = dateFromKeyword(dateMatch[2], now);
  if (timeMatch) {
    overrides.scheduledStart = toTimeValue(timeMatch[2], timeMatch[3] || '00');
    overrides.scheduledEnd = toTimeValue(timeMatch[4], timeMatch[5] || '00');
  }
  if (urls.length > 0) {
    overrides.activity = urls.map((url) => ({
      type: 'note' as const,
      text: url,
      timestamp: now.toISOString()
    }));
  }

  return {
    title,
    overrides
  };
}
