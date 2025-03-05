'use client'

import React from 'react'
import PieChart from '@/components/charts/PieChart'

// 상수 값
const CATEGORY_COLORS = {
  '기능': 'bg-emerald-200 text-emerald-800',
  '버그 수정': 'bg-red-100 text-red-800',
  '리팩토링': 'bg-blue-100 text-blue-800',
  '문서화': 'bg-amber-100 text-amber-800',
  '스타일': 'bg-purple-100 text-purple-800',
  '테스트': 'bg-indigo-100 text-indigo-800',
  '기타': 'bg-slate-300 text-slate-800',
};

// 카테고리 차트 색상 값 (차분한 파스텔톤)
const CATEGORY_COLOR_VALUES = {
  '기능': 'rgba(16, 185, 129, 0.7)',    // 더 선명한 에메랄드 색상
  '버그 수정': 'rgba(248, 113, 113, 0.7)',   // 옅은 빨강
  '리팩토링': 'rgba(96, 165, 250, 0.7)',    // 옅은 파랑
  '문서화': 'rgba(251, 191, 36, 0.7)',     // 옅은 황색
  '스타일': 'rgba(192, 132, 252, 0.7)',    // 옅은 보라
  '테스트': 'rgba(129, 140, 248, 0.7)',    // 옅은 인디고
  '기타': 'rgba(71, 85, 105, 0.7)',     // 더 진한 회색
};

// 카테고리 프로그레스 바 색상 (차분한 파스텔톤)
const CATEGORY_PROGRESS_COLORS = {
  '기능': 'bg-emerald-500',
  '버그 수정': 'bg-red-400',
  '리팩토링': 'bg-blue-400',
  '문서화': 'bg-amber-400',
  '스타일': 'bg-purple-400', 
  '테스트': 'bg-indigo-400',
  '기타': 'bg-slate-600',
};

// 기여도 타입 정의
type Contribution = {
  category: string;
  percentage: number;
}

interface ContributionAnalysisProps {
  contributions: Contribution[];
  analysisType?: 'personal' | 'repository';
  userLogin?: string;
}

export default function ContributionAnalysis({ 
  contributions, 
  analysisType = 'repository',
  userLogin 
}: ContributionAnalysisProps) {
  // 카테고리 색상 가져오기 함수들
  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS['기타'];
  };

  const getCategoryChartColor = (category: string) => {
    return CATEGORY_COLOR_VALUES[category as keyof typeof CATEGORY_COLOR_VALUES] || CATEGORY_COLOR_VALUES['기타'];
  };

  const getCategoryProgressColor = (category: string) => {
    return CATEGORY_PROGRESS_COLORS[category as keyof typeof CATEGORY_PROGRESS_COLORS] || CATEGORY_PROGRESS_COLORS['기타'];
  };

  return (
    <div className="bg-white shadow rounded-xl p-7">
      <h2 className="text-xl font-semibold text-gray-900 mb-5">
        {analysisType === 'personal' 
          ? `${userLogin || '사용자'}님의 기여도 분석` 
          : '기여도 분석'}
      </h2>
      <div className="flex flex-col md:flex-row items-center">
        <div className="w-full md:w-1/2 mb-6 md:mb-0 flex justify-center">
          <PieChart 
            data={contributions.map(contrib => ({
              name: contrib.category,
              value: contrib.percentage,
              color: getCategoryChartColor(contrib.category)
            }))} 
            height={280}
            width={280}
          />
        </div>
        <div className="w-full md:w-1/2 space-y-4">
          {contributions.map((contrib) => (
            <div key={contrib.category} className="flex items-center">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(contrib.category)} mr-3`}>
                {contrib.category}
              </span>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${getCategoryProgressColor(contrib.category)}`}
                    style={{ width: `${contrib.percentage}%` }}
                  ></div>
                </div>
              </div>
              <span className="ml-3 text-sm text-gray-500 w-12 text-right">{contrib.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 