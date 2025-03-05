'use client'

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// ChartJS 컴포넌트 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
    }[];
  };
  title?: string;
  height?: number;
  width?: number;
  className?: string;
  yAxisTitle?: string;
  xAxisTitle?: string;
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

const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  height = 300,
  width = 600,
  className = '',
  yAxisTitle,
  xAxisTitle,
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
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      backgroundColor: dataset.backgroundColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length].replace('0.7', '0.1'),
      tension: 0.2, // 라인을 더 부드럽게
      pointRadius: 3,
      pointHoverRadius: 5,
    })),
  };

  const options: ChartOptions<'line'> = {
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
    elements: {
      line: {
        tension: 0.3, // 곡선 부드러움 조절
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
      <Line data={enhancedData} options={options} />
    </div>
  );
};

export default LineChart; 