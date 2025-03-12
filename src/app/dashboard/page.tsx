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
  
  // 사용자가 자신의 커밋만 분석할 수 있도록 상태 추가
  const [onlyUserCommits, setOnlyUserCommits] = useState(true);

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

  // 저장소 분석 함수 수정
  const analyzeRepository = (owner: string, repo: string) => {
    // 분석 시작 상태 설정
    setIsLoading(true);
    setError(null);
    
    // 세션에서 액세스 토큰 확인
    if (!session?.accessToken) {
      setError('GitHub 인증 토큰이 없습니다. 로그아웃 후 다시 로그인해 주세요.');
      setIsLoading(false);
      return;
    }
    
    // 프로그레스 페이지로 이동 (분석 진행 상황을 보여주기 위함)
    // 분석 옵션을 URL 파라미터로 전달
    router.push(`/dashboard/analysis/${owner}/${repo}?onlyUserCommits=${onlyUserCommits}`);
    
    // API 호출은 분석 페이지에서 처리
  };

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

  // 저장소 목록 렌더링
  const renderRepositories = () => {
    if (isLoading) {
      // 스켈레톤 UI 렌더링 - 이 부분만 사용하고 다른 스켈레톤은 제거
      return (
        <div className="min-h-[450px] flex flex-col">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 flex-1 min-h-[500px]">
            {[...Array(6)].map((_, index) => (
              <div 
                key={`skeleton-${index}`} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-6 animate-pulse"></div>
                <div className="flex justify-between items-center">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 스켈레톤 페이지네이션 */}
          <div className="mt-6 flex justify-center">
            <div className="flex gap-2">
              {/* 이전 페이지 버튼 */}
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              {/* 최대 3개의 페이지 번호만 표시 */}
              {[...Array(3)].map((_, index) => (
                <div key={`page-${index}`} className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
              {/* 다음 페이지 버튼 */}
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>다시 시도하거나 GitHub 계정 권한을 확인해주세요.</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setReloadKey(prev => prev + 1);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-200 dark:bg-red-900 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="mr-2 -ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (repositories.length === 0) {
      return (
        <div className="text-center py-12 px-4">
          <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">저장소가 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">GitHub에 저장소를 생성하거나 권한을 확인해주세요.</p>
          <div className="mt-6">
            <button
              onClick={() => setReloadKey(prev => prev + 1)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              새로고침
            </button>
          </div>
        </div>
      );
    }

    // 필터링된 저장소
    const filteredRepos = repositories
      .filter(repo => 
        // 검색어로 필터링
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(repo => {
        // 탭으로 필터링
        if (activeTab === 'all') return true;
        if (activeTab === 'personal') return repo.owner.login === session?.user?.name;
        // 조직 필터링
        return activeTab === repo.owner.login;
      });

    // 페이지네이션 계산
    const indexOfLastRepo = currentPage * reposPerPage;
    const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
    const currentRepos = filteredRepos.slice(indexOfFirstRepo, indexOfLastRepo);
    const totalPages = Math.ceil(filteredRepos.length / reposPerPage);

    if (filteredRepos.length === 0) {
      return (
        <div className="text-center py-10 px-4">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">검색 결과 없음</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            '{searchTerm}' 검색어와 일치하는 저장소가 없습니다.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setSearchTerm('')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              검색어 지우기
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentRepos.map(repo => (
            <div 
              key={repo.id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Image 
                  src={repo.owner.avatar_url} 
                  alt={repo.owner.login}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"
                />
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                    {repo.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {repo.owner.login}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 min-h-[2.5rem]">
                {repo.description || '설명 없음'}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {repo.language && (
                  <div className="flex items-center">
                    <span 
                      className="h-3 w-3 rounded-full mr-1"
                      style={{ backgroundColor: getLanguageColor(repo.language) }}
                    ></span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">{repo.language}</span>
                  </div>
                )}
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  {repo.stargazers_count}
                </div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {repo.forks_count}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={() => analyzeRepository(repo.owner.login, repo.name)}
                  className="flex items-center text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 py-2 px-4 rounded-lg transition-colors"
                >
                  <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  분석하기
                </button>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
          ))}
        </div>
        
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="flex items-center">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-l-md border ${currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* 페이지 버튼 - 모바일 친화적으로 수정 */}
              {(() => {
                // 화면에 보여줄 페이지 버튼 수 계산 로직
                let pages = [];
                
                // 총 페이지 수가 5 이하면 모든 페이지 표시
                if (totalPages <= 5) {
                  pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                } else {
                  // 현재 페이지가 처음/끝에 가까울 때 처리
                  if (currentPage <= 3) {
                    // 1, 2, 3, 4, ..., totalPages
                    pages = [1, 2, 3, 4, 'ellipsis', totalPages];
                  } else if (currentPage >= totalPages - 2) {
                    // 1, ..., totalPages-3, totalPages-2, totalPages-1, totalPages
                    pages = [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                  } else {
                    // 1, ..., currentPage-1, currentPage, currentPage+1, ..., totalPages
                    pages = [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
                  }
                }
                
                return pages.map((page, index) => {
                  // 생략 부호 처리
                  if (page === 'ellipsis') {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 py-1 border-t border-b bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        ...
                      </span>
                    );
                  }
                  
                  // 일반 페이지 번호 버튼
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={`page-${page}`}
                      onClick={() => paginate(page as number)}
                      className={`px-3 py-1 border-t border-b ${isActive 
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-medium' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                    >
                      {page}
                    </button>
                  );
                });
              })()}
              
              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-r-md border ${currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </>
    );
  };

  // 로딩 중이거나 인증되지 않은 경우 로딩 표시
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* 스켈레톤 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-10 w-52 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* 스켈레톤 검색 필드 */}
        <div className="relative mb-4">
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* 스켈레톤 드롭다운 */}
        <div className="mb-6">
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* 저장소 목록 스켈레톤 - renderRepositories 함수 재사용 */}
        {renderRepositories()}
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
              <div className="inline-flex h-4 w-4 mr-2 bg-gray-200 rounded-full animate-pulse"></div>
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

      {/* 탭 상단에 추가 */}
      <div className="flex items-center justify-end mb-3">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4 text-primary-500 rounded"
            checked={onlyUserCommits}
            onChange={(e) => setOnlyUserCommits(e.target.checked)}
          />
          <span className="ml-2 text-sm text-gray-700">내 커밋만 분석하기</span>
        </label>
      </div>

      {/* 저장소 목록 */}
      {renderRepositories()}
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