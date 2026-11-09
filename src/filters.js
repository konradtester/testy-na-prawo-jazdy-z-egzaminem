import { state } from './state.js';
import { elCountAll, elCountBasic, elCountSpecial, elCountMistakes, elFilterBtns, elJumpInput } from './dom.js';

export function updateBadgesCounts() {
  const basicCount = state.rawQuestions.filter(q => q.scope === 'podstawowy').length;
  const specialCount = state.rawQuestions.filter(q => q.scope === 'specjalistyczny').length;
  const mistakesCount = state.sessionData.mistakes.length;

  if (elCountAll) elCountAll.textContent = state.rawQuestions.length;
  if (elCountBasic) elCountBasic.textContent = basicCount;
  if (elCountSpecial) elCountSpecial.textContent = specialCount;
  if (elCountMistakes) elCountMistakes.textContent = mistakesCount;
}

export function applyFilter(filterName) {
  state.currentFilter = filterName;

  let filteredIndices = [];
  state.rawQuestions.forEach((q, idx) => {
    if (filterName === 'all') {
      filteredIndices.push(idx);
    } else if (filterName === 'podstawowy' && q.scope === 'podstawowy') {
      filteredIndices.push(idx);
    } else if (filterName === 'specjalistyczny' && q.scope === 'specjalistyczny') {
      filteredIndices.push(idx);
    } else if (filterName === 'mistakes') {
      if (state.sessionData.mistakes.includes(q.id)) {
        filteredIndices.push(idx);
      }
    }
  });

  if (state.isShuffled) {
    shuffleArray(filteredIndices);
  }

  state.activeList = filteredIndices;
  state.activePointer = 0;

  elFilterBtns.forEach(btn => {
    if (btn.dataset.filter === filterName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (elJumpInput) {
    elJumpInput.max = state.activeList.length;
  }
}

export function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}
