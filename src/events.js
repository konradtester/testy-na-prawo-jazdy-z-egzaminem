import { state } from './state.js';
import {
  elBtnPrev, elBtnNext, elBtnReplay, elVideo,
  elImage, elModalImg, elModal, elModalClose,
  elFilterBtns, elBtnShuffle, elShuffleLabel,
  elJumpInput, elJumpBtn, elBtnReset,
  elBtnStartExam, elBtnExitExam, elBtnExamRetry, elBtnExamExit, elExamResultScreen, elAppLayout
} from './dom.js';
import { goToPrev, goToNext, jumpToPosition, resetSessionStats, renderCurrentQuestion } from './test-mode.js';
import { applyFilter } from './filters.js';
import { startExam, finishExam, exitExamToTestMode } from './exam.js';
import { handleGlobalKeydown } from './shortcuts.js';

export function attachEventListeners() {
  if (state.listenersAttached) return;
  state.listenersAttached = true;

  elBtnPrev.addEventListener('click', goToPrev);
  elBtnNext.addEventListener('click', goToNext);

  elBtnReplay.addEventListener('click', () => {
    elVideo.currentTime = 0;
    elVideo.play().catch(() => {});
  });

  elImage.addEventListener('click', () => {
    elModalImg.src = elImage.src;
    elModal.classList.remove('hidden');
  });

  elModalClose.addEventListener('click', () => {
    elModal.classList.add('hidden');
  });

  elModal.addEventListener('click', (e) => {
    if (e.target === elModal) {
      elModal.classList.add('hidden');
    }
  });

  elFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      applyFilter(btn.dataset.filter);
      renderCurrentQuestion();
    });
  });

  elBtnShuffle.addEventListener('click', () => {
    state.isShuffled = !state.isShuffled;
    if (state.isShuffled) {
      elBtnShuffle.classList.add('active-shuffle');
      elShuffleLabel.textContent = 'Losowo';
    } else {
      elBtnShuffle.classList.remove('active-shuffle');
      elShuffleLabel.textContent = 'Kolejno';
    }
    applyFilter(state.currentFilter);
    renderCurrentQuestion();
  });

  elJumpBtn.addEventListener('click', () => {
    const val = parseInt(elJumpInput.value, 10);
    jumpToPosition(val);
  });

  elJumpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = parseInt(elJumpInput.value, 10);
      jumpToPosition(val);
    }
  });

  elBtnReset.addEventListener('click', resetSessionStats);

  elBtnStartExam.addEventListener('click', startExam);

  elBtnExitExam.addEventListener('click', () => {
    if (!confirm('Czy na pewno chcesz zakończyć egzamin przed czasem? Nieodpowiedziane pytania liczą się jako błędne.')) {
      return;
    }
    finishExam();
  });

  elBtnExamRetry.addEventListener('click', () => {
    elExamResultScreen.classList.add('hidden');
    elAppLayout.classList.remove('hidden');
    startExam();
  });

  elBtnExamExit.addEventListener('click', exitExamToTestMode);

  window.addEventListener('keydown', handleGlobalKeydown);
}
