'use client'

import React from 'react'
import LineChart from '@/components/charts/LineChart'

// 개발 패턴 타입 정의
type DevelopmentPatternData = {
  commitFrequency: string;
  developmentCycle: string;
  teamDynamics: string;
  workPatterns: {
    time: string;
    dayOfWeek: string;
    mostActiveDay: string;
    mostActiveHour: number;
  };
}

interface DevelopmentPatternProps {
  developmentPattern: DevelopmentPatternData;
  analysisType?: 'personal' | 'repository';
  userLogin?: string;
}

export default function DevelopmentPattern({ 
  developmentPattern, 
  analysisType = 'repository',
  userLogin 
}: DevelopmentPatternProps) {
  // 활동 데이터 생성 함수
  const generateActivityData = (peakTimeStr: string) => {
    // 데이터가 없음을 나타내는 문자열이 포함되어 있는지 확인
    if (peakTimeStr.includes('데이터') || peakTimeStr.includes('분석 필요') || peakTimeStr.includes('부족')) {
      // 데이터가 없는 경우 평평한 선을 표시
      return Array(12).fill(1);
    }
    
    // 기본 낮은 활동 수준
    const baseActivity = 1;
    // 활동량 데이터 (24시간 중 12시간 간격만 보여줌)
    const activityData = Array(12).fill(baseActivity);
    
    // 시간대별 활동량 결정
    // 피크 시간에 따라 그래프 형태 조정
    if (peakTimeStr.includes('오전')) {
      // 오전 피크 (6-10시)
      activityData[3] = 2; // 6시
      activityData[4] = 4; // 8시
      activityData[5] = 3; // 10시
      activityData[6] = 2; // 12시
    } else if (peakTimeStr.includes('오후')) {
      // 오후 피크 (14-18시)
      activityData[6] = 2; // 12시
      activityData[7] = 3; // 14시
      activityData[8] = 4; // 16시
      activityData[9] = 3; // 18시
      activityData[10] = 2; // 20시
    } else if (peakTimeStr.includes('저녁')) {
      // 저녁 피크 (18-22시)
      activityData[9] = 3; // 18시
      activityData[10] = 4; // 20시
      activityData[11] = 3; // 22시
    } else if (peakTimeStr.includes('새벽')) {
      // 새벽 피크 (0-4시)
      activityData[0] = 3; // 0시
      activityData[1] = 4; // 2시
      activityData[2] = 2; // 4시
    } else {
      // 기본 패턴 - 낮 시간에 활동적
      activityData[4] = 2; // 8시
      activityData[5] = 3; // 10시
      activityData[6] = 3; // 12시
      activityData[7] = 4; // 14시
      activityData[8] = 3; // 16시
      activityData[9] = 2; // 18시
    }
    
    return activityData;
  }

  // 데이터 부족 여부 확인
  const hasLimitedData = 
    developmentPattern.commitFrequency.includes('데이터') || 
    developmentPattern.developmentCycle.includes('데이터') ||
    developmentPattern.teamDynamics.includes('데이터') ||
    developmentPattern.workPatterns.time.includes('데이터');

  return (
    <div className="bg-white shadow rounded-xl p-7">
      <h2 className="text-xl font-semibold text-gray-900 mb-5">
        {analysisType === 'personal' 
          ? `${userLogin || '사용자'}님의 개발 패턴` 
          : '개발 패턴'}
      </h2>
      
      {hasLimitedData && (
        <div className="mb-5 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            데이터 부족: 정확한 개발 패턴 분석을 위해 더 많은 커밋 데이터가 필요합니다.
          </p>
        </div>
      )}
      
      {/* 시간대별 활동 차트 */}
      <div className="mb-7">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {analysisType === 'personal' ? '시간대별 활동 패턴' : '개발팀 시간대별 활동 패턴'}
        </h3>
        <LineChart 
          data={{
            labels: ['0시', '2시', '4시', '6시', '8시', '10시', '12시', '14시', '16시', '18시', '20시', '22시'],
            datasets: [{
              label: '활동량',
              data: generateActivityData(developmentPattern.workPatterns.time)
            }]
          }}
          height={280}
          width={800}
          yAxisTitle="활동 수준"
          xAxisTitle="시간대"
          title="24시간 활동 패턴"
          className="mx-auto"
        />
        <p className="text-sm text-gray-500 text-center mt-3">
          생산성 높은 시간대: {hasLimitedData ? '데이터가 부족하여 정확한 분석이 어렵습니다' : developmentPattern.workPatterns.time}
        </p>
      </div>
      
      {/* 개발 패턴 인사이트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-md font-medium text-gray-800 mb-3">생산성 높은 시간대</h3>
          <div className="flex items-center">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-800 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <p className="text-gray-700 leading-relaxed">
              {hasLimitedData ? '데이터가 부족하여 정확한 분석이 어렵습니다' : developmentPattern.workPatterns.time}
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-md font-medium text-gray-800 mb-3">커밋 빈도</h3>
          <div className="flex items-center">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-800 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </span>
            <p className="text-gray-700 leading-relaxed">
              {hasLimitedData ? '데이터가 부족하여 정확한 분석이 어렵습니다' : developmentPattern.commitFrequency}
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-md font-medium text-gray-800 mb-3">반복 속도</h3>
          <div className="flex items-center">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-800 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </span>
            <p className="text-gray-700 leading-relaxed">
              {hasLimitedData ? '데이터가 부족하여 정확한 분석이 어렵습니다' : developmentPattern.developmentCycle}
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-md font-medium text-gray-800 mb-3">팀 역학</h3>
          <div className="flex items-center">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-800 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </span>
            <p className="text-gray-700 leading-relaxed">
              {hasLimitedData ? '데이터가 부족하여 정확한 분석이 어렵습니다' : developmentPattern.teamDynamics}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 