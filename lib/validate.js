/* ==============================================================================
   입력값 및 AI 응답 검증 모듈
   docs/04-api-spec.md 제4항 검증 규칙 준수
   ============================================================================== */

/**
 * 사용자 요청 본문 검증 함수
 * @param {any} body 요청 본문
 * @returns {{ valid: boolean, code?: string, text?: string }}
 */
export function validateRequestBody(body) {
  if (!body || typeof body !== 'object' || typeof body.text !== 'string') {
    return { valid: false, code: 'INVALID_REQUEST' };
  }

  const trimmedText = body.text.trim();

  if (trimmedText.length === 0) {
    return { valid: false, code: 'EMPTY_INPUT' };
  }

  if (trimmedText.length > 500) {
    return { valid: false, code: 'INPUT_TOO_LONG' };
  }

  return { valid: true, text: trimmedText };
}

/**
 * OpenAI의 응답 검증 및 보정 함수
 * @param {string} rawContent OpenAI가 반환한 텍스트 응답
 * @returns {{ valid: boolean, data?: { sentiment: string, confidence: number, reason: string } }}
 */
export function validateAiResponse(rawContent) {
  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    return { valid: false };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false };
  }

  const { sentiment, confidence, reason } = parsed;

  // 1. sentiment 검증 ('positive', 'negative', 'neutral' 3가지만 허용)
  const validSentiments = ['positive', 'negative', 'neutral'];
  if (!validSentiments.includes(sentiment)) {
    return { valid: false };
  }

  // 2. confidence 검증 (0 이상 100 이하의 숫자)
  if (typeof confidence !== 'number' || isNaN(confidence) || confidence < 0 || confidence > 100) {
    return { valid: false };
  }
  // 보정 규칙: 소수점인 경우 반올림하여 정수로 변환
  const roundedConfidence = Math.round(confidence);

  // 3. reason 검증 (비어 있지 않은 문자열)
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return { valid: false };
  }
  let adjustedReason = reason.trim();
  // 보정 규칙: 120자 초과 시 119자까지 자르고 말줄임표(…) 추가
  if (adjustedReason.length > 120) {
    adjustedReason = adjustedReason.slice(0, 119) + '…';
  }

  return {
    valid: true,
    data: {
      sentiment,
      confidence: roundedConfidence,
      reason: adjustedReason
    }
  };
}

