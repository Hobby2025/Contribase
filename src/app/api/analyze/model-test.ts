import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeCommitMessages,
  analyzeCodeChanges,
  getModelStatus
} from '@/utils/modelUtils.client';

/**
 * AI 모델 테스트 함수
 * 이 함수는 기본 분석 기능을 테스트합니다.
 */
export async function testModels() {
  console.log('모델 테스트를 시작합니다...');
  
  // 모델 상태 확인
  const modelStatus = await getModelStatus();
  console.log('현재 모델 상태:', modelStatus);
  
  // 규칙 기반 분석 테스트
  // ... existing code ...
}

// 이 모듈이 직접 실행될 경우 테스트 실행
if (typeof window === 'undefined' && require.main === module) {
  testModels().then(() => {
    console.log('테스트 완료');
    process.exit(0);
  }).catch(error => {
    console.error('테스트 실패:', error);
    process.exit(1);
  });
} 