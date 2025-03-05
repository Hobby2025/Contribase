'use client'

import { useState, useEffect } from 'react'
import AnalysisLoading from './AnalysisLoading'

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
  
  // 분석 단계별 메시지
  const stageMessages = {
    preparing: '분석 준비 중',
    fetching: '저장소 데이터 가져오는 중',
    analyzing: '코드 패턴 분석 중',
    finalizing: '결과 생성 중'
  };
  
  // 분석 진행 상태 폴링
  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout;
    
    const pollProgress = async () => {
      try {
        // 분석 진행 상태 API 호출 (실제 구현 필요)
        const response = await fetch(`/api/analysis/progress?repo=${repositoryName}`);
        
        if (!response.ok) {
          throw new Error('분석 상태 확인 중 오류가 발생했습니다.');
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setProgress(data.progress);
          setStage(data.stage);
          
          // 분석 완료 시
          if (data.completed) {
            clearInterval(pollInterval);
            onComplete(data.result);
          }
          
          // 오류 발생 시
          if (data.error) {
            clearInterval(pollInterval);
            const error = new Error(data.error.message || '분석 중 오류가 발생했습니다.');
            setError(error);
            onError(error);
          }
        }
      } catch (err) {
        if (isMounted) {
          const error = err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.');
          setError(error);
          onError(error);
          clearInterval(pollInterval);
        }
      }
    };
    
    // 초기 폴링 시작
    pollProgress();
    
    // 3초마다 진행 상태 확인
    pollInterval = setInterval(pollProgress, 3000);
    
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [repositoryName, onComplete, onError]);
  
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