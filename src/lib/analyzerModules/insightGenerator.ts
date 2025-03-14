'use client'

// 개발자 인사이트 및 추천 생성 관련 함수들

// 개발자 인사이트 추출
export function extractDeveloperInsights(
  commits: any[], 
  techStack: any[], 
  domains: string[]
): {
  title: string;
  description: string;
}[] {
  const insights = [];

  // 기술 스택 다양성 분석
  const languages = new Set<string>();
  techStack.forEach(tech => {
    if (tech.type === 'language') {
      languages.add(tech.name);
    }
  });

  if (languages.size >= 5) {
    insights.push({
      title: '다양한 언어 활용 능력',
      description: `${languages.size}개의 프로그래밍 언어를 활용하여 개발한 경험이 있으며, 언어에 구애받지 않고 문제 해결에 적합한 도구를 선택할 수 있는 능력을 갖추고 있습니다.`
    });
  } else if (languages.size >= 3) {
    insights.push({
      title: '여러 언어 활용 능력',
      description: `${languages.size}개의 프로그래밍 언어를 활용하여 개발을 진행하였으며, 다양한 언어를 학습하고 적용할 수 있는 능력을 보여줍니다.`
    });
  } else if (languages.size > 0) {
    const langArray = Array.from(languages);
    insights.push({
      title: `${langArray.join(', ')} 전문성`,
      description: `특정 언어에 대한 깊은 이해와 전문성을 바탕으로 프로젝트를 개발하였습니다.`
    });
  }

  // 도메인 다양성 분석
  if (domains.length >= 3) {
    insights.push({
      title: '다양한 도메인 경험',
      description: `${domains.join(', ')} 등 다양한 도메인에서 개발 경험을 쌓았으며, 새로운 영역에 빠르게 적응할 수 있는 유연성을 갖추고 있습니다.`
    });
  } else if (domains.length > 0) {
    insights.push({
      title: `${domains.join(', ')} 도메인 전문성`,
      description: `${domains.join(', ')} 도메인에 특화된 개발 경험을 가지고 있으며, 해당 분야의 특성과 요구사항을 이해하고 적용할 수 있는 능력을 보유하고 있습니다.`
    });
  }

  // 개발 패턴 분석
  // 커밋 일관성 분석
  const timeBetweenCommits = [];
  for (let i = 0; i < commits.length - 1; i++) {
    const current = new Date(commits[i].commit.author.date).getTime();
    const next = new Date(commits[i + 1].commit.author.date).getTime();
    timeBetweenCommits.push(current - next);
  }

  if (timeBetweenCommits.length > 0) {
    const avgTime = timeBetweenCommits.reduce((a, b) => a + b, 0) / timeBetweenCommits.length;
    const variance = timeBetweenCommits.map(t => Math.pow(t - avgTime, 2)).reduce((a, b) => a + b, 0) / timeBetweenCommits.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgTime;

    if (coefficientOfVariation < 0.5 && commits.length > 20) {
      insights.push({
        title: '일관된 개발 패턴',
        description: '규칙적이고 일관된 개발 활동을 보여주며, 계획적이고 체계적인 작업 방식을 가지고 있습니다. 이는 프로젝트 일정 관리와 지속적인 개발 문화에 기여할 수 있는 역량을 나타냅니다.'
      });
    }
  }

  // 커밋 메시지 분석 (일반적인 패턴 기반)
  const commitMessages = commits.map(c => c.commit.message);
  const hasDetailedCommits = commitMessages.some(msg => msg.length > 100);
  const hasConventionalCommits = commitMessages.some(msg => /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:/.test(msg));

  if (hasDetailedCommits) {
    insights.push({
      title: '상세한 문서화 능력',
      description: '상세하고 명확한 커밋 메시지를 작성하는 습관을 가지고 있어, 프로젝트의 변경 사항을 효과적으로 문서화하고 팀원들과 원활하게 소통할 수 있는 능력을 보여줍니다.'
    });
  }

  if (hasConventionalCommits) {
    insights.push({
      title: '표준화된 개발 방법론 적용',
      description: '커밋 컨벤션을 준수하여 개발 과정을 체계적으로 관리하는 능력을 갖추고 있으며, 이는 협업 상황에서 효율적인 코드 리뷰와 프로젝트 관리를 가능하게 합니다.'
    });
  }

  // 특정 기술 스택 기반 인사이트
  const techNames = techStack.map(t => t.name.toLowerCase());
  const hasTestingFrameworks = techNames.some(name => 
    name.includes('test') || name.includes('jest') || name.includes('junit') || name.includes('pytest') || name.includes('mocha')
  );

  if (hasTestingFrameworks) {
    insights.push({
      title: '테스트 주도 개발 역량',
      description: '테스트 프레임워크를 활용하여 코드의 품질과 안정성을 확보하는 개발 방식을 적용하고 있으며, 이는 지속 가능한 제품 개발과 유지보수에 중요한 역량입니다.'
    });
  }

  return insights;
}

// 프로젝트 주요 기능 추출
export function extractKeyFeatures(
  commits: any[], 
  domains: string[], 
  techStack: any[]
): {
  title: string;
  description: string;
  importance: number;
}[] {
  const features = [];
  
  // 커밋 메시지 분석
  const featureCommits = commits.filter(c => 
    /feat:|feature:|add:|implement:|새로운|기능|추가/i.test(c.commit.message)
  );
  
  // 자주 언급되는 키워드 추출 (단순 버전)
  const keywords: Record<string, number> = {};
  
  featureCommits.forEach(commit => {
    const message = commit.commit.message.toLowerCase();
    
    // 도메인별 주요 키워드 (확장 가능)
    const relevantKeywords = [
      // 공통 키워드
      'api', 'crud', 'ui', 'ux', 'interface', 'component', 'service', 'model',
      
      // 웹 개발 관련 키워드
      'auth', 'login', 'dashboard', 'frontend', 'backend', 'responsive', 'spa', 'pwa',
      'react', 'vue', 'angular', 'redux', 'state', 'component', 'hook', 'layout',
      
      // 모바일 관련 키워드
      'screen', 'view', 'navigation', 'notification', 'permission', 'profile',
      
      // 데이터 관련 키워드
      'data', 'analysis', 'algorithm', 'train', 'predict', 'model', 'dataset',
      
      // 인프라 관련 키워드
      'deploy', 'ci', 'cd', 'pipeline', 'docker', 'kubernetes', 'cloud',
      
      // 기능 관련 일반 키워드
      'search', 'filter', 'sort', 'pagination', 'upload', 'download', 'import', 'export',
      'notification', 'message', 'email', 'user', 'profile', 'setting', 'config',
      'report', 'chart', 'graph', 'dashboard', 'admin', 'payment', 'subscription'
    ];
    
    relevantKeywords.forEach(keyword => {
      if (message.includes(keyword)) {
        keywords[keyword] = (keywords[keyword] || 0) + 1;
      }
    });
  });
  
  // 가장 많이 언급된 키워드로 기능 추출
  const sortedKeywords = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  // 각 주요 키워드를 기반으로 기능 생성
  sortedKeywords.forEach(([keyword, count], index) => {
    // 키워드 기반 기능 제목 생성
    let title = '';
    let description = '';
    
    // 기본적인 매핑 로직 (향후 확장 가능)
    switch (keyword) {
      case 'api':
        title = 'API 통합 및 관리';
        description = '외부 서비스 및 데이터 소스와의 연동을 위한 API 통합 기능을 개발하여 데이터 액세스 및 시스템 간 통신을 용이하게 했습니다.';
        break;
      case 'auth':
      case 'login':
        title = '사용자 인증 및 권한 관리';
        description = '안전하고 사용자 친화적인 인증 시스템을 구현하여 개인 정보 보호 및 접근 제어를 강화했습니다.';
        break;
      case 'ui':
      case 'ux':
      case 'interface':
        title = '사용자 인터페이스 개선';
        description = '직관적이고 반응형 사용자 인터페이스를 설계 및 구현하여 사용자 경험을 향상시켰습니다.';
        break;
      case 'dashboard':
        title = '데이터 시각화 대시보드';
        description = '핵심 정보와 지표를 한눈에 확인할 수 있는 종합 대시보드를 개발하여 데이터 기반 의사결정을 지원합니다.';
        break;
      case 'search':
        title = '고급 검색 기능';
        description = '사용자가 원하는 정보를 효율적으로 찾을 수 있는 검색 시스템을 구현하여 접근성과 사용성을 향상시켰습니다.';
        break;
      case 'data':
      case 'analysis':
        title = '데이터 분석 및 처리';
        description = '다양한 소스의 데이터를 수집, 정제, 분석하는 기능을 개발하여 의미 있는 인사이트 도출을 가능하게 했습니다.';
        break;
      case 'notification':
      case 'message':
        title = '알림 및 메시지 시스템';
        description = '사용자에게 중요한 정보와 업데이트를 실시간으로 전달하는 알림 시스템을 구현했습니다.';
        break;
      case 'ci':
      case 'cd':
      case 'deploy':
        title = '자동화된 배포 파이프라인';
        description = '개발부터 배포까지의 과정을 자동화하여 개발 생산성과 소프트웨어 품질을 향상시켰습니다.';
        break;
      default:
        // 기본 형식 (첫 글자 대문자로 변환)
        title = `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} 기능 개발`;
        description = `${keyword}와 관련된 핵심 기능을 설계 및 구현하여 사용자 요구사항을 충족시켰습니다.`;
    }
    
    // 중요도 계산 (언급 빈도, 순서 기반)
    const importance = Math.min(100, Math.round((count / Math.max(...sortedKeywords.map(k => k[1]))) * 100) - index * 5);
    
    features.push({
      title,
      description,
      importance
    });
  });
  
  // 도메인 기반 일반적인 기능 추가 (커밋에서 명확히 추출되지 않은 경우)
  if (features.length < 3) {
    if (domains.includes('웹 개발')) {
      features.push({
        title: '반응형 웹 인터페이스',
        description: '다양한 기기와 화면 크기에 최적화된 반응형 웹 디자인을 적용하여 모든 사용자에게 일관된 경험을 제공합니다.',
        importance: 85
      });
    }
    
    if (domains.includes('모바일 개발')) {
      features.push({
        title: '오프라인 지원 기능',
        description: '네트워크 연결이 없는 환경에서도 핵심 기능을 사용할 수 있는 오프라인 지원 기능을 구현했습니다.',
        importance: 80
      });
    }
    
    if (domains.includes('데이터 사이언스')) {
      features.push({
        title: '데이터 시각화 및 리포팅',
        description: '복잡한 데이터를 이해하기 쉬운 차트와 그래프로 시각화하여 인사이트 도출을 돕는 기능을 개발했습니다.',
        importance: 90
      });
    }
  }
  
  // 중요도 기준으로 정렬
  return features.sort((a, b) => b.importance - a.importance);
}

// 프로젝트 추천 사항 생성
export function generateRecommendations(
  techStack: any[], 
  characteristics: any[], 
  domains: string[]
): {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}[] {
  // 프로젝트 특성이 제거되었으므로, 이에 의존하는 로직 제거
  // 기본 추천만 생성
  const recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[] = [];
  
  // 웹 프로젝트 권장 사항
  if (domains.includes('웹 개발')) {
    recommendations.push({
      title: '웹 성능 최적화',
      description: '자산 최적화, 코드 분할, 레이지 로딩 등의 기법을 적용하여 웹 애플리케이션의 성능을 개선하세요.',
      priority: 'medium' as const
    });
    
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
  }
  
  // 백엔드 프로젝트 추천
  if (domains.includes('백엔드 개발')) {
    recommendations.push({
      title: '서버 보안 강화',
      description: 'HTTPS, 입력 검증, XSS/CSRF 방어 등 보안 모범 사례를 적용하여 애플리케이션 보안을 강화하세요.',
      priority: 'high' as const
    });
  }
  
  // 기본 추천 (모든 프로젝트에 적용)
  recommendations.push({
    title: '테스트 커버리지 확대',
    description: '단위 테스트, 통합 테스트를 추가하여 코드 변경에 따른 위험을 줄이고 품질을 향상시키세요.',
    priority: 'medium' as const
  });
  
  recommendations.push({
    title: '문서화 개선',
    description: 'README, API 문서, 코드 주석 등을 통해 프로젝트 문서화를 개선하세요.',
    priority: 'medium' as const
  });
  
  // 상위 3개 권장사항만 반환
  return recommendations
    .sort((a, b) => {
      const priorityValue = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityValue[b.priority as keyof typeof priorityValue] - priorityValue[a.priority as keyof typeof priorityValue];
    })
    .slice(0, 3);
}

// 프로젝트 요약 생성
export function generateProjectSummary(
  techStack: any[], 
  domains: string[], 
  commits: any[],
  keyFeatures: any[],
  contributions: any[],
  isPersonal: boolean = true,
  userLogin?: string
): string {
  // 기본 정보 수집
  console.log(`[generateProjectSummary 호출] isPersonal 매개변수 값: ${isPersonal}`);
  
  const totalCommits = commits.length;
  const languages = techStack
    .filter(tech => tech.type === 'language')
    .map(tech => tech.name)
    .slice(0, 3);
  
  const frameworks = techStack
    .filter(tech => tech.type === 'framework' || tech.type === 'library')
    .map(tech => tech.name)
    .slice(0, 3);
  
  const firstCommitDate = new Date(commits[commits.length - 1]?.commit.author.date || Date.now());
  const lastCommitDate = new Date(commits[0]?.commit.author.date || Date.now());
  const durationInMonths = Math.max(
    1, 
    Math.ceil((lastCommitDate.getTime() - firstCommitDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  );
  
  // 주요 기능 텍스트
  const featuresText = keyFeatures.length > 0 
    ? `주요 기능으로는 ${keyFeatures.slice(0, 3).map(f => f.title).join(', ')} 등이 있습니다.` 
    : '';
  
  // 프로젝트 유형 파악
  const uniqueAuthors = new Set();
  commits.forEach(commit => {
    if (commit?.commit?.author?.email) {
      uniqueAuthors.add(commit.commit.author.email);
    }
  });
  
  console.log(`[요약 생성] 커밋에서 확인된 고유 이메일: ${uniqueAuthors.size}개`);
  
  // 매개변수로 받은 isPersonal 값을 우선 사용하되, 
  // 만약 커밋에서 여러 기여자가 확인되면 팀 프로젝트로 간주
  let projectType = isPersonal;
  
  if (uniqueAuthors.size > 1) {
    console.log('[요약 생성] 여러 기여자가 있어 팀 프로젝트로 판단함');
    projectType = false;
  } else {
    console.log('[요약 생성] 단일 기여자 프로젝트로 판단함');
  }
  
  console.log(`[요약 생성] 최종 프로젝트 유형: ${projectType ? '개인' : '팀'} 프로젝트`);
  
  // 기여도 텍스트 (팀 프로젝트에서만 표시)
  let contributionText = '';
  
  if (!projectType && userLogin) {
    // 현재 사용자의 커밋 수 계산
    const userCommits = commits.filter(commit => {
      const authorName = commit?.commit?.author?.name || '';
      const authorLogin = commit?.author?.login || '';
      return authorName === userLogin || authorLogin === userLogin;
    });
    
    if (userCommits.length > 0) {
      const percentage = Math.round((userCommits.length / totalCommits) * 100);
      console.log(`[요약 생성] 사용자 ${userLogin}의 기여도: ${percentage}% (${userCommits.length}/${totalCommits})`);
      contributionText = `이 프로젝트에서 ${percentage}%의 기여도를 보여주었으며, `;
    }
  }
  
  // 도메인 텍스트
  const domainText = domains.length > 0 
    ? `${domains.join(', ')} 영역의 ${projectType ? '역량을 보여주는' : '솔루션을 제공하는'}` 
    : '';
  
  // 기술 스택 텍스트
  let techStackText = '';
  if (languages.length > 0 && frameworks.length > 0) {
    techStackText = `주요 기술 스택으로는 ${languages.join(', ')}와(과) ${frameworks.join(', ')}을(를) 활용하였습니다.`;
  } else if (languages.length > 0) {
    techStackText = `주요 기술 스택으로는 ${languages.join(', ')}을(를) 활용하였습니다.`;
  }
  
  // 프로젝트 기간 텍스트
  const durationText = `약 ${durationInMonths}개월 동안 총 ${totalCommits}개의 커밋을 통해 개발되었습니다.`;
  
  // 전체 요약문 생성
  const summary = `이 프로젝트는 ${domainText} ${projectType ? '개인' : '팀'} 프로젝트입니다. ${techStackText} ${contributionText}${durationText} ${featuresText}`;
  
  console.log(`[요약 생성] 최종 요약문: ${summary}`);
  
  return summary;
} 