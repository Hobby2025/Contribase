'use client'

// 프로젝트 도메인 분석 관련 함수들

// 언어 데이터에서 프로젝트 도메인 추론
export function inferDomainFromLanguages(languages: Record<string, number>): string[] {
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
  const backendLanguages = ['Java', 'C#', 'Go', 'Rust', 'Python', 'Ruby', 'PHP', 'TypeScript', 'JavaScript'];
  // 백엔드 프레임워크 관련 언어 (확장 가능)
  const hasBackend = backendLanguages.some(lang => 
    languagePercentages[lang] >= 30 && 
    lang !== 'JavaScript' && 
    lang !== 'TypeScript'
  );
  
  // 임베디드/시스템 개발 관련 언어
  const embeddedLanguages = ['C', 'C++', 'Assembly', 'Rust'];
  const hasEmbedded = embeddedLanguages.some(lang => languagePercentages[lang] >= 30);
  
  // 게임 개발 관련 언어
  const gameLanguages = ['C#', 'C++', 'GDScript', 'Lua'];
  const hasGame = gameLanguages.some(lang => languagePercentages[lang] >= 20);
  
  // 도메인 추가
  if (hasWeb) {
    domains.push('웹 개발');
    
    // 프론트엔드 vs 풀스택 판단
    const frontendLanguages = ['JavaScript', 'TypeScript', 'HTML', 'CSS'];
    const isFrontendHeavy = frontendLanguages.some(lang => languagePercentages[lang] >= 40);
    
    if (isFrontendHeavy) {
      domains.push('프론트엔드');
    } else if (hasBackend) {
      domains.push('풀스택');
    }
  }
  
  if (hasDataScience) {
    domains.push('데이터 사이언스');
    
    // Python이 70% 이상이면 ML 가능성 있음
    if (languagePercentages['Python'] >= 70) {
      domains.push('머신러닝');
    }
    
    // Jupyter Notebook이 있으면 데이터 분석 가능성 높음
    if (languagePercentages['Jupyter Notebook'] >= 10) {
      domains.push('데이터 분석');
    }
  }
  
  if (hasMobile) {
    domains.push('모바일 개발');
    
    // 특정 언어에 따라 iOS/Android 분류
    if (languagePercentages['Swift'] >= 15 || languagePercentages['Objective-C'] >= 15) {
      domains.push('iOS');
    }
    
    if (languagePercentages['Kotlin'] >= 15 || languagePercentages['Java'] >= 30) {
      domains.push('Android');
    }
    
    if (languagePercentages['Dart'] >= 30) {
      domains.push('크로스 플랫폼');
    }
  }
  
  if (hasBackend && !hasWeb) {
    domains.push('백엔드');
    
    // 특정 언어 비중에 따라 더 구체적인 도메인 추가
    if (languagePercentages['Java'] >= 40) {
      domains.push('엔터프라이즈');
    } else if (languagePercentages['Go'] >= 30 || languagePercentages['Rust'] >= 30) {
      domains.push('시스템 프로그래밍');
    }
  }
  
  if (hasEmbedded) {
    domains.push('임베디드 시스템');
    
    if (languagePercentages['C'] >= 50) {
      domains.push('하드웨어 인터페이스');
    }
  }
  
  if (hasGame) {
    domains.push('게임 개발');
  }
  
  // 도메인이 없으면 기본값
  if (domains.length === 0) {
    domains.push('소프트웨어 개발');
  }
  
  return domains;
}

// 프로젝트 특성 분석
export function analyzeProjectCharacteristics(
  commits: any[], 
  categories: Record<string, number>
): {
  type: string;
  score: number;
  description: string;
}[] {
  const characteristics = [];
  const totalCommits = commits.length;
  
  // 커밋 수에 따른 프로젝트 규모 특성
  let projectSize = '';
  if (totalCommits < 20) {
    projectSize = '소규모';
  } else if (totalCommits < 100) {
    projectSize = '중소규모';
  } else if (totalCommits < 500) {
    projectSize = '중규모';
  } else {
    projectSize = '대규모';
  }
  
  characteristics.push({
    type: '프로젝트 규모',
    score: Math.min(100, totalCommits / 10),
    description: `${projectSize} 프로젝트 (총 ${totalCommits}개의 커밋)`
  });
  
  // 커밋 카테고리 비율로 특성 추정
  const featureRatio = (categories['기능'] || 0) / totalCommits;
  const fixRatio = (categories['버그 수정'] || 0) / totalCommits;
  const refactorRatio = (categories['리팩토링'] || 0) / totalCommits;
  const docsRatio = (categories['문서화'] || 0) / totalCommits;
  
  // 기능 개발 중심 특성
  if (featureRatio > 0.5) {
    characteristics.push({
      type: '개발 중점',
      score: featureRatio * 100,
      description: '기능 개발에 중점을 둔 프로젝트'
    });
  }
  
  // 안정성 중시 특성 (버그 수정 비율이 높음)
  if (fixRatio > 0.3) {
    characteristics.push({
      type: '안정성',
      score: fixRatio * 100,
      description: '안정성과 버그 수정에 중점을 둔 프로젝트'
    });
  }
  
  // 코드 품질 중시 특성 (리팩토링 비율이 높음)
  if (refactorRatio > 0.2) {
    characteristics.push({
      type: '코드 품질',
      score: refactorRatio * 100,
      description: '코드 품질과 리팩토링에 중점을 둔 프로젝트'
    });
  }
  
  // 문서화 중시 특성
  if (docsRatio > 0.15) {
    characteristics.push({
      type: '문서화',
      score: docsRatio * 100,
      description: '문서화에 중점을 둔 프로젝트'
    });
  }
  
  // 개발 속도/일관성 분석
  const commitDates = commits.map(c => new Date(c.commit.author.date).getTime());
  const timeBetweenCommits = [];
  
  for (let i = 0; i < commitDates.length - 1; i++) {
    timeBetweenCommits.push(commitDates[i] - commitDates[i + 1]);
  }
  
  if (timeBetweenCommits.length > 0) {
    const avgTime = timeBetweenCommits.reduce((a, b) => a + b, 0) / timeBetweenCommits.length;
    const stdDev = Math.sqrt(
      timeBetweenCommits.map(t => Math.pow(t - avgTime, 2))
        .reduce((a, b) => a + b, 0) / timeBetweenCommits.length
    );
    
    const consistencyScore = Math.max(0, 100 - (stdDev / avgTime) * 10);
    
    if (consistencyScore > 60) {
      characteristics.push({
        type: '개발 일관성',
        score: consistencyScore,
        description: '일관된 개발 패턴을 보이는 프로젝트'
      });
    } else if (consistencyScore < 30) {
      characteristics.push({
        type: '개발 패턴',
        score: 100 - consistencyScore,
        description: '산발적인 개발 패턴을 보이는 프로젝트'
      });
    }
  }
  
  return characteristics;
} 