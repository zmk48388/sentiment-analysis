/* ==============================================================================
   마음결 (Maeum-gyeol) 감성 분석 프론트엔드 제어 스크립트
   docs/03-feature-spec.md 지침을 준수하여 작성되었습니다.
   ============================================================================== */

(() => {
  // ----------------------------------------------------------------------------
  // 1. 오류 코드별 사용자 안내 문구 매핑 (한곳에서 일괄 관리)
  // ----------------------------------------------------------------------------
  const ERROR_MESSAGES = {
    EMPTY_INPUT: '분석할 문장을 입력해 주세요.',
    INPUT_TOO_LONG: '500자 이하로 입력해 주세요.',
    INVALID_REQUEST: '요청 형식이 올바르지 않아요. 페이지를 새로고침한 뒤 다시 시도해 주세요.',
    METHOD_NOT_ALLOWED: '잘못된 접근이에요. 페이지를 새로고침한 뒤 다시 시도해 주세요.',
    RATE_LIMITED: '요청이 많아요. 잠시 후 다시 시도해 주세요.',
    OPENAI_TIMEOUT: '분석이 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.',
    OPENAI_ERROR: 'AI 분석 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    INVALID_AI_RESPONSE: '분석 결과를 이해하지 못했어요. 다시 시도해 주세요.',
    INTERNAL_ERROR: '알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
    NETWORK_ERROR: '네트워크 연결을 확인하고 다시 시도해 주세요.'
  };

  // 감성 영문 코드 -> 한글 표시 매핑
  const SENTIMENT_LABELS = {
    positive: '긍정',
    negative: '부정',
    neutral: '중립'
  };

  // ----------------------------------------------------------------------------
  // 2. DOM 요소 획득 함수
  // ----------------------------------------------------------------------------
  function getElements() {
    return {
      form: document.getElementById('analyze-form'),
      textInput: document.getElementById('text-input'),
      charCount: document.getElementById('char-count'),
      submitBtn: document.getElementById('submit-btn'),
      submitBtnLabel: document.querySelector('#submit-btn .btn-label'),
      resetBtn: document.getElementById('reset-btn'),
      errorBox: document.getElementById('error-box'),
      resultCard: document.getElementById('result-card'),
      resultBadge: document.getElementById('result-badge'),
      resultConfidence: document.getElementById('result-confidence'),
      confidenceFill: document.getElementById('confidence-fill'),
      resultReason: document.getElementById('result-reason'),
      lowConfidenceNote: document.getElementById('low-confidence-note'),
      sampleBtns: document.querySelectorAll('.sample-btn')
    };
  }

  // ----------------------------------------------------------------------------
  // 3. 상태 관리 변수 및 상태 전환 함수 (idle, loading, success, error)
  // ----------------------------------------------------------------------------
  let currentState = 'idle';

  function setState(state, payload = {}) {
    const el = getElements();
    currentState = state;

    switch (state) {
      case 'idle':
        // 대기 상태: 폼 활성화, 결과 및 오류 숨김
        el.textInput.readOnly = false;
        el.submitBtn.disabled = false;
        el.submitBtn.removeAttribute('aria-busy');
        el.submitBtnLabel.textContent = '분석하기';
        el.resetBtn.disabled = false;
        el.errorBox.hidden = true;
        el.errorBox.textContent = '';
        el.resultCard.hidden = true;
        break;

      case 'loading':
        // 분석 중 상태: 입력창/버튼 비활성화, 이전 결과/오류 숨김
        el.textInput.readOnly = true;
        el.submitBtn.disabled = true;
        el.submitBtn.setAttribute('aria-busy', 'true');
        el.submitBtnLabel.textContent = '분석 중...';
        el.resetBtn.disabled = true;
        el.errorBox.hidden = true;
        el.errorBox.textContent = '';
        el.resultCard.hidden = true;
        break;

      case 'success':
        // 분석 성공 상태: 버튼/입력창 재활성화, 결과 카드 표시
        el.textInput.readOnly = false;
        el.submitBtn.disabled = false;
        el.submitBtn.removeAttribute('aria-busy');
        el.submitBtnLabel.textContent = '분석하기';
        el.resetBtn.disabled = false;
        el.errorBox.hidden = true;
        el.errorBox.textContent = '';
        renderResult(payload);
        break;

      case 'error':
        // 오류 상태: 입력창 내용은 유지하면서 오류 안내 박스 표시
        el.textInput.readOnly = false;
        el.submitBtn.disabled = false;
        el.submitBtn.removeAttribute('aria-busy');
        el.submitBtnLabel.textContent = '분석하기';
        el.resetBtn.disabled = false;
        el.resultCard.hidden = true;

        const errorCode = payload.code || 'INTERNAL_ERROR';
        const message = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.INTERNAL_ERROR;
        el.errorBox.textContent = message;
        el.errorBox.hidden = false;
        break;
    }
  }

  // ----------------------------------------------------------------------------
  // 4. 글자 수 표시 갱신 함수 (FR-1)
  // ----------------------------------------------------------------------------
  function updateCharCount() {
    const el = getElements();
    const len = el.textInput.value.length;
    el.charCount.textContent = `${len} / 500`;

    if (len >= 500) {
      el.charCount.className = 'char-count max';
    } else if (len > 450) {
      el.charCount.className = 'char-count warning';
    } else {
      el.charCount.className = 'char-count';
    }
  }

  // ----------------------------------------------------------------------------
  // 5. 브라우저 단 입력값 검증 함수
  // ----------------------------------------------------------------------------
  function validateInput(text) {
    if (!text || text.length === 0) {
      return 'EMPTY_INPUT';
    }
    if (text.length > 500) {
      return 'INPUT_TOO_LONG';
    }
    return null;
  }

  // ----------------------------------------------------------------------------
  // 6. 결과 카드 렌더링 함수 (FR-3, FR-4, FR-5)
  // ----------------------------------------------------------------------------
  function renderResult(data) {
    const el = getElements();
    const { sentiment, confidence, reason } = data;

    // 감성 라벨 및 배지 스타일 적용
    el.resultBadge.textContent = SENTIMENT_LABELS[sentiment] || sentiment;
    el.resultBadge.setAttribute('data-sentiment', sentiment);

    // 신뢰도 숫자 및 시각화 게이지 막대 적용
    el.resultConfidence.textContent = `${confidence}%`;
    el.confidenceFill.style.width = `${confidence}%`;
    el.confidenceFill.setAttribute('data-sentiment', sentiment);

    // 분석 이유 텍스트 설정 (보안을 위해 textContent 사용)
    el.resultReason.textContent = reason;

    // 신뢰도가 60% 미만일 때 안내 문구 노출
    if (confidence < 60) {
      el.lowConfidenceNote.hidden = false;
    } else {
      el.lowConfidenceNote.hidden = true;
    }

    // 결과 카드 노출
    el.resultCard.hidden = false;

    // 사용자의 화면 시야에 들어오도록 부드럽게 스크롤
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.resultCard.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest'
    });
  }

  // ----------------------------------------------------------------------------
  // 7. 백엔드 서버 API 호출 함수 (/api/analyze)
  // ----------------------------------------------------------------------------
  async function requestAnalysis(text) {
    const controller = new AbortController();
    // 브라우저 측 타임아웃 25초 설정 (서버 제한 20초보다 여유를 둠)
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorCode = data && data.error && data.error.code ? data.error.code : 'INTERNAL_ERROR';
        const err = new Error(errorCode);
        err.code = errorCode;
        throw err;
      }

      // 서버 응답 규격 방어적 검증
      const validSentiments = ['positive', 'negative', 'neutral'];
      if (
        !data ||
        !validSentiments.includes(data.sentiment) ||
        typeof data.confidence !== 'number' ||
        data.confidence < 0 ||
        data.confidence > 100 ||
        typeof data.reason !== 'string'
      ) {
        const err = new Error('INVALID_AI_RESPONSE');
        err.code = 'INVALID_AI_RESPONSE';
        throw err;
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('OPENAI_TIMEOUT');
        timeoutErr.code = 'OPENAI_TIMEOUT';
        throw timeoutErr;
      }
      if (err.code) {
        throw err;
      }
      // 네트워크 연결 단절 등
      const networkErr = new Error('NETWORK_ERROR');
      networkErr.code = 'NETWORK_ERROR';
      throw networkErr;
    }
  }

  // ----------------------------------------------------------------------------
  // 8. 폼 제출 처리 핸들러
  // ----------------------------------------------------------------------------
  async function handleSubmit(e) {
    if (e) {
      e.preventDefault();
    }

    if (currentState === 'loading') {
      return;
    }

    const el = getElements();
    const rawText = el.textInput.value.trim();

    // 입력값 유효성 검사
    const validationError = validateInput(rawText);
    if (validationError) {
      setState('error', { code: validationError });
      return;
    }

    setState('loading');

    try {
      const result = await requestAnalysis(rawText);
      setState('success', result);
    } catch (err) {
      setState('error', { code: err.code || 'INTERNAL_ERROR' });
    }
  }

  // ----------------------------------------------------------------------------
  // 9. 초기화 및 이벤트 바인딩
  // ----------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    const el = getElements();

    // 글자 수 실시간 반영
    el.textInput.addEventListener('input', updateCharCount);

    // Ctrl+Enter 또는 Cmd+Enter 단축키로 분석 요청
    el.textInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        el.form.requestSubmit();
      }
    });

    // 폼 제출 이벤트
    el.form.addEventListener('submit', handleSubmit);

    // 예시 문장 클릭 (FR-11)
    el.sampleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        el.textInput.value = btn.dataset.text || '';
        updateCharCount();
        setState('idle');
        el.textInput.focus();
      });
    });

    // 지우기 버튼 (FR-12)
    el.resetBtn.addEventListener('click', () => {
      if (currentState === 'loading') return;
      el.textInput.value = '';
      updateCharCount();
      setState('idle');
      el.textInput.focus();
    });

    // 초기 상태 반영
    updateCharCount();
    setState('idle');
  });
})();
