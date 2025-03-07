import OpenAI from 'openai';
import { Octokit } from '@octokit/rest';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GitHub API 클라이언트 초기화
const octokit = new Octokit({
  auth: process.env.GITHUB_PAT || '',
});

interface CommitData {
  message: string;
  url: string;
  date: string;
  author: {
    name: string;
    email: string;
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

interface ProjectDefinition {
  name: string;
  type: string;
  description: string;
  features: string[];
  technologies: string[];
  suggestion?: string;
}

/**
 * GitHub 저장소에서 최대 100개의 최신 커밋 데이터를 가져옵니다.
 */
export async function fetchRepositoryCommits(
  accessToken: string,
  owner: string,
  repo: string
): Promise<CommitData[]> {
  const authOctokit = new Octokit({ auth: accessToken });
  
  console.log(`[AI 분석] ${owner}/${repo} 저장소의 커밋 데이터를 가져오는 중...`);
  
  try {
    // 최대 100개의 커밋 가져오기
    const commits = await authOctokit.repos.listCommits({
      owner,
      repo,
      per_page: 100,
    });
    
    const detailedCommits: CommitData[] = [];
    
    // 각 커밋에 대한 상세 정보 가져오기
    for (const commit of commits.data.slice(0, 30)) { // 최대 30개 커밋만 상세 정보 가져오기
      const detail = await authOctokit.repos.getCommit({
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
        })) || [],
      });
    }
    
    console.log(`[AI 분석] ${detailedCommits.length}개의 커밋 데이터 가져오기 완료`);
    return detailedCommits;
  } catch (error) {
    console.error('[AI 분석] 커밋 데이터 가져오기 실패:', error);
    throw new Error('저장소 커밋 데이터를 가져오는 중 오류가 발생했습니다.');
  }
}

/**
 * 저장소 정보와 패키지 의존성을 가져옵니다.
 */
export async function fetchRepositoryInfo(
  accessToken: string,
  owner: string,
  repo: string
): Promise<{
  description: string;
  topics: string[];
  dependencies: Record<string, string>;
}> {
  const authOctokit = new Octokit({ auth: accessToken });
  
  try {
    // 저장소 정보 가져오기
    const repoInfo = await authOctokit.repos.get({
      owner,
      repo,
    });
    
    // package.json 파일 가져오기
    let dependencies: Record<string, string> = {};
    try {
      const packageJson = await authOctokit.repos.getContent({
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
      console.log('[AI 분석] package.json 파일을 찾을 수 없습니다.');
    }
    
    return {
      description: repoInfo.data.description || '',
      topics: repoInfo.data.topics || [],
      dependencies,
    };
  } catch (error) {
    console.error('[AI 분석] 저장소 정보 가져오기 실패:', error);
    throw new Error('저장소 정보를 가져오는 중 오류가 발생했습니다.');
  }
}

/**
 * GPT-4 Mini를 사용하여 프로젝트 정의를 생성합니다.
 */
export async function generateProjectDefinition(
  commits: CommitData[],
  repoInfo: {
    description: string;
    topics: string[];
    dependencies: Record<string, string>;
  }
): Promise<ProjectDefinition> {
  console.log('[AI 분석] GPT-4 Mini로 프로젝트 분석 중...');
  
  // 커밋 데이터 요약 
  const commitSummary = commits.map(commit => ({
    message: commit.message,
    date: commit.date,
    stats: commit.stats,
    files: commit.files?.map(file => file.filename).slice(0, 5) || [],
  }));
  
  // 주요 파일 타입 분석
  const fileExtensions = new Map<string, number>();
  commits.forEach(commit => {
    commit.files?.forEach(file => {
      const ext = file.filename.split('.').pop()?.toLowerCase() || 'unknown';
      fileExtensions.set(ext, (fileExtensions.get(ext) || 0) + 1);
    });
  });
  
  // GPT-4 Mini에 보낼 프롬프트 생성
  const prompt = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 코드 저장소를 분석하고 프로젝트의 목적, 타입, 기능 등을 요약하는 전문가입니다. 
        제공된 데이터를 바탕으로 프로젝트에 대한 간결하고 정확한 정의를 생성해주세요.
        JSON 형식으로 응답해야 합니다: { "name": "프로젝트명", "type": "프로젝트 타입", "description": "설명", "features": ["기능1", "기능2", ...], "technologies": ["기술1", "기술2", ...], "suggestion": "개선 제안" }`
      },
      {
        role: 'user',
        content: `다음 GitHub 저장소 정보를 분석하여 프로젝트 정의를 생성해주세요:
        
        # 저장소 정보
        ${repoInfo.description ? `설명: ${repoInfo.description}\n` : ''}
        ${repoInfo.topics.length > 0 ? `주제: ${repoInfo.topics.join(', ')}\n` : ''}
        
        # 의존성 패키지 (상위 20개)
        ${Object.entries(repoInfo.dependencies)
          .slice(0, 20)
          .map(([name, version]) => `${name}: ${version}`)
          .join('\n')}
        
        # 파일 확장자 분포
        ${Array.from(fileExtensions.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([ext, count]) => `${ext}: ${count}개 파일`)
          .join('\n')}
        
        # 최근 커밋 메시지 (일부)
        ${commits.slice(0, 10).map(c => `- ${c.message.split('\n')[0]}`).join('\n')}
        
        이 데이터를 기반으로 프로젝트 정의를 분석해주세요. 특히:
        1. 이 프로젝트가 무엇인지 (웹 앱, 라이브러리, 도구 등)
        2. 주요 기능이 무엇인지
        3. 사용된 주요 기술이 무엇인지
        4. 한국어로 작성된 간결한 프로젝트 설명문
        
        이 모든 것을 위에서 설명한 JSON 형식으로 반환해주세요.`
      }
    ],
    response_format: { type: 'json_object' }
  };
  
  try {
    const response = await openai.chat.completions.create(prompt as any);
    const content = response.choices[0]?.message?.content || '';
    
    console.log('[AI 분석] GPT-4 Mini 분석 완료');
    
    try {
      return JSON.parse(content) as ProjectDefinition;
    } catch (error) {
      console.error('[AI 분석] JSON 파싱 실패:', error);
      // 기본 응답 반환
      return {
        name: '알 수 없는 프로젝트',
        type: '웹 애플리케이션',
        description: '프로젝트 정보를 분석할 수 없습니다.',
        features: ['알 수 없음'],
        technologies: ['JavaScript'],
      };
    }
  } catch (error) {
    console.error('[AI 분석] GPT-4 Mini API 호출 실패:', error);
    throw new Error('AI 분석 중 오류가 발생했습니다.');
  }
}

/**
 * 저장소를 분석하고 프로젝트 정의를 생성합니다.
 */
export async function analyzeProjectWithAI(
  accessToken: string,
  owner: string,
  repo: string
): Promise<ProjectDefinition> {
  try {
    // 진행상황 업데이트
    await updateAnalysisProgress(owner, repo, 10, 'fetching');
    
    // 1. 커밋 데이터 가져오기
    const commits = await fetchRepositoryCommits(accessToken, owner, repo);
    await updateAnalysisProgress(owner, repo, 30, 'analyzing');
    
    // 2. 저장소 정보 가져오기
    const repoInfo = await fetchRepositoryInfo(accessToken, owner, repo);
    await updateAnalysisProgress(owner, repo, 50, 'analyzing');
    
    // 3. GPT-4 Mini로 프로젝트 정의 생성
    const projectDefinition = await generateProjectDefinition(commits, repoInfo);
    await updateAnalysisProgress(owner, repo, 90, 'finalizing');
    
    // 결과 반환
    return projectDefinition;
  } catch (error) {
    console.error('[AI 분석] 프로젝트 분석 실패:', error);
    throw error;
  }
}

// 분석 진행상황 업데이트 함수 (기존 코드 재사용)
async function updateAnalysisProgress(
  owner: string,
  repo: string,
  progress: number,
  stage: 'preparing' | 'fetching' | 'analyzing' | 'finalizing',
  completed: boolean = false,
  error?: { message: string },
  result?: any
) {
  // 이 함수는 기존 Contribase 코드에서 가져온 것으로 가정
  // 실제 구현은 프로젝트의 기존 코드를 사용
  console.log(`[AI 분석] 진행 상황 업데이트: ${stage} (${progress}%)`);
} 