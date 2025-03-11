// 분석 결과 타입 정의
export interface AnalysisResult {
  // 리포지토리 정보
  repositoryInfo: {
    owner: string;
    repo: string;
    isUserAnalysis: boolean;
    error?: string;
  };
  
  // 개발자 프로필
  developerProfile: {
    totalCommits: number;
    contributors: {
      author: string;
      email: string;
      commits: number;
      percentage: number;
    }[];
    commitCategories: Record<string, number>;
    activityPeriod: string;
    userLanguages?: { language: string; percentage: number }[];
  };
  
  // 기술 스택
  techStack: {
    name: string;
    type: string;
    usage: number;
    confidence: number;
  }[];
  
  // 도메인
  domains: string[];
  
  // 프로젝트 특성
  characteristics: {
    type: string;
    score: number;
    description: string;
  }[];
  
  // 개발 패턴
  developmentPattern: {
    commitFrequency: string;
    developmentCycle: string;
    teamDynamics: string;
    workPatterns: {
      time: string;
      dayOfWeek: string;
      mostActiveDay: string;
      mostActiveHour: number;
    };
  };
  
  // 핵심 기능
  keyFeatures: {
    title: string;
    description: string;
    importance: number;
  }[];
  
  // 개발자 인사이트
  insights: {
    title: string;
    description: string;
  }[];
  
  // 개선 권장사항
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  
  // 프로젝트 요약
  summary: string;
  
  // 코드 품질 (선택적)
  codeQuality?: number;
  
  // 코드 품질 메트릭 (선택적)
  codeQualityMetrics?: {
    readability: number;
    maintainability: number;
    testCoverage: number;
    documentation: number;
    architecture: number;
  };
  
  // 메타데이터
  meta: {
    generatedAt: string;
    version: string;
    error?: string;
  };
} 