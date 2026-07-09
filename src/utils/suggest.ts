/**
 * Lightweight, fully-offline "AI assist" for sound metadata. A curated keyword
 * map infers a fitting emoji, accent color and tags from a title. Deterministic
 * and instant — no network, no model. Good enough to auto-dress imported files
 * and recordings; the heavier ML suggestions are a later milestone.
 */
interface Rule {
  match: RegExp;
  emoji: string;
  color: string;
  tags: string[];
}

const RULES: Rule[] = [
  { match: /horn|air ?horn|honk/, emoji: '📣', color: '#f43f5e', tags: ['horn', 'hype'] },
  { match: /clap|applause|cheer/, emoji: '👏', color: '#22c55e', tags: ['crowd', 'applause'] },
  { match: /laugh|lol|haha|funny|meme/, emoji: '😂', color: '#eab308', tags: ['funny', 'meme'] },
  { match: /drum|beat|snare|roll/, emoji: '🥁', color: '#f97316', tags: ['drum', 'music'] },
  { match: /guitar|riff|rock/, emoji: '🎸', color: '#ef4444', tags: ['guitar', 'music'] },
  { match: /piano|key|melody/, emoji: '🎹', color: '#6366f1', tags: ['piano', 'music'] },
  { match: /bell|ding|chime|ring/, emoji: '🔔', color: '#38bdf8', tags: ['bell', 'alert'] },
  { match: /buzz|wrong|fail|error/, emoji: '❌', color: '#ef4444', tags: ['fail', 'wrong'] },
  { match: /coin|retro|8 ?bit|mario|game/, emoji: '🪙', color: '#f59e0b', tags: ['retro', 'gaming'] },
  { match: /laser|zap|sci|space/, emoji: '🔫', color: '#a855f7', tags: ['sci-fi', 'zap'] },
  { match: /pop|bubble|click/, emoji: '🫧', color: '#06b6d4', tags: ['ui', 'pop'] },
  { match: /boing|bounce|spring|cartoon/, emoji: '🤸', color: '#f472b6', tags: ['cartoon', 'bounce'] },
  { match: /trombone|womp|sad/, emoji: '🎺', color: '#eab308', tags: ['fail', 'womp'] },
  { match: /dog|bark|cat|meow|animal|moo|duck/, emoji: '🐾', color: '#84cc16', tags: ['animal'] },
  { match: /explos|boom|bomb|blast/, emoji: '💥', color: '#f97316', tags: ['explosion', 'action'] },
  { match: /whistle|ref|sport|goal/, emoji: '⚽', color: '#10b981', tags: ['sports'] },
  { match: /alarm|siren|police/, emoji: '🚨', color: '#ef4444', tags: ['alarm'] },
  { match: /magic|sparkle|success|win/, emoji: '✨', color: '#34d399', tags: ['success', 'magic'] },
  { match: /record|mic|voice|me\b/, emoji: '🎙️', color: '#ec4899', tags: ['recording', 'voice'] },
];

const FALLBACK: Omit<Rule, 'match'> = { emoji: '🔊', color: '#6366f1', tags: [] };

export interface MetaSuggestion {
  emoji: string;
  color: string;
  tags: string[];
}

/** Suggest emoji + color + tags for a title, merging with any existing tags. */
export function suggestMeta(title: string, existingTags: string[] = []): MetaSuggestion {
  const text = title.toLowerCase();
  const rule = RULES.find((r) => r.match.test(text)) ?? FALLBACK;

  // Add meaningful words from the title as tags too.
  const words = text
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  const tags = Array.from(new Set([...existingTags, ...rule.tags, ...words])).slice(0, 8);
  return { emoji: rule.emoji, color: rule.color, tags };
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'sound', 'clip', 'audio',
  'mp3', 'wav', 'final', 'new', 'copy',
]);
