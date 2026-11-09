import { state } from './state.js';

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
    answers: {},
    mistakes: [],
    lastPointer: 0,
    examHistory: []
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
