import { NextResponse } from 'next/server';
import { getModelStatus } from '../../../../lib/modelUtils';

/**
 * GET /api/models/status
 * 
 * 모델 상태를 확인하는 API 엔드포인트입니다.
 * rule-based 모드를 반환합니다.
 */
export async function GET() {
  try {
    // 모델 상태 확인 (항상 rule-based 모드)
    const modelStatus = await getModelStatus();
    
    // 결과 반환
    return NextResponse.json(modelStatus);
  } catch (error) {
    console.error('모델 상태 확인 API 오류:', error);
    
    // 오류 응답
    return NextResponse.json(
      { 
        error: '모델 상태 확인 중 서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 