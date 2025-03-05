'use client'

import React from 'react'
import PieChart from '@/components/charts/PieChart'

// 커밋 분석 데이터 타입 정의
type CommitAnalysisData = {
  commitTypes: {
    name: string;
    value: number;
    color?: string;
  }[];
  commitFrequency: {
    name: string;
    value: number;
    color?: string;
  }[];
  // 기타 필요한 필드들
}

interface CommitAnalysisProps {
  commitAnalysis: CommitAnalysisData;
  analysisType?: 'personal' | 'repository';
  userLogin?: string;
}

export default function CommitAnalysis({ 
  commitAnalysis,
  analysisType = 'repository',
  userLogin 
}: CommitAnalysisProps) {
  
  return (
    <div className="bg-white shadow rounded-xl p-7">
      <h2 className="text-xl font-semibold text-gray-900 mb-5">
        {analysisType === 'personal' 
          ? `${userLogin || '사용자'}님의 커밋 분석` 
          : '커밋 분석'}
      </h2>
      
      {/* 분석 내용 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 커밋 유형 분석 */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {analysisType === 'personal' ? '내 커밋 유형' : '커밋 유형 분석'}
          </h3>
          <PieChart 
            data={commitAnalysis.commitTypes}
            title={analysisType === 'personal' ? '내 커밋 유형 비율' : '커밋 유형 비율'}
            height={250}
          />
        </div>
        
        {/* 커밋 빈도 분석 */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {analysisType === 'personal' ? '시간별 커밋 패턴' : '시간별 커밋 분포'}
          </h3>
          <PieChart 
            data={commitAnalysis.commitFrequency}
            title={analysisType === 'personal' ? '내 커밋 시간대' : '팀 커밋 시간대'}
            height={250}
          />
        </div>
      </div>
    </div>
  );
} 