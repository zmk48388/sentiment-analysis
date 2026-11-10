/* ==============================================================================
   감성 분석 서버리스 API 엔드포인트: POST /api/analyze
   docs/04-api-spec.md 제5항 처리 순서 준수
   ============================================================================== */

import { validateRequestBody, validateAiResponse } from '../lib/validate.js';
import { analyzeSentimentWithOpenAI } from '../lib/openai-client.js';
import { saveAnalysis } from '../lib/supabase-client.js';
import { createErrorResponse } from '../lib/errors.js';

export default async function handler(req, res) {
  // 1. 요청 메서드 검사 (POST만 허용)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    const err = createErrorResponse('METHOD_NOT_ALLOWED');
    return res.status(err.status).json(err.body);
  }

  try {
    // 2. 요청 본문 파싱 및 유효성 검사 (JSON 객체, 글자 수 1~500자)
    const validation = validateRequestBody(req.body);
    if (!validation.valid) {
      const err = createErrorResponse(validation.code || 'INVALID_REQUEST');
      return res.status(err.status).json(err.body);
    }

    const textToAnalyze = validation.text;

    // 필수 환경변수 존재 여부 사전 점검
    if (!process.env.OPENAI_API_KEY) {
      console.error('환경변수 누락: OPENAI_API_KEY');
      const err = createErrorResponse('INTERNAL_ERROR');
      return res.status(err.status).json(err.body);
    }
    if (!process.env.OPENAI_MODEL) {
      console.error('환경변수 누락: OPENAI_MODEL');
      const err = createErrorResponse('INTERNAL_ERROR');
      return res.status(err.status).json(err.body);
    }

    // 3. OpenAI 감성 분석 호출 (20초 타임아웃, JSON 스키마 강제)
    let rawAiResponse;
    try {
      rawAiResponse = await analyzeSentimentWithOpenAI(textToAnalyze);
    } catch (openaiErr) {
      console.error('OpenAI 호출 단계 오류:', openaiErr.code || openaiErr.message);
      const err = createErrorResponse(openaiErr.code || 'OPENAI_ERROR');
      return res.status(err.status).json(err.body);
    }

    // 4. AI 응답 무결성 검증 및 보정
    const aiValidation = validateAiResponse(rawAiResponse);
    if (!aiValidation.valid) {
      console.error('OpenAI 응답 형식 검증 실패');
      const err = createErrorResponse('INVALID_AI_RESPONSE');
      return res.status(err.status).json(err.body);
    }

    const { sentiment, confidence, reason } = aiValidation.data;

    // 5. Supabase 분석 기록 비동기 저장 (저장 실패해도 사용자에게는 정상 결과 제공)
    let saved = false;
    try {
      saved = await saveAnalysis({
        inputText: textToAnalyze,
        sentiment,
        confidence,
        reason,
        model: process.env.OPENAI_MODEL
      });
    } catch (dbErr) {
      console.error('Supabase 저장 단계 오류:', dbErr.message || dbErr);
      saved = false;
    }

    // 6. 정상 응답 반환 (HTTP 200)
    return res.status(200).json({
      sentiment,
      confidence,
      reason,
      saved
    });
  } catch (unexpectedError) {
    console.error('서버 예외 발생:', unexpectedError.message || unexpectedError);
    const err = createErrorResponse('INTERNAL_ERROR');
    return res.status(err.status).json(err.body);
  }
}

