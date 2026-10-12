export interface LearningState { viewed: string[]; readUpdates: string[] }
const KEY = 'app-manual.learning.v1';
export function readLearning(): LearningState {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { viewed: Array.isArray(data.viewed) ? data.viewed.filter((v: unknown) => typeof v === 'string') : [], readUpdates: Array.isArray(data.readUpdates) ? data.readUpdates.filter((v: unknown) => typeof v === 'string') : [] };
  } catch { return { viewed: [], readUpdates: [] }; }
}
export function saveLearning(state: LearningState) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Browsing still works when storage is unavailable. */ } }
