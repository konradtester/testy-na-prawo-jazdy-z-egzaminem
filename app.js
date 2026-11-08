// ==========================================================================
// Prawo Jazdy Kat. A — Trainer Logic
// ==========================================================================

(function() {
  'use strict';

  // 0. Available Categories
  // Counts are informational only (shown on the selection screen before the
  // dataset is loaded) — rebuild_dataset.py is the source of truth for data.
  const CATEGORIES = [
    { code: 'A', name: 'Motocykl', count: 1425, icon: 'moto' },
    { code: 'A1', name: 'Motocykl do 125 cm³', count: 1411, icon: 'moto' },
    { code: 'A2', name: 'Motocykl średniej mocy', count: 1409, icon: 'moto' },
    { code: 'B', name: 'Samochód osobowy', count: 2135, icon: 'car' },
    { code: 'B1', name: 'Czterokołowiec (quad)', count: 1421, icon: 'quad' }
  ];
  const LAST_CATEGORY_KEY = 'prawo_jazdy_last_category';

  // Icon artwork (inline SVG paths) shown on each category card
  const CATEGORY_ICONS = {
    moto: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
    car: '<path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><rect x="3" y="11" width="18" height="5" rx="1.5"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/>',
    quad: '<circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><circle cx="5" cy="9" r="2"/><circle cx="19" cy="9" r="2"/><path d="M7 9h10M7 18h10M12 5v4M12 13v5"/>'
  };

  // CDN base for media streaming (converted web-optimized MP4 & WebP)
  const CDN_MEDIA_BASE = 'https://f003.backblazeb2.com/file/prawko';

  // 1. Data (populated once a category is chosen and its script is loaded)
  let rawQuestions = [];
  let currentCategory = null;

  // State
  let currentFilter = 'all'; // 'all' | 'podstawowy' | 'specjalistyczny' | 'mistakes'
  let isShuffled = false;
  let activeList = []; // Array of indices into rawQuestions
  let activePointer = 0; // Current position in activeList

  // Persistent Session Data (in localStorage) — set once category is chosen
  let STORAGE_KEY = null;
  let sessionData = { answers: {}, mistakes: [], lastPointer: 0 };

  // DOM Elements
  const elCard = document.getElementById('question-card');
  const elQuestionText = document.getElementById('question-text');
  const elQuestionId = document.getElementById('question-id');
  const elBadgeScope = document.getElementById('badge-scope');
  const elBadgePoints = document.getElementById('badge-points');
  const elBadgeType = document.getElementById('badge-type');

  const elMediaWrapper = document.getElementById('media-wrapper');
  const elVideoBox = document.getElementById('video-box');
  const elVideo = document.getElementById('question-video');
  const elBtnReplay = document.getElementById('btn-replay-video');
  const elImageBox = document.getElementById('image-box');
  const elImage = document.getElementById('question-image');
  const elMediaFallback = document.getElementById('media-fallback');
  const elMediaFallbackText = document.getElementById('media-fallback-text');

  const elFeedback = document.getElementById('feedback-banner');
  const elFeedbackIcon = document.getElementById('feedback-icon');
  const elFeedbackTitle = document.getElementById('feedback-title');
  const elFeedbackSub = document.getElementById('feedback-sub');

  const elAnswers = document.getElementById('answers-container');
  const elBtnPrev = document.getElementById('btn-prev');
  const elBtnNext = document.getElementById('btn-next');

  // Toolbar & Stats elements
  const elStatCorrect = document.getElementById('stat-correct-count');
  const elStatWrong = document.getElementById('stat-wrong-count');
  const elStatAccuracy = document.getElementById('stat-accuracy');

  const elCountAll = document.getElementById('count-all');
  const elCountBasic = document.getElementById('count-basic');
  const elCountSpecial = document.getElementById('count-special');
  const elCountMistakes = document.getElementById('count-mistakes');

  const elFilterBtns = document.querySelectorAll('.filter-btn');
  const elBtnShuffle = document.getElementById('btn-shuffle');
  const elShuffleLabel = document.getElementById('shuffle-label');
  const elJumpInput = document.getElementById('jump-input');
  const elJumpBtn = document.getElementById('jump-btn');
  const elBtnReset = document.getElementById('btn-reset-stats');

  const elProgressText = document.getElementById('progress-text');
  const elProgressPercent = document.getElementById('progress-percent');
  const elProgressBarFill = document.getElementById('progress-bar-fill');

  // Modal Lightbox elements
  const elModal = document.getElementById('image-modal');
  const elModalImg = document.getElementById('modal-img');
  const elModalClose = document.getElementById('modal-close');

  // Category screen elements
  const elCategoryScreen = document.getElementById('category-screen');
  const elCategoryGrid = document.getElementById('category-grid');
  const elAppLayout = document.getElementById('app-layout');
  const elBrandCategory = document.getElementById('brand-category');
  const elBtnChangeCategory = document.getElementById('btn-change-category');

  // Initialize
  initCategoryScreen();

  function initCategoryScreen() {
    renderCategoryGrid();

    elBtnChangeCategory.addEventListener('click', () => {
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
      rawQuestions = window[globalVar] || [];
      if (!rawQuestions.length) {
        console.error(`Brak pytań w window.${globalVar}!`);
      }

      currentCategory = CATEGORIES.find(c => c.code === code) || { code, name: code };
      STORAGE_KEY = `prawo_jazdy_kat_${code.toLowerCase()}_v1`;
      sessionData = loadSessionData();
      localStorage.setItem(LAST_CATEGORY_KEY, code);
      currentFilter = 'all';
      isShuffled = false;
      elShuffleLabel.textContent = 'Kolejno';
      elBtnShuffle.classList.remove('active-shuffle');

      elBrandCategory.textContent = `Kat. ${code}`;
      document.title = `Testy Prawo Jazdy Kat. ${code} — Baza Pytań WORD`;

      elCategoryScreen.classList.add('hidden');
      elAppLayout.classList.remove('hidden');

      init();
    };

    if (window[globalVar]) {
      onDataReady();
      return;
    }

    const script = document.createElement('script');
    script.src = `questions_kat_${code.toLowerCase()}.js`;
    script.onload = onDataReady;
    script.onerror = () => {
      alert(`Nie udało się wczytać bazy pytań dla kategorii ${code}.`);
    };
    document.body.appendChild(script);
  }

  function init() {
    updateBadgesCounts();
    applyFilter(currentFilter);

    // Restore saved question pointer if valid
    if (sessionData.lastPointer >= 0 && sessionData.lastPointer < activeList.length) {
      activePointer = sessionData.lastPointer;
    }

    renderCurrentQuestion();
    updateStatsDisplay();
    attachEventListeners();
  }

  // ==========================================================================
  // Session Persistence
  // ==========================================================================
  function loadSessionData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load session data:', e);
    }
    return {
      answers: {}, // questionId -> { selected: string, isCorrect: boolean }
      mistakes: [], // list of questionIds
      lastPointer: 0
    };
  }

  function saveSessionData() {
    try {
      sessionData.lastPointer = activePointer;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Could not save session data:', e);
    }
  }

  // ==========================================================================
  // Filtering & Ordering
  // ==========================================================================
  function updateBadgesCounts() {
    const basicCount = rawQuestions.filter(q => q.scope === 'podstawowy').length;
    const specialCount = rawQuestions.filter(q => q.scope === 'specjalistyczny').length;
    const mistakesCount = sessionData.mistakes.length;

    if (elCountAll) elCountAll.textContent = rawQuestions.length;
    if (elCountBasic) elCountBasic.textContent = basicCount;
    if (elCountSpecial) elCountSpecial.textContent = specialCount;
    if (elCountMistakes) elCountMistakes.textContent = mistakesCount;
  }

  function applyFilter(filterName) {
    currentFilter = filterName;

    // Filter indices
    let filteredIndices = [];
    rawQuestions.forEach((q, idx) => {
      if (filterName === 'all') {
        filteredIndices.push(idx);
      } else if (filterName === 'podstawowy' && q.scope === 'podstawowy') {
        filteredIndices.push(idx);
      } else if (filterName === 'specjalistyczny' && q.scope === 'specjalistyczny') {
        filteredIndices.push(idx);
      } else if (filterName === 'mistakes') {
        if (sessionData.mistakes.includes(q.id)) {
          filteredIndices.push(idx);
        }
      }
    });

    if (isShuffled) {
      shuffleArray(filteredIndices);
    }

    activeList = filteredIndices;
    activePointer = 0;

    // Update UI active filter button
    elFilterBtns.forEach(btn => {
      if (btn.dataset.filter === filterName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (elJumpInput) {
      elJumpInput.max = activeList.length;
    }
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }

  // ==========================================================================
  // Question Rendering
  // ==========================================================================
  function renderCurrentQuestion() {
    if (!activeList.length) {
      showEmptyState();
      return;
    }

    // Clamp pointer
    if (activePointer < 0) activePointer = 0;
    if (activePointer >= activeList.length) activePointer = activeList.length - 1;

    const qIndex = activeList[activePointer];
    const q = rawQuestions[qIndex];
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
    elBtnPrev.disabled = activePointer === 0;
    elBtnNext.disabled = activePointer === activeList.length - 1;

    // 6. Update progress bar
    updateProgressBar();

    saveSessionData();
  }

  function showEmptyState() {
    elQuestionId.textContent = '#0';
    elBadgeScope.textContent = '-';
    elBadgePoints.textContent = '-';
    elBadgeType.textContent = '-';
    elQuestionText.textContent = currentFilter === 'mistakes' 
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

  function renderMedia(q) {
    // Reset video state
    elVideo.pause();
    elVideo.removeAttribute('src');
    elVideo.load();
    elVideoBox.classList.add('hidden');
    elImageBox.classList.add('hidden');
    elMediaFallback.classList.add('hidden');

    if (!q.media) {
      elMediaWrapper.classList.add('empty');
      return;
    }

    elMediaWrapper.classList.remove('empty');

    if (q.mediaType === 'video') {
      elVideoBox.classList.remove('hidden');
      
      const cdnUrl = `${CDN_MEDIA_BASE}/vid/${encodeURIComponent(q.mediaStem)}.mp4`;
      const localUrl = `media/${q.media}`;

      let videoAttempt = 0;
      elVideo.onerror = function() {
        videoAttempt++;
        if (videoAttempt === 1) {
          elVideo.src = localUrl;
        } else {
          elVideo.onerror = null;
          elVideoBox.classList.add('hidden');
          elMediaFallbackText.textContent = `Wideo niedostępne: ${q.media}`;
          elMediaFallback.classList.remove('hidden');
        }
      };

      elVideo.src = cdnUrl;

      // Auto play video muted on first appearance
      elVideo.muted = true;
      elVideo.play().catch(() => {
        // Autoplay policy might block unmuted or first load, normal behavior
      });

    } else if (q.mediaType === 'image') {
      elImageBox.classList.remove('hidden');

      const cdnWebpUrl = `${CDN_MEDIA_BASE}/img/${encodeURIComponent(q.mediaStem)}.webp`;
      const cdnDirectUrl = `${CDN_MEDIA_BASE}/img/${encodeURIComponent(q.media)}`;
      const localUrl = `media/${q.media}`;

      let imageAttempt = 0;
      elImage.onerror = function() {
        imageAttempt++;
        if (imageAttempt === 1) {
          elImage.src = cdnDirectUrl;
        } else if (imageAttempt === 2) {
          elImage.src = localUrl;
        } else {
          elImage.onerror = null;
          elImageBox.classList.add('hidden');
          elMediaFallbackText.textContent = `Zdjęcie niedostępne: ${q.media}`;
          elMediaFallback.classList.remove('hidden');
        }
      };

      elImage.src = cdnWebpUrl;
    } else {
      elMediaWrapper.classList.add('empty');
    }
  }

  function renderAnswers(q) {
    elAnswers.innerHTML = '';
    elAnswers.className = q.type === 'yes_no' ? 'answers-area answers-yesno' : 'answers-area answers-abc';

    const recorded = sessionData.answers[q.id];
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
  function handleAnswerSelect(q, selectedKey) {
    if (sessionData.answers[q.id]) {
      return; // Already answered
    }

    const isCorrect = selectedKey === q.correct;

    // Record answer
    sessionData.answers[q.id] = {
      selected: selectedKey,
      isCorrect: isCorrect,
      timestamp: Date.now()
    };

    if (!isCorrect) {
      if (!sessionData.mistakes.includes(q.id)) {
        sessionData.mistakes.push(q.id);
      }
    } else {
      // Remove from mistakes if now answered correctly
      sessionData.mistakes = sessionData.mistakes.filter(id => id !== q.id);
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

  function showFeedbackBanner(q, isCorrect, selectedKey) {
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
  function goToNext() {
    if (activePointer < activeList.length - 1) {
      activePointer++;
      renderCurrentQuestion();
    }
  }

  function goToPrev() {
    if (activePointer > 0) {
      activePointer--;
      renderCurrentQuestion();
    }
  }

  function jumpToPosition(targetNum) {
    if (isNaN(targetNum) || targetNum < 1 || targetNum > activeList.length) {
      alert(`Wpisz numer od 1 do ${activeList.length}`);
      return;
    }
    activePointer = targetNum - 1;
    renderCurrentQuestion();
  }

  function updateProgressBar() {
    const total = activeList.length;
    const currentNum = total > 0 ? activePointer + 1 : 0;
    
    // Count how many answered in current list
    let answeredCount = 0;
    activeList.forEach(idx => {
      const q = rawQuestions[idx];
      if (q && sessionData.answers[q.id]) {
        answeredCount++;
      }
    });

    const percent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

    elProgressText.textContent = `Pytanie ${currentNum} z ${total}`;
    elProgressPercent.textContent = `${answeredCount}/${total} (${percent}%) ukończono`;
    elProgressBarFill.style.width = `${percent}%`;
  }

  function updateStatsDisplay() {
    let correct = 0;
    let wrong = 0;

    Object.values(sessionData.answers).forEach(rec => {
      if (rec.isCorrect) correct++;
      else wrong++;
    });

    const totalAnswered = correct + wrong;
    const accuracy = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;

    elStatCorrect.textContent = correct;
    elStatWrong.textContent = wrong;
    elStatAccuracy.textContent = totalAnswered > 0 ? `${accuracy}%` : '-%';
  }

  function resetSessionStats() {
    if (!confirm('Czy na pewno chcesz zresetować statystyki i historię odpowiedzi?')) {
      return;
    }
    sessionData = {
      answers: {},
      mistakes: [],
      lastPointer: 0
    };
    saveSessionData();
    updateBadgesCounts();
    updateStatsDisplay();
    renderCurrentQuestion();
  }

  // ==========================================================================
  // Event Listeners & Keyboard Shortcuts
  // ==========================================================================
  let listenersAttached = false;

  function attachEventListeners() {
    if (listenersAttached) return;
    listenersAttached = true;

    // Next / Prev buttons
    elBtnPrev.addEventListener('click', goToPrev);
    elBtnNext.addEventListener('click', goToNext);

    // Replay video
    elBtnReplay.addEventListener('click', () => {
      elVideo.currentTime = 0;
      elVideo.play().catch(() => {});
    });

    // Image Zoom modal
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

    // Filter Buttons
    elFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        applyFilter(btn.dataset.filter);
        renderCurrentQuestion();
      });
    });

    // Shuffle Button
    elBtnShuffle.addEventListener('click', () => {
      isShuffled = !isShuffled;
      if (isShuffled) {
        elBtnShuffle.classList.add('active-shuffle');
        elShuffleLabel.textContent = 'Losowo';
      } else {
        elBtnShuffle.classList.remove('active-shuffle');
        elShuffleLabel.textContent = 'Kolejno';
      }
      applyFilter(currentFilter);
      renderCurrentQuestion();
    });

    // Jump Button
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

    // Reset Button
    elBtnReset.addEventListener('click', resetSessionStats);

    // Keyboard Shortcuts
    window.addEventListener('keydown', handleGlobalKeydown);
  }

  function handleGlobalKeydown(e) {
    // Ignore keystrokes if typing inside jump input
    if (e.target.tagName === 'INPUT') {
      return;
    }

    // Ignore while the category selection screen is showing
    if (elAppLayout.classList.contains('hidden')) {
      return;
    }

    // Modal close on Escape
    if (e.key === 'Escape') {
      if (!elModal.classList.contains('hidden')) {
        elModal.classList.add('hidden');
        return;
      }
    }

    // Left Arrow: Previous
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
      return;
    }

    // Right Arrow, Space, or Enter: Next
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      goToNext();
      return;
    }

    // Question answers shortcuts
    if (!activeList.length) return;
    const qIndex = activeList[activePointer];
    const q = rawQuestions[qIndex];
    if (!q || sessionData.answers[q.id]) return;

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

})();
