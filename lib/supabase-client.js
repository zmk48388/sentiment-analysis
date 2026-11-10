/* ==============================================================================
   Supabase 연동 모듈
   docs/05-database.md 제3항 명세 준수
   ============================================================================== */

import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

/**
 * Supabase 클라이언트 싱글톤 인스턴스 획득 함수
 */
function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase 환경변수(SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY)가 누락되었습니다.');
    return null;
  }

  // 서버리스 환경에 맞게 세션 저장 및 자동 갱신 비활성화
  supabaseInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return supabaseInstance;
}

/**
 * 감성 분석 결과를 Supabase 'analyses' 테이블에 비동기 저장하는 함수
 * @param {object} params
 * @param {string} params.inputText 사용자가 입력한 문장
 * @param {string} params.sentiment 감성 분석 결과 ('positive' | 'negative' | 'neutral')
 * @param {number} params.confidence 신뢰도 점수 (0~100)
 * @param {string} params.reason 분석 이유
 * @param {string} params.model 사용된 AI 모델명
 * @returns {Promise<boolean>} 성공 시 true, 실패 시 false
 */
export async function saveAnalysis({ inputText, sentiment, confidence, reason, model }) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('Supabase 클라이언트를 초기화할 수 없습니다.');
      return false;
    }

    // DB 저장은 5초 타임아웃 제한 (사용자가 오래 대기하지 않도록 방어)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase 저장 시간 초과 (5s)')), 5000)
    );

    // 개인정보 보호: 로그에는 입력 문장 전문을 남기지 않고 진행
    const insertPromise = supabase
      .from('analyses')
      .insert({
        input_text: inputText,
        sentiment,
        confidence,
        reason,
        model
      });

    const { error } = await Promise.race([insertPromise, timeoutPromise]);

    if (error) {
      // 보안을 위해 입력 문장은 제외하고 오류 메시지만 간략히 기록
      console.error('Supabase 저장 실패:', error.message || error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Supabase 저장 중 예외 발생:', error.message || error);
    return false;
  }
}

