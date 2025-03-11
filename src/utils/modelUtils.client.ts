'use client'

import { ModelStatus } from '@/lib/modelUtils';

/**
 * 클라이언트에서 모델 상태를 가져오는 함수
 */
export async function getModelStatus(): Promise<ModelStatus> {
  try {
    const response = await fetch('/api/models/status');
    if (!response.ok) {
      throw new Error('모델 상태 가져오기 실패');
    }
    return await response.json();
  } catch (error) {
    console.error('모델 상태 확인 오류:', error);
    return {
      mode: 'rule-based',
      modelsAvailable: {
        roberta: false,
        codebert: false
      },
      isLoading: false,
      errors: [{
        code: 'CLIENT_ERROR',
        message: '모델 상태 확인 중 오류가 발생했습니다',
        details: error
      }]
    };
  }
}

/**
 * 클라이언트에서 커밋 메시지 분석 API를 호출하는 함수
 */
export async function analyzeCommitMessages(commitMessages: string[]) {
  try {
    const response = await fetch('/api/analyze/commits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ commitMessages }),
    });

    if (!response.ok) {
      throw new Error('커밋 메시지 분석에 실패했습니다');
    }

    return await response.json();
  } catch (error) {
    console.error('커밋 분석 오류:', error);
    return {
      error: {
        code: 'ANALYSIS_ERROR',
        message: '커밋 분석 중 오류가 발생했습니다',
        details: error
      }
    };
  }
}

/**
 * 클라이언트에서 코드 변경 분석 API를 호출하는 함수
 */
export async function analyzeCodeChanges(codeChanges: string[]) {
  try {
    const response = await fetch('/api/analyze/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ codeChanges }),
    });

    if (!response.ok) {
      throw new Error('코드 변경 분석에 실패했습니다');
    }

    return await response.json();
  } catch (error) {
    console.error('코드 분석 오류:', error);
    return {
      error: {
        code: 'ANALYSIS_ERROR',
        message: '코드 변경 분석 중 오류가 발생했습니다',
        details: error
      }
    };
  }
} 