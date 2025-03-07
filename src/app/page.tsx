'use client';

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 페이지 로드가 완료되면 로딩 상태 해제
    const handleLoad = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 300); // 부드러운 전환을 위한 짧은 지연
    };

    // 페이지가 이미 로드된 경우
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  if (isLoading) {
    return (
      <>
        {/* 개선된 스켈레톤 UI - Hero Section */}
        <section className="bg-primary-700 text-primary-50">
          <div className="container py-20 max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                {/* 스켈레톤 제목 */}
                <div className="h-14 bg-primary-600/50 rounded-lg w-3/4 animate-pulse"></div>
                <div className="h-14 bg-primary-600/50 rounded-lg w-4/5 animate-pulse"></div>
                
                {/* 스켈레톤 설명 */}
                <div className="h-8 bg-primary-600/50 rounded-lg w-full animate-pulse"></div>
                <div className="h-8 bg-primary-600/50 rounded-lg w-4/5 animate-pulse"></div>
                
                {/* 스켈레톤 버튼 */}
                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <div className="h-14 bg-primary-600/50 rounded-lg w-32 animate-pulse"></div>
                  <div className="h-14 bg-primary-600/50 rounded-lg w-40 animate-pulse"></div>
                </div>
              </div>
              
              {/* 스켈레톤 이미지 */}
              <div className="hidden md:block">
                <div className="w-full aspect-video rounded-lg bg-primary-600/50 animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 스켈레톤 UI - Features Section */}
        <section className="py-20 bg-primary-50">
          <div className="container max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="h-10 bg-gray-200/60 rounded-lg w-64 mx-auto animate-pulse"></div>
              <div className="h-6 bg-gray-200/60 rounded-lg w-96 mx-auto mt-4 animate-pulse"></div>
              <div className="h-6 bg-gray-200/60 rounded-lg w-80 mx-auto mt-4 animate-pulse"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="h-14 w-14 bg-gray-200/60 rounded-lg mb-4 animate-pulse"></div>
                  <div className="h-6 bg-gray-200/60 rounded-lg w-3/4 mb-3 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200/60 rounded-lg w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200/60 rounded-lg w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200/60 rounded-lg w-3/4 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 스켈레톤 UI - CTA Section */}
        <section className="bg-primary-700 text-primary-50 py-16">
          <div className="container max-w-4xl mx-auto text-center">
            <div className="h-10 bg-primary-600/50 rounded-lg w-3/4 mx-auto animate-pulse mb-6"></div>
            <div className="h-6 bg-primary-600/50 rounded-lg w-full mx-auto animate-pulse mb-4"></div>
            <div className="h-6 bg-primary-600/50 rounded-lg w-5/6 mx-auto animate-pulse mb-8"></div>
            <div className="h-14 bg-primary-600/50 rounded-lg w-60 mx-auto animate-pulse"></div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="bg-primary-700 text-primary-50">
        <div className="container py-20 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                GitHub 기여도를
              </h1>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                포트폴리오로 
                <span className="text-primary-300"> 자동 변환</span>
              </h1>
              <p className="text-xl md:text-2xl text-primary-100">
                AI 기반 분석 시스템이 GitHub 기록을 분석하여
              </p>
              <p className="text-xl md:text-2xl text-primary-100">
                개발자의 기술 스택과 기여도를 시각화합니다.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-primary-50 text-primary-900 rounded-lg font-medium text-lg hover:bg-primary-100 transition-colors inline-flex items-center justify-center"
                >
                  시작하기
                </Link>
                <Link
                  href="/about"
                  className="px-6 py-3 bg-primary-600 text-primary-50 rounded-lg font-medium text-lg hover:bg-primary-500 transition-colors inline-flex items-center justify-center"
                >
                  자세히 알아보기
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative w-full h-auto aspect-video">
                <Image 
                  src="/images/Contribase_main.webp" 
                  alt="GitHub 분석 이미지" 
                  className="rounded-lg"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-primary-50">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-primary-900">주요 기능</h2>
            <p className="text-xl text-primary-600 max-w-3xl mx-auto">
              Contribase는 GitHub 저장소를 AI로 분석하여
            </p>
            <p className="text-xl text-primary-600 max-w-3xl mx-auto">
              개발자의 기술 스택과 기여도를 시각화하고 포트폴리오로 변환합니다.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-primary-200">
              <div className="w-14 h-14 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-primary-900">AI 기반 분석</h3>
              <p className="text-primary-600">GPT-4 Mini를 활용한 고급 분석 시스템이 GitHub 저장소의 코드와 커밋 패턴을 분석하여 개발자의 기술 스택을 자동으로 식별합니다.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-primary-200">
              <div className="w-14 h-14 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-primary-900">시각화 대시보드</h3>
              <p className="text-primary-600">다양한 차트와 그래프로 프로젝트별 기여도와 기술 스택을 한눈에 확인할 수 있습니다. AI가 분석한 인사이트를 직관적으로 제공합니다.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-primary-200">
              <div className="w-14 h-14 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-primary-900">PDF 포트폴리오</h3>
              <p className="text-primary-600">AI가 분석한 결과를 바탕으로 전문적인 포트폴리오 PDF를 자동으로 생성하여 개발자의 역량을 효과적으로 표현합니다.</p>
            </div>
          </div>

          {/* 향후 계획 섹션 */}
          <div className="mt-16 pt-16 border-t border-primary-200">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4 text-primary-900">AI 기술 특징</h2>
              <p className="text-xl text-primary-600 max-w-3xl mx-auto">
                GPT-4 Mini를 활용한 고급 분석 시스템으로 개발자의 역량을 정확하게 파악합니다.
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-primary-100">
                <h3 className="text-lg font-semibold mb-2 text-primary-900">코드 품질 분석</h3>
                <p className="text-primary-600 text-sm">AI가 코드 패턴을 분석하여 품질과 개선 사항을 제안합니다.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-primary-100">
                <h3 className="text-lg font-semibold mb-2 text-primary-900">개발 패턴 인식</h3>
                <p className="text-primary-600 text-sm">개발자의 코딩 스타일과 패턴을 AI가 파악하여 분석합니다.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-primary-100">
                <h3 className="text-lg font-semibold mb-2 text-primary-900">프로젝트 인사이트</h3>
                <p className="text-primary-600 text-sm">프로젝트의 특성과 목적을 AI가 자동으로 파악합니다.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-primary-100">
                <h3 className="text-lg font-semibold mb-2 text-primary-900">맞춤형 추천</h3>
                <p className="text-primary-600 text-sm">개발자의 스킬셋에 맞는 개선점과 발전 방향을 제안합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-primary-700 text-primary-50 py-16">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">개발자의 역량을 돋보이게 하세요</h2>
          <p className="text-xl mb-2 text-primary-100">
            GPT-4 Mini 기반 AI 분석 시스템이 GitHub 기록을 분석하여
          </p>
          <p className="text-xl mb-8 text-primary-100">
            객관적이고 정확한 기술 프로필을 생성합니다.
          </p>
          <div className="relative w-60 h-14 mx-auto">
            <Link
              href="/auth/github"
              className="inline-block w-full h-full"
            >
              <Image 
                src="/images/github_login.webp" 
                alt="GitHub 로고" 
                fill
                sizes="240px"
              />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
} 