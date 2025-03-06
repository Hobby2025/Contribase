import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// 간단한 인메모리 캐시로 진행 상태를 저장
// 실제 프로덕션에서는 Redis나 다른 상태 저장소를 사용하는 것이 좋습니다
export const analysisProgressCache: Record<string, {
  progress: number;
  stage: 'preparing' | 'fetching' | 'analyzing' | 'finalizing';
  completed: boolean;
  error?: { message: string };
  result?: any;
  message?: string;
  lastUpdated: number;
}> = {};

// 캐시 상태 디버깅용 함수
function logCacheState(repo: string) {
  console.log(`캐시 상태 확인 (${repo}):`, {
    exists: !!analysisProgressCache[repo],
    completed: analysisProgressCache[repo]?.completed,
    hasResult: !!analysisProgressCache[repo]?.result,
    keys: analysisProgressCache[repo] ? Object.keys(analysisProgressCache[repo]) : []
  });
}

// 테스트용 기본 데이터 생성 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  // 테스트용 더미 데이터 추가
  analysisProgressCache['test/testrepo'] = {
    progress: 75,
    stage: 'analyzing',
    completed: false,
    message: '테스트 저장소 분석 중',
    lastUpdated: Date.now()
  };
  
  console.log('개발 환경 - 테스트 데이터가 캐시에 추가되었습니다.');
}

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
    console.log(`진행 상태 조회 요청: ${repo}`);
    console.log(`캐시 데이터 존재?: ${!!progressData}`);
    
    // 캐시 전체 키 확인
    const cacheKeys = Object.keys(analysisProgressCache);
    if (cacheKeys.length > 0) {
      console.log(`현재 캐시에 있는 저장소: ${cacheKeys.join(', ')}`);
    } else {
      console.log('캐시가 비어 있습니다.');
      
      // 개발 환경에서는 더미 데이터 생성
      if (process.env.NODE_ENV === 'development') {
        analysisProgressCache[repo] = {
          progress: 30,
          stage: 'preparing',
          completed: false,
          message: '테스트 데이터 - 분석 진행 중',
          lastUpdated: Date.now()
        };
        
        console.log(`개발 환경 - ${repo}에 대한 테스트 데이터를 생성했습니다.`);
        return NextResponse.json(analysisProgressCache[repo]);
      }
    }
    
    // 모든 유사한 키 확인
    const similarKeys = cacheKeys.filter(key => 
      key.toLowerCase() === repo.toLowerCase() || 
      key.includes(repo) || 
      repo.includes(key)
    );
    
    if (similarKeys.length > 0 && !progressData) {
      console.log(`정확한 키가 아닌 유사한 키가 있습니다: ${similarKeys.join(', ')}`);
      // 유사한 키가 있으면 첫 번째 것 사용
      const actualKey = similarKeys[0];
      console.log(`${repo} 대신 ${actualKey} 사용`);
      
      // 정확한 키로 캐시 데이터 복사
      analysisProgressCache[repo] = {...analysisProgressCache[actualKey]};
      
      // 업데이트된 캐시 데이터 가져오기
      const updatedData = analysisProgressCache[repo];
      if (updatedData) {
        logCacheState(repo);
        return NextResponse.json(updatedData);
      }
    }
    
    if (!progressData) {
      // 진행 중인 분석이 없는 경우
      console.log(`${repo}에 대한 진행 상태 데이터가 없습니다.`);
      
      // 개발 환경에서는 더미 데이터를 반환
      if (process.env.NODE_ENV === 'development') {
        const dummyData = {
          progress: 10,
          stage: 'preparing' as const,
          completed: false,
          message: '개발 환경 - 테스트 분석 진행 중',
          lastUpdated: Date.now()
        };
        
        // 캐시에 저장
        analysisProgressCache[repo] = dummyData;
        console.log(`개발 환경 - ${repo}에 대한 더미 데이터를 생성했습니다.`);
        
        return NextResponse.json(dummyData);
      }
      
      return NextResponse.json({
        progress: 0,
        stage: 'preparing',
        completed: false,
        message: '분석이 아직 시작되지 않았습니다.'
      });
    }
    
    // 캐시 데이터 만료 확인 (2시간으로 연장)
    const now = Date.now();
    if (now - progressData.lastUpdated > 7200000) {
      // 오래된 데이터 삭제
      delete analysisProgressCache[repo];
      console.log(`${repo}에 대한 캐시 데이터가 만료되었습니다.`);
      
      return NextResponse.json({
        progress: 0,
        stage: 'preparing',
        completed: false,
        message: '분석 데이터가 만료되었습니다. 다시 시작해주세요.'
      });
    }
    
    // 결과가 있으면 로그 출력
    if (progressData.completed) {
      console.log(`${repo}에 대한 분석이 완료되었습니다.`);
      console.log(`결과 데이터 존재?: ${!!progressData.result}`);
      if (progressData.result) {
        console.log('결과 데이터 확인:', Object.keys(progressData.result).join(', '));
        
        // 캐시 상태 로깅
        logCacheState(repo);
      }
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