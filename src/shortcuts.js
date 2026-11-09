import { state } from './state.js';
import { elAppLayout, elModal } from './dom.js';
import { goToPrev, goToNext, handleAnswerSelect } from './test-mode.js';
import { handleExamAnswerSelect } from './exam.js';

export function handleGlobalKeydown(e) {
  if (e.target.tagName === 'INPUT') {
    return;
  }

  if (elAppLayout.classList.contains('hidden')) {
    return;
  }

  if (e.key === 'Escape') {
    if (!elModal.classList.contains('hidden')) {
      elModal.classList.add('hidden');
      return;
    }
  }

  // Exam mode: answer shortcuts only — no going back, no manual "next",
  // mirroring the real exam's rules.
  if (state.examState.active) {
    const q = state.examState.questions[state.examState.pointer];
    if (!q || state.examState.answers[state.examState.pointer]) return;

    const examKey = e.key.toUpperCase();
    if (q.type === 'yes_no') {
      if (examKey === '1' || examKey === 'T') {
        e.preventDefault();
        handleExamAnswerSelect('T');
      } else if (examKey === '2' || examKey === 'N') {
        e.preventDefault();
        handleExamAnswerSelect('N');
      }
    } else if (q.type === 'abc') {
      if (examKey === '1' || examKey === 'A') {
        e.preventDefault();
        handleExamAnswerSelect('A');
      } else if (examKey === '2' || examKey === 'B') {
        e.preventDefault();
        handleExamAnswerSelect('B');
      } else if (examKey === '3' || examKey === 'C') {
        e.preventDefault();
        handleExamAnswerSelect('C');
      }
    }
    return;
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    goToPrev();
    return;
  }

  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    goToNext();
    return;
  }

  if (!state.activeList.length) return;
  const qIndex = state.activeList[state.activePointer];
  const q = state.rawQuestions[qIndex];
  if (!q || state.sessionData.answers[q.id]) return;

  const key = e.key.toUpperCase();

  if (q.type === 'yes_no') {
    if (key === '1' || key === 'T') {
      e.preventDefault();
      handleAnswerSelect(q, 'T');
    } else if (key === '2' || key === 'N') {
      e.preventDefault();
      handleAnswerSelect(q, 'N');
    }
  } else if (q.type === 'abc') {
    if (key === '1' || key === 'A') {
      e.preventDefault();
      handleAnswerSelect(q, 'A');
    } else if (key === '2' || key === 'B') {
      e.preventDefault();
      handleAnswerSelect(q, 'B');
    } else if (key === '3' || key === 'C') {
      e.preventDefault();
      handleAnswerSelect(q, 'C');
    }
  }
}
