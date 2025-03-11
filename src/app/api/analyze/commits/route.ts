import { NextRequest, NextResponse } from 'next/server';
import { analyzeCommitMessages } from '@/lib/modelUtils';
import { MODEL_CONFIG } from '@/utils/config';

/**
 * POST /api/analyze/commits
 * 
 * 커밋 메시지를 분석하는 API 엔드포인트입니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commitMessages } = body;

    // 입력 검증
    if (!Array.isArray(commitMessages)) {
      return NextResponse.json(
        { error: '유효한 commitMessages 배열이 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 분석할 커밋 메시지 수 제한
    const limitedMessages = commitMessages.slice(0, MODEL_CONFIG.MAX_BATCH_SIZE);
    
    // 분석 수행
    const result = await analyzeCommitMessages(limitedMessages);
    
    // 결과 반환
    return NextResponse.json(result);
  } catch (error) {
    console.error('커밋 분석 API 오류:', error);
    
    return NextResponse.json(
      { 
        error: '커밋 분석 중 서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 