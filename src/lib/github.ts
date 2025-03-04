import { Session } from 'next-auth'

// GitHub 저장소 인터페이스
export interface Repository {
  id: number
  name: string
  full_name: string
  owner: {
    login: string
    avatar_url: string
  }
  description: string
  html_url: string
  updated_at: string
  language: string
  stargazers_count: number
  forks_count: number
}

// 커밋 인터페이스
export interface Commit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
  author: {
    login: string
    avatar_url: string
  } | null
  html_url: string
}

// GitHub API 호출 기본 함수
async function fetchGitHubAPI<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(`GitHub API 오류 (${response.status}): ${error.message}`)
  }

  return response.json()
}

// 사용자 정보 가져오기
export async function getUserProfile(accessToken: string) {
  return fetchGitHubAPI<{
    login: string
    name: string
    avatar_url: string
    bio: string
    html_url: string
    public_repos: number
    followers: number
    following: number
  }>(accessToken, '/user')
}

// 사용자 저장소 목록 가져오기
export async function getUserRepositories(accessToken: string): Promise<Repository[]> {
  // 개인 저장소 가져오기
  const userRepos = await fetchGitHubAPI<Repository[]>(
    accessToken,
    '/user/repos?sort=updated&per_page=100'
  );
  
  try {
    // 사용자가 속한 조직 목록 가져오기
    const orgs = await getUserOrganizations(accessToken);
    
    // 각 조직의 저장소 가져오기
    const orgReposPromises = orgs.map(org => 
      getOrganizationRepositories(accessToken, org.login)
    );
    
    // 모든 조직 저장소 결과 기다리기
    const orgReposResults = await Promise.allSettled(orgReposPromises);
    
    // 성공적으로 가져온 조직 저장소만 필터링
    const orgRepos = orgReposResults
      .filter((result): result is PromiseFulfilledResult<Repository[]> => result.status === 'fulfilled')
      .flatMap(result => result.value);
    
    // 개인 저장소와 조직 저장소 합치기
    return [...userRepos, ...orgRepos];
  } catch (error) {
    console.error('조직 저장소 가져오기 오류:', error);
    // 오류 발생 시 개인 저장소만 반환
    return userRepos;
  }
}

// 사용자가 속한 조직 목록 가져오기
export async function getUserOrganizations(accessToken: string): Promise<{login: string, url: string}[]> {
  return fetchGitHubAPI<{login: string, url: string}[]>(
    accessToken,
    '/user/orgs'
  );
}

// 특정 조직의 저장소 목록 가져오기
export async function getOrganizationRepositories(accessToken: string, org: string): Promise<Repository[]> {
  return fetchGitHubAPI<Repository[]>(
    accessToken,
    `/orgs/${org}/repos?sort=updated&per_page=100`
  );
}

// 특정 저장소의 커밋 목록 가져오기
export async function getRepositoryCommits(
  accessToken: string,
  owner: string,
  repo: string,
  per_page: number = 100
): Promise<Commit[]> {
  return fetchGitHubAPI<Commit[]>(
    accessToken,
    `/repos/${owner}/${repo}/commits?per_page=${per_page}`
  )
}

// 특정 저장소의 언어 통계 가져오기
export async function getRepositoryLanguages(
  accessToken: string,
  owner: string,
  repo: string
): Promise<Record<string, number>> {
  return fetchGitHubAPI<Record<string, number>>(
    accessToken,
    `/repos/${owner}/${repo}/languages`
  )
}

// 특정 저장소의 README 내용 가져오기
export async function getRepositoryReadme(
  accessToken: string,
  owner: string,
  repo: string
): Promise<string | null> {
  try {
    const response = await fetchGitHubAPI<{ content: string }>(
      accessToken,
      `/repos/${owner}/${repo}/readme`
    )
    
    // Base64 디코딩
    return Buffer.from(response.content, 'base64').toString('utf8')
  } catch (error) {
    // README가 없는 경우 null 반환
    return null
  }
}

// 특정 저장소의 상세 정보 가져오기
export async function getRepositoryDetails(
  accessToken: string,
  owner: string,
  repo: string
): Promise<Repository & {
  created_at: string
  updated_at: string
  pushed_at: string
  default_branch: string
  license: { name: string } | null
  topics: string[]
  open_issues_count: number
  has_wiki: boolean
}> {
  return fetchGitHubAPI(
    accessToken,
    `/repos/${owner}/${repo}`
  )
} 