'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { analyzeRepository, AnalysisResult } from '@/lib/analyzer'

// 커밋 카테고리 색상 매핑
const CATEGORY_COLORS = {
  '기능 추가': 'bg-green-100 text-green-800',
  '버그 수정': 'bg-red-100 text-red-800',
  '리팩토링': 'bg-blue-100 text-blue-800',
  '문서화': 'bg-yellow-100 text-yellow-800',
  '스타일': 'bg-purple-100 text-purple-800',
  '테스트': 'bg-indigo-100 text-indigo-800',
  '기타': 'bg-gray-100 text-gray-800',
};

// 우선순위 색상 매핑
const PRIORITY_COLORS = {
  'high': 'bg-red-100 text-red-800 border-red-300',
  'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'low': 'bg-blue-100 text-blue-800 border-blue-300',
};

// 분석 결과 페이지 props 타입
interface AnalysisPageProps {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export default function RepositoryAnalysis({ params }: AnalysisPageProps) {
  // Next.js 15에서 권장하는 방식으로 params 처리
  const { owner, repo } = React.use(params);
  
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)

  // 카테고리에 따른 색상 반환
  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || 'bg-gray-100 text-gray-800'
  }

  // 우선순위에 따른 색상 반환
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    return PRIORITY_COLORS[priority] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  // 인증 상태 확인
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-required')
    }
  }, [status, router])

  // 저장소 분석 실행
  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      runAnalysis()
    }
  }, [status, session])

  // 분석 실행 함수
  const runAnalysis = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!session?.accessToken) {
        throw new Error('GitHub 액세스 토큰이 없습니다.')
      }

      const result = await analyzeRepository(
        session.accessToken,
        owner,
        repo
      )

      setAnalysis(result)
      setIsLoading(false)
    } catch (error) {
      console.error('저장소 분석 오류:', error)
      setError('저장소를 분석하는 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  // 로딩 중이거나 인증되지 않은 경우 로딩 표시
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* 스켈레톤 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-60 bg-gray-200/60 rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-gray-200/60 rounded animate-pulse"></div>
        </div>

        {/* 스켈레톤 UI - 분석 결과 */}
        <div className="space-y-6">
          {/* 분석 요약 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="h-20 bg-gray-200/60 rounded-md w-full animate-pulse"></div>
          </div>

          {/* 기술 스택 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={`tech-${index}`} className="relative">
                  <div className="flex justify-between mb-1">
                    <div className="h-4 bg-gray-200/60 rounded w-1/5 animate-pulse"></div>
                    <div className="h-4 bg-gray-200/60 rounded w-12 animate-pulse"></div>
                  </div>
                  <div className="h-2.5 bg-gray-200/60 rounded-full w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 프로젝트 특성 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={`char-${index}`} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-gray-200/60 rounded w-1/2 animate-pulse"></div>
                    <div className="h-6 bg-gray-200/60 rounded w-12 animate-pulse"></div>
                  </div>
                  <div className="h-2 bg-gray-200/60 rounded-full w-full mb-2 animate-pulse"></div>
                  <div className="h-12 bg-gray-200/60 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 기여도 분석 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={`contrib-${index}`} className="flex items-center">
                  <div className="h-5 bg-gray-200/60 rounded-full w-16 mr-2 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200/60 rounded-full w-full animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-gray-200/60 rounded w-10 ml-2 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 주요 기능 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={`feature-${index}`} className="border-l-4 border-primary-200 pl-4 py-2">
                  <div className="h-5 bg-gray-200/60 rounded w-1/3 mb-2 animate-pulse"></div>
                  <div className="h-12 bg-gray-200/60 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 개발자 인사이트 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={`insight-${index}`} className="bg-blue-50/40 rounded-lg p-4 border border-blue-100/40">
                  <div className="h-5 bg-gray-200/60 rounded w-1/2 mb-2 animate-pulse"></div>
                  <div className="h-12 bg-gray-200/60 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 맞춤형 추천 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={`rec-${index}`} className="border rounded-lg p-4 border-gray-200/60">
                  <div className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200/60 mr-3 mt-0.5 animate-pulse"></span>
                    <div>
                      <div className="h-5 bg-gray-200/60 rounded w-1/2 mb-2 animate-pulse"></div>
                      <div className="h-12 bg-gray-200/60 rounded w-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 코드 품질 점수 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="flex items-center">
              <div className="w-24 h-24 rounded-full border-8 border-primary-100/40 mr-6 flex items-center justify-center">
                <div className="h-10 w-10 bg-gray-200/60 rounded animate-pulse"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200/60 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200/60 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* PDF 다운로드 버튼 스켈레톤 */}
          <div className="flex justify-center">
            <div className="h-10 w-40 bg-gray-200/60 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {owner}/{repo} 분석 결과
        </h1>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          ← 돌아가기
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* 분석 요약 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="h-20 bg-gray-200/60 rounded-md w-full animate-pulse"></div>
          </div>

          {/* 기술 스택 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={`tech-${index}`} className="relative">
                  <div className="flex justify-between mb-1">
                    <div className="h-4 bg-gray-200/60 rounded w-1/5 animate-pulse"></div>
                    <div className="h-4 bg-gray-200/60 rounded w-12 animate-pulse"></div>
                  </div>
                  <div className="h-2.5 bg-gray-200/60 rounded-full w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 프로젝트 특성 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={`char-${index}`} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-gray-200/60 rounded w-1/2 animate-pulse"></div>
                    <div className="h-6 bg-gray-200/60 rounded w-12 animate-pulse"></div>
                  </div>
                  <div className="h-2 bg-gray-200/60 rounded-full w-full mb-2 animate-pulse"></div>
                  <div className="h-12 bg-gray-200/60 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 기여도 분석 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={`contrib-${index}`} className="flex items-center">
                  <div className="h-5 bg-gray-200/60 rounded-full w-16 mr-2 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200/60 rounded-full w-full animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-gray-200/60 rounded w-10 ml-2 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 주요 기능 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={`feature-${index}`} className="border-l-4 border-primary-200 pl-4 py-2">
                  <div className="h-5 bg-gray-200/60 rounded w-1/3 mb-2 animate-pulse"></div>
                  <div className="h-12 bg-gray-200/60 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 개발자 인사이트 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={`insight-${index}`} className="bg-blue-50/40 rounded-lg p-4 border border-blue-100/40">
                  <div className="h-5 bg-gray-200/60 rounded w-1/2 mb-2 animate-pulse"></div>
                  <div className="h-12 bg-gray-200/60 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* 맞춤형 추천 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={`rec-${index}`} className="border rounded-lg p-4 border-gray-200/60">
                  <div className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200/60 mr-3 mt-0.5 animate-pulse"></span>
                    <div>
                      <div className="h-5 bg-gray-200/60 rounded w-1/2 mb-2 animate-pulse"></div>
                      <div className="h-12 bg-gray-200/60 rounded w-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 코드 품질 점수 스켈레톤 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="h-6 bg-gray-200/60 rounded-md w-1/4 mb-4 animate-pulse"></div>
            <div className="flex items-center">
              <div className="w-24 h-24 rounded-full border-8 border-primary-100/40 mr-6 flex items-center justify-center">
                <div className="h-10 w-10 bg-gray-200/60 rounded animate-pulse"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200/60 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200/60 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* PDF 다운로드 버튼 스켈레톤 */}
          <div className="flex justify-center">
            <div className="h-10 w-40 bg-gray-200/60 rounded animate-pulse"></div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
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
          <div className="mt-4 flex justify-center">
            <button
              onClick={runAnalysis}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* 분석 요약 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">요약</h2>
            <p className="text-gray-700">{analysis.summary}</p>
          </div>

          {/* 기술 스택 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">기술 스택</h2>
            <div className="space-y-4">
              {analysis.techStack.map((tech) => (
                <div key={tech.name} className="relative">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{tech.name}</span>
                    <span className="text-sm font-medium text-gray-500">{tech.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary-600 h-2.5 rounded-full" 
                      style={{ width: `${tech.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 프로젝트 특성 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">프로젝트 특성</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.projectCharacteristics.map((char) => (
                <div key={char.type} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium text-gray-800">{char.type}</h3>
                    <span className="text-lg font-bold text-primary-600">{char.score}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${char.score}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">{char.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 기여도 분석 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">기여도 분석</h2>
            <div className="space-y-3">
              {analysis.contributions.map((contrib) => (
                <div key={contrib.category} className="flex items-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(contrib.category)} mr-2`}>
                    {contrib.category}
                  </span>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${contrib.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="ml-2 text-sm text-gray-500 w-10 text-right">{contrib.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 주요 기능 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">주요 기능</h2>
            <div className="space-y-4">
              {analysis.keyFeatures.map((feature, index) => (
                <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                  <h3 className="text-lg font-medium text-gray-900">{feature.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 개발자 인사이트 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">개발 패턴 인사이트</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.developerInsights.map((insight, index) => (
                <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="text-md font-medium text-blue-800">{insight.title}</h3>
                  <p className="mt-1 text-sm text-blue-700">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 맞춤형 추천 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">프로젝트 개선 제안</h2>
            <div className="space-y-4">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}>
                  <div className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-current text-xs font-medium mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-md font-medium">{rec.title}</h3>
                      <p className="mt-1 text-sm">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 코드 품질 점수 */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">코드 품질 점수</h2>
            <div className="flex items-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center border-8 border-primary-100 mr-6">
                <span className="text-2xl font-bold text-primary-600">{analysis.codeQuality}</span>
              </div>
              <div>
                <p className="text-gray-700">
                  {analysis.codeQuality >= 90 ? '우수한 코드 품질' : 
                   analysis.codeQuality >= 70 ? '양호한 코드 품질' : 
                   analysis.codeQuality >= 50 ? '개선 가능한 코드 품질' : 
                   '주의가 필요한 코드 품질'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  커밋 내역과 코드 패턴을 기반으로 산출된 점수입니다.
                </p>
              </div>
            </div>
          </div>

          {/* PDF 다운로드 버튼 */}
          <div className="flex justify-center">
            <a
              href={`/api/analysis/pdf/${owner}/${repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              PDF로 다운로드
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">분석 데이터 없음</h3>
          <p className="mt-1 text-sm text-gray-500">아직 저장소가 분석되지 않았습니다.</p>
          <div className="mt-6">
            <button
              onClick={runAnalysis}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              분석 시작
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 