import { state } from './state.js';

// ==========================================================================
// Session Persistence (localStorage, scoped per category via state.storageKey)
// ==========================================================================
export function loadSessionData() {
  try {
    const saved = localStorage.getItem(state.storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not load session data:', e);
  }
  return {
    answers: {}, // questionId -> { selected: string, isCorrect: boolean }
    mistakes: [], // list of questionIds
    lastPointer: 0,
    examHistory: [] // array of past exams' question-id arrays, most recent last
  };
}

export function saveSessionData() {
  try {
    state.sessionData.lastPointer = state.activePointer;
    localStorage.setItem(state.storageKey, JSON.stringify(state.sessionData));
  } catch (e) {
    console.warn('Could not save session data:', e);
  }
}
