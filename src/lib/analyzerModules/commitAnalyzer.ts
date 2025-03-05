'use client'

// 커밋 메시지 분석 관련 함수들을 담당하는 모듈

// 커밋 카테고리 정의
export const COMMIT_CATEGORIES = {
  FEATURE: '기능',
  FIX: '버그 수정',
  REFACTOR: '리팩토링',
  DOCS: '문서화',
  STYLE: '스타일',
  TEST: '테스트',
  CHORE: '기타',
};

// 커밋 메시지 분석 함수
export async function analyzeCommitMessage(message: string): Promise<string> {
  try {
    // 규칙 기반 분석으로 빠르게 분류 시도
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
    
    // 해당 패턴이 없을 경우 기본값 반환
    return COMMIT_CATEGORIES.CHORE;
  } catch (error) {
    console.error('커밋 메시지 분석 오류:', error);
    return COMMIT_CATEGORIES.CHORE; // 오류 발생 시 기본값 반환
  }
}

// 커밋 데이터로부터 개발 패턴 분석
export function analyzeDevelopmentPattern(commits: any[]): {
  commitFrequency: string;
  developmentCycle: string;
  teamDynamics: string;
  workPatterns: { 
    time: string; 
    dayOfWeek: string; 
    mostActiveDay: string; 
    mostActiveHour: number;
  }
} {
  // 커밋 빈도 분석
  const daysBetweenFirstAndLast = commits.length > 1 
    ? Math.ceil((new Date(commits[0].commit.author.date).getTime() - 
       new Date(commits[commits.length - 1].commit.author.date).getTime()) / (1000 * 60 * 60 * 24)) 
    : 1;
  
  const commitsPerDay = commits.length / Math.max(daysBetweenFirstAndLast, 1);

  // 커밋 빈도 텍스트 결정
  let commitFrequency = '';
  if (commitsPerDay >= 5) {
    commitFrequency = '매우 활발한 개발 활동';
  } else if (commitsPerDay >= 2) {
    commitFrequency = '꾸준한 개발 활동';
  } else if (commitsPerDay >= 0.5) {
    commitFrequency = '보통 수준의 개발 활동';
  } else {
    commitFrequency = '간헐적인 개발 활동';
  }

  // 요일별 커밋 분석
  const dayMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const hourMap: Record<number, number> = {};
  
  for (let i = 0; i < 24; i++) {
    hourMap[i] = 0;
  }
  
  commits.forEach(commit => {
    const date = new Date(commit.commit.author.date);
    const day = date.getDay();
    const hour = date.getHours();
    
    dayMap[day] += 1;
    hourMap[hour] += 1;
  });
  
  // 가장 활발한 요일과 시간 찾기
  let mostActiveDay = 0;
  let mostActiveDayCount = 0;
  
  Object.entries(dayMap).forEach(([day, count]) => {
    if (count > mostActiveDayCount) {
      mostActiveDay = parseInt(day);
      mostActiveDayCount = count;
    }
  });
  
  let mostActiveHour = 0;
  let mostActiveHourCount = 0;
  
  Object.entries(hourMap).forEach(([hour, count]) => {
    if (count > mostActiveHourCount) {
      mostActiveHour = parseInt(hour);
      mostActiveHourCount = count;
    }
  });
  
  // 요일 문자열 변환
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  
  // 커밋 패턴 결정
  const weekdayCommits = dayMap[1] + dayMap[2] + dayMap[3] + dayMap[4] + dayMap[5];
  const weekendCommits = dayMap[0] + dayMap[6];
  
  let dayOfWeek = '';
  if (weekdayCommits > weekendCommits * 3) {
    dayOfWeek = '주로 평일에 개발';
  } else if (weekendCommits > weekdayCommits * 2) {
    dayOfWeek = '주로 주말에 개발';
  } else {
    dayOfWeek = '평일과 주말 모두 개발';
  }
  
  // 시간대 분석
  const morningCommits = hourMap[6] + hourMap[7] + hourMap[8] + hourMap[9] + hourMap[10] + hourMap[11];
  const afternoonCommits = hourMap[12] + hourMap[13] + hourMap[14] + hourMap[15] + hourMap[16] + hourMap[17];
  const eveningCommits = hourMap[18] + hourMap[19] + hourMap[20] + hourMap[21] + hourMap[22] + hourMap[23];
  const nightCommits = hourMap[0] + hourMap[1] + hourMap[2] + hourMap[3] + hourMap[4] + hourMap[5];
  
  let time = '';
  if (morningCommits > Math.max(afternoonCommits, eveningCommits, nightCommits)) {
    time = '주로 오전에 활동';
  } else if (afternoonCommits > Math.max(morningCommits, eveningCommits, nightCommits)) {
    time = '주로 오후에 활동';
  } else if (eveningCommits > Math.max(morningCommits, afternoonCommits, nightCommits)) {
    time = '주로 저녁에 활동';
  } else {
    time = '주로 심야에 활동';
  }
  
  // 개발 주기 분석
  const timeBetweenCommits = [];
  for (let i = 0; i < commits.length - 1; i++) {
    const current = new Date(commits[i].commit.author.date).getTime();
    const next = new Date(commits[i + 1].commit.author.date).getTime();
    timeBetweenCommits.push(current - next);
  }
  
  const avgTimeBetweenCommits = timeBetweenCommits.length > 0 
    ? timeBetweenCommits.reduce((acc, val) => acc + val, 0) / timeBetweenCommits.length 
    : 0;
  
  let developmentCycle = '';
  if (avgTimeBetweenCommits < 1000 * 60 * 60 * 4) { // 4시간 이내
    developmentCycle = '짧은 간격으로 자주 커밋하는 패턴';
  } else if (avgTimeBetweenCommits < 1000 * 60 * 60 * 24) { // 24시간 이내
    developmentCycle = '하루 단위로 커밋하는 패턴';
  } else if (avgTimeBetweenCommits < 1000 * 60 * 60 * 24 * 3) { // 3일 이내
    developmentCycle = '며칠 단위로 커밋하는 패턴';
  } else {
    developmentCycle = '긴 간격으로 간헐적으로 커밋하는 패턴';
  }
  
  // 팀 역학 분석 (이 부분은 개인 프로젝트인지 팀 프로젝트인지에 따라 달라짐)
  const authors = new Set();
  commits.forEach(commit => {
    const author = commit.commit.author.email;
    authors.add(author);
  });
  
  let teamDynamics = '';
  if (authors.size === 1) {
    teamDynamics = '개인 프로젝트';
  } else if (authors.size <= 3) {
    teamDynamics = '소규모 팀 프로젝트';
  } else if (authors.size <= 10) {
    teamDynamics = '중규모 팀 프로젝트';
  } else {
    teamDynamics = '대규모 팀 프로젝트';
  }
  
  return {
    commitFrequency,
    developmentCycle,
    teamDynamics,
    workPatterns: {
      time,
      dayOfWeek,
      mostActiveDay: dayNames[mostActiveDay],
      mostActiveHour
    }
  };
} 