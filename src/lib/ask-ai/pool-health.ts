/**
 * Pool health-check persistence (client-side).
 *
 * Free models that failed mid-stream are remembered across visits so the
 * pool starts with them skipped from the first message. The skip is not
 * permanent: entries expire after `FAILED_MODELS_TTL_MS` (24h) so a model
 * that recovered is tried again — rate limits reset daily and provider
 * outages heal.
 *
 * Storage shape: `{ models: string[], savedAt: number }`. `savedAt` slides
 * forward on every new failure, so a model that keeps failing never
 * expires; a model that stops failing is retried once its entry ages out.
 */

export const FAILED_MODELS_KEY = 'ask-ai-failed-models';

/** How long a failed model stays skipped (rate limits reset daily). */
export const FAILED_MODELS_TTL_MS = 24 * 60 * 60 * 1000;

interface FailedModelsRecord {
  models: string[];
  savedAt: number;
}

/** Read the persisted failed models, dropping entries older than the TTL. */
export function loadFailedModels(
  storage: Pick<Storage, 'getItem'> = localStorage,
): string[] {
  try {
    const raw = storage.getItem(FAILED_MODELS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<FailedModelsRecord>;
    if (!parsed || !Array.isArray(parsed.models) || typeof parsed.savedAt !== 'number') {
      return [];
    }
    const now = Date.now();
    const savedAt = parsed.savedAt; // narrowed before the closure
    return parsed.models.filter(() => now - savedAt < FAILED_MODELS_TTL_MS);
  } catch {
    // Corrupt storage must not break the panel — start with a clean slate.
    return [];
  }
}

/** Persist the current failed-models list, sliding the TTL clock forward. */
export function persistFailedModels(
  models: string[],
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    const record: FailedModelsRecord = { models, savedAt: Date.now() };
    storage.setItem(FAILED_MODELS_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage write errors (quota, private mode, ...).
  }
}
