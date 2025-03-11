'use client'

import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

// ChartJS 컴포넌트 등록
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
    }[];
  };
  title?: string;
  height?: number;
  width?: number;
  className?: string;
  legend?: boolean;
  scale?: {
    min?: number;
    max?: number;
    stepSize?: number;
  };
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

const RadarChart: React.FC<RadarChartProps> = ({
  data,
  title,
  height = 300,
  width = 300,
  className = '',
  legend = true,
  scale = { min: 0, max: 5, stepSize: 1 },
}) => {
  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height, width }}>
        <p className="text-gray-400 text-sm">데이터가 없습니다</p>
      </div>
    );
  }

  // 데이터셋에 색상 자동 추가
  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => {
      const colorIndex = index % DEFAULT_COLORS.length;
      return {
        ...dataset,
        backgroundColor: dataset.backgroundColor || DEFAULT_COLORS[colorIndex],
        borderColor: dataset.borderColor || DEFAULT_COLORS[colorIndex],
        borderWidth: dataset.borderWidth || 2,
        pointBackgroundColor: DEFAULT_COLORS[colorIndex],
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: DEFAULT_COLORS[colorIndex],
        pointRadius: 3,
        pointHoverRadius: 5,
      };
    }),
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        display: data.datasets.length > 1,
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
      },
    },
    scales: {
      r: {
        min: scale.min,
        max: scale.max,
        ticks: {
          stepSize: scale.stepSize,
          backdropColor: 'transparent',
          color: '#666',
          font: {
            size: 11,
            family: "'Pretendard', 'Noto Sans KR', sans-serif",
          },
        },
        angleLines: {
          color: 'rgba(200, 200, 200, 0.2)',
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
        },
        pointLabels: {
          font: {
            size: 13,
            family: "'Pretendard', 'Noto Sans KR', sans-serif",
          },
          color: '#555',
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
    elements: {
      line: {
        borderWidth: 3,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: 'white',
      },
    },
  };

  return (
    <div className={`${className} rounded-xl shadow-sm bg-white p-5`} style={{ height, width }}>
      <Radar data={enhancedData} options={options} />
    </div>
  );
};

export default RadarChart; 