import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeCommitMessages,
  analyzeCodeChanges,
  getModelStatus
} from '@/lib/modelUtils.client';
import { ANALYSIS_CONFIG } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
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
      const limitedMessages = messages.slice(0, ANALYSIS_CONFIG.MAX_COMMITS_TO_ANALYZE);
      
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
      const limitedChanges = changes.slice(0, ANALYSIS_CONFIG.MAX_FILES_TO_ANALYZE);
      
      console.log(`📁 코드 분석 API 호출됨 - ${limitedChanges.length}개 파일 분석 시작`);
      
      // 분석 수행
      const result = await analyzeCodeChanges(limitedChanges);
      
      console.log(`✅ 코드 분석 완료 - 결과:`, JSON.stringify(result, null, 2).substring(0, 300) + '...');
      
      // 결과 반환
      return NextResponse.json(result);
    }
    else if (prompt) {
      // 기존 프롬프트 기반 분석

      // 모델 상태 확인
      const modelStatus = await getModelStatus();
      console.log('현재 분석 모드:', modelStatus.mode);
      
      // 모델 타입에 따른 처리
      let result;
      switch (type) {
        case 'developerProfile':
          try {
            const result = analyzeDeveloperProfile(prompt);
            return NextResponse.json(result);
          } catch (error) {
            console.error('개발자 프로필 분석 오류:', error);
            return NextResponse.json({ error: '개발자 프로필 분석 중 오류가 발생했습니다.' }, { status: 500 });
          }
          
        case 'developmentPattern':
          try {
            const result = analyzeDevelopmentPattern(prompt);
            return NextResponse.json(result);
          } catch (error) {
            console.error('개발 패턴 분석 오류:', error);
            return NextResponse.json({ error: '개발 패턴 분석 중 오류가 발생했습니다.' }, { status: 500 });
          }
          
        case 'codeReview':
          // 코드 리뷰 분석 로직
          // ... existing code ...
          break;
        default:
          // 기본 분석 로직
          // ... 기존 코드 유지 ...
      }
      
      return NextResponse.json(result);
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
function analyzeDeveloperProfile(promptData: any) {
  try {
    console.log('개발자 프로필 기능이 비활성화되었습니다.');
    
    // 기본 응답 반환 (개인 분석 기준)
    return {
      workStyle: '개발자 프로필 분석 기능이 비활성화되었습니다.',
      strengths: ['이 기능은 더 이상 사용할 수 없습니다.'],
      growthAreas: ['이 기능은 더 이상 사용할 수 없습니다.'],
      collaborationPattern: '기능 비활성화',
      communicationStyle: '기능 비활성화',
      skills: {
        '기술 역량': 0,
        '문제 해결': 0,
        '코드 품질': 0, 
        '생산성': 0,
        '적응력': 0
      }
    };
  } catch (error) {
    console.error('개발자 프로필 분석 오류:', error);
    
    // 오류 시 기본 응답 (개인 분석 기준)
    return {
      workStyle: '개발자 프로필 분석 기능이 비활성화되었습니다.',
      strengths: ['이 기능은 더 이상 사용할 수 없습니다.'],
      growthAreas: ['이 기능은 더 이상 사용할 수 없습니다.'],
      collaborationPattern: '기능 비활성화',
      communicationStyle: '기능 비활성화',
      skills: {
        '기술 역량': 0,
        '문제 해결': 0,
        '코드 품질': 0,
        '생산성': 0,
        '적응력': 0
      }
    };
  }
}

// 개발 패턴 분석 (규칙 기반)
function analyzeDevelopmentPattern(promptData: any) {
  try {
    console.log('API 서버에서 개발 패턴 분석 중...');
    const commits = promptData?.commits || [];
    
    if (!commits || commits.length === 0) {
      console.log('분석할 커밋 데이터가 없습니다. 기본 응답을 반환합니다.');
      return {
        peakProductivityTime: '데이터가 부족하여 정확한 분석이 어렵습니다',
        commitFrequency: '데이터가 부족하여 정확한 분석이 어렵습니다',
        codeReviewStyle: '데이터가 부족하여 정확한 분석이 어렵습니다',
        iterationSpeed: '데이터가 부족하여 정확한 분석이 어렵습니다',
        focusAreas: ['데이터가 부족하여 정확한 분석이 어렵습니다']
      };
    }
    
    // 최소 데이터 요구사항 확인 (의미 있는 분석을 위해 최소 10개의 커밋 필요)
    if (commits.length < 10) {
      console.log('의미 있는 분석을 위한 커밋 데이터가 부족합니다. 제한된 응답을 반환합니다.');
      return {
        peakProductivityTime: '데이터가 부족하여 정확한 분석이 어렵습니다',
        commitFrequency: `${commits.length}개의 커밋이 있습니다. 의미있는 분석을 위해 최소 10개 이상의 커밋이 필요합니다.`,
        codeReviewStyle: '데이터가 부족하여 정확한 분석이 어렵습니다',
        iterationSpeed: '데이터가 부족하여 정확한 분석이 어렵습니다',
        focusAreas: ['데이터가 부족하여 정확한 분석이 어렵습니다']
      };
    }
    
    // 커밋 구조 로깅으로 디버깅
    console.log('개발 패턴 분석을 위한 커밋 데이터 구조:', JSON.stringify(commits[0]).substring(0, 200) + '...');

    // 시간대별 커밋 분포 분석
    const timeDistribution: Record<string, number> = {
      morning: 0,   // 6-12시
      afternoon: 0, // 12-18시
      evening: 0,   // 18-24시
      night: 0      // 0-6시
    };
    
    // 커밋 메시지 분석
    const messagePatterns = {
      feature: 0,
      bugfix: 0,
      refactor: 0,
      docs: 0,
      test: 0
    };
    
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
          const hour = date.getHours();
          
          if (hour >= 6 && hour < 12) timeDistribution.morning++;
          else if (hour >= 12 && hour < 18) timeDistribution.afternoon++;
          else if (hour >= 18 && hour < 24) timeDistribution.evening++;
          else timeDistribution.night++;
        }
      } catch (dateError) {
        console.warn('커밋 날짜 처리 오류:', dateError);
      }
      
      // 커밋 메시지 분석
      const message = (commit.message || (commit.commit && commit.commit.message) || '').toLowerCase();
      
      if (message.includes('feat') || message.includes('feature') || message.includes('add')) {
        messagePatterns.feature++;
      }
      if (message.includes('fix') || message.includes('bug') || message.includes('issue')) {
        messagePatterns.bugfix++;
      }
      if (message.includes('refactor') || message.includes('clean') || message.includes('improve')) {
        messagePatterns.refactor++;
      }
      if (message.includes('doc') || message.includes('readme') || message.includes('comment')) {
        messagePatterns.docs++;
      }
      if (message.includes('test') || message.includes('spec') || message.includes('unit')) {
        messagePatterns.test++;
      }
    });

    // 가장 활발한 시간대 찾기
    let peakHour = 0;
    let maxCount = 0;
    Object.entries(timeDistribution).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = parseInt(hour);
      }
    });

    // 시간대 문자열로 변환
    let peakTimeDesc = '';
    if (timeDistribution.morning > 0) {
      peakTimeDesc = '오전';
    } else if (timeDistribution.afternoon > 0) {
      peakTimeDesc = '오후';
    } else if (timeDistribution.evening > 0) {
      peakTimeDesc = '저녁';
    } else {
      peakTimeDesc = '심야';
    }

    // 커밋 빈도 계산
    const commitFrequency = commits.length < 10 ? '데이터가 부족하여 정확한 분석이 어렵습니다' : 
                           commits.length < 30 ? '중간 빈도' : '높은 빈도';

    // 파일 유형 분석 (실제로는 더 정교한 분석 필요)
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
    
    // 충분한 데이터가 있는 경우에만 집중 영역 분석
    if (commits.length >= 10) {
      if (fileTypes.has('js') || fileTypes.has('ts')) focusAreas.push('프런트엔드 개발');
      if (fileTypes.has('py') || fileTypes.has('java')) focusAreas.push('백엔드 개발');
      if (fileTypes.has('css') || fileTypes.has('scss')) focusAreas.push('UI 개발');
      if (fileTypes.has('test.js') || fileTypes.has('test.ts') || fileTypes.has('spec.js')) focusAreas.push('테스트 작성');
      if (fileTypes.has('md') || fileTypes.has('txt')) focusAreas.push('문서화');
    }

    if (focusAreas.length === 0) {
      focusAreas.push('데이터가 부족하여 정확한 분석이 어렵습니다');
    }

    // 결과 반환
    return {
      peakProductivityTime: commits.length < 10 ? '데이터가 부족하여 정확한 분석이 어렵습니다' : `${peakTimeDesc} 시간대에 가장 활발한 개발 활동을 보입니다.`,
      commitFrequency: commitFrequency,
      codeReviewStyle: commits.length < 15 ? '데이터가 부족하여 정확한 분석이 어렵습니다' : '정기적인 코드 리뷰',
      iterationSpeed: commits.length < 10 ? '데이터가 부족하여 정확한 분석이 어렵습니다' : commits.length < 20 ? '느린 반복 개발 속도' : '빠른 반복 개발 속도',
      focusAreas
    };
  } catch (error) {
    console.error('개발 패턴 분석 오류:', error);
    
    // 오류 시 기본 응답
    return {
      peakProductivityTime: '데이터가 부족하여 정확한 분석이 어렵습니다',
      commitFrequency: '데이터가 부족하여 정확한 분석이 어렵습니다',
      codeReviewStyle: '데이터가 부족하여 정확한 분석이 어렵습니다',
      iterationSpeed: '데이터가 부족하여 정확한 분석이 어렵습니다',
      focusAreas: ['데이터가 부족하여 정확한 분석이 어렵습니다']
    };
  }
} 