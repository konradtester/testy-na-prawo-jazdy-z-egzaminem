import {
  state, DEFAULT_SHORTCUTS_LEGEND, EXAM_SHORTCUTS_LEGEND,
  EXAM_BASIC_PLAN, EXAM_SPECIALIST_PLAN, EXAM_PASS_THRESHOLD,
  EXAM_TIME_BASIC, EXAM_TIME_SPECIALIST, EXAM_HISTORY_DEPTH
} from './state.js';
import {
  elExamBar, elMainToolbar, elProgressContainer, elCardNavigation, elShortcutsLegend, elExamResultScreen,
  elQuestionId, elBadgeScope, elBadgePoints, elBadgeType, elQuestionText, elFeedback, elAnswers,
  elExamProgressText, elExamTimerFill, elExamTimerText, elAppLayout,
  elExamResultBadge, elExamResultScore, elExamResultSub, elExamResultBreakdown, elExamResultList
} from './dom.js';
import { renderMedia } from './media.js';
import { shuffleArray, updateBadgesCounts } from './filters.js';
import { saveSessionData } from './session.js';
import { renderCurrentQuestion } from './test-mode.js';

export function resetExamUI() {
  clearInterval(state.examState.timerInterval);
  elExamBar.classList.add('hidden');
  elMainToolbar.classList.remove('hidden');
  elProgressContainer.classList.remove('hidden');
  elCardNavigation.classList.remove('exam-mode');
  elShortcutsLegend.innerHTML = DEFAULT_SHORTCUTS_LEGEND;
  elExamResultScreen.classList.add('hidden');
}

function takeFromBucket(bucket, predicate) {
  for (let i = bucket.length - 1; i >= 0; i--) {
    if (predicate(bucket[i])) {
      return bucket.splice(i, 1)[0];
    }
  }
  return null;
}

// avoidIds: questions drawn in recent exams — skipped when a fresh
// alternative of the same weight exists, so repeat exams feel varied.
function pickQuestionsByPlan(pool, plan, usedIds, avoidIds) {
  const byPoints = { 1: [], 2: [], 3: [] };
  pool.forEach(q => {
    if (!byPoints[q.points]) byPoints[q.points] = [];
    byPoints[q.points].push(q);
  });
  Object.values(byPoints).forEach(shuffleArray);

  const result = [];
  plan.forEach(pts => {
    const bucket = byPoints[pts] || [];
    let picked = takeFromBucket(bucket, q => !usedIds.has(q.id) && !avoidIds.has(q.id));
    if (!picked) {
      // No fresh question left at this weight — allow a recently-used one
      picked = takeFromBucket(bucket, q => !usedIds.has(q.id));
    }
    if (!picked) {
      // Fallback: pool exhausted for this exact weight, grab any unused question
      picked = pool.find(q => !usedIds.has(q.id));
    }
    if (picked) {
      usedIds.add(picked.id);
      result.push(picked);
    }
  });
  return result;
}

function buildExamSet() {
  const basicPool = state.rawQuestions.filter(q => q.scope === 'podstawowy');
  const specialistPool = state.rawQuestions.filter(q => q.scope === 'specjalistyczny');
  const usedIds = new Set();
  const avoidIds = new Set();
  (state.sessionData.examHistory || []).forEach(examIds => {
    examIds.forEach(id => avoidIds.add(id));
  });
  const basicQs = pickQuestionsByPlan(basicPool, EXAM_BASIC_PLAN, usedIds, avoidIds);
  const specialistQs = pickQuestionsByPlan(specialistPool, EXAM_SPECIALIST_PLAN, usedIds, avoidIds);
  return basicQs.concat(specialistQs);
}

function recordExamHistory(questions) {
  if (!state.sessionData.examHistory) state.sessionData.examHistory = [];
  state.sessionData.examHistory.push(questions.map(q => q.id));
  if (state.sessionData.examHistory.length > EXAM_HISTORY_DEPTH) {
    state.sessionData.examHistory = state.sessionData.examHistory.slice(-EXAM_HISTORY_DEPTH);
  }
  saveSessionData();
}

export function startExam() {
  const requiredTotal = EXAM_BASIC_PLAN.length + EXAM_SPECIALIST_PLAN.length;
  const basicAvailable = state.rawQuestions.filter(q => q.scope === 'podstawowy').length;
  const specialistAvailable = state.rawQuestions.filter(q => q.scope === 'specjalistyczny').length;
  if (basicAvailable < EXAM_BASIC_PLAN.length || specialistAvailable < EXAM_SPECIALIST_PLAN.length) {
    alert('Za mało pytań w tej kategorii, by zasymulować pełny egzamin.');
    return;
  }

  const examQuestions = buildExamSet();
  if (examQuestions.length < requiredTotal) {
    alert('Nie udało się zebrać pełnego zestawu pytań egzaminacyjnych dla tej kategorii.');
    return;
  }
  recordExamHistory(examQuestions);

  state.examState = {
    active: true,
    questions: examQuestions,
    pointer: 0,
    answers: new Array(examQuestions.length).fill(null),
    timerInterval: null,
    timeLeft: 0,
    timeTotal: 0
  };

  elMainToolbar.classList.add('hidden');
  elProgressContainer.classList.add('hidden');
  elExamBar.classList.remove('hidden');
  elCardNavigation.classList.add('exam-mode');
  elShortcutsLegend.innerHTML = EXAM_SHORTCUTS_LEGEND;

  renderExamQuestion();
}

function renderExamQuestion() {
  const q = state.examState.questions[state.examState.pointer];
  if (!q) {
    finishExam();
    return;
  }

  elQuestionId.textContent = `#${q.id}`;
  elBadgeScope.textContent = q.scope === 'podstawowy' ? 'Podstawowy (Ogólne)' : 'Specjalistyczny';
  elBadgeScope.className = `tag tag-scope ${q.scope}`;
  elBadgePoints.textContent = `${q.points} ${q.points === 1 ? 'pkt' : 'punkty'}`;
  elBadgeType.textContent = q.type === 'yes_no' ? 'Tak / Nie' : 'Wybór A / B / C';
  elQuestionText.textContent = q.question;

  renderMedia(q);

  elFeedback.className = 'feedback-banner hidden';
  elAnswers.innerHTML = '';
  elAnswers.className = q.type === 'yes_no' ? 'answers-area answers-yesno' : 'answers-area answers-abc';

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'answer-btn';
    btn.dataset.key = opt.key;
    btn.innerHTML = `
      <span class="answer-key-pill">${opt.key}</span>
      <span class="answer-text">${opt.text}</span>
    `;
    btn.addEventListener('click', () => handleExamAnswerSelect(opt.key));
    elAnswers.appendChild(btn);
  });

  elExamProgressText.textContent = `Pytanie ${state.examState.pointer + 1} z ${state.examState.questions.length}`;

  startExamTimer(q);
}

function startExamTimer(q) {
  clearInterval(state.examState.timerInterval);
  const totalSeconds = q.scope === 'podstawowy' ? EXAM_TIME_BASIC : EXAM_TIME_SPECIALIST;
  state.examState.timeLeft = totalSeconds;
  state.examState.timeTotal = totalSeconds;
  updateExamTimerUI();

  state.examState.timerInterval = setInterval(() => {
    state.examState.timeLeft--;
    updateExamTimerUI();
    if (state.examState.timeLeft <= 0) {
      clearInterval(state.examState.timerInterval);
      handleExamAnswerSelect(null);
    }
  }, 1000);
}

function updateExamTimerUI() {
  elExamTimerText.textContent = `${Math.max(0, state.examState.timeLeft)}s`;
  const pct = state.examState.timeTotal > 0 ? Math.max(0, (state.examState.timeLeft / state.examState.timeTotal) * 100) : 0;
  elExamTimerFill.style.width = `${pct}%`;
  elExamTimerFill.classList.toggle('exam-timer-urgent', state.examState.timeLeft <= 5);
}

export function handleExamAnswerSelect(selectedKey) {
  if (!state.examState.active) return;
  if (state.examState.answers[state.examState.pointer]) return;

  clearInterval(state.examState.timerInterval);
  const q = state.examState.questions[state.examState.pointer];
  const isCorrect = selectedKey !== null && selectedKey === q.correct;

  state.examState.answers[state.examState.pointer] = {
    selected: selectedKey,
    isCorrect: isCorrect,
    points: isCorrect ? q.points : 0
  };

  elAnswers.querySelectorAll('.answer-btn').forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.key === selectedKey) {
      btn.classList.add('state-selected-exam');
    }
  });

  setTimeout(() => {
    state.examState.pointer++;
    if (state.examState.pointer >= state.examState.questions.length) {
      finishExam();
    } else {
      renderExamQuestion();
    }
  }, 350);
}

export function finishExam() {
  clearInterval(state.examState.timerInterval);
  state.examState.active = false;

  // Feed wrong/unanswered exam questions into the "Do powtórki" mistakes list
  state.examState.questions.forEach((q, i) => {
    const a = state.examState.answers[i];
    if (!a || !a.isCorrect) {
      if (!state.sessionData.mistakes.includes(q.id)) {
        state.sessionData.mistakes.push(q.id);
      }
    }
  });
  saveSessionData();
  updateBadgesCounts();

  renderExamResult();

  elExamBar.classList.add('hidden');
  elAppLayout.classList.add('hidden');
  elExamResultScreen.classList.remove('hidden');
}

function renderExamResult() {
  const totalPoints = state.examState.answers.reduce((sum, a) => sum + (a ? a.points : 0), 0);
  const maxPoints = state.examState.questions.reduce((sum, q) => sum + q.points, 0);
  const passed = totalPoints >= EXAM_PASS_THRESHOLD;
  const correctCount = state.examState.answers.filter(a => a && a.isCorrect).length;
  const wrongCount = state.examState.questions.length - correctCount;

  elExamResultBadge.textContent = passed ? 'ZDANE' : 'NIEZDANE';
  elExamResultBadge.className = `exam-result-badge ${passed ? 'pass' : 'fail'}`;
  elExamResultScore.textContent = `${totalPoints} / ${maxPoints} pkt`;
  elExamResultSub.textContent = `Próg zdawalności: ${EXAM_PASS_THRESHOLD} pkt na ${maxPoints} możliwych`;

  elExamResultBreakdown.innerHTML = `
    <div class="stat-pill correct">
      <span class="stat-label">Poprawne</span>
      <span class="stat-val">${correctCount}</span>
    </div>
    <div class="stat-pill wrong">
      <span class="stat-label">Błędne</span>
      <span class="stat-val">${wrongCount}</span>
    </div>
  `;

  elExamResultList.innerHTML = '';
  state.examState.questions.forEach((q, i) => {
    const a = state.examState.answers[i];
    const isCorrect = !!(a && a.isCorrect);
    const correctOpt = q.options.find(o => o.key === q.correct);
    const correctLabel = correctOpt ? (q.type === 'yes_no' ? correctOpt.text : `${correctOpt.key} — ${correctOpt.text}`) : q.correct;

    const row = document.createElement('div');
    row.className = `exam-result-row ${isCorrect ? 'correct' : 'wrong'}`;
    row.innerHTML = `
      <span class="exam-row-status">${isCorrect ? '✓' : '✗'}</span>
      <span class="exam-row-text">#${q.id} — ${q.question}${!isCorrect ? `<br><span style="color: var(--color-correct)">Poprawna odpowiedź: ${correctLabel}</span>` : ''}</span>
      <span class="exam-row-points">${a ? a.points : 0}/${q.points} pkt</span>
    `;
    elExamResultList.appendChild(row);
  });
}

export function exitExamToTestMode() {
  resetExamUI();
  elExamResultScreen.classList.add('hidden');
  elAppLayout.classList.remove('hidden');
  renderCurrentQuestion();
}
