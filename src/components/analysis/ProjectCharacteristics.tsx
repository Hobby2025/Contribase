'use client'

import React from 'react'
import BarChart from '@/components/analysis/charts/BarChart'

// 프로젝트 특성 타입 정의
type ProjectCharacteristic = {
  type: string;
  score: number;
  description: string;
}

interface ProjectCharacteristicsProps {
  characteristics: ProjectCharacteristic[];
  analysisType?: 'personal' | 'repository';
  userLogin?: string;
}

export default function ProjectCharacteristics({ 
  characteristics, 
  analysisType = 'repository',
  userLogin 
}: ProjectCharacteristicsProps) {
  return (
    <div className="bg-white shadow rounded-xl p-7">
      <h2 className="text-xl font-semibold text-gray-900 mb-5">
        {analysisType === 'personal' 
          ? `${userLogin || '사용자'}님의 기여 특성` 
          : '프로젝트 특성'}
      </h2>
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 mb-6 md:mb-0">
          <BarChart 
            data={{
              labels: characteristics.map(char => char.type),
              datasets: [{
                label: analysisType === 'personal' ? '개인 기여 점수' : '프로젝트 점수',
                data: characteristics.map(char => char.score)
              }]
            }}
            height={320}
            width={400}
            horizontal={true}
            yAxisTitle="특성"
            xAxisTitle="점수"
          />
        </div>
        <div className="w-full md:w-1/2 grid grid-cols-1 gap-5">
          {characteristics.map((char) => (
            <div key={char.type} className="bg-gray-50 rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-medium text-gray-800">{char.type}</h3>
                <span className="text-lg font-bold text-primary-600">{char.score}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                <div 
                  className="bg-primary-600 h-2.5 rounded-full" 
                  style={{ width: `${char.score}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{char.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 