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

/**
 * Returns the tags that should be *suggested* (shown as clickable chips) for a
 * task title: tags from the pool and the role graph that the title implies but
 * the task does not already carry. This is the single source of tag-suggestion
 * truth — there is no longer a parallel auto-add path in the task modal.
 */
export function suggestTaskTags({
  title,
  context = [],
  existingTags = [],
  tagPool = [],
  roles = [],
  maxTags = 5
}: {
  title: string;
  context?: string[];
  existingTags?: string[];
  tagPool?: string[];
  roles?: RoleDefinition[];
  maxTags?: number;
}): string[] {
  const present = new Set((existingTags || []).map((tag) => tag.toLowerCase()));
  const candidates = Array.from(new Set([...tagPool, ...roles.flatMap((role) => role.tags || [])]));
  const order = new Map(candidates.map((tag, index) => [tag.toLowerCase(), index]));
  const scores = new Map<string, number>();
  const addScore = (tag: string, score: number) => {
    const key = tag.toLowerCase();
    if (!tag || present.has(key)) return;
    scores.set(tag, (scores.get(tag) || 0) + score);
  };
  const sources = [{ value: title, weight: 100 }, ...context.map((value) => ({ value, weight: 60 }))];

  candidates.forEach((tag) => {
    sources.forEach(({ value, weight }) => {
      if (includesTerm(normalizeText(value), tag)) addScore(tag, weight);
    });
  });

  roles.forEach((role) => {
    const roleTags = role.tags || [];
    const roleMatched = sources.some(({ value }) => includesTerm(normalizeText(value), role.name));
    const relatedToEvidence = roleTags.some(
      (tag) => (scores.get(tag) || 0) > 0 || present.has(tag.toLowerCase())
    );
    if (roleMatched || relatedToEvidence) roleTags.forEach((tag) => addScore(tag, 20));
  });

  return [...scores.entries()]
    .filter(([, score]) => score > 0)
    .sort(
      ([leftTag, leftScore], [rightTag, rightScore]) =>
        rightScore - leftScore ||
        (order.get(leftTag.toLowerCase()) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(rightTag.toLowerCase()) ?? Number.MAX_SAFE_INTEGER) ||
        leftTag.localeCompare(rightTag)
    )
    .map(([tag]) => tag)
    .slice(0, maxTags);
}
