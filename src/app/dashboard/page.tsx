'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  
  // 인증 상태 확인
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-required')
    }
  }, [status, router])

  // 저장소 목록 가져오기
  useEffect(() => {
    const fetchRepositories = async () => {
      if (status !== 'authenticated' || !session?.accessToken) {
        return
      }
      
      try {
        setIsLoading(true)
        setError(null)
        
        const repos = await getUserRepositories(session.accessToken)
        setRepositories(repos)
        setIsLoading(false)
      } catch (err) {
        console.error('저장소 로딩 오류:', err)
        setError('GitHub 저장소를 가져오는 데 문제가 발생했습니다. GitHub 토큰이 유효한지 확인하세요.')
        setIsLoading(false)
      }
    }
    
    fetchRepositories()
  }, [status, session])

  // 저장소 분석하기
  const analyzeRepository = (owner: string, repo: string) => {
    router.push(`/dashboard/analysis/${owner}/${repo}`)
  }

  // 검색 필터
  const filteredRepositories = repositories.filter((repo) => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 로딩 중이거나 인증되지 않은 경우 로딩 표시
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">GitHub 저장소</h1>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="저장소 검색..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            다시 시도
          </button>
        </div>
      ) : filteredRepositories.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">저장소를 찾을 수 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">검색어를 변경하거나 GitHub에서 새 저장소를 생성하세요.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredRepositories.map((repo) => (
            <div 
              key={repo.id} 
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
                      className="hover:text-primary-600"
                    >
                      {repo.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {repo.owner.login} • 최종 업데이트: {new Date(repo.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                {repo.description || '설명 없음'}
              </p>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex space-x-4 text-sm text-gray-500">
                  {repo.language && (
                    <div className="flex items-center">
                      <span className="relative inline-block h-3 w-3 mr-1 rounded-full bg-primary-500" />
                      <span>{repo.language}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <span>{repo.stargazers_count}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3.5 3.25a.75.75 0 011.5 0v8.94l1.72-1.72a.75.75 0 111.06 1.06l-3 3a.75.75 0 01-1.06 0l-3-3a.75.75 0 111.06-1.06l1.72 1.72V3.25zm7.5 5a.75.75 0 01.75-.75h3.5a.75.75 0 110 1.5h-3.5a.75.75 0 01-.75-.75zM8.75 12a.75.75 0 000 1.5h9.5a.75.75 0 000-1.5h-9.5zm-5 5.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H4.5a.75.75 0 01-.75-.75z" />
                    </svg>
                    <span>{repo.forks_count}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => analyzeRepository(repo.owner.login, repo.name)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  분석하기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 