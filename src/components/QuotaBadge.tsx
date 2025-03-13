'use client'

import { useState, useEffect } from 'react';

// 할당량 이벤트 발행-구독 시스템
export const QuotaEvents = {
  listeners: new Set<() => void>(),
  
  // 할당량 업데이트 이벤트를 발행하는 함수
  notifyUpdate: () => {
    QuotaEvents.listeners.forEach(listener => listener());
  },
  
  // 할당량 업데이트 이벤트 구독
  subscribe: (listener: () => void) => {
    QuotaEvents.listeners.add(listener);
    return () => {
      QuotaEvents.listeners.delete(listener);
    };
  }
};

export default function QuotaBadge() {
  const [quota, setQuota] = useState<{
    remaining: number;
    limit: number;
    isAdmin: boolean;
    authenticated?: boolean;
  }>({ remaining: 0, limit: 0, isAdmin: false, authenticated: false });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        setError(null);
        console.log('할당량 정보 가져오는 중...');
        
        // 5초 타임아웃 설정
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/user/quota', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          setQuota({
            remaining: data.quota.remaining,
            limit: data.quota.limit,
            isAdmin: data.quota.isAdmin,
            authenticated: data.authenticated
          });
          console.log('할당량 정보 업데이트됨:', data.quota);
          
          // 성공 시 재시도 카운트 초기화
          setRetryCount(0);
        } else {
          console.error('할당량 정보 응답 오류:', response.status);
          setError(`서버 오류: ${response.status}`);
          
          // 재시도 카운트 증가 (최대 3회까지)
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('할당량 정보 요청 타임아웃');
          setError('요청 시간 초과');
        } else {
          console.error('할당량 정보 로딩 오류:', error);
          setError(error instanceof Error ? error.message : '알 수 없는 오류');
        }
        
        // 재시도 카운트 증가 (최대 3회까지)
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
        }
      } finally {
        setLoading(false);
      }
    };
    
    // 초기 로딩
    fetchQuota();
    
    // 이벤트 구독 - 분석 완료 후 할당량 업데이트
    const unsubscribe = QuotaEvents.subscribe(fetchQuota);
    
    // 1분마다 갱신
    const intervalId = setInterval(fetchQuota, 60 * 1000);
    
    // 오류 발생 시 재시도 (5초 후)
    let retryTimeoutId: NodeJS.Timeout | null = null;
    
    if (error && retryCount < 3) {
      retryTimeoutId = setTimeout(fetchQuota, 5000);
    }
    
    return () => {
      clearInterval(intervalId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      unsubscribe();
    };
  }, [error, retryCount]);
  
  if (loading) {
    return <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>;
  }
  
  // 오류 발생 시
  if (error && retryCount >= 3) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-help" title={`오류: ${error}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        분석: --
      </span>
    );
  }
  
  // 인증되지 않은 경우
  if (quota.authenticated === false) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        로그인 필요
      </span>
    );
  }
  
  // 관리자인 경우 무제한 표시
  if (quota.isAdmin) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"></path>
        </svg>
        관리자
      </span>
    );
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      quota.remaining === 0 
        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
        : quota.remaining === 1 
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }`}>
      {quota.remaining === 0 
        ? '분석 횟수 소진' 
        : `남은 분석: ${quota.remaining}회`}
    </span>
  );
} 