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

// GitHub 조직 인터페이스
interface GitHubOrg {
  login: string;
  id: number;
  url: string;
  repos_url: string;
  events_url: string;
  hooks_url: string;
  issues_url: string;
  members_url: string;
  public_members_url: string;
  avatar_url: string;
  description: string;
}

/**
 * 사용자의 GitHub 저장소 목록을 가져옵니다.
 * 조직 저장소 권한이 있다면 조직 저장소도 함께 가져옵니다.
 */
export async function getUserRepositories(accessToken: string): Promise<any[]> {
  try {
    console.log('GitHub API 호출: 저장소 목록 가져오기')
    
    // 1. 사용자 저장소 가져오기
    const userReposResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
    })
    
    if (!userReposResponse.ok) {
      console.error('GitHub API 오류 (사용자 저장소):', userReposResponse.status)
      throw new Error(`GitHub API 요청 실패: ${userReposResponse.status}`)
    }
    
    const userRepos = await userReposResponse.json()
    console.log(`사용자 저장소 ${userRepos.length}개 로드됨`)
    
    // 2. 사용자가 속한 조직 목록 가져오기 (권한이 있는 경우)
    let orgRepos: any[] = []
    try {
      const orgsResponse = await fetch('https://api.github.com/user/orgs', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
      })
      
      if (orgsResponse.ok) {
        const orgs: GitHubOrg[] = await orgsResponse.json()
        console.log(`조직 ${orgs.length}개 로드됨`)
        
        // 조직이 있을 경우 각 조직의 저장소 가져오기
        if (orgs.length > 0) {
          const orgReposPromises = orgs.map(async (org: GitHubOrg) => {
            try {
              const orgReposResponse = await fetch(
                `https://api.github.com/orgs/${org.login}/repos?per_page=100&sort=updated`, 
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                  },
                }
              )
              
              if (orgReposResponse.ok) {
                return await orgReposResponse.json()
              }
              return []
            } catch (err) {
              console.error(`조직 ${org.login} 저장소 가져오기 오류:`, err)
              return []
            }
          })
          
          const orgReposArray = await Promise.all(orgReposPromises)
          orgRepos = orgReposArray.flat()
          console.log(`조직 저장소 ${orgRepos.length}개 로드됨`)
        }
      }
    } catch (err) {
      console.error('조직 정보 가져오기 오류:', err)
      // 조직 정보를 가져오는데 실패해도 사용자 저장소는 계속 사용
    }
    
    // 사용자 저장소와 조직 저장소 합치기
    const allRepos = [...userRepos, ...orgRepos]
    console.log(`총 ${allRepos.length}개 저장소 로드 완료`)
    
    return allRepos
  } catch (error) {
    console.error('저장소 목록 가져오기 오류:', error)
    throw error
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

/**
 * 저장소 커밋 기록을 가져옵니다.
 */
export async function getRepositoryCommits(accessToken: string, owner: string, repo: string): Promise<any[]> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API 요청 실패: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('커밋 기록 가져오기 오류:', error)
    throw error
  }
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

/**
 * 저장소 컨트리뷰터 정보를 가져옵니다.
 */
export async function getRepositoryContributors(accessToken: string, owner: string, repo: string): Promise<any[]> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/stats/contributors`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API 요청 실패: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('컨트리뷰터 정보 가져오기 오류:', error)
    throw error
  }
} 