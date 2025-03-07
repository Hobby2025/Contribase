// 필요한 의존성 가져오기
import { Octokit } from '@octokit/rest';
import { analysisProgressCache } from '@/app/api/analysis/progress/route';

// 분석 결과 타입 정의
export interface AnalysisResult {
  repositoryInfo: {
    owner: string;
    repo: string;
    url: string;
    isUserAnalysis: boolean;
    userLogin?: string;
    aiAnalyzed: boolean;
    aiProjectType: string;
    error?: string;
  };
  developerProfile: {
    totalCommits: number;
    contributors: { author: string; email: string; commits: number; percentage: number }[];
    commitCategories: Record<string, number>;
    activityPeriod: string;
  };
  techStack: { name: string; type: string; usage: number; confidence: number }[];
  domains: string[];
  characteristics: { type: string; score: number; description: string }[];
  developmentPattern: {
    commitFrequency: string;
    developmentCycle: string;
    teamDynamics: string;
    workPatterns: { time: string; dayOfWeek: string; mostActiveDay: string; mostActiveHour: number };
  };
  keyFeatures: { title: string; description: string; importance: number }[];
  insights: { title: string; description: string }[];
  recommendations: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
  summary: string;
  codeQuality: number;
  codeQualityMetrics: { name: string; score: number; description: string }[];
  meta: {
    generatedAt: string;
    version: string;
    error?: string;
  };
}

// OpenAI 클라이언트 초기화
// 서버 환경에서만 OpenAI 인스턴스 생성
let openai: any;
if (typeof window === 'undefined') {
  const { OpenAI } = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  });
}

// 분석 진행 상태 업데이트
async function updateAnalysisProgress(
  owner: string,
  repo: string,
  progress: number,
  stage: 'preparing' | 'fetching' | 'analyzing' | 'finalizing',
  completed: boolean = false,
  error?: { message: string },
  result?: any,
  message?: string
) {
  console.log(`[분석 진행 상황] ${owner}/${repo} - ${stage} (${progress}%)`);
  
  try {
    // 브라우저 환경에서는 API 호출 생략
    if (typeof window !== 'undefined') {
      if (completed) {
        console.log(`[분석 완료] ${owner}/${repo}`);
      }
      
      if (error) {
        console.error(`[분석 오류] ${owner}/${repo} - ${error.message}`);
      }
      return;
    }
    
    // 기본 메시지 생성
    let statusMessage = message;
    if (!statusMessage) {
      if (stage === 'preparing') {
        statusMessage = '분석을 준비하는 중입니다...';
      } else if (stage === 'fetching') {
        statusMessage = 'GitHub에서 저장소 데이터를 가져오는 중입니다...';
      } else if (stage === 'analyzing') {
        statusMessage = `GPT-4 Mini로 코드를 분석하는 중입니다... (${progress}% 완료)`;
      } else if (stage === 'finalizing') {
        statusMessage = '분석 결과를 생성하는 중입니다. 곧 완료됩니다...';
      }
    }
    
    // 서버 환경에서는 서버 API 경로에 직접 접근하지 않고
    // 메모리에 저장 (여기서는 analysisProgressCache를 import해서 사용)
    const repoKey = `${owner}/${repo}`;
    try {
      // import한 캐시에 직접 접근
      analysisProgressCache[repoKey] = {
        progress,
        stage,
        completed,
        error,
        result,
        message: statusMessage,
        lastUpdated: Date.now()
      };
    } catch (cacheErr) {
      console.error('캐시 업데이트 오류:', cacheErr);
    }
    
    if (completed) {
      console.log(`[분석 완료] ${owner}/${repo}`);
    }
    
    if (error) {
      console.error(`[분석 오류] ${owner}/${repo} - ${error.message}`);
    }
  } catch (err) {
    console.error('진행 상황 업데이트 오류:', err);
  }
}

// 커밋 데이터 구조
interface CommitData {
  message: string;
  url: string;
  date: string;
  author: {
    name: string;
    email: string;
    login?: string;
  };
  stats?: {
    additions: number;
    deletions: number;
  };
  files?: Array<{
    filename: string;
    additions: number;
    deletions: number;
    patch?: string;
  }>;
}

// 저장소 커밋 가져오기
async function getRepositoryCommits(
  accessToken: string,
  owner: string,
  repo: string
): Promise<CommitData[]> {
  const octokit = new Octokit({ auth: accessToken });
  
  try {
    console.log(`[GitHub API] ${owner}/${repo} 저장소의 커밋 데이터를 가져오는 중...`);
    
    // 최대 100개의 커밋 가져오기
    const commits = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 100,
    });
    
    const detailedCommits: CommitData[] = [];
    
    // 각 커밋에 대한 상세 정보 가져오기 (최대 50개)
    for (const commit of commits.data.slice(0, 50)) {
      const detail = await octokit.repos.getCommit({
        owner,
        repo,
        ref: commit.sha,
      });
      
      detailedCommits.push({
        message: detail.data.commit.message,
        url: detail.data.html_url,
        date: detail.data.commit.author?.date || '',
        author: {
          name: detail.data.commit.author?.name || '',
          email: detail.data.commit.author?.email || '',
          login: detail.data.author?.login,
        },
        stats: {
          additions: detail.data.stats?.additions || 0,
          deletions: detail.data.stats?.deletions || 0,
        },
        files: detail.data.files?.map(file => ({
          filename: file.filename,
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch?.slice(0, 500), // 패치 내용 제한 (토큰 절약)
        })).slice(0, 10) || [], // 파일 수 제한 (토큰 절약)
      });
    }
    
    console.log(`[GitHub API] ${detailedCommits.length}개의 커밋 데이터 가져오기 완료`);
    return detailedCommits;
  } catch (error) {
    console.error('[GitHub API] 커밋 데이터 가져오기 실패:', error);
    throw new Error('저장소 커밋 데이터를 가져오는 중 오류가 발생했습니다.');
  }
}

// 저장소 정보와 의존성 가져오기
async function getRepositoryInfo(
  accessToken: string,
  owner: string,
  repo: string
): Promise<{
  description: string;
  topics: string[];
  dependencies: Record<string, string>;
  language: string;
  stars: number;
  forks: number;
}> {
  const octokit = new Octokit({ auth: accessToken });
  
  try {
    // 저장소 정보 가져오기
    const repoInfo = await octokit.repos.get({
      owner,
      repo,
    });
    
    // 저장소 언어 정보 가져오기
    const languages = await octokit.repos.listLanguages({
      owner,
      repo,
    });
    
    // 메인 언어 찾기
    const mainLanguage = Object.entries(languages.data)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])[0] || '';
    
    // package.json 파일 가져오기
    let dependencies: Record<string, string> = {};
    try {
      const packageJson = await octokit.repos.getContent({
        owner,
        repo,
        path: 'package.json',
      });
      
      if ('content' in packageJson.data && packageJson.data.content) {
        const content = Buffer.from(packageJson.data.content, 'base64').toString();
        const pkg = JSON.parse(content);
        dependencies = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {})
        };
      }
    } catch (err) {
      console.log('[저장소 분석] package.json 파일을 찾을 수 없습니다.');
    }
    
    return {
      description: repoInfo.data.description || '',
      topics: repoInfo.data.topics || [],
      dependencies,
      language: mainLanguage,
      stars: repoInfo.data.stargazers_count,
      forks: repoInfo.data.forks_count,
    };
  } catch (error) {
    console.error('[저장소 분석] 저장소 정보 가져오기 실패:', error);
    throw new Error('저장소 정보를 가져오는 중 오류가 발생했습니다.');
  }
}

// GPT-4 Mini를 사용한 저장소 분석
async function analyzeWithGPT(
  commits: CommitData[],
  repoInfo: {
    description: string;
    topics: string[];
    dependencies: Record<string, string>;
    language: string;
    stars: number;
    forks: number;
  },
  options: {
    personalAnalysis: boolean;
    userLogin?: string;
    userEmail?: string;
  }
): Promise<{
  projectType: string;
  summary: string;
  techStack: { name: string; type: string; confidence: number }[];
  keyFeatures: { title: string; description: string; importance: number }[];
  insights: { title: string; description: string }[];
  recommendations: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
  codeQuality: number;
  codeQualityMetrics: { name: string; score: number; description: string }[];
  domains: string[];
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
}> {
  // 브라우저 환경 확인
  if (typeof window !== 'undefined') {
    throw new Error('analyzeWithGPT 함수는 서버 환경에서만 실행할 수 있습니다.');
  }
  
  console.log('[GPT 분석] GPT-4 Mini로 프로젝트 분석 중...');
  
  // 커밋 데이터 요약
  const commitSummary = commits.map(commit => ({
    message: commit.message,
    date: commit.date,
    author: {
      name: commit.author.name,
      login: commit.author.login
    },
    stats: commit.stats,
    files: (commit.files || []).slice(0, 3).map(file => file.filename),
  }));
  
  // 파일 확장자 분석
  const fileExtensions = new Map<string, number>();
  commits.forEach(commit => {
    (commit.files || []).forEach(file => {
      const ext = file.filename.split('.').pop()?.toLowerCase() || 'unknown';
      fileExtensions.set(ext, (fileExtensions.get(ext) || 0) + 1);
    });
  });
  
  // 기여자 분석
  const contributors = new Map<string, { commits: number, email: string }>();
  commits.forEach(commit => {
    const author = commit.author.name;
    const email = commit.author.email;
    
    if (author && email) {
      if (!contributors.has(author)) {
        contributors.set(author, { commits: 1, email });
      } else {
        const data = contributors.get(author)!;
        contributors.set(author, { commits: data.commits + 1, email });
      }
    }
  });
  
  // GPT에 보낼 프롬프트 생성
  const userFocus = options.personalAnalysis && options.userLogin 
    ? `주 분석 대상은 GitHub 사용자 '${options.userLogin}'(이메일: '${options.userEmail || '불명'}')의 기여입니다.` 
    : '저장소 전체에 대한 분석입니다.';
    
  const prompt = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 GitHub 저장소를 심층 분석하는 AI 전문가입니다. 개발자에게 유용한 인사이트를 제공해야 합니다.
        
        아래 형식으로 JSON을 반환해주세요:
        {
          "projectType": "프로젝트 유형(예: 웹 애플리케이션, 라이브러리, CLI 도구 등)",
          "summary": "프로젝트에 대한 전체적인 요약 (3-4문장)",
          "techStack": [
            {"name": "기술명", "type": "language|framework|library|tool", "confidence": 0.95}
          ],
          "keyFeatures": [
            {"title": "기능 제목", "description": "설명", "importance": 0.9}
          ],
          "insights": [
            {"title": "인사이트 제목", "description": "설명"}
          ],
          "recommendations": [
            {"title": "추천 제목", "description": "설명", "priority": "high|medium|low"}
          ],
          "codeQuality": 85,
          "codeQualityMetrics": [
            {"name": "지표명", "score": 85, "description": "설명"}
          ],
          "domains": ["frontend", "backend", "database"],
          "developmentPattern": {
            "commitFrequency": "주기적/비주기적 설명",
            "developmentCycle": "개발 사이클 설명",
            "teamDynamics": "팀 역학 설명",
            "workPatterns": {
              "time": "주로 작업하는 시간대",
              "dayOfWeek": "주로 작업하는 요일",
              "mostActiveDay": "가장 활동적인 요일",
              "mostActiveHour": 14
            }
          }
        }`
      },
      {
        role: 'user',
        content: `다음 GitHub 저장소 정보를 분석하여 프로젝트를 종합적으로 분석해주세요. ${userFocus}
        
        # 저장소 정보
        ${repoInfo.description ? `설명: ${repoInfo.description}\n` : ''}
        주요 언어: ${repoInfo.language}
        스타: ${repoInfo.stars}개
        포크: ${repoInfo.forks}개
        ${repoInfo.topics.length > 0 ? `주제: ${repoInfo.topics.join(', ')}\n` : ''}
        
        # 의존성 패키지 (상위 10개)
        ${Object.entries(repoInfo.dependencies)
          .slice(0, 10)
          .map(([name, version]) => `${name}: ${version}`)
          .join('\n')}
        
        # 파일 확장자 분포 (상위 5개)
        ${Array.from(fileExtensions.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([ext, count]) => `${ext}: ${count}개 파일`)
          .join('\n')}
        
        # 기여자 (상위 5명)
        ${Array.from(contributors.entries())
          .sort((a, b) => b[1].commits - a[1].commits)
          .slice(0, 5)
          .map(([name, data]) => `${name} (${data.commits}개 커밋)`)
          .join('\n')}
        
        # 최근 커밋 메시지 (10개)
        ${commitSummary.slice(0, 10).map(c => `- ${c.message.split('\n')[0]}`).join('\n')}
        
        # 수정된 파일 패턴 (상위 15개)
        ${commits.flatMap(commit => commit.files || [])
          .map(file => file.filename)
          .slice(0, 15)
          .join('\n')}
        
        모든 분석 요소에 대해 매우 상세하게 설명해주세요. 특히:
        1. 이 프로젝트가 정확히 무엇인지
        2. 사용된 주요 기술 스택과 아키텍처
        3. 주요 기능과 특징
        4. 개발 패턴 및 작업 스타일
        5. 코드 품질 및 유지보수성
        6. 개선을 위한 실질적인 추천사항
        
        모든 분석을 JSON 형식으로 반환해주세요.`
      }
    ],
    response_format: { type: 'json_object' }
  };
  
  try {
    console.log('[GPT 분석] GPT-4 Mini API 호출 중...');
    
    const response = await openai.chat.completions.create(prompt as any);
    const content = response.choices[0]?.message?.content || '';
    
    console.log('[GPT 분석] GPT-4 Mini 분석 완료');
    
    try {
      const result = JSON.parse(content);
      
      // 결과 정제 및 기본값 제공
      return {
        projectType: result.projectType || '웹 애플리케이션',
        summary: result.summary || '프로젝트 분석을 완료하였습니다.',
        techStack: result.techStack || [],
        keyFeatures: result.keyFeatures || [],
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        codeQuality: result.codeQuality || 70,
        codeQualityMetrics: result.codeQualityMetrics || [
          { name: '코드 가독성', score: 70, description: '코드의 가독성이 양호합니다.' }
        ],
        domains: result.domains || ['frontend'],
        developmentPattern: result.developmentPattern || {
          commitFrequency: '불규칙적',
          developmentCycle: '표준 개발 주기',
          teamDynamics: '소규모 팀 또는 개인 프로젝트',
          workPatterns: {
            time: '다양한 시간대',
            dayOfWeek: '주중',
            mostActiveDay: '월요일',
            mostActiveHour: 14
          }
        }
      };
    } catch (error) {
      console.error('[GPT 분석] JSON 파싱 실패:', error);
      // 기본 응답 반환
      return {
        projectType: '웹 애플리케이션',
        summary: '이 프로젝트는 웹 기반 애플리케이션으로 보입니다. 분석 중 일부 오류가 발생하여 완전한 결과를 제공하지 못했습니다.',
        techStack: [
          { name: repoInfo.language || 'JavaScript', type: 'language', confidence: 0.9 }
        ],
        keyFeatures: [
          { title: '주요 기능', description: '커밋 내역에서 주요 기능을 파악할 수 없습니다.', importance: 0.5 }
        ],
        insights: [
          { title: '개발 인사이트', description: '더 많은 문서화가 필요합니다.' }
        ],
        recommendations: [
          { title: '문서 개선', description: 'README를 추가하거나 개선하세요.', priority: 'medium' }
        ],
        codeQuality: 70,
        codeQualityMetrics: [
          { name: '코드 가독성', score: 70, description: '코드의 가독성이 양호합니다.' }
        ],
        domains: ['frontend'],
        developmentPattern: {
          commitFrequency: '불규칙적',
          developmentCycle: '표준 개발 주기',
          teamDynamics: '소규모 팀 또는 개인 프로젝트',
          workPatterns: {
            time: '다양한 시간대',
            dayOfWeek: '주중',
            mostActiveDay: '월요일',
            mostActiveHour: 14
          }
        }
      };
    }
  } catch (error) {
    console.error('[GPT 분석] GPT-4 Mini API 호출 실패:', error);
    throw new Error('AI 분석 중 오류가 발생했습니다.');
  }
}

// 기여자 분석 함수
function analyzeContributors(commits: CommitData[], userLogin?: string, userEmail?: string): {
  totalCommits: number;
  contributors: { author: string; email: string; commits: number; percentage: number }[];
  commitCategories: Record<string, number>;
  activityPeriod: string;
} {
  // 총 커밋 수
  const totalCommits = commits.length;
  
  // 이메일별 기여자 데이터 집계
  const contributorMap = new Map<string, { author: string; email: string; commits: number }>();
  
  commits.forEach(commit => {
    const email = commit.author.email;
    const name = commit.author.name;
    
    if (email && name) {
      if (!contributorMap.has(email)) {
        contributorMap.set(email, { author: name, email, commits: 1 });
      } else {
        const data = contributorMap.get(email)!;
        contributorMap.set(email, { ...data, commits: data.commits + 1 });
      }
    }
  });
  
  // 기여자 목록 생성 및 정렬
  const contributors = Array.from(contributorMap.values())
    .map(contributor => ({
      ...contributor,
      percentage: Math.round((contributor.commits / totalCommits) * 100)
    }))
    .sort((a, b) => b.commits - a.commits);
  
  // 기여 유형 분석 (개인 분석인 경우)
  let commitCategories: Record<string, number> = {
    '코드 추가': 0,
    '버그 수정': 0,
    '문서화': 0,
    '리팩토링': 0,
    '테스트': 0,
    '기타': 0
  };
  
  if (userLogin || userEmail) {
    const userCommits = commits.filter(commit => {
      if (userEmail && commit.author.email === userEmail) return true;
      if (userLogin && commit.author.login === userLogin) return true;
      return false;
    });
    
    userCommits.forEach(commit => {
      const msg = commit.message.toLowerCase();
      if (msg.includes('fix') || msg.includes('bug') || msg.includes('해결')) {
        commitCategories['버그 수정']++;
      } else if (msg.includes('doc') || msg.includes('문서')) {
        commitCategories['문서화']++;
      } else if (msg.includes('refactor') || msg.includes('리팩토링')) {
        commitCategories['리팩토링']++;
      } else if (msg.includes('test') || msg.includes('테스트')) {
        commitCategories['테스트']++;
      } else if (msg.includes('feat') || msg.includes('add') || msg.includes('feature') || msg.includes('구현') || msg.includes('추가')) {
        commitCategories['코드 추가']++;
      } else {
        commitCategories['기타']++;
      }
    });
  }
  
  // 활동 기간 분석
  let activityPeriod = '알 수 없음';
  if (commits.length > 0) {
    try {
      const firstCommitDate = new Date(commits[commits.length - 1].date);
      const lastCommitDate = new Date(commits[0].date);
      
      const diffTime = Math.abs(lastCommitDate.getTime() - firstCommitDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        activityPeriod = `${diffDays}일 동안`;
      } else if (diffDays < 365) {
        const months = Math.round(diffDays / 30);
        activityPeriod = `약 ${months}개월 동안`;
      } else {
        const years = Math.round(diffDays / 365 * 10) / 10;
        activityPeriod = `약 ${years.toFixed(1)}년 동안`;
      }
    } catch (error) {
      console.error('활동 기간 계산 오류:', error);
    }
  }
  
  return {
    totalCommits,
    contributors,
    commitCategories,
    activityPeriod
  };
}

/**
 * 저장소 분석 메인 함수
 */
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
  
  console.log(`저장소 ${owner}/${repo} 분석 시작...`);
  console.log(`분석 유형: ${isPersonalAnalysis ? '개인' : '저장소'} 분석`);
  if (userLogin) console.log(`사용자: ${userLogin}`);
  
  try {
    // 분석 진행상황 업데이트 - 준비 단계
    await updateAnalysisProgress(owner, repo, 0, 'preparing', false, undefined, undefined, 
      '분석 환경을 준비하는 중입니다...');
    
    // 저장소 데이터 가져오기
    await updateAnalysisProgress(owner, repo, 10, 'fetching', false, undefined, undefined, 
      `GitHub API를 통해 ${owner}/${repo} 저장소 데이터를 가져오는 중입니다...`);
    console.log('저장소 데이터 가져오는 중...');
    
    // 1. 커밋 이력 가져오기
    const commits = await getRepositoryCommits(accessToken, owner, repo);
    if (!commits || commits.length === 0) {
      throw new Error('커밋 이력을 가져올 수 없습니다.');
    }
    
    await updateAnalysisProgress(owner, repo, 20, 'fetching', false, undefined, undefined, 
      `${commits.length}개의 커밋 정보를 가져왔습니다. 저장소 정보를 확인 중...`);
    
    // 2. 저장소 정보 가져오기
    const repoInfo = await getRepositoryInfo(accessToken, owner, repo);
    
    // 분석 진행 상황 업데이트
    await updateAnalysisProgress(owner, repo, 30, 'analyzing', false, undefined, undefined, 
      '기여자 정보를 분석하는 중입니다...');
    console.log('데이터 분석 중...');
    
    // 3. 기여자 분석
    const developerProfile = analyzeContributors(commits, userLogin, userEmail);
    
    // 4. GPT-4 Mini로 전체 분석 수행
    await updateAnalysisProgress(owner, repo, 50, 'analyzing', false, undefined, undefined, 
      'GPT-4 Mini AI로 코드와 커밋 내용을 분석 중입니다... 약 30초 정도 소요됩니다.');
    console.log('GPT-4 Mini로 분석 중...');
    
    const gptAnalysis = await analyzeWithGPT(commits, repoInfo, {
      personalAnalysis: isPersonalAnalysis,
      userLogin,
      userEmail
    });
    
    // 분석 마무리
    await updateAnalysisProgress(owner, repo, 90, 'finalizing', false, undefined, undefined, 
      '분석 결과를 생성하는 중입니다. 곧 완료됩니다...');
    console.log('분석 결과 종합 중...');
    
    // 5. 최종 결과 종합
    const analysisResult: AnalysisResult = {
      repositoryInfo: {
        owner,
        repo,
        url: `https://github.com/${owner}/${repo}`,
        isUserAnalysis: isPersonalAnalysis,
        userLogin: userLogin || '',
        aiAnalyzed: true,
        aiProjectType: gptAnalysis.projectType,
      },
      developerProfile,
      techStack: gptAnalysis.techStack.map(tech => {
        // 기술 스택 타입이 없는 경우 타입 추론 로직 추가
        let enhancedTech = { ...tech };
        
        if (!enhancedTech.type) {
          // 주요 언어 목록
          const programmingLanguages = [
            'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'C', 
            'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Ruby', 'Scala', 'Dart',
            'HTML', 'CSS', 'SCSS', 'SASS', 'Less', 'SQL', 'Shell', 'Bash'
          ];
          
          // 주요 프레임워크와 라이브러리 목록
          const frameworksAndLibraries = [
            'React', 'Angular', 'Vue', 'Next.js', 'Nuxt.js', 'Express', 'Nest.js',
            'Django', 'Flask', 'Spring', 'Laravel', 'Ruby on Rails', 'ASP.NET',
            'jQuery', 'Bootstrap', 'Tailwind', 'Material-UI', 'Chakra UI',
            'Redux', 'MobX', 'Zustand', 'Apollo', 'GraphQL', 'REST API',
            'Node.js', 'Deno', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
            'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Firebase',
            'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Elasticsearch'
          ];
          
          // 언어 목록에 있으면 'language' 타입으로 설정
          if (programmingLanguages.includes(enhancedTech.name)) {
            enhancedTech.type = 'language';
          } 
          // 프레임워크/라이브러리 목록에 있으면 'framework' 타입으로 설정
          else if (frameworksAndLibraries.includes(enhancedTech.name)) {
            enhancedTech.type = 'framework';
          }
          // 위 목록에 없는 경우 이름에 따라 추론
          else if (enhancedTech.name.includes('.js') || 
                   enhancedTech.name.includes('UI') || 
                   enhancedTech.name.toLowerCase().includes('framework') ||
                   enhancedTech.name.toLowerCase().includes('library')) {
            enhancedTech.type = 'framework';
          }
          // 그 외에는 기본값으로 'tool' 설정
          else {
            enhancedTech.type = 'tool';
          }
        }
        
        return {
          ...enhancedTech,
          usage: Math.round(enhancedTech.confidence * 100)
        };
      }),
      domains: gptAnalysis.domains,
      characteristics: [], // 이 버전에서는 사용하지 않음
      developmentPattern: gptAnalysis.developmentPattern,
      keyFeatures: gptAnalysis.keyFeatures,
      insights: gptAnalysis.insights,
      recommendations: gptAnalysis.recommendations,
      summary: gptAnalysis.summary,
      codeQuality: gptAnalysis.codeQuality,
      codeQualityMetrics: gptAnalysis.codeQualityMetrics,
      meta: {
        generatedAt: new Date().toISOString(),
        version: '2.0-ai',
      }
    };
    
    // 분석 완료
    await updateAnalysisProgress(owner, repo, 100, 'finalizing', true, undefined, analysisResult,
      '분석이 완료되었습니다! 결과를 표시합니다.');
    console.log('분석 완료!');
    
    return analysisResult;
  } catch (error: any) {
    console.error('저장소 분석 중 오류 발생:', error);
    
    // 오류 업데이트
    await updateAnalysisProgress(
      owner,
      repo,
      100,
      'finalizing',
      true,
      { message: error.message || '알 수 없는 오류가 발생했습니다.' }
    );
    
    // 오류 결과 반환
    return {
      repositoryInfo: {
        owner,
        repo,
        url: `https://github.com/${owner}/${repo}`,
        isUserAnalysis: isPersonalAnalysis,
        userLogin: userLogin || '',
        aiAnalyzed: false,
        aiProjectType: '',
        error: error.message || '알 수 없는 오류가 발생했습니다.'
      },
      developerProfile: {
        totalCommits: 0,
        contributors: [],
        commitCategories: {},
        activityPeriod: '',
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
      summary: '분석 중 오류가 발생했습니다.',
      codeQuality: 0,
      codeQualityMetrics: [],
      meta: {
        generatedAt: new Date().toISOString(),
        version: '2.0-ai',
        error: error.message || '알 수 없는 오류가 발생했습니다.'
      }
    };
  }
} 