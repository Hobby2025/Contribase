import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { analysisProgressCache, logCacheState } from '@/lib/cache';

// 캐시 상태 디버깅용 함수
// function logCacheState(repo: string) { ... }

// 개발 환경 더미 데이터 제거

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
    
    console.log('진행 상태 조회 요청:', repo);
    console.log('요청 URL:', request.url);
    console.log('query 파라미터:', Object.fromEntries(searchParams.entries()));
    
    // 전체 캐시 키 확인
    const cachedKeys = Object.keys(analysisProgressCache);
    console.log('현재 캐시에 저장된 키:', cachedKeys);
    
    // 진행 상태 확인 (정확한 키 검색)
    let progressData = analysisProgressCache[repo];
    
    // owner/repo 형식 검출을 위한 정규식
    const repoPattern = /^([^/]+)\/([^/]+)$/;
    const match = repo.match(repoPattern);
    
    if (!progressData && match) {
      // owner와 repo 추출
      const [, owner, repoName] = match;
      console.log(`${owner}/${repoName} 형식의 키로 검색 중...`);
      
      // 캐시에서 재검색
      progressData = analysisProgressCache[`${owner}/${repoName}`];
    }
    
    console.log('캐시 데이터 존재?:', !!progressData);
    
    // 진행 상태 캐시가 없는 경우 빈 결과 반환
    if (!progressData) {
      console.log(`${repo}에 대한 진행 상태 데이터가 없습니다.`);
      return NextResponse.json({ exists: false });
    }
    
    // 진행 상태 반환
    const responseData = {
      ...progressData,
      // error 필드가 있으면 일관된 형식으로 확인
      error: progressData.error 
        ? (typeof progressData.error === 'object' && progressData.error !== null
            ? progressData.error
            : { message: String(progressData.error) })
        : undefined
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('진행 상태 조회 오류:', error);
    
    // 오류 메시지 표준화
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
        ? error
        : '알 수 없는 오류가 발생했습니다';
    
    return NextResponse.json(
      { error: { message: errorMessage } },
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
      message: body.message,
      lastUpdated: Date.now()
    };
    
    console.log(`${repo}의 분석 진행 상태가 업데이트되었습니다.`);
    console.log(`진행률: ${progress}%, 단계: ${stage}, 완료: ${completed}`);
    
    if (completed) {
      console.log(`분석 결과 캐시에 저장 완료: ${repo}`);
      console.log(`캐시 상태 (completed): ${analysisProgressCache[repo].completed}`);
      console.log(`캐시 결과 유무: ${!!analysisProgressCache[repo].result}`);
      
      // 캐시 상태 로깅
      logCacheState(repo);
    }
    
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