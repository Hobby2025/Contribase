'use client'

import { useState, useEffect } from 'react'

interface AnalysisLoadingProps {
  message?: string;
  progress?: number;
  isIndeterminate?: boolean;
}

/**
 * 분석 작업 중 로딩 상태를 표시하는 컴포넌트
 */
export default function AnalysisLoading({ 
  message = '분석 중입니다...', 
  progress = 0,
  isIndeterminate = true 
}: AnalysisLoadingProps) {
  const [dots, setDots] = useState('.');
  
  // 로딩 애니메이션 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '.';
        return prev + '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
        {message}{dots}
      </h3>
      
      {!isIndeterminate && (
        <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          ></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
            {Math.round(progress)}% 완료
          </p>
        </div>
      )}
      
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md text-center">
        저장소 크기에 따라 몇 분 정도 소요될 수 있습니다. 잠시만 기다려주세요.
      </p>
    </div>
  );
} 