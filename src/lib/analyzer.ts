'use client'

import { getRepositoryCommits, getRepositoryLanguages } from './github';

// 분석 결과 타입 정의
export interface AnalysisResult {
  techStack: {
    name: string;
    percentage: number;
  }[];
  contributions: {
    category: string;
    percentage: number;
  }[];
  keyFeatures: {
    title: string;
    description: string;
    importance: number;
  }[];
  projectCharacteristics: {
    type: string;
    score: number;
    description: string;
  }[];
  summary: string;
  codeQuality: number;
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  developerInsights: {
    title: string;
    description: string;
  }[];
}

// 커밋 카테고리 상수
const COMMIT_CATEGORIES = {
  FEATURE: '기능 추가',
  FIX: '버그 수정',
  REFACTOR: '리팩토링',
  DOCS: '문서화',
  STYLE: '스타일',
  TEST: '테스트',
  CHORE: '기타',
};

// 동적 임포트를 사용하여 ModelLoader 로드 (클라이언트에서만 사용)
// 성능 및 에러 방지를 위해 ModelLoader 사용 안함
// let ModelLoader: any = null;

// // 클라이언트 측에서만 실행되도록 처리
// if (typeof window !== 'undefined') {
//   // 모듈 로드를 즉시 실행 함수로 감싸서 비동기 임포트 처리
//   (async () => {
//     try {
//       // 동적으로 모듈 로드
//       const module = await import('./modelLoader');
//       ModelLoader = module.default;
//     } catch (error) {
//       console.error('ModelLoader 로드 중 오류:', error);
//     }
//   })();
// }

// 커밋 메시지 분석 함수
export async function analyzeCommitMessage(message: string): Promise<string> {
  // 클라이언트에서만 작동하도록 조건부 처리
  if (typeof window === 'undefined') {
    return COMMIT_CATEGORIES.CHORE; // 서버에서는 기본값 반환
  }

  try {
    // ModelLoader 사용하지 않고 패턴 기반으로 분류
    // 간단한 규칙 기반 분류로 변경
    const lowerMessage = message.toLowerCase();
    
    if (/feat:|feature:|add:|new:/i.test(lowerMessage)) {
      return COMMIT_CATEGORIES.FEATURE;
    } else if (/fix:|bug:|resolve:/i.test(lowerMessage)) {
      return COMMIT_CATEGORIES.FIX;
    } else if (/refactor:|clean:|improve:|perf:/i.test(lowerMessage)) {
      return COMMIT_CATEGORIES.REFACTOR;
    } else if (/docs:|document:|readme:/i.test(lowerMessage)) {
      return COMMIT_CATEGORIES.DOCS;
    } else if (/style:|css:|format:|ui:/i.test(lowerMessage)) {
      return COMMIT_CATEGORIES.STYLE;
    } else if (/test:|spec|check|validator/i.test(lowerMessage)) {
      return COMMIT_CATEGORIES.TEST;
    }
    
    // TODO: 모델 기반 분석 구현 (가중치 적용된 실제 결과 사용)
    // 지금은 규칙 기반으로만 구현했지만, 실제로는 모델을 통해 분류
    
    return COMMIT_CATEGORIES.CHORE;
  } catch (error) {
    console.error('커밋 메시지 분석 오류:', error);
    return COMMIT_CATEGORIES.CHORE;
  }
}

// 언어 데이터에서 프로젝트 도메인 추론
function inferDomainFromLanguages(languages: Record<string, number>): string[] {
  const domains = [];
  const totalBytes = Object.values(languages).reduce((acc, val) => acc + val, 0);
  
  const languagePercentages: Record<string, number> = {};
  
  Object.entries(languages).forEach(([lang, bytes]) => {
    languagePercentages[lang] = (bytes / totalBytes) * 100;
  });
  
  // 웹 개발 관련 언어
  const webLanguages = ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'PHP'];
  const hasWeb = webLanguages.some(lang => languagePercentages[lang] >= 10);
  
  // 데이터 사이언스/ML 관련 언어
  const dataLanguages = ['Python', 'R', 'Jupyter Notebook'];
  const hasDataScience = dataLanguages.some(lang => languagePercentages[lang] >= 20);
  
  // 모바일 개발 관련 언어
  const mobileLanguages = ['Kotlin', 'Swift', 'Dart', 'Java', 'Objective-C'];
  const hasMobile = mobileLanguages.some(lang => languagePercentages[lang] >= 15);
  
  // 백엔드 개발 관련 언어
  const backendLanguages = ['Java', 'C#', 'Go', 'Ruby', 'PHP', 'Python', 'C++'];
  const hasBackend = backendLanguages.some(lang => languagePercentages[lang] >= 15);

  // 시스템 프로그래밍 관련 언어
  const systemLanguages = ['C', 'C++', 'Rust', 'Go'];
  const hasSystemProgramming = systemLanguages.some(lang => languagePercentages[lang] >= 20);

  // 게임 개발 관련 언어
  const gameLanguages = ['C#', 'C++', 'JavaScript'];
  const hasGameDev = gameLanguages.some(lang => languagePercentages[lang] >= 30) && 
                     (languagePercentages['Unity'] > 0 || languagePercentages['UnrealEngine'] > 0);

  // 추론된 도메인 추가
  if (hasWeb) {
    domains.push('웹 개발');
    
    // 프론트엔드 vs 풀스택 추론
    if (languagePercentages['JavaScript'] > 30 || languagePercentages['TypeScript'] > 30) {
      domains.push('프론트엔드');
      
      // 특정 프레임워크 추론
      if (languagePercentages['TypeScript'] > 25) {
        domains.push('React/Angular');
      } else if (languagePercentages['JavaScript'] > 25 && languagePercentages['HTML'] > 15) {
        domains.push('Vue/React');
      }
    }
  }
  
  if (hasDataScience) {
    domains.push('데이터 사이언스');
    
    // 머신러닝인지 확인
    if (languagePercentages['Python'] > 40) {
      domains.push('머신러닝');
      if (languagePercentages['Jupyter Notebook'] > 15) {
        domains.push('데이터 분석');
      }
    }
  }
  
  if (hasMobile) {
    domains.push('모바일 개발');
    
    // Android vs iOS
    if (languagePercentages['Kotlin'] > 20 || languagePercentages['Java'] > 20) {
      domains.push('Android');
    }
    if (languagePercentages['Swift'] > 20) {
      domains.push('iOS');
    }
    if (languagePercentages['Dart'] > 20) {
      domains.push('Flutter 크로스 플랫폼');
    }
  }
  
  if (hasBackend) {
    domains.push('백엔드');
    
    // 특정 백엔드 기술 파악
    if (languagePercentages['Java'] > 30) {
      domains.push('Spring 기반');
    } else if (languagePercentages['C#'] > 30) {
      domains.push('.NET 기반');
    } else if (languagePercentages['Python'] > 30) {
      domains.push('Django/Flask 기반');
    } else if (languagePercentages['PHP'] > 30) {
      domains.push('Laravel/PHP 기반');
    } else if (languagePercentages['JavaScript'] > 20 && languagePercentages['TypeScript'] > 10) {
      domains.push('Node.js 기반');
    }
  }

  if (hasSystemProgramming) {
    domains.push('시스템 프로그래밍');
    if (languagePercentages['Rust'] > 25) {
      domains.push('메모리 안전성 중심');
    }
  }

  if (hasGameDev) {
    domains.push('게임 개발');
  }
  
  // 도메인이 추론되지 않은 경우 일반적인 값 제공
  if (domains.length === 0) {
    domains.push('소프트웨어 개발');
  }
  
  return domains;
}

// 커밋 패턴에서 프로젝트 특성 분석
function analyzeProjectCharacteristics(commits: any[], categories: Record<string, number>): {
  type: string;
  score: number;
  description: string;
}[] {
  const totalCommits = commits.length;
  const characteristics = [];
  
  // 커밋 빈도 분석
  const commitDates = commits.map(commit => new Date(commit.commit.author.date));
  const oldestCommit = new Date(Math.min(...commitDates.map(date => date.getTime())));
  const newestCommit = new Date(Math.max(...commitDates.map(date => date.getTime())));
  
  const daysDiff = Math.max(1, Math.floor((newestCommit.getTime() - oldestCommit.getTime()) / (1000 * 3600 * 24)));
  const commitsPerDay = totalCommits / daysDiff;
  
  // 개발 활발성 점수
  const activityScore = Math.min(100, Math.round(commitsPerDay * 20));
  characteristics.push({
    type: '개발 활발성',
    score: activityScore,
    description: activityScore > 70 
      ? '매우 활발한 개발 활동이 이루어지고 있습니다.' 
      : activityScore > 40 
        ? '꾸준한 개발 활동이 이루어지고 있습니다.' 
        : '간헐적인 개발 활동이 이루어지고 있습니다.'
  });
  
  // 버그 수정 대 기능 개발 비율
  const bugFixPercentage = (categories[COMMIT_CATEGORIES.FIX] || 0) / totalCommits * 100;
  const featurePercentage = (categories[COMMIT_CATEGORIES.FEATURE] || 0) / totalCommits * 100;
  
  // 안정성 점수
  const stabilityScore = Math.min(100, Math.max(0, 100 - Math.round(bugFixPercentage * 1.5)));
  characteristics.push({
    type: '코드 안정성',
    score: stabilityScore,
    description: stabilityScore > 75 
      ? '안정적인 코드베이스를 가지고 있습니다.' 
      : stabilityScore > 50 
        ? '대체로 안정적이나 버그 수정이 주기적으로 필요한 코드베이스입니다.' 
        : '불안정한 코드베이스로, 버그 수정 비율이 높습니다.'
  });
  
  // 리팩토링 점수
  const refactorPercentage = (categories[COMMIT_CATEGORIES.REFACTOR] || 0) / totalCommits * 100;
  const refactoringScore = Math.min(100, Math.round(refactorPercentage * 3));
  characteristics.push({
    type: '코드 유지보수',
    score: refactoringScore,
    description: refactoringScore > 60 
      ? '높은 수준의 코드 유지보수가 이루어지고 있으며, 기술 부채 관리가 우수합니다.' 
      : refactoringScore > 30 
        ? '적절한 수준의 코드 유지보수가 이루어지고 있습니다.' 
        : '코드 유지보수와 리팩토링이 부족한 상태입니다.'
  });
  
  // 문서화 점수
  const docsPercentage = (categories[COMMIT_CATEGORIES.DOCS] || 0) / totalCommits * 100;
  const documentationScore = Math.min(100, Math.round(docsPercentage * 5));
  characteristics.push({
    type: '문서화 수준',
    score: documentationScore,
    description: documentationScore > 60 
      ? '우수한 문서화가 이루어지고 있습니다.' 
      : documentationScore > 30 
        ? '기본적인 문서화가 이루어지고 있습니다.' 
        : '문서화가 부족한 상태입니다.'
  });

  // 테스트 점수
  const testPercentage = (categories[COMMIT_CATEGORIES.TEST] || 0) / totalCommits * 100;
  const testingScore = Math.min(100, Math.round(testPercentage * 5));
  characteristics.push({
    type: '테스트 커버리지',
    score: testingScore,
    description: testingScore > 60 
      ? '높은 수준의 테스트가 이루어지고 있습니다.' 
      : testingScore > 30 
        ? '적절한 수준의 테스트가 이루어지고 있습니다.' 
        : '테스트가 부족한 상태입니다.'
  });
  
  return characteristics;
}

// 커밋 패턴 분석을 통한 개발자 인사이트 추출
function extractDeveloperInsights(commits: any[], techStack: any[], domains: string[]): {
  title: string;
  description: string;
}[] {
  const insights = [];
  
  // 커밋 메시지 길이 분석
  const commitMessages = commits.map(commit => commit.commit.message);
  const avgMessageLength = commitMessages.reduce((acc, msg) => acc + msg.length, 0) / commitMessages.length;
  
  if (avgMessageLength > 100) {
    insights.push({
      title: '상세한 커밋 메시지',
      description: '커밋 메시지가 매우 상세하게 작성되고 있어 협업과 코드 이해에 도움이 됩니다.'
    });
  } else if (avgMessageLength < 20) {
    insights.push({
      title: '간결한 커밋 메시지',
      description: '커밋 메시지가 간결하게 작성되고 있습니다. 더 자세한 설명을 추가하면 협업에 도움이 될 수 있습니다.'
    });
  }
  
  // 커밋 패턴 분석
  const commitDates = commits.map(commit => new Date(commit.commit.author.date));
  const dayHours = commitDates.map(date => date.getHours());
  
  // 야간 개발 패턴 확인
  const nightCommits = dayHours.filter(hour => hour >= 22 || hour <= 5).length;
  const nightCommitPercentage = (nightCommits / commits.length) * 100;
  
  if (nightCommitPercentage > 30) {
    insights.push({
      title: '야간 개발 패턴',
      description: '개발 활동의 상당 부분이 야간에 이루어지고 있습니다. 이는 부업 프로젝트이거나 꾸준한 열정을 나타낼 수 있습니다.'
    });
  }
  
  // 주말 개발 패턴 확인
  const weekendCommits = commitDates.filter(date => date.getDay() === 0 || date.getDay() === 6).length;
  const weekendCommitPercentage = (weekendCommits / commits.length) * 100;
  
  if (weekendCommitPercentage > 25) {
    insights.push({
      title: '주말 개발 패턴',
      description: '개발 활동의 상당 부분이 주말에 이루어지고 있습니다. 이는 열정 프로젝트이거나 부업일 가능성이 높습니다.'
    });
  }

  // 도메인별 특성 인사이트
  if (domains.includes('웹 개발') && domains.includes('프론트엔드')) {
    insights.push({
      title: '프론트엔드 전문성',
      description: '프론트엔드 개발에 대한 전문성이 돋보이며, UI/UX에 대한 관심이 높습니다.'
    });
  }

  if (domains.includes('데이터 사이언스') || domains.includes('머신러닝')) {
    insights.push({
      title: '데이터 중심 접근 방식',
      description: '데이터 분석과 알고리즘에 기반한 접근 방식을 선호하는 경향이 있습니다.'
    });
  }

  // 기술 스택 다양성 분석
  if (techStack.length > 5) {
    insights.push({
      title: '다양한 기술 활용',
      description: '다양한 기술을 활용하는 풀스택 성향이 있으며, 새로운 기술 학습에 열린 자세를 가지고 있습니다.'
    });
  } else if (techStack.length <= 2 && techStack[0]?.percentage > 70) {
    insights.push({
      title: '특화된 기술 전문성',
      description: `${techStack[0].name} 기술에 특화된 전문성을 보여주고 있으며, 해당 생태계에 깊은 이해도를 가지고 있을 가능성이 높습니다.`
    });
  }

  return insights;
}

// 프로젝트 특성과 도메인에 따른 권장 사항 생성
function generateRecommendations(
  techStack: any[], 
  characteristics: any[], 
  domains: string[]
): {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}[] {
  const recommendations = [];

  // 웹 프로젝트 권장 사항
  if (domains.includes('웹 개발')) {
    // 성능 최적화 권장 사항
    if (techStack.find(t => t.name === 'JavaScript' || t.name === 'TypeScript')) {
      recommendations.push({
        title: '웹 성능 최적화',
        description: '자산 최적화, 코드 분할, 레이지 로딩 등의 기법을 적용하여 웹 애플리케이션의 성능을 개선하세요.',
        priority: 'medium' as const
      });
    }
    
    // 접근성 권장 사항
    recommendations.push({
      title: '웹 접근성 개선',
      description: 'ARIA 속성, 시맨틱 HTML, 키보드 네비게이션을 구현하여 다양한 사용자가 이용할 수 있도록 접근성을 개선하세요.',
      priority: 'medium' as const
    });
  }
  
  // 모바일 앱 권장 사항
  if (domains.includes('모바일 개발')) {
    recommendations.push({
      title: '반응형 디자인 적용',
      description: '다양한 화면 크기와 해상도에 대응할 수 있도록 반응형 디자인을 구현하세요.',
      priority: 'high' as const
    });
    
    recommendations.push({
      title: '오프라인 지원 강화',
      description: '네트워크 연결이 불안정한 환경에서도 앱이 작동할 수 있도록 오프라인 기능을 구현하세요.',
      priority: 'medium' as const
    });
  }
  
  // 품질 관련 권장 사항
  const codeQualityChar = characteristics.find(c => c.type === '코드 품질');
  if (codeQualityChar && codeQualityChar.score < 70) {
    recommendations.push({
      title: '코드 품질 개선',
      description: '코드 리팩토링, 중복 제거, 일관된 코딩 스타일 적용을 통해 코드 품질을 향상시키세요.',
      priority: 'high' as const
    });
    
    recommendations.push({
      title: '테스트 코드 확대',
      description: '단위 테스트와 통합 테스트를 추가하여 코드의 안정성과 신뢰성을 높이세요.',
      priority: 'high' as const
    });
  }
  
  // 문서화 권장 사항
  const docChar = characteristics.find(c => c.type === '문서화');
  if (!docChar || docChar.score < 60) {
    recommendations.push({
      title: '프로젝트 문서화 강화',
      description: 'README 파일 개선, API 문서화, 코드 주석 추가를 통해 프로젝트의 이해도와 유지보수성을 높이세요.',
      priority: 'medium' as const
    });
  }
  
  // 데이터 처리 권장 사항
  if (domains.includes('데이터 사이언스/ML')) {
    recommendations.push({
      title: '데이터 처리 파이프라인 최적화',
      description: '데이터 로딩, 전처리, 변환 과정을 최적화하여 성능을 개선하세요.',
      priority: 'high' as const
    });
    
    recommendations.push({
      title: '모델 평가 메트릭 다양화',
      description: '다양한 평가 지표를 사용하여 모델의 성능을 종합적으로 평가하세요.',
      priority: 'medium' as const
    });
  }
  
  // 확장성 권장 사항
  const scalabilityChar = characteristics.find(c => c.type === '확장성');
  if (!scalabilityChar || scalabilityChar.score < 70) {
    recommendations.push({
      title: '확장성 설계 개선',
      description: '모듈화, 의존성 주입, 마이크로서비스 아키텍처 등을 고려하여 시스템의 확장성을 개선하세요.',
      priority: 'medium' as const
    });
  }
  
  // 보안 권장 사항
  recommendations.push({
    title: '보안 강화',
    description: '입력 유효성 검사, 인증 및 권한 관리, 데이터 암호화 등을 통해 애플리케이션의 보안을 강화하세요.',
    priority: 'high' as const
  });
  
  // 최적화 권장 사항
  if (techStack.some(t => t.percentage > 50)) {
    recommendations.push({
      title: '기술 다양화',
      description: '단일 기술에 지나치게 의존하지 않도록 기술 스택을 다양화하세요.',
      priority: 'low' as const
    });
  }
  
  // 상위 3개 권장 사항만 반환
  return recommendations
    .sort((a, b) => {
      const priorityValue = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityValue[b.priority] - priorityValue[a.priority];
    })
    .slice(0, 3);
}

// 커밋 메시지에서 핵심 기능 추출
function extractKeyFeatures(
  commits: any[], 
  domains: string[], 
  techStack: any[]
): {
  title: string;
  description: string;
  importance: number;
}[] {
  const featureCommits = commits.filter(commit => 
    /feat:|feature:|add|implement|support/i.test(commit.commit.message.toLowerCase())
  );
  
  const features = [];
  
  // 도메인 기반 핵심 기능
  features.push({
    title: `${domains[0]} 프로젝트`,
    description: `이 프로젝트는 주로 ${techStack[0]?.name || '다양한'} 기술을 활용한 ${domains.join(', ')} 분야의 애플리케이션입니다.`,
    importance: 5
  });
  
  // 커밋 볼륨 기반 활동성 분석
  features.push({
    title: '개발 활동성',
    description: `${commits.length}개의 커밋을 통해 ${
      commits.length > 100 ? '매우 활발하게' : 
      commits.length > 50 ? '활발하게' : 
      commits.length > 20 ? '꾸준하게' : '초기 단계로'
    } 개발이 이루어지고 있습니다.`,
    importance: 4
  });

  // 커밋 메시지 분석하여 주요 키워드 추출
  const keywordRegexes = [
    { regex: /authentication|login|auth|oauth|jwt/i, feature: '사용자 인증 시스템' },
    { regex: /dashboard|analytics|chart|graph/i, feature: '대시보드 및 분석' },
    { regex: /api|endpoint|rest|graphql/i, feature: 'API 인터페이스' },
    { regex: /database|schema|model|entity|db/i, feature: '데이터베이스 관리' },
    { regex: /ui|ux|interface|design|component/i, feature: 'UI/UX 디자인' },
    { regex: /test|spec|coverage|jest|mocha/i, feature: '테스트 시스템' },
    { regex: /deploy|kubernetes|docker|ci|cd|pipeline/i, feature: 'CI/CD 파이프라인' },
    { regex: /security|auth|protect|encrypt/i, feature: '보안 기능' },
    { regex: /performance|optimize|speed|cache/i, feature: '성능 최적화' },
    { regex: /mobile|responsive|android|ios/i, feature: '모바일 지원' },
    { regex: /payment|stripe|paypal|subscription/i, feature: '결제 시스템' },
    { regex: /notification|alert|message/i, feature: '알림 시스템' },
    { regex: /search|filter|find|query/i, feature: '검색 기능' },
    { regex: /storage|upload|file|image/i, feature: '파일 관리' },
    { regex: /user|profile|account|role|permission/i, feature: '사용자 관리' },
    { regex: /report|export|pdf|csv|excel/i, feature: '보고서 기능' },
    { regex: /email|mail|smtp|message/i, feature: '메시징 시스템' },
    { regex: /config|setting|preference|env/i, feature: '설정 관리' },
    { regex: /localization|i18n|language|translate/i, feature: '다국어 지원' },
    { regex: /theme|darkmode|style|css/i, feature: '테마 및 스타일링' },
  ];

  // 커밋 메시지에서 키워드 찾기
  const foundFeatures = new Map();
  featureCommits.forEach(commit => {
    const message = commit.commit.message.toLowerCase();
    keywordRegexes.forEach(({ regex, feature }) => {
      if (regex.test(message)) {
        foundFeatures.set(feature, (foundFeatures.get(feature) || 0) + 1);
      }
    });
  });

  // 발견된 상위 기능 추가
  Array.from(foundFeatures.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([feature, count], index) => {
      features.push({
        title: feature,
        description: `${feature}이(가) 프로젝트의 핵심 기능으로 구현되어 있습니다.`,
        importance: 4 - index
      });
    });

  // 기술 스택 기반 특성 추가
  features.push({
    title: '다양한 기술 스택',
    description: `${techStack.slice(0, 3).map(tech => tech.name).join(', ')} 등 다양한 기술을 활용하고 있습니다.`,
    importance: 3
  });

  // 최대 5개 기능까지만 반환
  return features.slice(0, 5);
}

// 저장소 분석 메인 함수
export async function analyzeRepository(
  accessToken: string,
  owner: string,
  repo: string
): Promise<AnalysisResult> {
  try {
    // GitHub API를 통해 데이터 가져오기
    const [commits, languages] = await Promise.all([
      getRepositoryCommits(accessToken, owner, repo),
      getRepositoryLanguages(accessToken, owner, repo)
    ]);
    
    // 기술 스택 분석 (언어 사용 비율)
    const totalBytes = Object.values(languages).reduce((acc, val) => acc + val, 0);
    const techStack = Object.entries(languages)
      .map(([name, bytes]) => ({
        name,
        percentage: Math.round((bytes / totalBytes) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);
    
    // 기여도 분석 (커밋 유형별 분류)
    const commitCategories: Record<string, number> = {};
    
    // 각 커밋 메시지 분석 (실제 모델은 클라이언트에서만 작동)
    const categorizedCommits = await Promise.all(
      commits.map(async commit => {
        const category = typeof window !== 'undefined' 
          ? await analyzeCommitMessage(commit.commit.message)
          : COMMIT_CATEGORIES.CHORE;
        return category;
      })
    );
    
    // 카테고리별 비율 계산
    categorizedCommits.forEach(category => {
      commitCategories[category] = (commitCategories[category] || 0) + 1;
    });
    
    const contributions = Object.entries(commitCategories)
      .map(([category, count]) => ({
        category,
        percentage: Math.round((count / commits.length) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);
    
    // 프로젝트 도메인 분석
    const domains = inferDomainFromLanguages(languages);
    
    // 프로젝트 특성 분석
    const projectCharacteristics = analyzeProjectCharacteristics(commits, commitCategories);
    
    // 핵심 기능 추출
    const keyFeatures = extractKeyFeatures(commits, domains, techStack);
    
    // 개발자 인사이트 추출
    const developerInsights = extractDeveloperInsights(commits, techStack, domains);
    
    // 맞춤형 추천 생성
    const recommendations = generateRecommendations(techStack, projectCharacteristics, domains);
    
    // 전체 요약 생성
    const summary = `이 저장소는 ${domains.join(', ')} 분야의 프로젝트로, 주로 ${
      techStack.slice(0, 2).map(tech => tech.name).join('과 ')
    } 기술을 활용하고 있습니다. 총 ${commits.length}개의 커밋이 있으며, 그 중 ${
      contributions[0]?.category || '다양한 유형'
    }이(가) ${contributions[0]?.percentage || 0}%로 가장 큰 비중을 차지하고 있습니다. ${
      projectCharacteristics[0]?.description || ''
    }`;
    
    // 코드 품질 점수 계산
    let codeQuality = 75; // 기본 점수
    
    // 문서화가 잘 되어 있으면 점수 증가
    const docsPercentage = contributions.find(c => c.category === COMMIT_CATEGORIES.DOCS)?.percentage || 0;
    codeQuality += docsPercentage > 10 ? 5 : 0;
    
    // 리팩토링 비율이 높으면 점수 증가
    const refactorPercentage = contributions.find(c => c.category === COMMIT_CATEGORIES.REFACTOR)?.percentage || 0;
    codeQuality += refactorPercentage > 15 ? 10 : 0;
    
    // 버그 수정 비율이 너무 높으면 점수 감소
    const bugfixPercentage = contributions.find(c => c.category === COMMIT_CATEGORIES.FIX)?.percentage || 0;
    codeQuality -= bugfixPercentage > 30 ? 10 : 0;
    
    // 최종 점수 제한 (0-100)
    codeQuality = Math.max(0, Math.min(100, codeQuality));
    
    return {
      techStack,
      contributions,
      keyFeatures,
      projectCharacteristics,
      summary,
      codeQuality,
      recommendations,
      developerInsights
    };
  } catch (error) {
    console.error('저장소 분석 중 오류 발생:', error);
    throw new Error('저장소 분석 중 오류가 발생했습니다.');
  }
} 