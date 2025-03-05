'use client'

import { getRepositoryCommits, getRepositoryLanguages } from './github';
import { 
  getModelStatus, 
  analyzeCommitMessages, 
  analyzeCodeChanges 
} from './modelUtils.client';
import { AnalysisResult } from '../types/analysis';

// 모듈화된 분석 기능 가져오기
import { analyzeCommitMessage, analyzeDevelopmentPattern } from './analyzerModules/commitAnalyzer';
import { inferDomainFromLanguages, analyzeProjectCharacteristics } from './analyzerModules/domainAnalyzer';
import { 
  extractDeveloperInsights, 
  extractKeyFeatures, 
  generateRecommendations,
  generateProjectSummary 
} from './analyzerModules/insightGenerator';

// Re-export AnalysisResult type
export type { AnalysisResult };

// 활동 기간 계산 함수
function getActivityPeriod(commits: any[]): string {
  if (commits.length === 0) return '활동 정보 없음';
  
  const firstCommitDate = new Date(commits[commits.length - 1].commit.author.date);
  const lastCommitDate = new Date(commits[0].commit.author.date);
  
  const diffMonths = (lastCommitDate.getFullYear() - firstCommitDate.getFullYear()) * 12 + 
                    (lastCommitDate.getMonth() - firstCommitDate.getMonth());
  
  if (diffMonths < 1) {
    const diffDays = Math.round((lastCommitDate.getTime() - firstCommitDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${diffDays}일 동안 활동`;
  } else if (diffMonths < 12) {
    return `${diffMonths}개월 동안 활동`;
  } else {
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    
    if (months === 0) {
      return `${years}년 동안 활동`;
    } else {
      return `${years}년 ${months}개월 동안 활동`;
    }
  }
}

// 분석 진행상황 업데이트 함수
async function updateAnalysisProgress(
  owner: string,
  repo: string,
  progress: number,
  stage: 'preparing' | 'fetching' | 'analyzing' | 'finalizing',
  completed: boolean = false,
  error?: { message: string },
  result?: any
) {
  try {
    const response = await fetch(`/api/analysis/progress/${owner}/${repo}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        progress,
        stage,
        completed,
        error,
        result
      }),
    });
    
    if (!response.ok) {
      console.error('분석 진행상황 업데이트 실패');
    }
  } catch (err) {
    console.error('분석 진행상황 업데이트 중 오류:', err);
  }
}

// PR 정보 가져오기
async function fetchPullRequests(accessToken: string, owner: string, repo: string): Promise<any[]> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      console.error('PR 정보 가져오기 실패:', response.statusText);
      return [];
    }
    
    const pullRequests = await response.json();
    return pullRequests;
  } catch (error) {
    console.error('PR 정보 가져오기 중 오류:', error);
    return [];
  }
}

// 이슈 정보 가져오기
async function fetchIssues(accessToken: string, owner: string, repo: string): Promise<any[]> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      console.error('이슈 정보 가져오기 실패:', response.statusText);
      return [];
    }
    
    const issues = await response.json();
    // PR은 이슈 API에서도 반환되므로 필터링
    return issues.filter((issue: any) => !issue.pull_request);
  } catch (error) {
    console.error('이슈 정보 가져오기 중 오류:', error);
    return [];
  }
}

// 개발자 프로필 분석
async function analyzeDeveloperProfile(
  commits: any[], 
  owner: string, 
  repo: string
): Promise<AnalysisResult['developerProfile']> {
  // 기여자 정보 분석
  const contributors = new Map<string, { name: string, email: string, count: number }>();
  
  commits.forEach(commit => {
    const author = commit.commit.author;
    const email = author.email;
    
    if (!contributors.has(email)) {
      contributors.set(email, {
        name: author.name,
        email: email,
        count: 1
      });
    } else {
      const current = contributors.get(email)!;
      contributors.set(email, {
        ...current,
        count: current.count + 1
      });
    }
  });
  
  // 총 커밋 수 계산
  const totalCommits = commits.length;
  
  // 기여자 목록 및 비율 계산
  const contributorsList = Array.from(contributors.values()).map(contributor => {
    return {
      author: contributor.name,
      email: contributor.email,
      commits: contributor.count,
      percentage: (contributor.count / totalCommits) * 100
    };
  }).sort((a, b) => b.commits - a.commits);
  
  // 커밋 분석
  const commitCategories: Record<string, number> = {};
  
  // 커밋 메시지 기반 카테고리 분류
  for (const commit of commits) {
    const message = commit.commit.message;
    const category = await analyzeCommitMessage(message);
    
    commitCategories[category] = (commitCategories[category] || 0) + 1;
  }
  
  return {
    totalCommits,
    contributors: contributorsList,
    commitCategories,
    activityPeriod: getActivityPeriod(commits)
  };
}

// 메인 분석 함수
export async function analyzeRepository(
  accessToken: string,
  owner: string,
  repo: string,
  options?: {
    personalAnalysis?: boolean;
    userLogin?: string;
    userEmail?: string;
  }
): Promise<AnalysisResult> {
  // 기본 옵션 설정
  const isPersonalAnalysis = options?.personalAnalysis ?? true;
  const userLogin = options?.userLogin;
  const userEmail = options?.userEmail;
  
  // 분석 시작 로그
  console.log(`저장소 ${owner}/${repo} 분석 시작...`);
  
  try {
    // 분석 진행상황 업데이트 - 준비 단계
    await updateAnalysisProgress(owner, repo, 0, 'preparing');
    
    // 데이터 가져오기
    await updateAnalysisProgress(owner, repo, 10, 'fetching');
    
    // 커밋 이력 가져오기
    console.log('커밋 이력 가져오는 중...');
    const commits = await getRepositoryCommits(accessToken, owner, repo);
    
    if (!commits || commits.length === 0) {
      throw new Error('커밋 이력을 가져올 수 없습니다.');
    }
    
    // 개인 분석인 경우 사용자 커밋만 필터링
    const filteredCommits = isPersonalAnalysis && userEmail 
      ? commits.filter(commit => {
          const authorEmail = commit.commit.author.email;
          return authorEmail === userEmail;
        })
      : commits;
    
    if (filteredCommits.length === 0) {
      throw new Error('해당 사용자의 커밋이 없습니다.');
    }
    
    console.log(`총 ${filteredCommits.length}개의 커밋을 가져왔습니다.`);
    
    // 언어 통계 가져오기
    console.log('언어 통계 가져오는 중...');
    const languages = await getRepositoryLanguages(accessToken, owner, repo);
    
    // PR 및 이슈 정보 가져오기 (옵션)
    const [pullRequests, issues] = await Promise.all([
      fetchPullRequests(accessToken, owner, repo),
      fetchIssues(accessToken, owner, repo)
    ]);
    
    // 데이터 분석 시작
    await updateAnalysisProgress(owner, repo, 30, 'analyzing');
    
    // 1. 개발자 프로필 분석
    console.log('개발자 프로필 분석 중...');
    const developerProfile = await analyzeDeveloperProfile(filteredCommits, owner, repo);
    
    // 2. 프로젝트 도메인 분석
    console.log('프로젝트 도메인 분석 중...');
    const domains = inferDomainFromLanguages(languages);
    
    // 3. 기술 스택 분석
    console.log('기술 스택 분석 중...');
    // 언어를 기술 스택 형식으로 변환
    const techStack = Object.entries(languages).map(([language, bytes]) => {
      return {
        name: language,
        type: 'language',
        usage: bytes,
        confidence: 1.0 // 언어 사용량은 GitHub API에서 직접 가져오므로 신뢰도 100%
      };
    }).sort((a, b) => b.usage - a.usage);
    
    // 4. 프로젝트 특성 분석
    console.log('프로젝트 특성 분석 중...');
    const characteristics = analyzeProjectCharacteristics(filteredCommits, developerProfile.commitCategories);
    
    // 5. 개발 패턴 분석
    console.log('개발 패턴 분석 중...');
    const developmentPattern = analyzeDevelopmentPattern(filteredCommits);
    
    // 6. 핵심 기능 추출
    console.log('핵심 기능 추출 중...');
    const keyFeatures = extractKeyFeatures(filteredCommits, domains, techStack);
    
    // 7. 개발자 인사이트 추출
    console.log('개발자 인사이트 추출 중...');
    const insights = extractDeveloperInsights(filteredCommits, techStack, domains);
    
    // 8. 개선 권장사항 생성
    console.log('개선 권장사항 생성 중...');
    const recommendations = generateRecommendations(techStack, characteristics, domains);
    
    // 9. 프로젝트 요약 생성
    console.log('프로젝트 요약 생성 중...');
    const summary = generateProjectSummary(
      techStack, 
      domains, 
      filteredCommits, 
      keyFeatures, 
      developerProfile.contributors,
      isPersonalAnalysis,
      userLogin
    );
    
    // 분석 결과 구성
    await updateAnalysisProgress(owner, repo, 90, 'finalizing');
    
    const result: AnalysisResult = {
      repositoryInfo: {
        owner,
        repo,
        isUserAnalysis: isPersonalAnalysis
      },
      developerProfile,
      techStack,
      domains,
      characteristics,
      developmentPattern: {
        commitFrequency: developmentPattern.commitFrequency,
        developmentCycle: developmentPattern.developmentCycle,
        teamDynamics: developmentPattern.teamDynamics,
        workPatterns: developmentPattern.workPatterns
      },
      keyFeatures,
      insights,
      recommendations,
      summary,
      meta: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    // 분석 완료
    await updateAnalysisProgress(owner, repo, 100, 'finalizing', true, undefined, result);
    console.log('저장소 분석 완료');
    
    return result;
    
  } catch (error: any) {
    console.error('저장소 분석 중 오류 발생:', error);
    
    // 오류 상태 업데이트
    await updateAnalysisProgress(
      owner, 
      repo, 
      100, 
      'finalizing', 
      true, 
      { message: error.message || '알 수 없는 오류가 발생했습니다.' }
    );
    
    // 기본 에러 결과 반환
    return {
      repositoryInfo: {
        owner,
        repo,
        isUserAnalysis: isPersonalAnalysis,
        error: error.message || '알 수 없는 오류가 발생했습니다.'
      },
      developerProfile: {
        totalCommits: 0,
        contributors: [],
        commitCategories: {},
        activityPeriod: '활동 정보 없음'
      },
      techStack: [],
      domains: [],
      characteristics: [],
      developmentPattern: {
        commitFrequency: '',
        developmentCycle: '',
        teamDynamics: '',
        workPatterns: {
          time: '',
          dayOfWeek: '',
          mostActiveDay: '',
          mostActiveHour: 0
        }
      },
      keyFeatures: [],
      insights: [],
      recommendations: [],
      summary: '분석 결과를 생성할 수 없습니다.',
      meta: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        error: error.message || '알 수 없는 오류가 발생했습니다.'
      }
    };
  }
} 