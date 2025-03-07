'use client'

import React from 'react'
import PieChart from '@/components/charts/PieChart'

// 기술 스택 타입 정의
type TechStack = {
  name: string;
  type: string;
  usage: number;
  confidence: number;
  normalizedUsage?: number; // 정규화된 사용량을 위한 옵션 필드
}

interface TechStackSectionProps {
  techStack: TechStack[];
  analysisType?: 'personal' | 'repository';
  userLogin?: string;
}

export default function TechStackSection({ 
  techStack, 
  analysisType = 'repository', 
  userLogin 
}: TechStackSectionProps) {
  // 언어 타입의 기술 스택만 필터링
  const languageTechStack = techStack.filter(tech => tech.type === 'language');
  
  // 언어 사용 비율 정규화 - 합계가 100%가 되도록 조정
  let normalizedLanguageTechStack = [...languageTechStack];
  
  if (normalizedLanguageTechStack.length > 0) {
    // 총 usage 합계 계산
    const totalUsage = normalizedLanguageTechStack.reduce((sum, tech) => sum + tech.usage, 0);
    
    // 비율이 합계 100%가 되도록 정규화
    if (totalUsage > 0) {
      normalizedLanguageTechStack = normalizedLanguageTechStack.map(tech => ({
        ...tech,
        normalizedUsage: Math.round((tech.usage / totalUsage) * 100)
      }));
    }
    
    // 사용량 기준으로 내림차순 정렬
    normalizedLanguageTechStack.sort((a, b) => 
      (b.normalizedUsage || b.usage) - (a.normalizedUsage || a.usage)
    );
    
    // 1% 미만의 언어들을 "기타" 카테고리로 묶기
    const mainLanguages = normalizedLanguageTechStack.filter(
      tech => (tech.normalizedUsage || tech.usage) >= 1
    );
    
    const smallLanguages = normalizedLanguageTechStack.filter(
      tech => (tech.normalizedUsage || tech.usage) < 1
    );
    
    // 작은 언어들이 있으면 "기타" 카테고리 추가
    if (smallLanguages.length > 0) {
      const otherUsage = smallLanguages.reduce(
        (sum, tech) => sum + (tech.normalizedUsage || tech.usage), 
        0
      );
      
      normalizedLanguageTechStack = [
        ...mainLanguages,
        {
          name: '기타',
          type: 'language',
          usage: otherUsage,
          confidence: 1,
          normalizedUsage: Math.round(otherUsage)
        }
      ];
    } else {
      normalizedLanguageTechStack = mainLanguages;
    }
  }
  
  // 데이터 변환
  const pieData = normalizedLanguageTechStack.map(tech => {
    // "기타" 카테고리에 다른 색상 적용
    let color = undefined;
    if (tech.name === '기타') {
      color = 'rgba(110, 118, 129, 0.7)'; // 회색으로 기타 표시
    }
    
    return {
      name: tech.name,
      value: tech.normalizedUsage || tech.usage,
      color
    };
  });

  return (
    <div className="bg-white shadow rounded-xl p-7">
      <h2 className="text-xl font-semibold text-gray-900 mb-5">
        {analysisType === 'personal' 
          ? `${userLogin || '사용자'}님의 사용 언어` 
          : '프로젝트 사용 언어'}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        이 섹션은 프로젝트에서 사용된 프로그래밍 언어 비율을 GitHub와 유사한 방식으로 표시합니다.
      </p>
      <div className="flex flex-col md:flex-row items-center">
        <div className="w-full md:w-1/2 mb-6 md:mb-0 flex justify-center">
          <PieChart 
            data={pieData} 
            height={280}
            width={280}
          />
        </div>
        <div className="w-full md:w-1/2 space-y-5">
          {normalizedLanguageTechStack.length > 0 ? (
            normalizedLanguageTechStack.map((tech) => (
              <div key={tech.name} className="relative">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{tech.name}</span>
                  <span className="text-sm font-medium text-gray-500">{tech.normalizedUsage || tech.usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-primary-600 h-3 rounded-full" 
                    style={{ width: `${tech.normalizedUsage || tech.usage}%` }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-4 text-gray-500">
              언어 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 