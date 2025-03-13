'use client'

import React, { useState, useEffect, useCallback, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { AnalysisResult } from '@/modules/analyzer'
import {
  TechStackSection,
  ContributionAnalysis,
  DevelopmentPattern,
  CodeQualityMetrics,
  AIProjectDefinition
} from '@/components/analysis'
import Image from 'next/image'
import AnalysisLoading from '@/components/analysis/AnalysisLoading'
import { CodeQualityMetrics as CodeQualityMetricsType } from '@/lib/codeQualityAnalyzer'

// CodeQualityMetricsData 타입 정의
type CodeQualityMetricsData = {
  readability: number;
  maintainability: number;
  testCoverage: number;
  documentation: number;
  architecture: number;
}

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

// 코드 품질 데이터 인터페이스 정의
interface CodeQualityData {
  readability: number;
  maintainability: number;
  testCoverage: number;
  documentation: number;
  architecture: number;
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

  // 분석 재시작 방지를 위한 상태
  const [analysisRequested, setAnalysisRequested] = useState(false);
  
  // 할당량 정보를 저장할 상태 추가
  const [quotaInfo, setQuotaInfo] = useState<{
    hasQuota: boolean;
    remaining: number;
    isAdmin: boolean;
  }>({ hasQuota: false, remaining: 0, isAdmin: false });
  
  // 할당량 로딩 상태
  const [quotaLoading, setQuotaLoading] = useState(true);

  // 인증 상태 확인
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login-required')
    }
  }, [status, router])
  
  // 할당량 정보 조회
  useEffect(() => {
    const fetchQuota = async () => {
      if (status !== 'authenticated') return;
      
      try {
        const response = await fetch('/api/user/quota');
        if (response.ok) {
          const data = await response.json();
          setQuotaInfo({
            hasQuota: data.quota.remaining > 0 || data.quota.isAdmin,
            remaining: data.quota.remaining,
            isAdmin: data.quota.isAdmin
          });
        }
      } catch (error) {
        console.error('할당량 정보 로딩 오류:', error);
      } finally {
        setQuotaLoading(false);
      }
    };
    
    fetchQuota();
  }, [status]);

  // 저장소 분석 실행
  useEffect(() => {
    // 이미 분석을 요청했으면 재실행하지 않음
    if (analysisRequested) {
      return;
    }

    if (status === 'authenticated' && session?.accessToken) {
      // 저장소 분석 상태 확인 먼저 시도
      const checkExistingAnalysis = async () => {
        try {
          // 옵션에서 onlyUserCommits 값 가져오기
          const searchParams = new URLSearchParams(window.location.search);
          const onlyUserCommits = searchParams.get('onlyUserCommits') === 'true';
          console.log('분석 옵션 확인: 내 커밋만 =', onlyUserCommits);
          
          // 항상 새 분석 시작
          console.log('새 분석을 시작합니다.');
          setAnalysisRequested(true);
          runAnalysis();
        } catch (err) {
          console.error('기존 분석 확인 오류:', err);
          setAnalysisRequested(true);
          runAnalysis();
        }
      };
      
      checkExistingAnalysis();
    }
  }, [status, session, owner, repo, analysisRequested]);
  
  // 분석 진행 상태 확인
  useEffect(() => {
    if (isLoading) {
      let checkAttempts = 0;
      const maxCheckAttempts = 5;
      let isCancelled = false;
      
      const checkProgress = async () => {
        if (isCancelled) return;
        
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
            
            // 분석이 정말 필요한 경우에만 재시작, 이미 분석 요청이 있었는데 실패한 경우만 재시도
            if (session?.accessToken && analysisRequested) {
              console.log('분석을 다시 시작합니다...');
              runAnalysis();
              checkAttempts = 0;
              return;
            }
          }
          
          checkAttempts++;
          console.log(`진행 상태 확인 중... ${owner}/${repo} (시도 ${checkAttempts}/${maxCheckAttempts})`);
          
          // 분석 정보를 위한 확실한 키 포맷 (owner/repo)
          const repoKey = `${owner}/${repo}`;
          
          // 타임아웃 있는 fetch 함수
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
          
          try {
            // 진행 상태 API 호출 시 정확한 형식으로 전달
            const progressUrl = `/api/analysis/progress?repo=${encodeURIComponent(owner + '/' + repo)}`;
            console.log('진행 상태 요청 URL:', progressUrl);
            
            const response = await fetch(progressUrl, {
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
              // 오류 객체가 있는지 확인하고 안전하게 메시지 추출
              const errorMessage = typeof data.error === 'object' && data.error !== null && 'message' in data.error
                ? data.error.message
                : typeof data.error === 'string' 
                  ? data.error 
                  : '알 수 없는 오류가 발생했습니다';
                  
              // 네트워크 관련 오류인 경우 친절한 메시지 표시
              const isNetworkError = 
                errorMessage.includes('연결이 끊어') || 
                errorMessage.includes('시간이 초과') ||
                errorMessage.includes('other side closed') ||
                errorMessage.includes('rate limit');
                
              const userMessage = isNetworkError
                ? `서버와의 연결에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요. (${errorMessage})`
                : errorMessage;
              
              setError(userMessage);
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
                    // 재시도 전 마지막으로 한 번 더 확인
                    const recheckAnalysis = async () => {
                      if (isCancelled) return;
                      
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
                        // 1초 후에 다시 한번 확인하고 정말 필요한 경우에만 분석 재시작
                        setTimeout(() => {
                          if (isCancelled) return;
                          runAnalysis();
                        }, 1000);
                      } catch (err) {
                        console.error('재확인 오류:', err);
                        if (!isCancelled) {
                          runAnalysis();
                        }
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
        isCancelled = true;
      };
    }
  }, [isLoading, owner, repo, session]);

  // 분석 실행 함수
  const runAnalysis = async () => {
    // 할당량이 없으면 분석 실행 불가
    if (!quotaInfo.hasQuota && !quotaInfo.isAdmin) {
      setError('오늘의 분석 횟수를 모두 사용했습니다. 내일 다시 시도해 주세요.');
      setIsLoading(false);
      return;
    }
    
    // 이미 분석 중이면 중복 실행하지 않음
    if (isLoading && progress.progress > 0) {
      console.log('분석이 이미 진행 중입니다. 중복 실행하지 않습니다.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setProgress({ progress: 1, stage: 'preparing', completed: false });
    
    // 분석 진행 상태 확인 함수 - runAnalysis 내부에 정의
    const checkProgressStatus = async () => {
      try {
        const repoKey = `${owner}/${repo}`;
        const statusResponse = await fetch(`/api/analysis/progress?repo=${encodeURIComponent(repoKey)}`);
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('분석 진행 상태:', statusData);
          
          // 진행 상태 업데이트
          setProgress(statusData);
          
          // 완료된 경우 결과 표시
          if (statusData.completed && statusData.result) {
            setAnalysis(statusData.result);
            setIsLoading(false);
            
            // 할당량 정보 업데이트 (분석 완료 시 할당량이 줄어듦)
            if (statusData.result.quota) {
              setQuotaInfo(statusData.result.quota);
            }
            return; // 완료됨
          }
          
          // 에러가 있는 경우
          if (statusData.error) {
            setError(statusData.error.message);
            setIsLoading(false);
            return; // 오류로 종료
          }
          
          // 계속 진행 중인 경우 5초 후 다시 확인
          setTimeout(checkProgressStatus, 5000);
        } else {
          // 응답 오류 - 10초 후 다시 시도
          console.error('분석 상태 확인 응답 오류:', statusResponse.status);
          setTimeout(checkProgressStatus, 10000);
        }
      } catch (err) {
        console.error('분석 상태 확인 중 오류:', err);
        // 오류 발생 시 10초 후 다시 시도
        setTimeout(checkProgressStatus, 10000);
      }
    };
    
    try {
      if (!session?.accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      // URL 파라미터에서 onlyUserCommits 옵션 값 가져오기
      const searchParams = new URLSearchParams(window.location.search);
      const onlyUserCommits = searchParams.get('onlyUserCommits') === 'true';
      console.log('분석 옵션: 내 커밋만 분석 =', onlyUserCommits);
      
      // 새로운 분석 요청 즉시 시작
      console.log(`새 분석 요청 시작: ${owner}/${repo}, 옵션: 내 커밋만=${onlyUserCommits}`);
      
      // API 엔드포인트를 통해 분석 요청
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃으로 늘림
      
      try {
        // 전송되는 데이터를 로깅
        const requestData = {
          owner,
          repo,
          options: {
            personalAnalysis: true,
            userLogin: session.user?.name || undefined,
            userEmail: session.user?.email || undefined,
            onlyUserCommits: onlyUserCommits
          }
        };
        
        console.log('분석 요청 데이터:', JSON.stringify(requestData));
        
        // 요청 시작
        const response = await fetch('/api/analysis/repository', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('분석 요청 응답 오류:', response.status, errorText);
          throw new Error(`분석 요청 실패: ${response.status} ${response.statusText}`);
        }
        
        // 분석 요청 결과 확인
        const result = await response.json();
        console.log('분석 요청 결과:', result);
        
        // 성공 메시지 표시
        setProgress({
          progress: 5,
          stage: 'preparing',
          completed: false,
          message: result.message || '분석이 시작되었습니다. 잠시만 기다려주세요...'
        });
        
        // 5초 후에 첫 번째 진행 상태 확인을 시작
        setTimeout(() => {
          checkProgressStatus();
        }, 5000);
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.warn('분석 요청 시간 초과, 하지만 서버에서 분석이 계속 진행될 수 있습니다.');
          
          // 타임아웃 발생 시에도 진행 상황 확인 시작
          setProgress({
            progress: 2,
            stage: 'preparing',
            completed: false,
            message: '분석 요청이 시간 초과되었지만, 서버에서 분석이 계속 진행 중일 수 있습니다. 진행 상황을 확인합니다...'
          });
          
          // 즉시 진행 상태 확인 시작
          checkProgressStatus();
          return; // 오류로 처리하지 않고 진행 상태 확인으로 넘어감
        }
        
        // 다른 오류는 그대로 던짐
        throw fetchError;
      }
    } catch (err) {
      console.error('저장소 분석 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 개발 패턴 데이터 디버깅 추가 (이전 조건 검사 내부 삭제)
  // 분석 결과가 로드되었을 때만 로깅
  useEffect(() => {
    if (analysis) {
      console.log('개발 패턴 데이터:', JSON.stringify(analysis.developmentPattern, null, 2));
      console.log('분석 결과 전체 구조:', Object.keys(analysis));
      
      // aiAnalyzed 속성 여부 확인
      if ('aiAnalyzed' in analysis.repositoryInfo) {
        console.log('aiAnalyzed 속성 확인:', analysis.repositoryInfo.aiAnalyzed);
      }
    }
  }, [analysis]);
  
  // 분석 데이터가 없으면 로딩 상태 표시
  if (!analysis) {
    // 오류가 있을 경우 오류 메시지와 재시도 버튼 표시
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white p-8 rounded-lg shadow-md text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-red-700 mb-2">분석 중 오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={runAnalysis}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            다시 분석하기
          </button>
        </div>
      );
    }
    
    return <AnalysisLoading 
      message="분석 결과를 불러오는 중입니다..." 
      isIndeterminate={true}
    />;
  }
  
  // 분석 결과를 확인하고 AI 분석이 완료되지 않았으면 로딩 표시
  if (!analysis.repositoryInfo) {
    console.log('분석 결과가 없습니다.');
    return <AnalysisLoading 
      message="분석 결과를 불러오는 중입니다..." 
      isIndeterminate={true}
    />;
  }
  
  // 분석 결과가 있지만 aiProjectType이 없거나 Unknown인 경우
  // 이 경우 분석은 완료되었으나 중요 데이터가 누락된 경우
  if (!analysis.repositoryInfo.aiProjectType || analysis.repositoryInfo.aiProjectType === "Unknown") {
    console.log('중요 분석 결과가 누락되었습니다:', analysis.repositoryInfo);
    console.log('분석 메타 정보:', analysis.meta);
    
    // 에러가 있는 경우 에러 메시지 표시
    if (analysis.meta?.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white p-8 rounded-lg shadow-md text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-red-700 mb-2">분석 중 오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{analysis.meta.error}</p>
          <button 
            onClick={runAnalysis}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            다시 분석하기
          </button>
        </div>
      );
    }
    
    // 분석은 완료되었지만 중요 데이터가 누락된 경우 재분석 버튼 표시
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white p-8 rounded-lg shadow-md text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-bold text-yellow-700 mb-2">분석 결과가 불완전합니다</h2>
        <p className="text-gray-600 mb-6">분석이 완료되었으나 일부 중요 데이터가 누락되었습니다. 다시 분석을 시도해보세요.</p>
        <button 
          onClick={runAnalysis}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          다시 분석하기
        </button>
      </div>
    );
  }

  // 정상적인 분석 결과 디버깅
  console.log('분석 결과 확인:', {
    projectType: analysis.repositoryInfo.aiProjectType,
    hasDevPattern: !!analysis.developmentPattern,
    hasKeyFeatures: analysis.keyFeatures?.length > 0
  });

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
                .filter((tech: { confidence: number }) => {
                  // 신뢰도가 높은 모든 기술 스택 포함 (언어, 프레임워크, 라이브러리 등)
                  return tech.confidence >= 0.7;
                })
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
            userLanguages={analysis.developerProfile.userLanguages}
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
          {/* 코드 품질 메트릭 디버깅 로그 */}
          {(() => { console.log('코드 품질 메트릭 상태:', analysis.codeQuality, analysis.codeQualityMetrics); return null; })()}
          <CodeQualityMetrics 
            score={analysis.codeQuality || 70}
            metrics={{
              readability: typeof analysis.codeQualityMetrics === 'object' && 'readability' in analysis.codeQualityMetrics 
                ? (analysis.codeQualityMetrics as CodeQualityMetricsData).readability : 70,
              maintainability: typeof analysis.codeQualityMetrics === 'object' && 'maintainability' in analysis.codeQualityMetrics
                ? (analysis.codeQualityMetrics as CodeQualityMetricsData).maintainability : 65,
              testCoverage: typeof analysis.codeQualityMetrics === 'object' && 'testCoverage' in analysis.codeQualityMetrics
                ? (analysis.codeQualityMetrics as CodeQualityMetricsData).testCoverage : 50,
              documentation: typeof analysis.codeQualityMetrics === 'object' && 'documentation' in analysis.codeQualityMetrics
                ? (analysis.codeQualityMetrics as CodeQualityMetricsData).documentation : 60,
              architecture: typeof analysis.codeQualityMetrics === 'object' && 'architecture' in analysis.codeQualityMetrics
                ? (analysis.codeQualityMetrics as CodeQualityMetricsData).architecture : 75
            }}
            analysisType="repository"
            userLogin={session?.user?.name || undefined}
          />

          {/* 개발 패턴 */}
          {(() => { console.log('개발 패턴 데이터:', analysis.developmentPattern); return null; })()}
          <DevelopmentPattern 
            developmentPattern={analysis.developmentPattern} 
            analysisType="personal"
            userLogin={session?.user?.name || undefined}
          />

          {/* PDF 다운로드 버튼 */}
          <div className="flex justify-center mt-8">
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-400 cursor-not-allowed opacity-70"
              onClick={() => {
                alert('PDF 다운로드 기능이 일시적으로 비활성화되었습니다. 기능 개선이 완료될 때까지 잠시 사용할 수 없습니다.');
              }}
              disabled={true}
              title="PDF 다운로드 기능이 일시적으로 비활성화되었습니다"
            >
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF 다운로드
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
} 