import { state, CATEGORIES, CATEGORY_ICONS, LAST_CATEGORY_KEY } from './state.js';
import {
  elCategoryGrid, elCategoryScreen, elAppLayout,
  elBrandCategory, elBrandIconSvg, elBtnChangeCategory,
  elBtnShuffle, elShuffleLabel
} from './dom.js';
import { loadSessionData } from './session.js';
import { init } from './test-mode.js';
import { resetExamUI } from './exam.js';
import { attachEventListeners } from './events.js';

export function initCategoryScreen() {
  renderCategoryGrid();

  elBtnChangeCategory.addEventListener('click', () => {
    if (state.examState.active) {
      if (!confirm('Trwa egzamin. Czy na pewno chcesz go przerwać i zmienić kategorię?')) return;
      clearInterval(state.examState.timerInterval);
      state.examState.active = false;
      resetExamUI();
    }
    showCategoryScreen();
  });

  const lastCategory = localStorage.getItem(LAST_CATEGORY_KEY);
  const known = CATEGORIES.some(c => c.code === lastCategory);
  if (lastCategory && known) {
    loadCategory(lastCategory);
  } else {
    showCategoryScreen();
  }
}

function renderCategoryGrid() {
  elCategoryGrid.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'category-card';
    const iconSvg = CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS.moto;
    btn.innerHTML = `
      <svg class="category-icon" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>
      <span class="category-code">${cat.code}</span>
      <span class="category-name">${cat.name}</span>
      <span class="category-count">${cat.count} pytań</span>
    `;
    btn.addEventListener('click', () => loadCategory(cat.code));
    elCategoryGrid.appendChild(btn);
  });
}

function showCategoryScreen() {
  elCategoryScreen.classList.remove('hidden');
  elAppLayout.classList.add('hidden');
}

function loadCategory(code) {
  const globalVar = `QUESTIONS_KAT_${code}`;

  const onDataReady = () => {
    state.rawQuestions = window[globalVar] || [];
    if (!state.rawQuestions.length) {
      console.error(`Brak pytań w window.${globalVar}!`);
    }

    state.currentCategory = CATEGORIES.find(c => c.code === code) || { code, name: code };
    state.storageKey = `prawo_jazdy_kat_${code.toLowerCase()}_v1`;
    state.sessionData = loadSessionData();
    localStorage.setItem(LAST_CATEGORY_KEY, code);
    state.currentFilter = 'all';
    state.isShuffled = false;
    elShuffleLabel.textContent = 'Kolejno';
    elBtnShuffle.classList.remove('active-shuffle');
    resetExamUI();

    elBrandCategory.textContent = `Kat. ${code}`;
    elBrandIconSvg.innerHTML = CATEGORY_ICONS[state.currentCategory.icon] || CATEGORY_ICONS.moto;
    document.title = `Testy Prawo Jazdy Kat. ${code} — Baza Pytań WORD`;

    elCategoryScreen.classList.add('hidden');
    elAppLayout.classList.remove('hidden');

    init();
    attachEventListeners();
  };

  if (window[globalVar]) {
    onDataReady();
    return;
  }

  // Path is relative to index.html (the document base), not to this module —
  // dynamically created <script> tags always resolve against the page URL.
  const script = document.createElement('script');
  script.src = `data/questions_kat_${code.toLowerCase()}.js`;
  script.onload = onDataReady;
  script.onerror = () => {
    alert(`Nie udało się wczytać bazy pytań dla kategorii ${code}.`);
  };
  document.body.appendChild(script);
}
