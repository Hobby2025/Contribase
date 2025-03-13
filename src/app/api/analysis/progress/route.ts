import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analysisProgressCache, logCacheState } from '@/lib/cache';
import { checkUserAnalysisQuota } from '@/lib/userQuota';

// 캐시 상태 디버깅용 함수
// function logCacheState(repo: string) { ... }

// 개발 환경 더미 데이터 제거

/**
 * GET /api/analysis/progress
 * 
 * 분석 진행 상황을 조회하는 API 엔드포인트입니다.
 * 쿼리 파라미터로 repo를 전달해야 합니다.
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }
    
    // URL에서 저장소 이름 가져오기
    const searchParams = request.nextUrl.searchParams;
    const repo = searchParams.get('repo');
    
    if (!repo) {
      return NextResponse.json(
        { error: '저장소 이름이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // 디버깅을 위한 세션 정보 출력
    console.log('-------------------------------------');
    console.log('진행 상태 API 호출됨');
    console.log('세션 정보:', {
      name: session.user?.name,
      email: session.user?.email
    });
    
    console.log('진행 상태 조회 요청:', repo);
    console.log('요청 URL:', request.url);
    console.log('query 파라미터:', { repo });
    console.log('현재 캐시에 저장된 키:', Object.keys(analysisProgressCache).join(', ') || '없음');
    
    // 간략한 로깅을 위한 캐시 상태 요약
    const cacheStatusSummary = Object.keys(analysisProgressCache).map(key => ({
      key,
      completed: analysisProgressCache[key]?.completed,
      progress: analysisProgressCache[key]?.progress,
      hasError: !!analysisProgressCache[key]?.error,
      hasResult: !!analysisProgressCache[key]?.result
    }));
    
    console.log('전체 캐시 상태 요약:', cacheStatusSummary.length ? JSON.stringify(cacheStatusSummary) : '비어 있음');
    
    // 요청한 저장소 키 찾기
    console.log(`${repo} 형식의 키로 검색 중...`);
    
    // 캐시 데이터 확인
    const progressData = analysisProgressCache[repo];
    const exists = !!progressData;
    console.log('캐시 데이터 존재?:', exists);
    
    if (!exists) {
      console.log(`${repo}에 대한 진행 상태 데이터가 없습니다.`);
      
      // 할당량 정보 확인
      const quotaInfo = await checkUserAnalysisQuota(session.user.email || '');
      console.log('할당량 정보:', quotaInfo);
      console.log('-------------------------------------');
      
      return NextResponse.json({
        progress: 0,
        stage: 'not_started',
        message: '아직 분석이 시작되지 않았습니다.',
        quota: quotaInfo
      });
    }
    
    console.log(`${repo}의 진행 상태 데이터:`, {
      progress: progressData.progress,
      stage: progressData.stage,
      completed: progressData.completed,
      hasError: !!progressData.error,
      hasResult: !!progressData.result,
      message: progressData.message || '(메시지 없음)'
    });
    
    // 진행 상태 정보 반환
    const response = {
      ...progressData
    };
    
    // 캐시 만료 처리
    const now = Date.now();
    const CACHE_EXPIRY = 30 * 60 * 1000; // 30분
    
    if (now - progressData.lastUpdated > CACHE_EXPIRY && progressData.completed) {
      console.log(`${repo}의 캐시 데이터가 만료되었습니다. 다음 요청 시 제거됩니다.`);
      response.message = '이 분석 결과는 만료되었습니다. 새로운 분석을 시작하세요.';
    }
    
    console.log('진행 상태 응답 완료');
    console.log('-------------------------------------');
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('진행 상태 API 오류:', error);
    
    // 오류 응답
    return NextResponse.json(
      { 
        error: '진행 상태를 가져오는 중 서버 오류가 발생했습니다.',
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
    // 인증 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }
    
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
    
    console.log(`진행 상태 업데이트 요청: ${repo}`);
    console.log(`진행률: ${progress}%, 단계: ${stage}, 완료: ${completed}`);
    
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
    
    if (completed) {
      console.log(`${repo} 분석 완료 상태로 업데이트됨`);
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