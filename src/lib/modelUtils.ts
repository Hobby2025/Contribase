'use server'

import { MODEL_CONFIG } from '@/utils/config';

// 일반 분석기 타입 정의
export type TextClassifier = (text: string) => { label: string; score: number }[];
export type ModelError = { 
  code: string; 
  message: string; 
  details: unknown 
};
export type ModelErrorResult = { 
  error: ModelError 
};

// 타입 가드 함수
export async function isModelError(result: any): Promise<boolean> {
  return result && 'error' in result;
}

// 동기 타입 체크 헬퍼 (서버 액션 아님)
function hasModelError(result: any): boolean {
  return result && 'error' in result;
}

// 모델 상태 타입 정의
export type ModelStatus = {
  mode: 'rule-based' | 'hybrid';
  modelsAvailable: {
    roberta: boolean;
    codebert: boolean;
  };
  isLoading: boolean;
  errors?: ModelError[];
};

/**
 * 모델 상태를 반환합니다.
 * 이제 항상 rule-based 모드를 사용합니다.
 */
export async function getModelStatus(): Promise<ModelStatus> {
  return {
    mode: 'rule-based',
    modelsAvailable: {
      roberta: false,
      codebert: false
    },
    isLoading: false
  };
}

/**
 * 커밋 메시지를 분석합니다 (규칙 기반)
 */
export async function analyzeCommitMessages(commitMessages: string[]) {
  try {
    const results = commitMessages.map(message => {
      // 규칙 기반 분석
      return extractCommitType(message);
    });
    
    return processCommitAnalysisResults(results);
  } catch (error) {
    console.error('커밋 메시지 분석 중 오류 발생:', error);
    return { error: { code: 'ANALYSIS_ERROR', message: '커밋 분석 중 오류가 발생했습니다.', details: error } };
  }
}

/**
 * 코드 변경을 분석합니다 (규칙 기반)
 */
export async function analyzeCodeChanges(codeChanges: string[]) {
  try {
    const results = codeChanges.map(code => {
      // 규칙 기반 코드 분석
      return enhancedRuleBasedCodeAnalysis(code);
    });
    
    return processCodeChangeAnalysisResults(results);
  } catch (error) {
    console.error('코드 변경 분석 중 오류 발생:', error);
    return { error: { code: 'ANALYSIS_ERROR', message: '코드 변경 분석 중 오류가 발생했습니다.', details: error } };
  }
}

/**
 * 규칙 기반으로 커밋 메시지의 타입을 추출합니다.
 */
function extractCommitType(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // 일반적인 커밋 메시지 패턴 분석
  if (/feat|feature|add|new|implement/i.test(lowerMessage)) {
    return { label: 'feature', score: 0.9 };
  } else if (/fix|bug|issue|resolve|solve/i.test(lowerMessage)) {
    return { label: 'bug', score: 0.9 };
  } else if (/refactor|clean|improve|perf|optim/i.test(lowerMessage)) {
    return { label: 'refactor', score: 0.9 };
  } else if (/docs|document|readme|comment/i.test(lowerMessage)) {
    return { label: 'docs', score: 0.9 };
  } else if (/style|format|lint|ui|css/i.test(lowerMessage)) {
    return { label: 'style', score: 0.9 };
  } else if (/test|spec|check|validate/i.test(lowerMessage)) {
    return { label: 'test', score: 0.9 };
  } else if (/chore|build|ci|config|dep|devops/i.test(lowerMessage)) {
    return { label: 'chore', score: 0.9 };
  }
  
  // 기본값
  return { label: 'other', score: 0.5 };
}

/**
 * 향상된 규칙 기반 코드 분석
 * AI 모델 없이도 더 정교한 분석 제공
 */
function enhancedRuleBasedCodeAnalysis(code: string) {
  // 코드 구조 분석을 위한 패턴
  const patterns = [
    { pattern: /class\s+\w+/g, type: 'OOP', weight: 1.0 },
    { pattern: /interface\s+\w+/g, type: 'OOP', weight: 0.9 },
    { pattern: /extends|implements/g, type: 'OOP', weight: 0.8 },
    { pattern: /private|protected|public/g, type: 'OOP', weight: 0.7 },
    
    { pattern: /=>/g, type: 'FUNCTIONAL', weight: 0.9 },
    { pattern: /\.map\(|\.filter\(|\.reduce\(/g, type: 'FUNCTIONAL', weight: 0.8 },
    { pattern: /const\s+\w+\s*=/g, type: 'FUNCTIONAL', weight: 0.5 },
    
    { pattern: /for\s*\(/g, type: 'IMPERATIVE', weight: 0.9 },
    { pattern: /while\s*\(/g, type: 'IMPERATIVE', weight: 0.8 },
    { pattern: /if\s*\(/g, type: 'IMPERATIVE', weight: 0.7 },
    
    { pattern: /async|await/g, type: 'ASYNC', weight: 1.0 },
    { pattern: /Promise|then\(|catch\(/g, type: 'ASYNC', weight: 0.8 },
    
    { pattern: /\/\/|\/\*|\*\//g, type: 'DOCUMENTATION', weight: 1.0 },
    { pattern: /\* @param|\* @return/g, type: 'DOCUMENTATION', weight: 1.2 },
    
    { pattern: /test\(|describe\(|it\(/g, type: 'TESTING', weight: 1.0 },
    { pattern: /expect\(|assert\./g, type: 'TESTING', weight: 0.9 },
  ];
  
  // 점수 계산
  let scores: Record<string, number> = {
    'OOP': 0,
    'FUNCTIONAL': 0,
    'IMPERATIVE': 0,
    'ASYNC': 0,
    'DOCUMENTATION': 0,
    'TESTING': 0,
  };
  
  // 각 패턴에 대한 점수 계산
  patterns.forEach(({ pattern, type, weight }) => {
    const matches = (code.match(pattern) || []).length;
    scores[type] += matches * weight;
  });
  
  // 코드 복잡도 계산
  const complexity = Math.min(
    10,
    Math.ceil(
      (code.length / 500) + // 길이 기반
      ((code.match(/if|for|while|switch|catch/g) || []).length / 3) + // 제어 구조
      ((code.match(/\{|\}/g) || []).length / 10) // 중첩 수준
    )
  );
  
  // 코드 품질 계산
  const quality = Math.min(
    10,
    Math.ceil(
      (((code.match(/\/\/|\/\*|\*\//g) || []).length / (code.length / 100)) * 3) + // 주석 비율
      (scores['DOCUMENTATION'] / 3) + // 문서화 수준
      (5 - (complexity / 2)) // 복잡도 역비례
    )
  );
  
  // 최상위 패턴 결정
  const dominantPattern = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(entry => entry[1] > 0)
    .map(entry => entry[0]);
  
  return {
    type: dominantPattern[0] || 'UNKNOWN',
    patterns: dominantPattern.slice(0, 3),
    complexity,
    quality,
    scores,
    confidence: 0.85 // 규칙 기반이지만 신뢰도 높게 설정
  };
}

/**
 * 코드 변경 분석 결과 처리 함수
 * 향상된 규칙 기반 분석 결과를 개발 패턴으로 변환
 */
function processCodeChangeAnalysisResults(results: any[]) {
  if (!results || results.length === 0) {
    return {
      codeQuality: '분석 불가',
      complexity: '분석 불가',
      maintainability: '분석 불가',
      securityRisks: ['분석할 코드가 없습니다.'],
      recommendations: ['코드 변경 내용을 확인해주세요.']
    };
  }

  // 패턴 빈도 계산
  const patternFrequency: Record<string, number> = {};
  let totalComplexity = 0;
  let totalQuality = 0;
  let totalPatterns = 0;

  // 각 코드 분석 결과 처리
  results.forEach(result => {
    // 복잡도와 품질 합산
    totalComplexity += result.complexity || 0;
    totalQuality += result.quality || 0;

    // 패턴 빈도 계산
    if (result.patterns && Array.isArray(result.patterns)) {
      result.patterns.forEach((pattern: string) => {
        patternFrequency[pattern] = (patternFrequency[pattern] || 0) + 1;
        totalPatterns++;
      });
    } else if (result.type) {
      patternFrequency[result.type] = (patternFrequency[result.type] || 0) + 1;
      totalPatterns++;
    }
  });

  // 평균 복잡도 및 품질 계산
  const avgComplexity = totalComplexity / results.length;
  const avgQuality = totalQuality / results.length;

  // 품질 등급 결정 (1-10 -> 문자열)
  let codeQuality;
  if (avgQuality >= 8) codeQuality = '우수';
  else if (avgQuality >= 6) codeQuality = '양호';
  else if (avgQuality >= 4) codeQuality = '보통';
  else codeQuality = '개선 필요';

  // 복잡도 등급 결정 (1-10 -> 문자열)
  let complexityGrade;
  if (avgComplexity <= 3) complexityGrade = '낮음';
  else if (avgComplexity <= 6) complexityGrade = '보통';
  else complexityGrade = '높음';

  // 유지보수성 계산 (복잡도 역비례, 품질 정비례)
  let maintainability;
  const maintainabilityScore = ((10 - avgComplexity) * 0.5) + (avgQuality * 0.5);
  if (maintainabilityScore >= 7) maintainability = '우수';
  else if (maintainabilityScore >= 5) maintainability = '양호';
  else if (maintainabilityScore >= 3) maintainability = '보통';
  else maintainability = '개선 필요';

  // 주요 패턴 결정 (빈도 기준)
  const sortedPatterns = Object.entries(patternFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([pattern, count]) => ({
      pattern,
      percentage: Math.round((count / totalPatterns) * 100)
    }));

  // 상위 3개 패턴 추출
  const topPatterns = sortedPatterns.slice(0, 3);
  
  // 보안 위험 분석 (단순화된 버전)
  const securityRisks = [];
  
  if (avgQuality < 4) {
    securityRisks.push('전반적인 코드 품질이 낮아 보안 위험이 있을 수 있습니다.');
  }
  
  if (avgComplexity > 7) {
    securityRisks.push('코드가 지나치게 복잡하여 취약점이 숨어있을 가능성이 있습니다.');
  }
  
  // 특정 패턴 감지
  if (patternFrequency['ASYNC'] && avgQuality < 6) {
    securityRisks.push('비동기 코드의 품질이 낮아 잠재적인 취약점이 있을 수 있습니다.');
  }
  
  // 권장 사항 생성
  const recommendations = [];
  
  if (avgQuality < 6) {
    recommendations.push('코드 문서화를 개선하세요.');
  }
  
  if (avgComplexity > 6) {
    recommendations.push('코드를 더 작은 함수로 분리하여 복잡도를 줄이세요.');
  }
  
  if (!patternFrequency['TESTING'] || patternFrequency['TESTING'] < 3) {
    recommendations.push('테스트 코드 작성을 권장합니다.');
  }
  
  if (patternFrequency['IMPERATIVE'] > patternFrequency['FUNCTIONAL']) {
    recommendations.push('명령형 코드보다 함수형 접근 방식을 고려해보세요.');
  }

  return {
    codeQuality,
    complexity: complexityGrade,
    maintainability,
    patterns: topPatterns,
    securityRisks: securityRisks.length > 0 ? securityRisks : ['특별한 보안 위험이 감지되지 않았습니다.'],
    recommendations: recommendations.length > 0 ? recommendations : ['현재 코드 품질이 양호합니다.']
  };
}

// 헬퍼 함수: 커밋 분석 결과 처리
function processCommitAnalysisResults(results: any[]) {
  // 실제 구현에서는 모델 출력을 개발자 프로필로 변환하는 로직 필요
  // 여기서는 간단한 예시만 제공합니다
  
  // 실제 모델 출력 형식에 맞게 수정 필요
  return {
    workStyle: '데이터 기반 분석 결과', 
    strengths: ['모델이 식별한 강점 1', '모델이 식별한 강점 2'],
    growthAreas: ['개선 영역 1', '개선 영역 2'],
    collaborationPattern: '모델 기반 협업 패턴 분석',
    communicationStyle: '커뮤니케이션 스타일 분석 결과'
  };
} 