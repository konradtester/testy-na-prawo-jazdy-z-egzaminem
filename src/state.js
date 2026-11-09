// ==========================================================================
// Shared constants & mutable application state
// ==========================================================================

// Counts are informational only (shown on the selection screen before the
// dataset is loaded) — scripts/build_dataset.py is the source of truth for data.
export const CATEGORIES = [
  { code: 'A', name: 'Motocykl', count: 1425, icon: 'moto' },
  { code: 'A1', name: 'Motocykl do 125 cm³', count: 1411, icon: 'moto' },
  { code: 'A2', name: 'Motocykl średniej mocy', count: 1409, icon: 'moto' },
  { code: 'B', name: 'Samochód osobowy', count: 2135, icon: 'car' },
  { code: 'B1', name: 'Czterokołowiec (quad)', count: 1421, icon: 'quad' }
];
export const LAST_CATEGORY_KEY = 'prawo_jazdy_last_category';

// Icon artwork (inline SVG paths) shown on each category card
export const CATEGORY_ICONS = {
  moto: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
  car: '<path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><rect x="3" y="11" width="18" height="5" rx="1.5"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/>',
  quad: '<circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><circle cx="5" cy="9" r="2"/><circle cx="19" cy="9" r="2"/><path d="M7 9h10M7 18h10M12 5v4M12 13v5"/>'
};

// CDN base for media streaming (converted web-optimized MP4 & WebP)
export const CDN_MEDIA_BASE = 'https://f003.backblazeb2.com/file/prawko';

export const DEFAULT_SHORTCUTS_LEGEND = `<span>Klawisze:</span> <kbd>1</kbd> TAK • <kbd>2</kbd> NIE • <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd> wybór odpowiedzi (pytania z 3 opcjami) • <kbd>Spacja</kbd>/<kbd>→</kbd> Następne`;
export const EXAM_SHORTCUTS_LEGEND = `<span>Egzamin:</span> <kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> wybór odpowiedzi — pytanie zamyka się automatycznie, bez cofania`;

// Official PL theory exam structure: 32 questions (20 basic + 12 specialist),
// weighted 1/2/3 points, max 74 points, pass threshold 68 points.
// Basic: 20s per question. Specialist: 50s per question.
export const EXAM_BASIC_PLAN = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1];
export const EXAM_SPECIALIST_PLAN = [3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1];
export const EXAM_PASS_THRESHOLD = 68;
export const EXAM_TIME_BASIC = 20;
export const EXAM_TIME_SPECIALIST = 50;
// How many of the most recent exams' questions to avoid re-drawing, when a
// fresh alternative of the same weight is available.
export const EXAM_HISTORY_DEPTH = 3;

// Single mutable state object, shared by reference across all modules.
export const state = {
  rawQuestions: [],
  currentCategory: null,

  currentFilter: 'all', // 'all' | 'podstawowy' | 'specjalistyczny' | 'mistakes'
  isShuffled: false,
  activeList: [], // Array of indices into rawQuestions
  activePointer: 0, // Current position in activeList

  storageKey: null,
  sessionData: { answers: {}, mistakes: [], lastPointer: 0 },

  examState: {
    active: false,
    questions: [],
    pointer: 0,
    answers: [],
    timerInterval: null,
    timeLeft: 0,
    timeTotal: 0
  },

  listenersAttached: false
};
