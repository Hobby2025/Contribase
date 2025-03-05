'use client'

import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { ChartOptions } from 'chart.js';

// ChartJS 컴포넌트 등록
ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  data: {
    name: string;
    value: number;
    color?: string;
  }[];
  title?: string;
  height?: number;
  width?: number;
  className?: string;
}

// 기본 색상 팔레트 - 차분한 파스텔톤으로 업데이트
const DEFAULT_COLORS = [
  'rgba(96, 165, 250, 0.7)',    // 옅은 파랑
  'rgba(248, 113, 113, 0.7)',   // 옅은 빨강
  'rgba(52, 211, 153, 0.7)',    // 옅은 에메랄드
  'rgba(251, 191, 36, 0.7)',    // 옅은 황색
  'rgba(192, 132, 252, 0.7)',   // 옅은 보라
  'rgba(14, 165, 233, 0.7)',    // 옅은 하늘색
  'rgba(148, 163, 184, 0.7)',   // 옅은 회색
  'rgba(250, 204, 21, 0.7)',    // 옅은 노랑
  'rgba(232, 121, 249, 0.7)',   // 옅은 분홍
  'rgba(134, 239, 172, 0.7)',   // 옅은 녹색
];

const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  title, 
  height = 200, 
  width = 200,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height, width }}>
        <p className="text-gray-400 text-sm">데이터가 없습니다</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: data.map((item, index) => item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]),
        borderColor: data.map((item, index) => {
          const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
          return color.replace('0.8', '1'); // 테두리 색상은 더 짙게
        }),
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 13,
            family: "'Pretendard', 'Noto Sans KR', sans-serif",
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: !!title,
        text: title || '',
        font: {
          size: 18,
          weight: 'bold',
          family: "'Pretendard', 'Noto Sans KR', sans-serif",
        },
        padding: {
          top: 15,
          bottom: 15,
        },
        color: '#333',
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111',
        bodyColor: '#444',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 6,
        titleFont: {
          size: 14,
          weight: 'bold',
          family: "'Pretendard', 'Noto Sans KR', sans-serif",
        },
        bodyFont: {
          size: 13,
          family: "'Pretendard', 'Noto Sans KR', sans-serif",
        },
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number;
            const percentage = Math.round(value) + '%';
            return `${label}: ${percentage}`;
          }
        }
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeOutQuart',
    },
    layout: {
      padding: 10,
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#fff',
      },
    },
  };

  return (
    <div className={`${className} rounded-xl shadow-sm bg-white p-5`} style={{ height, width }}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default PieChart; 