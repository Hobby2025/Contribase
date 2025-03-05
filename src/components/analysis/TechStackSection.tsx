'use client'

import React from 'react'
import PieChart from '@/components/charts/PieChart'

// 기술 스택 타입 정의
type TechStack = {
  name: string;
  percentage: number;
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
  return (
    <div className="bg-white shadow rounded-xl p-7">
      <h2 className="text-xl font-semibold text-gray-900 mb-5">
        {analysisType === 'personal' 
          ? `${userLogin || '사용자'}님의 기술 스택` 
          : '기술 스택'}
      </h2>
      <div className="flex flex-col md:flex-row items-center">
        <div className="w-full md:w-1/2 mb-6 md:mb-0 flex justify-center">
          <PieChart 
            data={techStack.map(tech => ({
              name: tech.name,
              value: tech.percentage
            }))} 
            height={280}
            width={280}
          />
        </div>
        <div className="w-full md:w-1/2 space-y-5">
          {techStack.map((tech) => (
            <div key={tech.name} className="relative">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{tech.name}</span>
                <span className="text-sm font-medium text-gray-500">{tech.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary-600 h-3 rounded-full" 
                  style={{ width: `${tech.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 