/**
 * 분석 진행 상태를 위한 캐시 모듈
 * 서버 메모리에 저장되는 간단한 캐시 구현
 * 실제 프로덕션에서는 Redis나 다른 상태 저장소를 사용하는 것이 좋습니다.
 */

// 타입 정의
type AnalysisProgressCacheType = Record<string, {
  progress: number;
  stage: 'preparing' | 'fetching' | 'analyzing' | 'finalizing';
  completed: boolean;
  error?: { message: string };
  result?: any;
  message?: string;
  lastUpdated: number;
}>;

// globalThis에 타입 확장
declare global {
  var __ANALYSIS_PROGRESS_CACHE__: AnalysisProgressCacheType;
}

// 글로벌 변수로 선언하여 모든 서버 인스턴스에서 접근 가능하게 함
// Next.js는 개발 환경에서 API 라우트마다 모듈을 다시 로드할 수 있으므로
// globalThis를 사용하여 전역 상태 보존
const GLOBAL_CACHE_KEY = '__ANALYSIS_PROGRESS_CACHE__';

if (!global[GLOBAL_CACHE_KEY]) {
  global[GLOBAL_CACHE_KEY] = {};
}

// 분석 진행 상태 캐시
export const analysisProgressCache: AnalysisProgressCacheType = global[GLOBAL_CACHE_KEY];

// 캐시 상태 디버깅용 함수
export function logCacheState(repo: string) {
  console.log(`캐시 상태 확인 (${repo}):`, {
    exists: !!analysisProgressCache[repo],
    completed: analysisProgressCache[repo]?.completed,
    hasResult: !!analysisProgressCache[repo]?.result,
    keys: analysisProgressCache[repo] ? Object.keys(analysisProgressCache[repo]) : [],
    allKeys: Object.keys(analysisProgressCache)
  });
}

// 진행 상태 업데이트 함수
export function updateAnalysisProgress(
  owner: string,
  repo: string,
  progress: number,
  stage: 'preparing' | 'fetching' | 'analyzing' | 'finalizing',
  completed: boolean = false,
  error?: { message: string },
  result?: any,
  message?: string
) {
  console.log(`[분석 진행 상황] ${owner}/${repo} - ${stage} (${progress}%)`);
  
  try {
    // 기본 메시지 생성
    let statusMessage = message;
    if (!statusMessage) {
      if (stage === 'preparing') {
        statusMessage = '분석을 준비하는 중입니다...';
      } else if (stage === 'fetching') {
        statusMessage = 'GitHub에서 저장소 데이터를 가져오는 중입니다...';
      } else if (stage === 'analyzing') {
        statusMessage = `GPT-4 Mini로 코드를 분석하는 중입니다... (${progress}% 완료)`;
      } else if (stage === 'finalizing') {
        statusMessage = '분석 결과를 생성하는 중입니다. 곧 완료됩니다...';
      }
    }
    
    // 캐시에 저장
    const repoKey = `${owner}/${repo}`;
    try {
      analysisProgressCache[repoKey] = {
        progress,
        stage,
        completed,
        error,
        result,
        message: statusMessage,
        lastUpdated: Date.now()
      };
      
      // 디버깅: 캐시 업데이트 시 현재 상태 로깅
      console.log(`캐시 업데이트 완료 [${repoKey}], 현재 캐시 키:`, Object.keys(analysisProgressCache));
    } catch (cacheErr) {
      console.error('캐시 업데이트 오류:', cacheErr);
    }
    
    if (completed) {
      console.log(`[분석 완료] ${owner}/${repo}`);
    }
    
    if (error) {
      console.error(`[분석 오류] ${owner}/${repo} - ${error.message}`);
    }
  } catch (err) {
    console.error('진행 상황 업데이트 오류:', err);
  }
} 