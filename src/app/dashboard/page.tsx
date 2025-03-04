'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getUserRepositories } from '@/lib/github'

// 저장소 데이터 인터페이스
interface Repository {
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

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [organizations, setOrganizations] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const reposPerPage = 6
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // 인증 요청 쓰로틀링을 위한 상태
  const [isAuthThrottled, setIsAuthThrottled] = useState(false)
  const [throttleTimeRemaining, setThrottleTimeRemaining] = useState(0)
  const MIN_AUTH_INTERVAL = 60 // 초 단위 (1분)
  const [isAuthLoading, setIsAuthLoading] = useState(false) // 로딩 상태 추가
  const [reloadKey, setReloadKey] = useState(0) // 저장소 목록 새로고침을 위한 키
  
  // URL 파라미터 확인
  useEffect(() => {
    // 브라우저에서만 실행
    if (typeof window === 'undefined') return;

    // URL에서 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const requireOrgAccess = urlParams.get('requireOrgAccess');
    const timestamp = urlParams.get('t');

    // 조직 권한이 새로 추가되었거나 타임스탬프가 있는 경우 데이터 다시 로드
    if (requireOrgAccess === 'true' || timestamp) {
      console.log('조직 권한이 새로 추가되었거나 타임스탬프가 있습니다. 데이터를 다시 로드합니다.');
      
      // 저장소 목록 새로고침 트리거
      setReloadKey(prev => prev + 1);
      
      // URL에서 파라미터 제거 (페이지 새로고침 시 중복 로드 방지)
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);
  
  // 인증 상태 확인
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-required')
    }
  }, [status, router])

  // 조직 접근 권한 요청 함수
  const requestOrgAccess = () => {
    console.log('조직 추가하기 버튼 클릭됨');
    
    // 이미 로딩 중이면 중복 요청 방지
    if (isAuthLoading) return;
    
    // 쓰로틀링 체크: 마지막 인증 요청 시간 확인
    if (typeof window !== 'undefined') {
      const lastAuthTime = localStorage.getItem('lastAuthRequestTime')
      const currentTime = Math.floor(Date.now() / 1000) // 현재 시간(초)
      
      if (lastAuthTime) {
        const timeSinceLastAuth = currentTime - parseInt(lastAuthTime)
        
        // 마지막 인증 요청 후 MIN_AUTH_INTERVAL초가 지나지 않았으면 요청 차단
        if (timeSinceLastAuth < MIN_AUTH_INTERVAL) {
          setIsAuthThrottled(true)
          const remaining = MIN_AUTH_INTERVAL - timeSinceLastAuth
          setThrottleTimeRemaining(remaining)
          
          // 남은 시간 카운트다운
          const countdownInterval = setInterval(() => {
            setThrottleTimeRemaining(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval)
                setIsAuthThrottled(false)
                return 0
              }
              return prev - 1
            })
          }, 1000)
          
          return
        }
      }
      
      // 현재 시간 저장
      localStorage.setItem('lastAuthRequestTime', currentTime.toString())
    }
    
    // 로딩 상태 활성화
    setIsAuthLoading(true);
    
    // 추가 권한이 필요함을 표시하는 URL 파라미터
    const callbackUrlWithParams = `/dashboard?t=${Date.now()}&requireOrgAccess=true`;
    
    // GitHub 인증 페이지로 강제 리다이렉트
    // prompt=consent를 사용하여 항상 권한 확인 화면 표시
    window.location.href = `https://github.com/login/oauth/authorize?` +
      `client_id=${process.env.NEXT_PUBLIC_GITHUB_ID}` +
      `&redirect_uri=${encodeURIComponent(`${window.location.origin}/api/auth/callback/github`)}` +
      `&scope=read:user user:email repo read:org admin:org` +
      `&prompt=consent` +
      `&state=${encodeURIComponent(JSON.stringify({ callbackUrl: callbackUrlWithParams }))}`;
    
    // 10초 후 로딩 상태 자동 해제 (페이지 이동이 안 된 경우)
    setTimeout(() => {
      setIsAuthLoading(false);
    }, 10000);
  }

  // 저장소 목록 가져오기
  useEffect(() => {
    const fetchRepositories = async () => {
      if (status !== 'authenticated' || !session?.accessToken) {
        return
      }
      
      try {
        setIsLoading(true)
        const repos = await getUserRepositories(session.accessToken)
        
        // 중복된 저장소 제거 (ID 기준)
        const uniqueRepos = Array.from(
          new Map(repos.map(repo => [repo.id, repo])).values()
        );
        
        setRepositories(uniqueRepos)
        
        // 조직 목록 추출
        const orgNames = uniqueRepos
          .filter(repo => repo.owner.login !== session.user?.name)
          .map(repo => repo.owner.login)
          .filter((value, index, self) => self.indexOf(value) === index);
        
        setOrganizations(orgNames);
        
        // 조직/저장소가 로드되었음을 알림
        console.log(`조직 ${orgNames.length}개, 저장소 ${uniqueRepos.length}개 로드 완료`);
        
        setIsLoading(false)
      } catch (err) {
        console.error('저장소 목록 로드 오류:', err)
        setError('저장소 목록을 가져오는 중 오류가 발생했습니다.')
        setIsLoading(false)
      }
    }
    
    fetchRepositories()
  }, [status, session, reloadKey])

  // 세션이 변경될 때마다 URL 해시 확인하여 콜백 상태 감지
  useEffect(() => {
    // URL 해시가 존재하고 인증이 완료된 상태라면 저장소 목록 새로고침
    if (typeof window !== 'undefined' && window.location.hash && status === 'authenticated') {
      console.log('콜백 상태 감지: 저장소 목록 새로고침')
      
      // URL 해시 제거
      window.history.replaceState(
        null, 
        document.title, 
        window.location.pathname + window.location.search
      )
      
      // 약간의 지연 후 저장소 목록 다시 가져오기
      setTimeout(() => {
        getUserRepositories(session!.accessToken as string)
          .then(repos => {
            // 중복된 저장소 제거 (ID 기준)
            const uniqueRepos = Array.from(
              new Map(repos.map(repo => [repo.id, repo])).values()
            );
            
            setRepositories(uniqueRepos)
            
            // 조직 목록 업데이트
            const orgNames = uniqueRepos
              .filter(repo => repo.owner.login !== session!.user?.name)
              .map(repo => repo.owner.login)
              .filter((value, index, self) => self.indexOf(value) === index);
            
            setOrganizations(orgNames);
          })
          .catch(error => {
            console.error('콜백 후 저장소 목록 가져오기 오류:', error)
          })
      }, 500)
    }
  }, [status, session])

  // 저장소 분석하기
  const analyzeRepository = (owner: string, repo: string) => {
    router.push(`/dashboard/analysis/${owner}/${repo}`)
  }

  // 검색 필터 및 탭 필터
  const filteredRepositories = repositories.filter((repo) => {
    // 검색어 필터링
    const matchesSearch = 
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 탭 필터링
    if (activeTab === 'all') return matchesSearch;
    if (activeTab !== 'all') {
      // 특정 조직의 저장소 필터링
      return matchesSearch && repo.owner.login === activeTab;
    }
    
    return matchesSearch;
  });

  // 페이지네이션 계산
  const indexOfLastRepo = currentPage * reposPerPage;
  const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
  const currentRepos = filteredRepositories.slice(indexOfFirstRepo, indexOfLastRepo);
  const totalPages = Math.ceil(filteredRepositories.length / reposPerPage);

  // 페이지 변경 함수
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // 탭 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // 로딩 중이거나 인증되지 않은 경우 로딩 표시
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* 스켈레톤 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-10 w-52 bg-gray-200 rounded relative overflow-hidden">
            <div className="absolute inset-0 skeleton-shine"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded relative overflow-hidden">
            <div className="absolute inset-0 skeleton-shine"></div>
          </div>
        </div>
        
        {/* 스켈레톤 검색 필드 */}
        <div className="relative mb-4">
          <div className="h-10 w-full bg-gray-200 rounded relative overflow-hidden">
            <div className="absolute inset-0 skeleton-shine"></div>
          </div>
        </div>
        
        {/* 스켈레톤 드롭다운 */}
        <div className="mb-6">
          <div className="h-10 w-full bg-gray-200 rounded relative overflow-hidden">
            <div className="absolute inset-0 skeleton-shine"></div>
          </div>
        </div>
        
        {/* 스켈레톤 저장소 목록 */}
        <div className="min-h-[650px] flex flex-col">
          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 flex-1 min-h-[500px]">
            {[...Array(4)].map((_, index) => (
              <div 
                key={`skeleton-${index}`} 
                className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100 h-[200px] sm:h-[220px] flex flex-col relative overflow-hidden"
              >
                {/* 스켈레톤 배경 효과 */}
                <div className="absolute inset-0 skeleton-shine"></div>
                
                <div className="flex items-start flex-1 overflow-hidden">
                  <div className="mr-4 flex-shrink-0">
                    <div className="rounded-full h-12 w-12 bg-gray-200"></div>
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mt-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mt-1"></div>
                    <div className="flex items-center mt-4">
                      <div className="h-4 w-16 bg-gray-200 rounded mr-3"></div>
                      <div className="h-4 w-12 bg-gray-200 rounded mr-3"></div>
                      <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-auto flex justify-end">
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 스켈레톤 페이지네이션 */}
          <div className="mt-auto pt-6 h-[100px]">
            <div className="flex justify-center overflow-x-auto pb-2 max-w-full">
              <div className="flex space-x-2 flex-wrap justify-center">
                <div className="h-10 w-10 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 skeleton-shine"></div>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 skeleton-shine"></div>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 skeleton-shine"></div>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 skeleton-shine"></div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <div className="h-4 w-48 bg-gray-200 rounded relative overflow-hidden">
                <div className="absolute inset-0 skeleton-shine"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">GitHub 저장소</h1>
        <button 
          onClick={requestOrgAccess}
          disabled={isAuthThrottled || isAuthLoading} 
          className={`flex items-center justify-center gap-2 px-4 py-2 mt-4 text-sm font-medium rounded-md ${
            isAuthThrottled || isAuthLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-primary-500 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
          }`}
        >
          {isAuthLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              인증 중...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {isAuthThrottled 
                ? `${throttleTimeRemaining}초 후 시도하세요` 
                : '조직 추가하기'}
            </>
          )}
        </button>
      </div>
      
      {/* 검색 입력 필드 */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="저장소 검색..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 카테고리 아코디언 */}
      <div className="mb-6">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <span>{activeTab === 'all' ? '모든 저장소' : `${activeTab} 저장소`}</span>
            <svg 
              className={`ml-2 h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveTab('all')
                    setIsDropdownOpen(false)
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeTab === 'all'
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  모든 저장소
                </button>
                {organizations.map(org => (
                  <button
                    key={org}
                    onClick={() => {
                      setActiveTab(org)
                      setIsDropdownOpen(false)
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      activeTab === org
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {org} 저장소
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 저장소 목록 */}
      {isLoading ? (
        <div className="min-h-[650px] flex flex-col">
          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 flex-1 min-h-[500px]">
            {[...Array(4)].map((_, index) => (
              <div 
                key={`skeleton-${index}`} 
                className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100 h-[200px] sm:h-[220px] flex flex-col relative overflow-hidden"
              >
                {/* 스켈레톤 배경 효과 */}
                <div className="absolute inset-0 skeleton-shine"></div>
                
                <div className="flex items-start flex-1 overflow-hidden">
                  <div className="mr-4 flex-shrink-0">
                    <div className="rounded-full h-12 w-12 bg-gray-200"></div>
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mt-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mt-1"></div>
                    <div className="flex items-center mt-4">
                      <div className="h-4 w-16 bg-gray-200 rounded mr-3"></div>
                      <div className="h-4 w-12 bg-gray-200 rounded mr-3"></div>
                      <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-auto flex justify-end">
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 스켈레톤 페이지네이션 */}
          <div className="mt-auto pt-6 h-[100px]">
            <div className="flex justify-center overflow-x-auto pb-2 max-w-full">
              <div className="flex space-x-2 flex-wrap justify-center">
                <div className="h-10 w-10 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 skeleton-shine"></div>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 skeleton-shine"></div>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 skeleton-shine"></div>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 skeleton-shine"></div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <div className="h-4 w-48 bg-gray-200 rounded relative overflow-hidden">
                <div className="absolute inset-0 skeleton-shine"></div>
              </div>
            </div>
          </div>
        </div>
      ) : filteredRepositories.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <svg className="h-12 w-12 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-lg">표시할 저장소가 없습니다</p>
          {activeTab !== 'all' && (
            <p className="mt-2 text-sm">{activeTab} 조직에 저장소가 없거나 접근 권한이 없습니다.</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {currentRepos.map((repo) => (
              <div 
                key={`${repo.owner.login}-${repo.name}`} 
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div className="mr-4 flex-shrink-0">
                    <Image
                      src={repo.owner.avatar_url}
                      alt={repo.owner.login}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      <Link 
                        href={repo.html_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {repo.owner.login === session?.user?.name ? (
                          <span>내 저장소 / {repo.name}</span>
                        ) : (
                          <span>{repo.full_name}</span>
                        )}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {repo.description || '설명 없음'}
                    </p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      {repo.language && (
                        <span className="mr-3 flex items-center">
                          <span className="mr-1.5 h-3 w-3 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }}></span>
                          {repo.language}
                        </span>
                      )}
                      <span className="mr-3 flex items-center">
                        <svg className="mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {repo.stargazers_count}
                      </span>
                      <span className="flex items-center">
                        <svg className="mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        {repo.forks_count}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => analyzeRepository(repo.owner.login, repo.name)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    분석하기
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-auto pt-6 h-[100px]">
              {totalPages > 1 && (
                <div className="flex justify-center overflow-x-auto pb-2 max-w-full">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px flex-wrap justify-center" aria-label="Pagination">
                    <button
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">이전</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* 첫번째 페이지 */}
                    {totalPages > 3 && currentPage > 3 && (
                      <>
                        <button
                          onClick={() => paginate(1)}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          1
                          </button>
                        {currentPage > 4 && (
                          <span className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                      </>
                    )}
                    
                    {/* 페이지 번호 (모바일에 최적화) */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(num => {
                        // 현재 페이지 주변 2개 페이지만 표시 (또는 총 페이지가 5개 이하면 모두 표시)
                        if (totalPages <= 5) return true;
                        return Math.abs(num - currentPage) <= 1;
                      })
                      .map((number) => (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === number
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {number}
                        </button>
                      ))}
                    
                    {/* 마지막 페이지 */}
                    {totalPages > 3 && currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <span className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => paginate(totalPages)}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">다음</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              )}
            </div>
          )}
          
          {/* 결과 요약 */}
          <div className="mt-4 text-sm text-gray-500 text-center">
            전체 {filteredRepositories.length}개 중 {indexOfFirstRepo + 1}-{Math.min(indexOfLastRepo, filteredRepositories.length)}개 표시
          </div>
        </>
      )}
    </div>
  )
}

// 언어별 색상 매핑
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Python: '#3572A5',
    Java: '#b07219',
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#178600',
    Ruby: '#701516',
    Go: '#00ADD8',
    PHP: '#4F5D95',
    Swift: '#ffac45',
    Kotlin: '#F18E33',
    Rust: '#dea584',
    Dart: '#00B4AB',
  }
  
  return colors[language] || '#8257e5'
} 