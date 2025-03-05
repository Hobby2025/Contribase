import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// 간단한 인메모리 캐시로 진행 상태를 저장
// 실제 프로덕션에서는 Redis나 다른 상태 저장소를 사용하는 것이 좋습니다
const analysisProgressCache: Record<string, {
  progress: number;
  stage: 'preparing' | 'fetching' | 'analyzing' | 'finalizing';
  completed: boolean;
  error?: { message: string };
  result?: any;
  lastUpdated: number;
}> = {};

/**
 * GET /api/analysis/progress
 * 
 * 분석 진행 상태를 가져오는 API 엔드포인트입니다.
 * 쿼리 파라미터로 repo를 전달해야 합니다.
 */
export async function GET(request: NextRequest) {
  try {
    // URL에서 저장소 이름 가져오기
    const searchParams = request.nextUrl.searchParams;
    const repo = searchParams.get('repo');
    
    if (!repo) {
      return NextResponse.json(
        { error: '저장소 이름이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // 진행 상태 확인
    const progressData = analysisProgressCache[repo];
    
    if (!progressData) {
      // 진행 중인 분석이 없는 경우
      return NextResponse.json({
        progress: 0,
        stage: 'preparing',
        completed: false,
        message: '분석이 아직 시작되지 않았습니다.'
      });
    }
    
    // 캐시 데이터 만료 확인 (1시간)
    const now = Date.now();
    if (now - progressData.lastUpdated > 3600000) {
      // 오래된 데이터 삭제
      delete analysisProgressCache[repo];
      
      return NextResponse.json({
        progress: 0,
        stage: 'preparing',
        completed: false,
        message: '분석 데이터가 만료되었습니다. 다시 시작해주세요.'
      });
    }
    
    // 결과 반환
    return NextResponse.json(progressData);
  } catch (error) {
    console.error('분석 진행 상태 확인 API 오류:', error);
    
    // 오류 응답
    return NextResponse.json(
      { 
        error: '진행 상태 확인 중 서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/analysis/progress
 * 
 * 분석 진행 상태를 업데이트하는 API 엔드포인트입니다.
 * 쿼리 파라미터로 repo를 전달해야 하고, 요청 본문에 progress, stage 등을 포함해야 합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // URL에서 저장소 이름 가져오기
    const searchParams = request.nextUrl.searchParams;
    const repo = searchParams.get('repo');
    
    if (!repo) {
      return NextResponse.json(
        { error: '저장소 이름이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // 요청 본문 파싱
    const body = await request.json();
    const { progress, stage, completed, error, result } = body;
    
    // 진행 상태 업데이트
    analysisProgressCache[repo] = {
      progress: progress ?? 0,
      stage: stage ?? 'preparing',
      completed: completed ?? false,
      error,
      result,
      lastUpdated: Date.now()
    };
    
    // 결과 반환
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('분석 진행 상태 업데이트 API 오류:', error);
    
    // 오류 응답
    return NextResponse.json(
      { 
        error: '진행 상태 업데이트 중 서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 