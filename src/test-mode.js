import { state } from './state.js';
import {
  elQuestionId, elBadgeScope, elBadgePoints, elBadgeType, elQuestionText,
  elMediaWrapper, elVideoBox, elImageBox, elFeedback,
  elFeedbackIcon, elFeedbackTitle, elFeedbackSub,
  elAnswers, elBtnPrev, elBtnNext,
  elStatCorrect, elStatWrong, elStatAccuracy,
  elProgressText, elProgressPercent, elProgressBarFill
} from './dom.js';
import { renderMedia } from './media.js';
import { saveSessionData } from './session.js';
import { updateBadgesCounts, applyFilter } from './filters.js';

// ==========================================================================
// Tryb Testy: lifecycle, question rendering, navigation & stats
// ==========================================================================
export function init() {
  updateBadgesCounts();
  applyFilter(state.currentFilter);

  // Restore saved question pointer if valid
  if (state.sessionData.lastPointer >= 0 && state.sessionData.lastPointer < state.activeList.length) {
    state.activePointer = state.sessionData.lastPointer;
  }

  renderCurrentQuestion();
  updateStatsDisplay();
}

export function renderCurrentQuestion() {
  if (!state.activeList.length) {
    showEmptyState();
    return;
  }

  // Clamp pointer
  if (state.activePointer < 0) state.activePointer = 0;
  if (state.activePointer >= state.activeList.length) state.activePointer = state.activeList.length - 1;

  const qIndex = state.activeList[state.activePointer];
  const q = state.rawQuestions[qIndex];
  if (!q) return;

  // 1. Meta Badges
  elQuestionId.textContent = `#${q.id}`;
  elBadgeScope.textContent = q.scope === 'podstawowy' ? 'Podstawowy (Ogólne)' : 'Specjalistyczny';
  elBadgeScope.className = `tag tag-scope ${q.scope}`;

  elBadgePoints.textContent = `${q.points} ${q.points === 1 ? 'pkt' : 'punkty'}`;
  elBadgeType.textContent = q.type === 'yes_no' ? 'Tak / Nie' : 'Wybór A / B / C';

  // 2. Question Text
  elQuestionText.textContent = q.question;

  // 3. Media Handling
  renderMedia(q);

  // 4. Answers Area
  renderAnswers(q);

  // 5. Navigation buttons
  elBtnPrev.disabled = state.activePointer === 0;
  elBtnNext.disabled = state.activePointer === state.activeList.length - 1;

  // 6. Update progress bar
  updateProgressBar();

  saveSessionData();
}

export function showEmptyState() {
  elQuestionId.textContent = '#0';
  elBadgeScope.textContent = '-';
  elBadgePoints.textContent = '-';
  elBadgeType.textContent = '-';
  elQuestionText.textContent = state.currentFilter === 'mistakes'
    ? 'Brak pytań do powtórki! Rozwiązuj pytania, a błędne odpowiedzi pojawią się tutaj automatycznie.'
    : 'Brak pytań w tej kategorii.';
  elMediaWrapper.classList.add('empty');
  elVideoBox.classList.add('hidden');
  elImageBox.classList.add('hidden');
  elFeedback.classList.add('hidden');
  elAnswers.innerHTML = '';
  elBtnPrev.disabled = true;
  elBtnNext.disabled = true;
  updateProgressBar();
}

export function renderAnswers(q) {
  elAnswers.innerHTML = '';
  elAnswers.className = q.type === 'yes_no' ? 'answers-area answers-yesno' : 'answers-area answers-abc';

  const recorded = state.sessionData.answers[q.id];
  const isAnswered = !!recorded;

  // Reset feedback banner
  if (isAnswered) {
    showFeedbackBanner(q, recorded.isCorrect, recorded.selected);
    elBtnNext.classList.add('pulse');
  } else {
    elFeedback.className = 'feedback-banner hidden';
    elBtnNext.classList.remove('pulse');
  }

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'answer-btn';
    btn.dataset.key = opt.key;
    btn.id = `btn-answer-${opt.key.toLowerCase()}`;

    let badgeHtml = '';
    if (isAnswered) {
      btn.disabled = true;
      if (opt.key === q.correct) {
        btn.classList.add('state-correct');
        badgeHtml = '<span class="answer-eval-badge badge-is-correct">✓ Poprawna</span>';
      } else if (opt.key === recorded.selected) {
        btn.classList.add('state-wrong');
        badgeHtml = '<span class="answer-eval-badge badge-is-wrong">✗ Twoja odpowiedź</span>';
      } else {
        btn.classList.add('state-faded');
      }
    } else {
      btn.addEventListener('click', () => handleAnswerSelect(q, opt.key));
    }

    btn.innerHTML = `
      <span class="answer-key-pill">${opt.key}</span>
      <span class="answer-text">${opt.text}</span>
      ${badgeHtml}
    `;

    elAnswers.appendChild(btn);
  });
}

// ==========================================================================
// Answer Evaluation
// ==========================================================================
export function handleAnswerSelect(q, selectedKey) {
  if (state.sessionData.answers[q.id]) {
    return; // Already answered
  }

  const isCorrect = selectedKey === q.correct;

  // Record answer
  state.sessionData.answers[q.id] = {
    selected: selectedKey,
    isCorrect: isCorrect,
    timestamp: Date.now()
  };

  if (!isCorrect) {
    if (!state.sessionData.mistakes.includes(q.id)) {
      state.sessionData.mistakes.push(q.id);
    }
  } else {
    // Remove from mistakes if now answered correctly
    state.sessionData.mistakes = state.sessionData.mistakes.filter(id => id !== q.id);
  }

  saveSessionData();
  updateBadgesCounts();
  updateStatsDisplay();

  // Update Buttons with animation and clear status tags
  const allBtns = elAnswers.querySelectorAll('.answer-btn');
  allBtns.forEach(btn => {
    btn.disabled = true;
    const key = btn.dataset.key;
    const oldBadge = btn.querySelector('.answer-eval-badge');
    if (oldBadge) oldBadge.remove();

    if (key === q.correct) {
      btn.classList.add('state-correct');
      const badge = document.createElement('span');
      badge.className = 'answer-eval-badge badge-is-correct';
      badge.textContent = '✓ Poprawna';
      btn.appendChild(badge);
    } else if (key === selectedKey) {
      btn.classList.add('state-wrong');
      const badge = document.createElement('span');
      badge.className = 'answer-eval-badge badge-is-wrong';
      badge.textContent = '✗ Twoja odpowiedź';
      btn.appendChild(badge);
    } else {
      btn.classList.add('state-faded');
    }
  });

  // Feedback banner with explicit correct answer display
  showFeedbackBanner(q, isCorrect, selectedKey);

  // Pulse next button to invite advancement
  elBtnNext.classList.add('pulse');
}

export function showFeedbackBanner(q, isCorrect, selectedKey) {
  elFeedback.classList.remove('hidden');

  const correctOpt = q.options ? q.options.find(o => o.key === q.correct) : null;
  const selectedOpt = q.options ? q.options.find(o => o.key === selectedKey) : null;

  const correctLabel = correctOpt ? (q.type === 'yes_no' ? correctOpt.text : `${correctOpt.key} — ${correctOpt.text}`) : q.correct;
  const selectedLabel = selectedOpt ? (q.type === 'yes_no' ? selectedOpt.text : `${selectedOpt.key} — ${selectedOpt.text}`) : selectedKey;

  if (isCorrect) {
    elFeedback.className = 'feedback-banner correct';
    elFeedbackIcon.textContent = '✓';
    elFeedbackTitle.textContent = 'Prawidłowa odpowiedź!';
    elFeedbackSub.innerHTML = `
      <div class="feedback-comparison">
        <div class="feedback-row correct-row">
          <span class="feedback-tag tag-correct">Twoja odpowiedź:</span>
          <strong class="feedback-highlight correct-text">${correctLabel}</strong>
        </div>
      </div>
    `;
  } else {
    elFeedback.className = 'feedback-banner wrong';
    elFeedbackIcon.textContent = '✗';
    elFeedbackTitle.textContent = 'Nieprawidłowa odpowiedź!';
    elFeedbackSub.innerHTML = `
      <div class="feedback-comparison">
        <div class="feedback-row correct-row">
          <span class="feedback-tag tag-correct">Prawidłowa odpowiedź:</span>
          <strong class="feedback-highlight correct-text">${correctLabel}</strong>
        </div>
        <div class="feedback-row wrong-row">
          <span class="feedback-tag tag-wrong">Twoja odpowiedź:</span>
          <span class="feedback-highlight wrong-text">${selectedLabel}</span>
        </div>
      </div>
    `;
  }
}

// ==========================================================================
// Navigation & Progress
// ==========================================================================
export function goToNext() {
  if (state.activePointer < state.activeList.length - 1) {
    state.activePointer++;
    renderCurrentQuestion();
  }
}

export function goToPrev() {
  if (state.activePointer > 0) {
    state.activePointer--;
    renderCurrentQuestion();
  }
}

export function jumpToPosition(targetNum) {
  if (isNaN(targetNum) || targetNum < 1 || targetNum > state.activeList.length) {
    alert(`Wpisz numer od 1 do ${state.activeList.length}`);
    return;
  }
  state.activePointer = targetNum - 1;
  renderCurrentQuestion();
}

export function updateProgressBar() {
  const total = state.activeList.length;
  const currentNum = total > 0 ? state.activePointer + 1 : 0;

  // Count how many answered in current list
  let answeredCount = 0;
  state.activeList.forEach(idx => {
    const q = state.rawQuestions[idx];
    if (q && state.sessionData.answers[q.id]) {
      answeredCount++;
    }
  });

  const percent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  elProgressText.textContent = `Pytanie ${currentNum} z ${total}`;
  elProgressPercent.textContent = `${answeredCount}/${total} (${percent}%) ukończono`;
  elProgressBarFill.style.width = `${percent}%`;
}

export function updateStatsDisplay() {
  let correct = 0;
  let wrong = 0;

  Object.values(state.sessionData.answers).forEach(rec => {
    if (rec.isCorrect) correct++;
    else wrong++;
  });

  const totalAnswered = correct + wrong;
  const accuracy = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;

  elStatCorrect.textContent = correct;
  elStatWrong.textContent = wrong;
  elStatAccuracy.textContent = totalAnswered > 0 ? `${accuracy}%` : '-%';
}

export function resetSessionStats() {
  if (!confirm('Czy na pewno chcesz zresetować statystyki i historię odpowiedzi?')) {
    return;
  }
  state.sessionData = {
    answers: {},
    mistakes: [],
    lastPointer: 0
  };
  saveSessionData();
  updateBadgesCounts();
  updateStatsDisplay();
  renderCurrentQuestion();
}
