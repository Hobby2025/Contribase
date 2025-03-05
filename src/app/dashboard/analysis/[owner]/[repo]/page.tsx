'use client'

import React, { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { analyzeRepository, AnalysisResult } from '@/lib/analyzer'

// 컴포넌트 임포트
import {
  TechStackSection,
  ProjectCharacteristics,
  ContributionAnalysis,
  DevelopmentPattern,
  CodeQualityMetrics
} from '@/components/analysis'

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
  const unwrappedParams = use(params);
  const owner = unwrappedParams.owner;
  const repo = unwrappedParams.repo;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    progress: number;
    stage: string;
    completed: boolean;
    message?: string;
  }>({ progress: 0, stage: 'preparing', completed: false });

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
  
  // 분석 진행 상태 확인
  useEffect(() => {
    if (isLoading) {
      const checkProgress = async () => {
        try {
          const response = await fetch(`/api/analysis/progress?repo=${owner}/${repo}`);
          if (response.ok) {
            const data = await response.json();
            setProgress(data);
            
            // 분석이 완료되었고 결과가 있으면 결과 설정
            if (data.completed && data.result) {
              setAnalysis(data.result);
              setIsLoading(false);
            } 
            // 오류가 있으면 오류 설정
            else if (data.error) {
              setError(data.error.message);
              setIsLoading(false);
            }
          }
        } catch (err) {
          console.error('진행 상태 확인 오류:', err);
        }
      };
      
      // 주기적으로 진행 상태 확인
      const intervalId = setInterval(checkProgress, 2000);
      return () => clearInterval(intervalId);
    }
  }, [isLoading, owner, repo]);

  // 분석 실행 함수
  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!session?.accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      const result = await analyzeRepository(
        session.accessToken as string,
        owner,
        repo,
        {
          personalAnalysis: true,
          userLogin: session.user?.name || undefined,
          userEmail: session.user?.email || undefined
        }
      );
      
      setAnalysis(result);
    } catch (err) {
      console.error('저장소 분석 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">저장소 분석 진행 중...</h2>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>
          <p className="text-gray-600 mb-2">
            {progress.stage === 'preparing' && '분석 준비 중...'}
            {progress.stage === 'fetching' && '저장소 데이터 가져오는 중...'}
            {progress.stage === 'analyzing' && '데이터 분석 중...'}
            {progress.stage === 'finalizing' && '분석 마무리 중...'}
          </p>
          <p className="text-sm text-gray-500">{progress.message || '잠시만 기다려주세요...'}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">분석 중 오류가 발생했습니다</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={runAnalysis}
            className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            다시 시도
          </button>
        </div>
      ) : analysis ? (
        <div className="space-y-8">
          {/* 분석 타입 표시 - 개인 분석으로 고정 */}
          <div className="flex items-center bg-primary-50 rounded-xl p-4 border border-primary-100">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-primary-800">
                {`${session?.user?.name || '사용자'}님의 개인 기여 분석 결과입니다.`}
              </span>
            </div>
          </div>
          
          {/* 분석 요약 */}
          <div className="bg-white shadow rounded-xl p-7">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">요약</h2>
            <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* 기술 스택 */}
          <TechStackSection 
            techStack={analysis.techStack} 
            analysisType="personal"
            userLogin={session?.user?.name || undefined}
          />

          {/* 프로젝트 특성 */}
          <ProjectCharacteristics 
            characteristics={analysis.characteristics}
            analysisType="personal"
            userLogin={session?.user?.name || undefined}
          />

          {/* 기여도 분석 */}
          <ContributionAnalysis 
            contributions={Object.entries(analysis.developerProfile.commitCategories).map(([category, count]) => ({
              category,
              percentage: Math.round((count / analysis.developerProfile.totalCommits) * 100)
            }))}
            analysisType="personal"
            userLogin={session?.user?.name || undefined}
          />

          {/* 주요 기능 */}
          <div className="bg-white shadow rounded-xl p-7">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">주요 기능</h2>
            <div className="space-y-5">
              {analysis.keyFeatures.map((feature, index) => (
                <div key={index} className="border-l-4 border-primary-500 pl-5 py-3 bg-gray-50 rounded-r-lg">
                  <h3 className="text-lg font-medium text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 개발자 인사이트 */}
          <div className="bg-white shadow rounded-xl p-7">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">개발 패턴 인사이트</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {analysis.insights.map((insight, index) => (
                <div key={index} className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h3 className="text-md font-medium text-blue-800">{insight.title}</h3>
                  <p className="mt-2 text-sm text-blue-700 leading-relaxed">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 맞춤형 추천 */}
          <div className="bg-white shadow rounded-xl p-7">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">맞춤형 개선 추천</h2>
            <div className="space-y-5">
              {analysis.recommendations.map((recommendation, index) => (
                <div 
                  key={index} 
                  className={`border rounded-xl p-5 ${PRIORITY_COLORS[recommendation.priority]}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      {recommendation.priority === 'high' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      ) : recommendation.priority === 'medium' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-md font-medium">
                        {recommendation.title}
                        <span className="ml-2 px-2.5 py-0.5 text-xs rounded-full">
                          {recommendation.priority === 'high' ? '높음' : 
                           recommendation.priority === 'medium' ? '중간' : '낮음'}
                        </span>
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed">{recommendation.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 코드 품질 */}
          <CodeQualityMetrics 
            score={analysis.codeQuality}
            metrics={analysis.codeQualityMetrics}
            analysisType="personal"
            userLogin={session?.user?.name || undefined}
          />

          {/* 개발 패턴 */}
          <DevelopmentPattern 
            developmentPattern={analysis.developmentPattern} 
            analysisType="personal"
            userLogin={session?.user?.name || undefined}
          />

          {/* PDF 다운로드 버튼 */}
          <div className="flex justify-center mt-8">
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              onClick={() => alert('PDF 다운로드 기능은 준비 중입니다.')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              PDF로 다운로드
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
} 