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
  // 원래 prop 형태 - 하위 호환성 유지
  codeQualityMetrics?: CodeQualityMetricsData;
  analysisType?: 'personal' | 'repository';
  userLogin?: string;
  
  // 페이지에서 전달하는 prop 형태
  score?: number; // 전체 코드 품질 점수
  metrics?: CodeQualityMetricsData; // 상세 메트릭
}

export default function CodeQualityMetrics({ 
  codeQualityMetrics,
  analysisType = 'repository',
  userLogin,
  score,
  metrics
}: CodeQualityMetricsProps) {
  // metrics 또는 codeQualityMetrics에서 데이터 추출
  const metricData = {
    readability: metrics?.readability ?? codeQualityMetrics?.readability ?? 0,
    maintainability: metrics?.maintainability ?? codeQualityMetrics?.maintainability ?? 0,
    testCoverage: metrics?.testCoverage ?? codeQualityMetrics?.testCoverage ?? 0,
    documentation: metrics?.documentation ?? codeQualityMetrics?.documentation ?? 0,
    architecture: metrics?.architecture ?? codeQualityMetrics?.architecture ?? 0
  };

  // 메트릭 측정 가능 여부 확인
  const isMeasurable = Object.values(metricData).some(value => value > 0);

  // 품질 점수에 따른 색상 결정
  const getQualityColor = (score: number) => {
    if (score === 0) return 'bg-gray-50 text-gray-400 border-gray-200';
    if (score >= 70) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="bg-white shadow rounded-xl p-7">
      <h2 className="text-xl font-semibold text-gray-900 mb-5">
        {analysisType === 'personal' 
          ? `${userLogin || '사용자'}님의 코드 품질 메트릭` 
          : '코드 품질 상세 메트릭'}
      </h2>
      <div className="flex flex-col md:flex-row gap-7">
        <div className="w-full md:w-1/2">
          {isMeasurable ? (
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
          ) : (
            <div className="flex items-center justify-center bg-gray-50 rounded-lg h-[320px] w-[400px] mx-auto">
              <div className="text-center p-5">
                <p className="text-gray-500 font-medium mb-2">데이터 측정이 불가합니다</p>
                <p className="text-gray-400 text-sm">현재 코드 품질 데이터를 측정할 수 없습니다.</p>
              </div>
            </div>
          )}
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
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-gray-200 mr-3"></div>
                  <span className="text-sm text-gray-700">0: 데이터 측정 불가</span>
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
                      {value > 0 ? (
                        <span className="text-lg font-bold">{value}</span>
                      ) : (
                        <span className="text-sm text-gray-400">측정 불가</span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                      {value > 0 ? (
                        <div 
                          className={`h-2.5 rounded-full ${value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${value}%` }}
                        ></div>
                      ) : (
                        <div className="h-2.5 rounded-full bg-gray-300 opacity-30" style={{ width: '100%' }}></div>
                      )}
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