import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeCommitMessages,
  analyzeCodeChanges,
  getModelStatus
} from '@/utils/modelUtils.client';
import { MODEL_CONFIG } from '@/utils/config';
import { analyzeCodeQuality, calculateOverallQuality } from '@/lib/codeQualityAnalyzer';
import { AnalysisResult } from '@/modules/analyzer/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeRepository } from '@/modules/analyzer';
import { checkUserAnalysisQuota, incrementAnalysisUsage } from '@/lib/userQuota';
import { Session } from 'next-auth';

/**
 * 개발자 프로필 분석 결과 인터페이스
 */
interface DeveloperProfileResult {
  error?: string;
  message: string;
}

/**
 * 개발 패턴 분석 결과 인터페이스
 */
interface DevelopmentPatternResult {
  peakProductivityTime: string;
  commitFrequency: string;
  codeReviewStyle: string;
  iterationSpeed: string;
  focusAreas: string[];
  workPatterns: {
    time: string;
    dayOfWeek: string;
    mostActiveDay: string;
    mostActiveHour: number;
  };
  teamDynamics: string;
  developmentCycle: string;
}

/**
 * 커밋 데이터 인터페이스
 */
interface CommitData {
  message?: string;
  date?: string;
  author?: {
    name?: string;
    email?: string;
  };
  commit?: {
    message?: string;
    author?: {
      name?: string;
      date?: string;
    };
    committer?: {
      date?: string;
    };
  };
  additions?: number;
  deletions?: number;
  stats?: {
    additions: number;
    deletions: number;
  };
  files?: Array<{
    filename?: string;
    path?: string;
    additions?: number;
    deletions?: number;
  } | string>;
}

// 세션에서 사용자 ID를 추출하는 함수
function getUserIdFromSession(session: Session | null): string | null {
  if (!session?.user) return null;
  
  // id가 있으면 id를, 없으면 email을 사용
  return session.user.id || session.user.email || null;
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 사용자 할당량 확인
    const userId = getUserIdFromSession(session);
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID를 확인할 수 없습니다.' },
        { status: 400 }
      );
    }
    
    const quotaInfo = await checkUserAnalysisQuota(userId);
    
    // 할당량이 부족한 경우
    if (!quotaInfo.hasQuota) {
      return NextResponse.json({
        error: '오늘의 분석 횟수를 모두 사용했습니다. 내일 다시 시도해 주세요.',
        quota: quotaInfo
      }, { status: 429 }); // Too Many Requests
    }

    // 요청 데이터 파싱
    const body = await request.json();
    const { prompt, type, messages, changes } = body;

    // 요청 유형에 따른 처리
    if (type === 'commits' && messages) {
      // 커밋 메시지 분석
      if (!Array.isArray(messages)) {
        return NextResponse.json(
          { error: '유효한 messages 배열이 필요합니다.' },
          { status: 400 }
        );
      }
      
      // 분석할 커밋 메시지 수 제한
      const limitedMessages = messages.slice(0, MODEL_CONFIG.MAX_BATCH_SIZE);
      
      // 분석 수행
      const result = await analyzeCommitMessages(limitedMessages);
      
      // 결과 반환
      return NextResponse.json(result);
    } 
    else if (type === 'code' && changes) {
      // 코드 변경 분석
      if (!Array.isArray(changes)) {
        return NextResponse.json(
          { error: '유효한 changes 배열이 필요합니다.' },
          { status: 400 }
        );
      }
      
      // 분석할 코드 변경 수 제한
      const limitedChanges = changes.slice(0, MODEL_CONFIG.MAX_BATCH_SIZE);
      
      console.log(`📁 코드 분석 API 호출됨 - ${limitedChanges.length}개 파일 분석 시작`);
      
      // 분석 수행
      const result = await analyzeCodeChanges(limitedChanges);
      
      // 간략한 요약 로깅 (전체 JSON 출력 방지)
      console.log(`✅ 코드 분석 완료 - 분석된 파일 수: ${limitedChanges.length}`);
      
      // 결과 반환
      return NextResponse.json(result);
    }
    else if (type === 'repository' && prompt) {
      try {
        // 요청 데이터 분석
        const parsed = typeof prompt === 'string' ? JSON.parse(prompt) : prompt;
        const { 
          owner: ownerParam, 
          repo: repoParam, 
          userAnalysis: userAnalysisParam = false,
          onlyUserCommits: onlyUserCommitsParam = false,
          token = null
        } = parsed;
        
        // 본격적인 저장소 분석 시작
        const authHeader = request.headers.get('authorization');
        let accessToken = '';
        
        // Authorization 헤더에서 토큰 추출
        if (authHeader && authHeader.startsWith('Bearer ')) {
          accessToken = authHeader.slice(7); // 'Bearer ' 부분 제거
          console.log('Authorization 헤더에서 토큰 추출 성공');
        }
        // 요청 본문의 token 파라미터 사용
        else if (token) {
          accessToken = token;
          console.log('요청 본문의 token 파라미터 사용');
        }
        
        // 토큰이 없으면 오류 반환
        if (!accessToken) {
          console.error('인증 토큰 없음: Authorization 헤더 누락 또는 토큰 파라미터 없음');
          return NextResponse.json(
            { error: '저장소 분석을 위한 인증 토큰이 필요합니다. GitHub에 로그인했는지 확인해주세요.' },
            { status: 401 }
          );
        }
        
        try {
          // 세션에서 사용자 정보 가져오기
          let userLogin: string | undefined = undefined;
          let userEmail: string | undefined = undefined;
          
          try {
            const session = await getServerSession(authOptions);
            
            console.log('세션 정보:', session ? '있음' : '없음');
            if (session) {
              console.log('사용자 정보:', session.user?.name || '이름 없음');
              console.log('액세스 토큰:', session.accessToken ? '있음' : '없음');
            }
            
            userLogin = session?.user?.name || undefined;
            userEmail = session?.user?.email || undefined;
          } catch (sessionError) {
            console.error('세션 정보 가져오기 실패:', sessionError);
          }
          
          console.log(`저장소 분석 요청: ${ownerParam}/${repoParam}`);
          console.log(`분석 옵션: 사용자 분석=${userAnalysisParam}, 내 커밋만=${onlyUserCommitsParam}`);
          console.log(`사용자 정보: 로그인=${userLogin}, 이메일=${userEmail || '없음'}`);
          
          // 저장소 분석 시작
          const result = await analyzeRepository(accessToken, ownerParam, repoParam, {
            personalAnalysis: userAnalysisParam === true || userAnalysisParam === 'true',
            userLogin,
            userEmail,
            onlyUserCommits: onlyUserCommitsParam === true || onlyUserCommitsParam === 'true'
          });
          
          // 분석 성공 시 사용량 증가
          await incrementAnalysisUsage(userId);
          
          // 업데이트된 할당량 정보 조회
          const updatedQuota = await checkUserAnalysisQuota(userId);
          
          // 결과 반환 (할당량 정보 포함)
          return NextResponse.json({
            ...result,
            quota: updatedQuota
          });
        } catch (analysisError: any) {
          console.error('저장소 분석 중 오류 발생:', analysisError);
          return NextResponse.json(
            { error: `저장소 분석 중 오류: ${analysisError.message}` },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error('저장소 분석 요청 처리 중 오류:', error);
        return NextResponse.json(
          { error: '저장소 분석 요청 형식이 올바르지 않습니다.' },
          { status: 400 }
        );
      }
    }
    else if (type === 'developerProfile' && prompt) {
      try {
        const result = analyzeDeveloperProfile(prompt);
        return NextResponse.json(result);
      } catch (error) {
        console.error('개발자 프로필 분석 오류:', error);
        return NextResponse.json({ error: '개발자 프로필 분석 중 오류가 발생했습니다.' }, { status: 500 });
      }
    }
    else if (type === 'developmentPattern' && prompt) {
      try {
        const result = analyzeDevelopmentPattern(prompt);
        return NextResponse.json(result);
      } catch (error) {
        console.error('개발 패턴 분석 오류:', error);
        return NextResponse.json({ error: '개발 패턴 분석 중 오류가 발생했습니다.' }, { status: 500 });
      }
    }
    else if (prompt) {
      // 모델 상태 확인
      const modelStatus = await getModelStatus();
      console.log('현재 분석 모드:', modelStatus.mode);
      
      return NextResponse.json(
        { error: '지원되지 않는 분석 유형입니다.' },
        { status: 400 }
      );
    }
    else {
      // 잘못된 요청
      return NextResponse.json(
        { error: '유효한 요청 형식이 아닙니다. prompt, messages 또는 changes가 필요합니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('분석 API 오류:', error);
    
    // 오류 응답
    return NextResponse.json(
      { 
        error: '분석 중 서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// 개발자 프로필 분석 (규칙 기반)
function analyzeDeveloperProfile(promptData: Record<string, unknown>): DeveloperProfileResult {
  try {
    console.log('개발자 프로필 기능이 비활성화되었습니다.');
    
    // 개발자 프로필 분석 기능이 비활성화되었으므로 오류 발생
    throw new Error('개발자 프로필 분석 기능은 더 이상 지원되지 않습니다.');
  } catch (error) {
    console.error('개발자 프로필 분석 오류:', error);
    
    // 오류 발생 시 명확한 오류 메시지와 함께 빈 응답 반환
    return {
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      message: '개발자 프로필 분석 기능은 더 이상 지원되지 않습니다.'
    };
  }
}

// 개발 패턴 분석 (규칙 기반)
function analyzeDevelopmentPattern(promptData: {
  commits?: CommitData[];
  userLogin?: string;
}): DevelopmentPatternResult {
  try {
    console.log('API 서버에서 개발 패턴 분석 중...');
    const commits = promptData?.commits || [];
    const userLogin = promptData?.userLogin || '';
    
    if (!commits || commits.length === 0) {
      console.log('분석할 커밋 데이터가 없습니다.');
      throw new Error('분석할 커밋 데이터가 없습니다.');
    }
    
    // 최소 데이터 요구사항 확인 (의미 있는 분석을 위해 최소 5개의 커밋 필요)
    if (commits.length < 5) {
      console.log('의미 있는 분석을 위한 커밋 데이터가 부족합니다.');
      throw new Error(`${commits.length}개의 커밋이 있습니다. 의미있는 분석을 위해 더 많은 커밋 데이터가 필요합니다.`);
    }
    
    // 커밋 구조 로깅으로 디버깅
    console.log('개발 패턴 분석을 위한 커밋 데이터 구조:', JSON.stringify(commits[0]).substring(0, 200) + '...');

    // 시간대별 커밋 분포 분석 - 더 세분화된 시간대
    const hourlyDistribution: Record<number, number> = {};
    // 0-23시까지 초기화
    for (let i = 0; i < 24; i++) {
      hourlyDistribution[i] = 0;
    }
    
    // 요일별 커밋 분포
    const weekdayDistribution: Record<string, number> = {
      '월요일': 0,
      '화요일': 0,
      '수요일': 0,
      '목요일': 0,
      '금요일': 0,
      '토요일': 0,
      '일요일': 0
    };
    
    // 요일 이름 얻기
    const getWeekdayName = (day: number): string => {
      const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      return weekdays[day];
    };
    
    // 커밋 간격 분석을 위한 날짜 저장
    const commitDates: Date[] = [];
    
    // 커밋 메시지 분석
    const messagePatterns = {
      feature: 0,
      bugfix: 0,
      refactor: 0,
      docs: 0,
      test: 0,
      chore: 0,
      style: 0
    };
    
    // 커밋 크기 패턴
    const commitSizes = {
      small: 0,  // 10줄 미만
      medium: 0, // 10-50줄
      large: 0   // 50줄 이상
    };
    
    // 기여자 분포
    const contributors: Record<string, number> = {};
    
    // 커밋 데이터 분석
    commits.forEach((commit: any) => {
      // 시간 분석 (날짜가 있는 경우)
      try {
        const commitDate = 
          commit.date || 
          (commit.commit && commit.commit.author && commit.commit.author.date) ||
          (commit.commit && commit.commit.committer && commit.commit.committer.date);
        
        if (commitDate) {
          const date = new Date(commitDate);
          
          // 시간대별 분포
          const hour = date.getHours();
          hourlyDistribution[hour]++;
          
          // 요일별 분포
          const weekday = date.getDay();
          weekdayDistribution[getWeekdayName(weekday)]++;
          
          // 날짜 저장
          commitDates.push(date);
        }
      } catch (dateError) {
        console.warn('커밋 날짜 처리 오류:', dateError);
      }
      
      // 커밋 메시지 분석
      const message = (commit.message || (commit.commit && commit.commit.message) || '').toLowerCase();
      
      if (message.includes('feat') || message.includes('feature') || message.includes('add') || message.includes('new')) {
        messagePatterns.feature++;
      }
      if (message.includes('fix') || message.includes('bug') || message.includes('issue') || message.includes('resolve')) {
        messagePatterns.bugfix++;
      }
      if (message.includes('refactor') || message.includes('clean') || message.includes('improve') || message.includes('perf')) {
        messagePatterns.refactor++;
      }
      if (message.includes('doc') || message.includes('readme') || message.includes('comment')) {
        messagePatterns.docs++;
      }
      if (message.includes('test') || message.includes('spec') || message.includes('unit')) {
        messagePatterns.test++;
      }
      if (message.includes('chore') || message.includes('build') || message.includes('ci') || message.includes('tool')) {
        messagePatterns.chore++;
      }
      if (message.includes('style') || message.includes('format') || message.includes('lint')) {
        messagePatterns.style++;
      }
      
      // 커밋 크기 분석
      const additions = commit.additions || (commit.stats && commit.stats.additions) || 0;
      const deletions = commit.deletions || (commit.stats && commit.stats.deletions) || 0;
      const totalChanges = additions + deletions;
      
      if (totalChanges < 10) {
        commitSizes.small++;
      } else if (totalChanges < 50) {
        commitSizes.medium++;
      } else {
        commitSizes.large++;
      }
      
      // 기여자 분석
      const author = commit.author || (commit.commit && commit.commit.author && commit.commit.author.name) || 'unknown';
      contributors[author] = (contributors[author] || 0) + 1;
    });

    // 시간대 분석
    const hoursByActivity: Array<[number, number]> = Object.entries(hourlyDistribution)
      .map(([hour, count]): [number, number] => [parseInt(hour), count])
      .sort((a, b) => b[1] - a[1]); // 활동량 내림차순
      
    // 가장 활발한 시간대 (상위 3개)
    const mostActiveHours = hoursByActivity.slice(0, 3).map(([hour]) => hour);
    // 가장 활발한 시간
    const mostActiveHour = mostActiveHours[0];
    
    // 활동이 집중된 시간대 설명
    let timeRangeDescription = '';
    
    if (mostActiveHours.length > 0) {
      // 시간이 연속된 경우 (예: 10, 11, 12시)
      const isSequential = mostActiveHours.every((hour, index, arr) => 
        index === 0 || Math.abs(hour - arr[index - 1]) === 1 || Math.abs(hour - arr[index - 1]) === 23
      );
      
      // 활동 시간대 구분 (아침/오전/오후/저녁/밤)
      if (isSequential) {
        const startHour = Math.min(...mostActiveHours);
        const endHour = Math.max(...mostActiveHours);
        
        if ((startHour >= 9 && endHour <= 17) || (startHour >= 10 && endHour <= 18)) {
          timeRangeDescription = '주로 오전 10시에서 오후 5시 사이에 작업합니다.';
        } else if (startHour >= 8 && endHour <= 13) {
          timeRangeDescription = '주로 오전 시간대에 활발히 작업합니다.';
        } else if (startHour >= 13 && endHour <= 18) {
          timeRangeDescription = '주로 오후 시간대에 활발히 작업합니다.';
        } else if ((startHour >= 18 && endHour <= 23) || (startHour >= 19 && endHour <= 22)) {
          timeRangeDescription = '주로 저녁 시간대에 활발히 작업합니다.';
        } else if ((startHour >= 22 || startHour <= 2) || (startHour >= 23 || startHour <= 3)) {
          timeRangeDescription = '주로 늦은 밤과 새벽 시간대에 활발히 작업합니다.';
        } else {
          timeRangeDescription = `주로 ${startHour}시에서 ${endHour}시 사이에 활발히 작업합니다.`;
        }
      } else {
        // 비연속적인 시간대인 경우
        const timeDescriptions = mostActiveHours.map(hour => {
          if (hour >= 5 && hour < 9) return '이른 아침';
          if (hour >= 9 && hour < 12) return '오전';
          if (hour >= 12 && hour < 18) return '오후';
          if (hour >= 18 && hour < 22) return '저녁';
          return '늦은 밤';
        });
        
        // 중복 제거
        const uniqueTimeDescriptions = Array.from(new Set(timeDescriptions));
        timeRangeDescription = `주로 ${uniqueTimeDescriptions.join('과 ')} 시간대에 활발히 작업합니다.`;
      }
    } else {
      timeRangeDescription = '특정 시간대에 집중된 작업 패턴이 발견되지 않았습니다.';
    }
    
    // 요일 분석
    const weekdaysByActivity = Object.entries(weekdayDistribution)
      .sort((a, b) => b[1] - a[1]); // 활동량 내림차순
    
    const mostActiveWeekday = weekdaysByActivity[0][0];
    
    // 주중/주말 패턴
    const weekdayActivity = weekdayDistribution['월요일'] + weekdayDistribution['화요일'] + 
                            weekdayDistribution['수요일'] + weekdayDistribution['목요일'] + weekdayDistribution['금요일'];
    const weekendActivity = weekdayDistribution['토요일'] + weekdayDistribution['일요일'];
    
    let dayOfWeekPattern = '';
    if (weekdayActivity > weekendActivity * 3) {
      dayOfWeekPattern = '주로 평일에 작업하는 패턴을 보입니다.';
    } else if (weekendActivity > weekdayActivity) {
      dayOfWeekPattern = '주로 주말에 작업하는 패턴을 보입니다.';
    } else {
      dayOfWeekPattern = '평일과 주말에 고르게 작업하는 패턴을 보입니다.';
    }
    
    // 커밋 간격 분석
    let commitIntervals: number[] = [];
    if (commitDates.length > 1) {
      // 날짜순 정렬
      commitDates.sort((a, b) => a.getTime() - b.getTime());
      
      // 각 커밋 사이의 간격 계산 (일 단위)
      for (let i = 1; i < commitDates.length; i++) {
        const diffTime = Math.abs(commitDates[i].getTime() - commitDates[i-1].getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        commitIntervals.push(diffDays);
      }
    }
    
    // 평균 커밋 간격
    const avgCommitInterval = commitIntervals.length > 0 
      ? commitIntervals.reduce((sum, interval) => sum + interval, 0) / commitIntervals.length 
      : 0;
    
    // 커밋 빈도 문자열 생성
    let commitFrequencyDesc = '';
    if (commits.length < 10) {
      commitFrequencyDesc = '데이터가 제한적이지만, 간헐적으로 커밋하는 패턴을 보입니다.';
    } else if (avgCommitInterval < 1) {
      commitFrequencyDesc = '매우 활발하게 커밋하며, 대체로 하루에 여러 번 커밋합니다.';
    } else if (avgCommitInterval < 2) {
      commitFrequencyDesc = '활발하게 커밋하며, 대체로 매일 커밋합니다.';
    } else if (avgCommitInterval < 4) {
      commitFrequencyDesc = '정기적으로 커밋하며, 대체로 2-3일마다 커밋합니다.';
    } else if (avgCommitInterval < 8) {
      commitFrequencyDesc = '주기적으로 커밋하며, 일반적으로 주 1-2회 커밋합니다.';
    } else {
      commitFrequencyDesc = '간헐적으로 커밋하는 패턴을 보입니다.';
    }
    
    // 개발 사이클 분석
    let developmentCycleDesc = '';
    
    // 메시지 패턴 기반 개발 사이클 추론
    const featureRatio = messagePatterns.feature / commits.length;
    const bugfixRatio = messagePatterns.bugfix / commits.length;
    const refactorRatio = messagePatterns.refactor / commits.length;
    
    if (featureRatio > 0.4 && bugfixRatio > 0.3) {
      developmentCycleDesc = '갈고리 방식의 개발 사이클로, 피처 추가 후 버그 수정 주기가 반복됩니다.';
    } else if (featureRatio > 0.5 && refactorRatio > 0.2) {
      developmentCycleDesc = '점진적 개발 방식으로, 기능 추가와 코드 개선이 꾸준히 이루어집니다.';
    } else if (bugfixRatio > 0.5) {
      developmentCycleDesc = '유지보수 중심의 개발 패턴으로, 주로 버그 수정에 집중합니다.';
    } else if (refactorRatio > 0.3) {
      developmentCycleDesc = '코드 품질 중심의 개발 패턴으로, 리팩토링과 구조 개선에 중점을 둡니다.';
    } else if (messagePatterns.docs > commits.length * 0.3) {
      developmentCycleDesc = '문서화 중심의 개발 패턴으로, 코드 문서화에 많은 노력을 기울입니다.';
    } else {
      developmentCycleDesc = '균형 잡힌 개발 사이클로, 다양한 유형의 개발 활동이 골고루 이루어집니다.';
    }
    
    // 커밋 크기 기반 추가 분석
    if (commitSizes.small > commits.length * 0.7) {
      developmentCycleDesc += ' 작은 단위로 자주 커밋하는 점진적 개발 방식을 선호합니다.';
    } else if (commitSizes.large > commits.length * 0.4) {
      developmentCycleDesc += ' 큰 변경사항을 한 번에 커밋하는 배치 스타일의 개발 방식을 보입니다.';
    }
    
    // 팀 역학 분석
    const contributorCount = Object.keys(contributors).length;
    const authorCommitRatio = contributors[userLogin] ? contributors[userLogin] / commits.length : 0;
    
    let teamDynamicsDesc = '';
    if (contributorCount <= 1) {
      teamDynamicsDesc = '독립적인 개발 패턴을 보이며, 주로 단독으로 작업합니다.';
    } else if (contributorCount < 3) {
      teamDynamicsDesc = '소규모 팀에서의 협업 패턴을 보입니다.';
    } else if (contributorCount < 5) {
      teamDynamicsDesc = '중간 규모 팀에서의 협업 패턴을 보입니다.';
    } else {
      teamDynamicsDesc = '큰 규모의 팀에서 협업하는 패턴을 보입니다.';
    }
    
    if (authorCommitRatio > 0.8) {
      teamDynamicsDesc += ' 대부분의 개발 작업을 직접 수행하는 주도적인 역할을 합니다.';
    } else if (authorCommitRatio > 0.5) {
      teamDynamicsDesc += ' 팀에서 중요한 기여를 하며 적극적으로 참여합니다.';
    } else if (authorCommitRatio > 0.3) {
      teamDynamicsDesc += ' 팀원들과 균형 있게 협업하는 패턴을 보입니다.';
    }
    
    // 파일 유형 분석
    const fileTypes = new Set<string>();
    commits.forEach((commit: any) => {
      if (commit.files && Array.isArray(commit.files)) {
        commit.files.forEach((file: any) => {
          // file이 문자열이거나 객체일 수 있으므로 두 경우 모두 처리
          const filename = typeof file === 'string' ? file : (file.filename || file.path || '');
          const extension = filename.split('.').pop()?.toLowerCase();
          if (extension) fileTypes.add(extension);
        });
      }
    });

    // 주요 집중 영역 결정
    const focusAreas: string[] = [];
    
    // 파일 확장자 기반 집중 영역 결정
    if (fileTypes.has('js') || fileTypes.has('ts') || fileTypes.has('jsx') || fileTypes.has('tsx')) {
      focusAreas.push('JavaScript/TypeScript 개발');
    }
    if (fileTypes.has('py')) focusAreas.push('Python 개발');
    if (fileTypes.has('java')) focusAreas.push('Java 개발');
    if (fileTypes.has('html') || fileTypes.has('css') || fileTypes.has('scss')) focusAreas.push('웹 프론트엔드 개발');
    if (fileTypes.has('php')) focusAreas.push('PHP 개발');
    if (fileTypes.has('go')) focusAreas.push('Go 개발');
    if (fileTypes.has('rb')) focusAreas.push('Ruby 개발');
    if (fileTypes.has('cs')) focusAreas.push('C# 개발');
    if (fileTypes.has('cpp') || fileTypes.has('c') || fileTypes.has('h')) focusAreas.push('C/C++ 개발');
    if (fileTypes.has('md') || fileTypes.has('txt')) focusAreas.push('문서화');
    if (fileTypes.has('json') || fileTypes.has('yml') || fileTypes.has('yaml')) focusAreas.push('설정 관리');
    if (fileTypes.has('sql')) focusAreas.push('데이터베이스 관리');
    if (fileTypes.has('test.js') || fileTypes.has('test.ts') || fileTypes.has('spec.js')) focusAreas.push('테스트 작성');

    // 메시지 패턴 기반 추가 분석
    if (messagePatterns.docs > commits.length * 0.2) focusAreas.push('문서화');
    if (messagePatterns.test > commits.length * 0.2) focusAreas.push('테스트 및 품질 관리');
    if (messagePatterns.refactor > commits.length * 0.2) focusAreas.push('코드 리팩토링 및 유지보수');
    if (messagePatterns.feature > commits.length * 0.3) focusAreas.push('새로운 기능 개발');
    if (messagePatterns.bugfix > commits.length * 0.3) focusAreas.push('버그 수정 및 안정화');

    if (focusAreas.length === 0) {
      focusAreas.push('명확한 집중 영역이 분석되지 않았습니다.');
    }

    // 최종 결과 구성
    return {
      peakProductivityTime: timeRangeDescription,
      commitFrequency: commitFrequencyDesc,
      codeReviewStyle: commits.length < 15 ? '데이터가 부족하여 코드 리뷰 패턴을 분석할 수 없습니다.' : 
                      contributorCount > 2 ? '팀원 간의 활발한 협업이 이루어지며, 코드 리뷰가 정기적으로 진행되는 것으로 보입니다.' : 
                      '소규모 개발 환경에서 간소화된 코드 리뷰 프로세스를 사용하는 것으로 보입니다.',
      iterationSpeed: developmentCycleDesc,
      focusAreas,
      workPatterns: {
        time: timeRangeDescription,
        dayOfWeek: dayOfWeekPattern,
        mostActiveDay: mostActiveWeekday,
        mostActiveHour: mostActiveHour || 0
      },
      teamDynamics: teamDynamicsDesc,
      developmentCycle: developmentCycleDesc
    };
  } catch (error) {
    console.error('개발 패턴 분석 오류:', error);
    
    // 오류 시 기본 응답
    return {
      peakProductivityTime: '데이터 분석 중 오류가 발생했습니다',
      commitFrequency: '데이터 분석 중 오류가 발생했습니다',
      codeReviewStyle: '데이터 분석 중 오류가 발생했습니다',
      iterationSpeed: '데이터 분석 중 오류가 발생했습니다',
      focusAreas: ['데이터 분석 중 오류가 발생했습니다'],
      workPatterns: {
        time: '데이터 분석 중 오류가 발생했습니다',
        dayOfWeek: '데이터 분석 중 오류가 발생했습니다',
        mostActiveDay: '',
        mostActiveHour: 0
      },
      teamDynamics: '데이터 분석 중 오류가 발생했습니다',
      developmentCycle: '데이터 분석 중 오류가 발생했습니다'
    };
  }
} 