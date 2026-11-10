/* ==============================================================================
   서버 오류 정의 모듈
   docs/04-api-spec.md 표 6에 정의된 오류 코드와 HTTP 상태 코드 매핑
   ============================================================================== */

export const ERRORS = {
  METHOD_NOT_ALLOWED: {
    status: 405,
    message: '잘못된 접근이에요. 페이지를 새로고침한 뒤 다시 시도해 주세요.'
  },
  INVALID_REQUEST: {
    status: 400,
    message: '요청 형식이 올바르지 않아요. 페이지를 새로고침한 뒤 다시 시도해 주세요.'
  },
  EMPTY_INPUT: {
    status: 400,
    message: '분석할 문장을 입력해 주세요.'
  },
  INPUT_TOO_LONG: {
    status: 400,
    message: '500자 이하로 입력해 주세요.'
  },
  RATE_LIMITED: {
    status: 429,
    message: '요청이 많아요. 잠시 후 다시 시도해 주세요.'
  },
  OPENAI_TIMEOUT: {
    status: 504,
    message: '분석이 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.'
  },
  OPENAI_ERROR: {
    status: 502,
    message: 'AI 분석 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
  },
  INVALID_AI_RESPONSE: {
    status: 502,
    message: '분석 결과를 이해하지 못했어요. 다시 시도해 주세요.'
  },
  INTERNAL_ERROR: {
    status: 500,
    message: '알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
  }
};

/**
 * 에러 응답 객체 생성 도우미 함수
 */
export function createErrorResponse(code) {
  const err = ERRORS[code] || ERRORS.INTERNAL_ERROR;
  return {
    status: err.status,
    body: {
      error: {
        code: ERRORS[code] ? code : 'INTERNAL_ERROR',
        message: err.message
      }
    }
  };
}

