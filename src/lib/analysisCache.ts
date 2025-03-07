// 전역 캐시 시스템 - Next.js 서버 컴포넌트 간에 상태 공유
// 실제 프로덕션에서는 Redis, DynamoDB 또는 다른 영구 저장소로 교체해야 합니다.

export type AnalysisStage = 'preparing' | 'fetching' | 'analyzing' | 'finalizing';

export interface AnalysisProgress {
  progress: number;
  stage: AnalysisStage;
  completed: boolean;
  error?: { message: string };
  result?: any;
  message?: string;
  lastUpdated: number;
}

// 전역 캐시 타입 (Next.js 서버 컴포넌트 간 공유)
// 글로벌 스코프에 전역 변수 선언
declare global {
  var __analysisCache: Record<string, AnalysisProgress>;
}

// 전역 캐시 초기화 (존재하지 않는 경우)
if (!global.__analysisCache) {
  global.__analysisCache = {};
}

// 캐시 접근 함수들
export const analysisCache = {
  // 분석 상태 저장
  set(key: string, progress: Partial<AnalysisProgress>): void {
    const currentData = global.__analysisCache[key] || {
      progress: 0,
      stage: 'preparing' as AnalysisStage,
      completed: false,
      lastUpdated: Date.now()
    };
    
    global.__analysisCache[key] = {
      ...currentData,
      ...progress,
      lastUpdated: Date.now()
    };
    
    console.log(`[캐시 업데이트] ${key} - 상태: ${progress.stage || currentData.stage} (${progress.progress || currentData.progress}%)`);
    if (progress.completed) {
      console.log(`[캐시 완료] ${key} - 결과 존재: ${!!progress.result}`);
    }
  },
  
  // 분석 상태 조회
  get(key: string): AnalysisProgress | null {
    const data = global.__analysisCache[key];
    return data || null;
  },
  
  // 모든 분석 상태 조회
  getAll(): Record<string, AnalysisProgress> {
    return { ...global.__analysisCache };
  },
  
  // 분석 상태 삭제
  delete(key: string): void {
    delete global.__analysisCache[key];
  },
  
  // 오래된 분석 상태 정리 (1시간 이상 지난 항목)
  cleanup(): void {
    const now = Date.now();
    const ONE_HOUR = 3600000;
    
    Object.keys(global.__analysisCache).forEach(key => {
      const data = global.__analysisCache[key];
      if (now - data.lastUpdated > ONE_HOUR) {
        delete global.__analysisCache[key];
      }
    });
  }
};

// 주기적으로 캐시 정리 (서버 환경에서만)
if (typeof window === 'undefined') {
  setInterval(() => {
    analysisCache.cleanup();
  }, 1800000); // 30분마다 정리
}

export default analysisCache; 