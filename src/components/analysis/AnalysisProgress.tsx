'use client'

import { useState, useEffect, useRef } from 'react'
import AnalysisLoading from './AnalysisLoading'
import { QuotaEvents } from '../QuotaBadge'

interface AnalysisProgressProps {
  repositoryName: string;
  onComplete: (result: any) => void;
  onError: (error: Error) => void;
  analysisType: 'repository' | 'personal';
  userLogin?: string;
}

/**
 * 분석 진행 상태를 추적하고 표시하는 컴포넌트
 */
export default function AnalysisProgress({
  repositoryName,
  onComplete,
  onError,
  analysisType,
  userLogin
}: AnalysisProgressProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'preparing' | 'fetching' | 'analyzing' | 'finalizing'>('preparing');
  const [error, setError] = useState<Error | null>(null);
  
  // 연속 실패 횟수를 추적하기 위한 ref
  const failedAttemptsRef = useRef(0);
  const maxFailedAttempts = 3;
  
  // 분석 완료 여부를 저장하는 ref
  const isCompletedRef = useRef(false);
  
  // 분석 단계별 메시지
  const stageMessages = {
    preparing: '분석 준비 중',
    fetching: '저장소 데이터 가져오는 중',
    analyzing: '코드 패턴 분석 중',
    finalizing: '결과 생성 중'
  };
  
  // fetch 함수 - 타임아웃 기능 추가
  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };
  
  // 분석 진행 상태 폴링
  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout;
    
    const pollProgress = async () => {
      try {
        // 이미 완료된 경우 폴링 중지
        if (isCompletedRef.current) {
          console.log('이미 분석이 완료되었습니다. 폴링을 중지합니다.');
          clearInterval(pollInterval);
          return;
        }
        
        // 분석 진행 상태 API 호출
        console.log(`분석 진행 상태 확인 중: ${repositoryName}`);
        
        try {
          // 타임아웃이 있는 fetch 사용
          const response = await fetchWithTimeout(
            `/api/analysis/progress?repo=${encodeURIComponent(repositoryName)}`,
            {},
            10000 // 10초 타임아웃
          );
          
          if (!response.ok) {
            throw new Error(`API 응답 오류: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('받은 분석 상태 데이터:', data);
          
          if (isMounted) {
            // 이전 진행률보다 낮으면 업데이트하지 않음 (역행 방지)
            if (data.progress >= progress) {
              setProgress(data.progress);
            }
            setStage(data.stage || 'preparing');
            
            // 분석 완료 시
            if (data.completed && data.result) {
              console.log('분석 완료됨, 결과 있음:', !!data.result);
              isCompletedRef.current = true;
              clearInterval(pollInterval);
              
              // 할당량 정보가 포함되어 있는지 확인하고 할당량 업데이트 이벤트 발행
              if (data.result.quota || data.message === '할당량 업데이트가 필요합니다') {
                console.log('할당량 정보 업데이트 이벤트 발행');
                // 할당량 업데이트 이벤트 발행
                QuotaEvents.notifyUpdate();
              }
              
              onComplete(data.result);
              return;
            }
            // 진행 중인 경우: 실패 카운터 초기화
            else if (!data.error) {
              failedAttemptsRef.current = 0;
            }
            
            // 오류 발생 시
            if (data.error) {
              failedAttemptsRef.current++;
              console.error(`분석 오류 발생 (${failedAttemptsRef.current}/${maxFailedAttempts}):`, data.error);
              
              // 최대 실패 횟수 초과 시에만 오류 처리
              if (failedAttemptsRef.current >= maxFailedAttempts) {
                const error = new Error(data.error.message || '분석 중 오류가 발생했습니다.');
                setError(error);
                clearInterval(pollInterval);
                onError(error);
              }
            }
          }
        } catch (fetchError) {
          // fetch 자체의 오류 (네트워크 오류, 타임아웃 등)
          failedAttemptsRef.current++;
          
          const errorMessage = fetchError instanceof Error ? 
            (fetchError.name === 'AbortError' ? '요청 시간 초과' : fetchError.message) : 
            '알 수 없는 오류';
            
          console.error(`폴링 오류 발생 (${failedAttemptsRef.current}/${maxFailedAttempts}): ${errorMessage}`);
          
          // 최대 실패 횟수 초과 시에만 오류 처리
          if (failedAttemptsRef.current >= maxFailedAttempts && isMounted) {
            const error = new Error(`네트워크 오류: ${errorMessage}`);
            setError(error);
            clearInterval(pollInterval);
            onError(error);
          }
        }
      } catch (err) {
        // 일반적인 예외 처리 (JSON 파싱 오류 등)
        failedAttemptsRef.current++;
        console.error(`폴링 처리 오류 (${failedAttemptsRef.current}/${maxFailedAttempts}):`, err);
        
        // 최대 실패 횟수 초과 시에만 오류 처리
        if (failedAttemptsRef.current >= maxFailedAttempts && isMounted) {
          const error = err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.');
          setError(error);
          clearInterval(pollInterval);
          onError(error);
        }
      }
    };
    
    // 초기 폴링 시작 (최초 지연)
    const initialPollDelay = setTimeout(() => {
      pollProgress();
      
      // 그 후 3초마다 진행 상태 확인
      pollInterval = setInterval(pollProgress, 3000);
    }, 1000);
    
    return () => {
      isMounted = false;
      clearTimeout(initialPollDelay);
      clearInterval(pollInterval);
    };
  }, [repositoryName, onComplete, onError, progress]);
  
  // 오류 발생 시
  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">분석 중 오류가 발생했습니다</h3>
        <p className="mt-2 text-red-600 dark:text-red-300">{error.message}</p>
        <button 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          onClick={() => window.location.reload()}
        >
          다시 시도
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        {analysisType === 'personal' 
          ? `${userLogin || '사용자'}의 기여 분석 중` 
          : `${repositoryName} 저장소 분석 중`}
      </h2>
      
      <AnalysisLoading 
        message={stageMessages[stage]} 
        progress={progress} 
        isIndeterminate={progress === 0}
      />
    </div>
  );
} 