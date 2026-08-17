/**
 * Conversation Memory System (client-side)
 * 
 * Manages long-term memory for the AI copilot in localStorage:
 * - Summaries persisted to localStorage (client-side)
 * - Session: Preferences and context for the current browser session
 * 
 * The server-side summarization call (`generateConversationSummary` /
 * `shouldSummarize`) was removed in candidate C5 — it ran in the ask-ai
 * route and its result was discarded with a console.log. These client
 * helpers are the intended API for the panel's memory integration.
 */

const MEMORY_STORAGE_KEY = 'ask-ai-memory';

export interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  messageCount: number;
  lastUpdated: string;
  topics: string[];
}

export interface UserPreferences {
  language: 'es' | 'en';
  mode: 'ask' | 'analyze' | 'osint' | 'services';
  lastSection?: string;
}

export interface MemoryState {
  summaries: ConversationSummary[];
  preferences: UserPreferences;
  currentTopics: string[];
}

function getDefaultPreferences(language: 'es' | 'en' = 'es'): UserPreferences {
  return { language, mode: 'ask' };
}

function getDefaultMemory(): MemoryState {
  return {
    summaries: [],
    preferences: getDefaultPreferences(),
    currentTopics: [],
  };
}

/**
 * Load memory from localStorage (client-side only).
 */
export function loadMemory(): MemoryState {
  if (typeof window === 'undefined') return getDefaultMemory();
  try {
    const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        summaries: parsed.summaries || [],
        preferences: parsed.preferences || getDefaultPreferences(),
        currentTopics: parsed.currentTopics || [],
      };
    }
  } catch {
    // Ignore corrupt data
  }
  return getDefaultMemory();
}

/**
 * Save memory to localStorage (client-side only).
 */
export function saveMemory(memory: MemoryState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Update user preferences.
 */
export function updatePreferences(prefs: Partial<UserPreferences>): MemoryState {
  const memory = loadMemory();
  memory.preferences = { ...memory.preferences, ...prefs };
  saveMemory(memory);
  return memory;
}

/**
 * Add a conversation summary.
 */
export function addSummary(summary: Omit<ConversationSummary, 'id' | 'lastUpdated'>): MemoryState {
  const memory = loadMemory();
  memory.summaries.unshift({
    ...summary,
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    lastUpdated: new Date().toISOString(),
  });
  // Keep max 20 summaries
  if (memory.summaries.length > 20) {
    memory.summaries = memory.summaries.slice(0, 20);
  }
  saveMemory(memory);
  return memory;
}

/**
 * Build a context string from past conversation summaries for the system prompt.
 * The returned block is pre-localized and self-labeled, ready to embed in the
 * system prompt (the prompt-builder seam injects it verbatim).
 */
export function buildMemoryContext(memory?: MemoryState, language: 'es' | 'en' = 'es'): string {
  if (!memory || memory.summaries.length === 0) {
    return '';
  }

  const recent = memory.summaries.slice(0, 3);
  const context = recent.map(s => `- ${s.title}: ${s.summary}`).join('\n');

  return language === 'en'
    ? `\nPast conversations:\n${context}\n`
    : `\nConversaciones anteriores:\n${context}\n`;
}

/**
 * A minimal structural view of a chat message — the seam only needs the role
 * and the text parts, so it accepts any message shape that provides them
 * (e.g. the `UIMessage` objects `useChat` produces).
 */
export interface SummarizableMessage {
  role: string;
  parts: readonly { type: string; text?: string }[];
}

export interface SummarizeConversationOptions {
  /** Max title length in chars (default 64). */
  maxTitleLength?: number;
  /** Max length of each quoted excerpt in the summary (default 280). */
  maxSummaryLength?: number;
}

/**
 * Derive a real summary from a completed conversation: title from the first
 * user message, a question/answer excerpt as the summary body, the user
 * message count, and technical topics extracted from the user's prompts.
 * Returns `null` when there is nothing to summarize (no user messages or no
 * text at all).
 */
export function summarizeConversation(
  messages: readonly SummarizableMessage[],
  language: 'es' | 'en' = 'es',
  options: SummarizeConversationOptions = {},
): Omit<ConversationSummary, 'id' | 'lastUpdated'> | null {
  const { maxTitleLength = 64, maxSummaryLength = 280 } = options;

  const textOf = (m: SummarizableMessage) =>
    m.parts
      .filter((p) => p.type === 'text' && typeof p.text === 'string')
      .map((p) => (p.text as string).trim())
      .filter(Boolean)
      .join(' ')
      .trim();

  const userMessages = messages.filter((m) => m.role === 'user');
  const firstUserText = userMessages.length > 0 ? textOf(userMessages[0]) : '';
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastAssistantText = lastAssistant ? textOf(lastAssistant) : '';

  // Nothing to summarize: no user messages (the conversation never started) or
  // no text at all anywhere in the thread.
  if (userMessages.length === 0 || (!firstUserText && !lastAssistantText)) {
    return null;
  }

  const truncate = (text: string, max: number) =>
    text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

  const title = truncate(firstUserText || lastAssistantText, maxTitleLength);
  const question = truncate(firstUserText, maxSummaryLength);
  const answer = truncate(lastAssistantText, maxSummaryLength);

  const summary =
    language === 'en'
      ? `User asked: "${question}".${answer ? ` Assistant answered: "${answer}".` : ' No assistant response yet.'}`
      : `El usuario preguntó: "${question}".${answer ? ` El asistente respondió: "${answer}".` : ' Aún no hay respuesta del asistente.'}`;

  return {
    title,
    summary,
    messageCount: userMessages.length,
    topics: extractTopics(messages),
  };
}

/**
 * Extract technical topics from the user's prompts: all-caps terms (IEC,
 * NIST, SIEM…) and tokens containing digits (62443, ISO27001…). Deduplicated,
 * max 5.
 */
function extractTopics(messages: readonly SummarizableMessage[]): string[] {
  const text = messages
    .filter((m) => m.role === 'user')
    .flatMap((m) =>
      m.parts
        .filter((p) => p.type === 'text' && typeof p.text === 'string')
        .map((p) => p.text as string),
    )
    .join(' ');

  const matches = text.match(/[A-ZÁÉÍÓÚÑÜ]{2,}|\b\w*\d\w*\b/g) || [];
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const raw of matches) {
    const topic = raw.trim();
    if (!topic || seen.has(topic)) continue;
    seen.add(topic);
    topics.push(topic);
    if (topics.length >= 5) break;
  }
  return topics;
}
