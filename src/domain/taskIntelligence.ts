import type { RoleDefinition } from './types';

const normalizeText = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const wordsFor = (value: string) => normalizeText(value).split(' ').filter(Boolean);

const includesTerm = (haystack: string, term: string) => {
  const normalized = normalizeText(term);
  if (!normalized) return false;
  const haystackWords = haystack.split(' ').filter(Boolean);
  const termWords = normalized.split(' ').filter(Boolean);
  if (termWords.length === 1) return haystackWords.includes(termWords[0]);
  return haystack.includes(normalized);
};

const pushUnique = (items: string[], tag: string, maxTags: number) => {
  const normalized = String(tag || '').trim();
  if (!normalized || items.length >= maxTags) return;
  if (items.some((item) => item.toLowerCase() === normalized.toLowerCase())) return;
  items.push(normalized);
};

export function inferTaskTags({
  title,
  existingTags = [],
  tagPool = [],
  roles = [],
  maxTags = 8
}: {
  title: string;
  existingTags?: string[];
  tagPool?: string[];
  roles?: RoleDefinition[];
  maxTags?: number;
}) {
  const titleText = normalizeText(title);
  const inferred = [...existingTags];
  const graph = new Map<string, Set<string>>();

  const connect = (term: string, tag: string) => {
    const normalized = normalizeText(term);
    if (!normalized || !tag) return;
    if (!graph.has(normalized)) graph.set(normalized, new Set());
    graph.get(normalized)?.add(tag);
  };

  tagPool.forEach((tag) => {
    if (includesTerm(titleText, tag)) pushUnique(inferred, tag, maxTags);
  });

  roles.forEach((role) => {
    const roleTags = role.tags || [];
    connect(role.name, roleTags[0] || role.name);
    wordsFor(role.name).forEach((word) => roleTags.forEach((tag) => connect(word, tag)));
    roleTags.forEach((tag) => {
      connect(tag, tag);
      wordsFor(tag).forEach((word) => connect(word, tag));
      roleTags.forEach((relatedTag) => connect(tag, relatedTag));
    });
  });

  graph.forEach((tags, term) => {
    if (!includesTerm(titleText, term)) return;
    tags.forEach((tag) => pushUnique(inferred, tag, maxTags));
  });

  return inferred;
}
