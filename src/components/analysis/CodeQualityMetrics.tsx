'use client'

import React from 'react'
import BarChart from '@/components/charts/BarChart'

// 코드 품질 메트릭 타입 정의
type CodeQualityMetricsData = {
  readability: number;
  maintainability: number;
  testCoverage: number;
  documentation: number;
  architecture: number;
}

interface CodeQualityMetricsProps {
  codeQualityMetrics?: CodeQualityMetricsData;
  analysisType?: 'personal' | 'repository';
  userLogin?: string;
}

export default function CodeQualityMetrics({ 
  codeQualityMetrics,
  analysisType = 'repository',
  userLogin 
}: CodeQualityMetricsProps) {
  // 메트릭 데이터 준비 (undefined 경우 기본값 제공)
  const metricData = {
    readability: codeQualityMetrics?.readability || 65,
    maintainability: codeQualityMetrics?.maintainability || 70,
    testCoverage: codeQualityMetrics?.testCoverage || 60,
    documentation: codeQualityMetrics?.documentation || 50,
    architecture: codeQualityMetrics?.architecture || 75
  };

  // 품질 점수에 따른 색상 결정
  const getQualityColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="mt-7">
      <h3 className="text-lg font-medium text-gray-800 mb-5">
        {analysisType === 'personal' 
          ? `${userLogin || '사용자'}님의 코드 품질 메트릭` 
          : '코드 품질 상세 메트릭'}
      </h3>
      <div className="flex flex-col md:flex-row gap-7">
        <div className="w-full md:w-1/2">
          <BarChart 
            data={{
              labels: ['가독성', '유지보수성', '테스트 커버리지', '문서화', '구조화'],
              datasets: [{
                label: analysisType === 'personal' ? '내 코드 품질 점수' : '프로젝트 코드 품질 점수',
                data: [
                  metricData.readability,
                  metricData.maintainability,
                  metricData.testCoverage,
                  metricData.documentation,
                  metricData.architecture
                ]
              }]
            }}
            height={320}
            width={400}
            yAxisTitle="점수 (0-100)"
            title={analysisType === 'personal' ? '내 코드 품질 메트릭' : '프로젝트 코드 품질 메트릭'}
            className="mx-auto"
          />
          <div className="text-center text-xs text-gray-500 mt-3">
            * 점수는 커밋 기록과 코드 패턴 분석을 기반으로 산출된 추정치입니다.
          </div>
        </div>
        
        <div className="w-full md:w-1/2">
          <h4 className="text-md font-medium text-gray-800 mb-4">
            {analysisType === 'personal' ? '개인 개선 영역' : '프로젝트 개선 영역'}
          </h4>
          <div className="space-y-5">
            <div className="flex flex-col p-5 rounded-xl border">
              <h5 className="font-medium text-gray-900 mb-3">점수 가이드</h5>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 mr-3"></div>
                  <span className="text-sm text-gray-700">70-100: 좋음</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 mr-3"></div>
                  <span className="text-sm text-gray-700">50-69: 개선 필요</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-red-500 mr-3"></div>
                  <span className="text-sm text-gray-700">0-49: 즉시 개선 필요</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(metricData).map(([key, value]) => {
                const label = {
                  readability: '가독성',
                  maintainability: '유지보수성',
                  testCoverage: '테스트 커버리지',
                  documentation: '문서화',
                  architecture: '구조화'
                }[key as keyof typeof metricData];
                
                return (
                  <div key={key} className={`p-4 rounded-xl border ${getQualityColor(value)}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{label}</span>
                      <span className="text-lg font-bold">{value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                      <div 
                        className={`h-2.5 rounded-full ${value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 