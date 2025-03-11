import { NextRequest, NextResponse } from 'next/server';
import { analyzeCodeChanges } from '@/lib/modelUtils';
import { MODEL_CONFIG } from '@/utils/config';

/**
 * POST /api/analyze/code
 * 
 * 코드 변경 내용을 분석하는 API 엔드포인트입니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codeChanges } = body;

    // 입력 검증
    if (!Array.isArray(codeChanges)) {
      return NextResponse.json(
        { error: '유효한 codeChanges 배열이 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 분석할 코드 변경 수 제한
    const limitedChanges = codeChanges.slice(0, MODEL_CONFIG.MAX_BATCH_SIZE);
    
    // 분석 수행
    const result = await analyzeCodeChanges(limitedChanges);
    
    // 결과 반환
    return NextResponse.json(result);
  } catch (error) {
    console.error('코드 분석 API 오류:', error);
    
    return NextResponse.json(
      { 
        error: '코드 분석 중 서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 