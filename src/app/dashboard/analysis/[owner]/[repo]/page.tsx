'use client'

import React, { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnalysisResult } from '@/lib/analyzer'
import {
  TechStackSection,
  ContributionAnalysis,
  DevelopmentPattern,
  CodeQualityMetrics,
  AIProjectDefinition
} from '@/components/analysis'

// 우선순위 색상 매핑
const PRIORITY_COLORS: Record<string, string> = {
  'high': 'bg-red-100 text-red-800 border-red-300',
  'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'low': 'bg-blue-100 text-blue-800 border-blue-300',
};

// 분석 결과 페이지 props 타입
interface AnalysisPageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export default function RepositoryAnalysis({ params }: AnalysisPageProps) {
  // params에서 owner와 repo 추출 - React.use()를 사용하여 언래핑
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
      // 저장소 분석 상태 확인 먼저 시도
      const checkExistingAnalysis = async () => {
        try {
          const repoKey = `${owner}/${repo}`;
          const response = await fetch(`/api/analysis/progress?repo=${encodeURIComponent(repoKey)}`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.completed && data.result) {
              console.log('기존 분석 결과 발견, 새 분석 시작하지 않음');
              setProgress(data);
              setAnalysis(data.result);
              setIsLoading(false);
              return;
            }
          }
          // 기존 분석 결과가 없거나 완료되지 않은 경우에만 새 분석 시작
          runAnalysis();
        } catch (err) {
          console.error('기존 분석 확인 오류:', err);
          runAnalysis();
        }
      };
      
      checkExistingAnalysis();
    }
  }, [status, session]);
  
  // 분석 진행 상태 확인
  useEffect(() => {
    if (isLoading) {
      let checkAttempts = 0;
      const maxCheckAttempts = 5;
      
      const checkProgress = async () => {
        try {
          if (checkAttempts >= maxCheckAttempts) {
            console.log(`최대 체크 시도 횟수(${maxCheckAttempts}회)에 도달했습니다.`);
            // 이미 완료된 분석이 있는지 확인 후 재시작
            const repoKey = `${owner}/${repo}`;
            const existingCheck = await fetch(`/api/analysis/progress?repo=${encodeURIComponent(repoKey)}`);
            
            if (existingCheck.ok) {
              const existingData = await existingCheck.json();
              if (existingData.completed && existingData.result) {
                console.log('분석이 이미 완료되었습니다. 새로운 분석을 시작하지 않습니다.');
                setProgress(existingData);
                setAnalysis(existingData.result);
                setIsLoading(false);
                return;
              }
            }
            
            // 분석이 정말 필요한 경우에만 재시작
            if (session?.accessToken) {
              console.log('분석을 다시 시작합니다...');
              runAnalysis();
              checkAttempts = 0;
              return;
            }
          }
          
          checkAttempts++;
          console.log(`진행 상태 확인 중... ${owner}/${repo} (시도 ${checkAttempts}/${maxCheckAttempts})`);
          
          // 정확한 repo 키 설정 - 대소문자 주의
          const repoKey = `${owner}/${repo}`;
          
          // 타임아웃 있는 fetch 함수
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
          
          try {
            const response = await fetch(`/api/analysis/progress?repo=${encodeURIComponent(repoKey)}`, {
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`API 오류: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // 디버깅: 받은 데이터 구조 확인
            const dataKeys = Object.keys(data);
            console.log(`진행 상태 데이터 키: ${dataKeys.join(', ')}`);
            
            // 이전 상태와 비교하여 변경 사항만 업데이트
            if (JSON.stringify(data) !== JSON.stringify(progress)) {
              setProgress(data);
            }
            
            // 분석이 완료되었고 결과가 있으면 결과 설정
            if (data.completed && data.result) {
              console.log('분석 완료, 결과가 있습니다.');
              console.log('결과 객체 키:', Object.keys(data.result).join(', '));
              setAnalysis(data.result);
              setIsLoading(false);
              return; // 중요: 완료된 경우 함수 종료
            } 
            // 오류가 있으면 오류 설정
            else if (data.error) {
              console.error('분석 오류:', data.error);
              setError(data.error.message);
              setIsLoading(false);
              return; // 중요: 오류가 있는 경우 함수 종료
            }
            // 완료됐지만 결과가 없는 경우, 몇 번만 재시도
            else if (data.completed && !data.result) {
              console.warn('분석이 완료되었지만 결과가 없습니다.');
              
              // 재시도 횟수 제한 로직 추가
              const retryCount = parseInt(sessionStorage.getItem(`retry-${repoKey}`) || '0');
              
              if (retryCount < 2) { // 최대 2번만 재시도
                console.log(`분석 재시도 (${retryCount + 1}/2)...`);
                sessionStorage.setItem(`retry-${repoKey}`, String(retryCount + 1));
                
                // 재시도 트리거 (delay 추가)
                setTimeout(() => {
                  if (session?.accessToken) {
                    // 재시도 전 마지막으로 한 번 더 더 확인
                    const recheckAnalysis = async () => {
                      try {
                        const recheckResponse = await fetch(`/api/analysis/progress?repo=${encodeURIComponent(repoKey)}`);
                        if (recheckResponse.ok) {
                          const recheckData = await recheckResponse.json();
                          if (recheckData.completed && recheckData.result) {
                            console.log('재확인 결과 분석이 이미 완료되었습니다.');
                            setProgress(recheckData);
                            setAnalysis(recheckData.result);
                            setIsLoading(false);
                            return;
                          }
                        }
                        // 정말 필요한 경우에만 분석 재시작
                        runAnalysis();
                      } catch (err) {
                        console.error('재확인 오류:', err);
                        runAnalysis();
                      }
                    };
                    recheckAnalysis();
                  }
                }, 3000);
              } else {
                console.error('최대 재시도 횟수 초과. 분석을 중단합니다.');
                setError('분석 결과를 가져오는데 실패했습니다. 나중에 다시 시도해 주세요.');
                setIsLoading(false);
              }
            }
          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            
            // AbortError는 타임아웃이 발생한 경우
            if (fetchError.name === 'AbortError') {
              console.error('API 요청 시간 초과');
            } else {
              console.error('API 호출 오류:', fetchError);
            }
            
            // 다음 폴링 때 다시 시도하므로 별도의 처리 필요 없음
          }
        } catch (err) {
          console.error('진행 상태 확인 오류:', err);
        }
      };
      
      // 주기적으로 진행 상태 확인 (2초에서 5초로 증가)
      let intervalId = setInterval(checkProgress, 5000);
      // 최초 1회 즉시 실행
      checkProgress();
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isLoading, owner, repo, session]);

  // 분석 실행 함수
  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!session?.accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      // API 엔드포인트를 통해 분석 요청
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20초 타임아웃
      
      try {
        const response = await fetch('/api/analysis/repository', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: session.accessToken,
            owner,
            repo,
            options: {
              personalAnalysis: true,
              userLogin: session.user?.name || undefined,
              userEmail: session.user?.email || undefined
            }
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`분석 요청 실패: ${response.status} ${response.statusText}`);
        }
        
        // 추가: 분석 요청 결과 확인
        const result = await response.json();
        console.log('분석 요청 결과:', result);
        
        // 분석이 시작되면 진행 상태를 확인하는 로직이 실행됨
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('분석 요청 시간이 초과되었습니다.');
        }
        throw fetchError;
      }
    } catch (err) {
      console.error('저장소 분석 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
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
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden relative">
            {progress.progress > 0 ? (
              <div 
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${progress.progress}%` }}
              ></div>
            ) : (
              <div className="h-2.5 w-full relative overflow-hidden">
                <div className="animate-progress-pulse h-full w-1/2 absolute top-0 left-0 bg-blue-400/30"></div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mb-4">
            <span>0%</span>
            <span className="font-medium">{progress.progress}%</span>
            <span>100%</span>
          </div>
          
          <div className="flex items-center mb-3">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              progress.stage === 'preparing' ? 'bg-blue-500 animate-pulse' : 
              progress.stage === 'fetching' || progress.stage === 'analyzing' || progress.stage === 'finalizing' ? 'bg-blue-500' : 'bg-gray-300'
            }`}></div>
            <p className={`text-gray-600 ${progress.stage === 'preparing' ? 'font-medium' : ''}`}>
              {progress.stage === 'preparing' ? '분석 준비 중...' : '분석 준비'}
              {progress.stage === 'preparing' && 
                <span className="ml-1 inline-flex">
                  <span className="dot-1">.</span>
                  <span className="dot-2">.</span>
                  <span className="dot-3">.</span>
                </span>
              }
            </p>
          </div>

          <div className="flex items-center mb-3">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              progress.stage === 'fetching' ? 'bg-blue-500 animate-pulse' : 
              progress.stage === 'analyzing' || progress.stage === 'finalizing' ? 'bg-blue-500' : 'bg-gray-300'
            }`}></div>
            <p className={`text-gray-600 ${progress.stage === 'fetching' ? 'font-medium' : ''}`}>
              {progress.stage === 'fetching' ? '저장소 데이터 가져오는 중...' : '저장소 데이터 가져오기'}
              {progress.stage === 'fetching' && 
                <span className="ml-1 inline-flex">
                  <span className="dot-1">.</span>
                  <span className="dot-2">.</span>
                  <span className="dot-3">.</span>
                </span>
              }
            </p>
          </div>

          <div className="flex items-center mb-3">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              progress.stage === 'analyzing' ? 'bg-blue-500 animate-pulse' : 
              progress.stage === 'finalizing' ? 'bg-blue-500' : 'bg-gray-300'
            }`}></div>
            <p className={`text-gray-600 ${progress.stage === 'analyzing' ? 'font-medium' : ''}`}>
              {progress.stage === 'analyzing' ? 'GPT-4 Mini로 데이터 분석 중...' : '데이터 분석'}
              {progress.stage === 'analyzing' && 
                <span className="ml-1 inline-flex">
                  <span className="dot-1">.</span>
                  <span className="dot-2">.</span>
                  <span className="dot-3">.</span>
                </span>
              }
            </p>
          </div>

          <div className="flex items-center mb-4">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              progress.stage === 'finalizing' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
            }`}></div>
            <p className={`text-gray-600 ${progress.stage === 'finalizing' ? 'font-medium' : ''}`}>
              {progress.stage === 'finalizing' ? '분석 결과 생성 중...' : '결과 생성'}
              {progress.stage === 'finalizing' && 
                <span className="ml-1 inline-flex">
                  <span className="dot-1">.</span>
                  <span className="dot-2">.</span>
                  <span className="dot-3">.</span>
                </span>
              }
            </p>
          </div>

          <p className="text-sm text-gray-500 italic">
            {progress.message || '분석은 약 30초에서 1분 정도 소요됩니다. 잠시만 기다려주세요...'}
          </p>
          
          <div className="mt-4 text-xs text-gray-400">
            GPT-4 Mini를 사용한 코드 분석 중입니다. 저장소 크기에 따라 시간이 더 걸릴 수 있습니다.
          </div>
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
          
          {/* AI 프로젝트 정의 (요약 위에 추가) */}
          {analysis.repositoryInfo.aiAnalyzed && (
            <AIProjectDefinition
              isAIAnalyzed={analysis.repositoryInfo.aiAnalyzed}
              description=""
              projectType={analysis.repositoryInfo.aiProjectType || '웹 애플리케이션'}
              features={analysis.keyFeatures
                .filter((feature: { importance: number }) => feature.importance >= 0.7)
                .map((feature: { title: string }) => feature.title)}
              technologies={analysis.techStack
                .filter((tech: { confidence: number }) => tech.confidence >= 0.8)
                .map((tech: { name: string }) => tech.name)}
            />
          )}
          
          {/* 분석 요약 (상세 설명) */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-7 mb-6">
            <div className="flex items-center mb-5">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-blue-600 dark:text-blue-300" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">프로젝트 설명</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-5 rounded-lg leading-relaxed text-base">
              {analysis.summary}
            </p>
          </div>

          {/* 기술 스택 */}
          <TechStackSection 
            techStack={analysis.techStack} 
            analysisType={analysis.repositoryInfo.isUserAnalysis ? "personal" : "repository"}
            userLogin={session?.user?.name || undefined}
          />

          {/* 기여도 분석 */}
          <ContributionAnalysis 
            contributions={Object.entries(analysis.developerProfile.commitCategories).map(([category, count]) => ({
              category,
              percentage: Math.round((Number(count) / analysis.developerProfile.totalCommits) * 100)
            }))}
            analysisType={analysis.repositoryInfo.isUserAnalysis ? "personal" : "repository"}
            userLogin={session?.user?.name || undefined}
          />

          {/* 주요 기능 */}
          <div className="bg-white shadow rounded-xl p-7">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">주요 기능</h2>
            <div className="space-y-5">
              {analysis.keyFeatures.map((feature: { title: string; description: string }, index: number) => (
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
              {analysis.insights.map((insight: { title: string; description: string }, index: number) => (
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
              {analysis.recommendations.map((recommendation: { title: string; description: string; priority: string }, index: number) => (
                <div 
                  key={index} 
                  className={`border rounded-xl p-5 ${PRIORITY_COLORS[recommendation.priority] || ''}`}
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
            codeQualityMetrics={{
              readability: 70,
              maintainability: 65,
              testCoverage: 50,
              documentation: 60,
              architecture: 75
            }}
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
  );
} 