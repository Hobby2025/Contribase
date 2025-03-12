'use client'

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// ChartJS 컴포넌트 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }[];
  };
  title?: string;
  height?: number;
  width?: number;
  className?: string;
  yAxisTitle?: string;
  xAxisTitle?: string;
  horizontal?: boolean;
}

// 기본 색상 팔레트 - 더 세련된 색상으로 업데이트
const DEFAULT_COLORS = [
  'rgba(59, 130, 246, 0.8)',   // 파란색
  'rgba(239, 68, 68, 0.8)',    // 빨간색
  'rgba(16, 185, 129, 0.8)',   // 녹색
  'rgba(245, 158, 11, 0.8)',   // 주황색
  'rgba(139, 92, 246, 0.8)',   // 보라색
  'rgba(14, 165, 233, 0.8)',   // 하늘색
  'rgba(249, 115, 22, 0.8)',   // 주황색 계열
];

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  height = 300,
  width = 600,
  className = '',
  yAxisTitle,
  xAxisTitle,
  horizontal = false,
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
      // 단일 색상이 제공된 경우, 모든 바에 동일한 색상 적용
      const applyDefaultColors = !dataset.backgroundColor || 
        (typeof dataset.backgroundColor === 'string' && data.labels.length > 1);
      
      let backgroundColor;
      if (applyDefaultColors) {
        // 여러 데이터셋이 있으면 데이터셋별로 색상 지정, 단일 데이터셋이면 바마다 다른 색상 지정
        backgroundColor = data.datasets.length > 1
          ? DEFAULT_COLORS[index % DEFAULT_COLORS.length]
          : data.labels.map((_, i) => DEFAULT_COLORS[i % DEFAULT_COLORS.length]);
      } else {
        backgroundColor = dataset.backgroundColor;
      }
      
      return {
        ...dataset,
        backgroundColor,
        borderColor: dataset.borderColor || 'transparent',
        borderWidth: dataset.borderWidth || 1,
        borderRadius: 4,
      };
    }),
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        display: data.datasets.length > 1, // 데이터셋이 하나면 범례 숨김
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 13,
            family: "'Pretendard', 'Noto Sans KR', sans-serif",
          },
          usePointStyle: true, // 점 스타일 사용
          pointStyle: 'circle', // 원형 포인트
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
          bottom: 25,
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
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: !!yAxisTitle,
          text: yAxisTitle || '',
          font: {
            size: 14,
            weight: 'bold',
            family: "'Pretendard', 'Noto Sans KR', sans-serif",
          },
          padding: {
            bottom: 15,
          },
          color: '#555',
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.15)',
        },
        ticks: {
          font: {
            size: 12,
            family: "'Pretendard', 'Noto Sans KR', sans-serif",
          },
          color: '#666',
          padding: 8,
        },
      },
      x: {
        title: {
          display: !!xAxisTitle,
          text: xAxisTitle || '',
          font: {
            size: 14,
            weight: 'bold',
            family: "'Pretendard', 'Noto Sans KR', sans-serif",
          },
          padding: {
            top: 15,
          },
          color: '#555',
        },
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            family: "'Pretendard', 'Noto Sans KR', sans-serif",
          },
          color: '#666',
          padding: 8,
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
    },
    elements: {
      bar: {
        borderRadius: 6,
      },
    },
  };

  return (
    <div className={`${className} rounded-xl shadow-sm bg-white p-5`} style={{ height, width }}>
      <Bar data={enhancedData} options={options} />
    </div>
  );
};

export default BarChart; 