'use client'

import { useState, useEffect } from 'react';

export default function QuotaDisplay() {
  const [quota, setQuota] = useState<{
    used: number;
    limit: number;
    remaining: number;
    isAdmin: boolean;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const response = await fetch('/api/user/quota');
        if (response.ok) {
          const data = await response.json();
          setQuota(data.quota);
        }
      } catch (error) {
        console.error('할당량 정보 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuota();
  }, []);
  
  if (loading) {
    return <div className="animate-pulse h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>;
  }
  
  if (!quota) {
    return null;
  }
  
  // 관리자인 경우
  if (quota.isAdmin) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">분석 권한</h3>
        <div className="flex items-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"></path>
            </svg>
            관리자 권한
          </span>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            무제한 분석 사용 가능
          </span>
        </div>
      </div>
    );
  }
  
  // 일반 사용자인 경우 - 프로그레스 바 표시
  const percentUsed = quota.limit > 0 ? ((quota.used / quota.limit) * 100) : 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">오늘의 분석 사용량</h3>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
        <div 
          className={`h-2.5 rounded-full transition-all ${
            quota.remaining === 0 ? 'bg-red-600' : 
            quota.remaining < quota.limit * 0.3 ? 'bg-yellow-500' : 
            'bg-primary-600 dark:bg-primary-500'
          }`} 
          style={{ width: `${percentUsed}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-sm">
        <span>
          {quota.used}/{quota.limit} 사용
        </span>
        <span>
          {quota.remaining === 0 ? (
            <span className="text-red-600 dark:text-red-400 font-medium">제한 도달</span>
          ) : (
            <span>{quota.remaining}회 남음</span>
          )}
        </span>
      </div>
    </div>
  );
}