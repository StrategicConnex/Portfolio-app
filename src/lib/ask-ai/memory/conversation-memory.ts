/**
 * Conversation Memory System
 * 
 * Manages short-term and long-term memory for the AI copilot.
 * - Short-term: Active conversation context
 * - Long-term: Summaries persisted to localStorage (client-side)
 * - Session: Preferences and context for the current browser session
 */

const MEMORY_STORAGE_KEY = 'ask-ai-memory';
const SUMMARY_THRESHOLD = 8; // Summarize every N messages

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
 * Generate a simple text summary from conversation messages.
 * This runs on the server side when the conversation is complete.
 */
export function generateConversationSummary(
  messages: { role: string; content: string }[],
  language: 'es' | 'en' = 'es',
): { title: string; summary: string; topics: string[] } {
  if (messages.length === 0) {
    return { title: language === 'en' ? 'Empty conversation' : 'Conversación vacía', summary: '', topics: [] };
  }

  // Extract first user message as title
  const firstUserMsg = messages.find(m => m.role === 'user');
  const title = firstUserMsg
    ? firstUserMsg.content.substring(0, 80) + (firstUserMsg.content.length > 80 ? '...' : '')
    : language === 'en' ? 'Conversation' : 'Conversación';

  // Detect topics from user messages
  const topicKeywords = [
    'iec 62443', 'nist', 'iso 27001', 'purdue', 'siem', 'security onion',
    'oil & gas', 'vaca muerta', 'scada', 'modbus', 'dns', 'ssl', 'tls',
    'http', 'firewall', 'seguridad', 'industrial', 'cloud', 'azure', 'aws',
    'certification', 'certificación', 'pmp', 'ccna', 'docker', 'kubernetes',
  ];

  const topics = new Set<string>();
  for (const msg of messages) {
    const lower = msg.content.toLowerCase();
    for (const kw of topicKeywords) {
      if (lower.includes(kw)) {
        topics.add(kw);
      }
    }
  }

  // Build summary from message patterns
  const userMessages = messages.filter(m => m.role === 'user');
  const botMessages = messages.filter(m => m.role === 'assistant');

  const summary = language === 'en'
    ? `Conversation about ${topics.size > 0 ? [...topics].slice(0, 3).join(', ') : 'general topics'}. ${userMessages.length} user messages, ${botMessages.length} assistant responses.`
    : `Conversación sobre ${topics.size > 0 ? [...topics].slice(0, 3).join(', ') : 'temas generales'}. ${userMessages.length} mensajes de usuario, ${botMessages.length} respuestas del asistente.`;

  return {
    title,
    summary,
    topics: [...topics].slice(0, 5),
  };
}

/**
 * Check if the conversation should be summarized (based on message count threshold).
 */
export function shouldSummarize(messages: { role: string }[]): boolean {
  return messages.filter(m => m.role === 'user').length >= SUMMARY_THRESHOLD;
}

/**
 * Build a context string from past conversation summaries for the system prompt.
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
