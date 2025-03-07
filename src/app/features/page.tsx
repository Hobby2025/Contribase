import Link from 'next/link'

export default function Features() {
  return (
    <div className="bg-white">
      {/* 헤더 섹션 */}
      <div className="bg-primary-700 text-white py-16">
        <div className="container max-w-5xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-6 text-center">Contribase 기능</h1>
          <p className="text-xl text-primary-100 text-center max-w-3xl mx-auto">
            AI 기반 GitHub 분석과 포트폴리오 생성을 통해 개발자의 기술적 역량을 돋보이게 합니다.
          </p>
        </div>
      </div>
      
      {/* 주요 기능 섹션 */}
      <div className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">주요 기능</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Contribase의 AI 분석 기능으로 개발자 포트폴리오 작성 과정을 혁신적으로 개선합니다.
            </p>
          </div>
          
          {/* 기능 1: 도메인 분석 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="text-primary-600 text-sm font-semibold mb-2">분석 기능</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">도메인 분석</h3>
              <div className="prose prose-lg">
                <p>
                  GPT-4 Mini 기반 AI 분석 시스템이 GitHub 커밋 내역을 분석하여 프론트엔드, 백엔드, 인프라 등 개발자가 담당한 도메인을 자동으로 분류합니다.
                </p>
                <ul className="mt-4 space-y-3">
                  <li>프로젝트 목적 자동 파악</li>
                  <li>코드 패턴 기반 역할 분석</li>
                  <li>프로젝트별 담당 영역 시각화</li>
                </ul>
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-8 shadow-inner">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="mb-6">
                  <h4 className="font-medium text-lg mb-3">도메인 분포</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">프론트엔드</span>
                        <span>65%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">백엔드</span>
                        <span>25%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">인프라</span>
                        <span>10%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 기능 2: 기여도 분석 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 bg-gray-100 rounded-xl p-8 shadow-inner">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="border-l-4 border-primary-500 pl-3 py-1">
                    <div className="font-medium">프로젝트 목적 및 개요 파악</div>
                    <div className="text-sm text-gray-600">AI 기반 프로젝트 분석</div>
                  </div>
                  <div className="border-l-4 border-primary-400 pl-3 py-1">
                    <div className="font-medium">주요 기능 및 특징 도출</div>
                    <div className="text-sm text-gray-600">GPT-4 Mini 인사이트 생성</div>
                  </div>
                  <div className="border-l-4 border-primary-300 pl-3 py-1">
                    <div className="font-medium">사용 기술 분석</div>
                    <div className="text-sm text-gray-600">언어 및 라이브러리 자동 분석</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1">
              <div className="text-primary-600 text-sm font-semibold mb-2">분석 기능</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">프로젝트 분석</h3>
              <div className="prose prose-lg">
                <p>
                  AI가 프로젝트의 코드와 구조를 분석하여 프로젝트의 목적, 주요 기능, 특징을 자동으로 도출합니다.
                </p>
                <ul className="mt-4 space-y-3">
                  <li>프로젝트 목적 및 개요 자동 생성</li>
                  <li>주요 기능과 특징 분석</li>
                  <li>사용된 기술 스택 분석</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* 기능 3: PDF 포트폴리오 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-primary-600 text-sm font-semibold mb-2">출력 기능</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">PDF 포트폴리오</h3>
              <div className="prose prose-lg">
                <p>
                  AI가 분석한 데이터를 바탕으로 전문적인 PDF 포트폴리오를 자동으로 생성합니다. 개발자의 기술적 역량과 프로젝트 기여도를 체계적으로 정리합니다.
                </p>
                <ul className="mt-4 space-y-3">
                  <li>프로젝트별 상세 설명 AI 생성</li>
                  <li>기술 스택 시각화</li>
                  <li>주요 업적 요약</li>
                  <li>커스텀 테마 지원</li>
                </ul>
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-8 shadow-inner">
              <div className="bg-white rounded-lg aspect-[3/4] flex flex-col shadow-md border border-gray-200">
                <div className="bg-primary-700 text-white p-4">
                  <div className="font-bold text-lg">개발자 포트폴리오</div>
                </div>
                <div className="p-4 flex-grow">
                  <div className="w-1/2 h-2 bg-gray-200 rounded mb-4"></div>
                  <div className="w-full h-1 bg-gray-200 rounded mb-8"></div>
                  
                  <div className="mb-4 h-2 w-1/3 bg-gray-300 rounded"></div>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                  
                  <div className="mb-4 h-2 w-1/3 bg-gray-300 rounded"></div>
                  <div className="space-y-2 mb-6">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 w-11/12 bg-gray-200 rounded"></div>
                    <div className="h-4 w-10/12 bg-gray-200 rounded"></div>
                  </div>
                  
                  <div className="mb-4 h-2 w-1/3 bg-gray-300 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded mb-6"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* AI 분석 기능 세부 설명 */}
          <div className="border-t border-gray-200 pt-20 mt-16">
            <div className="text-center mb-16">
              <div className="text-primary-600 text-sm font-semibold mb-2">AI 분석</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">AI 분석 기능 상세</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                GPT-4 Mini를 활용하여 프로젝트를 다각도로 분석합니다.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="bg-primary-50 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">프로젝트 목적 분석</h3>
                <p className="text-gray-600">
                  AI가 코드 구조와 패턴을 분석하여 프로젝트의 목적과 주요 기능을 자동으로 파악합니다.
                </p>
              </div>
              
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="bg-primary-50 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">기술 스택 분석</h3>
                <p className="text-gray-600">
                  GPT-4 Mini 모델이 프로젝트에 사용된 언어, 프레임워크, 라이브러리를 정확하게 식별합니다.
                </p>
              </div>
              
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="bg-primary-50 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">인사이트 생성</h3>
                <p className="text-gray-600">
                  AI가 프로젝트의 특징과 강점을 분석하여 개발자의 역량을 효과적으로 표현할 수 있는 인사이트를 생성합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 기술적 고려사항 섹션 */}
      <div className="py-16 bg-gray-50">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">기술적 고려사항</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold mb-3">성능 목표</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>분석 시작: 3-5초</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI 분석 속도: 10-30초</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>최대 저장소 크기: 500MB</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold mb-3">AI 모델 정보</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>GPT-4 Mini 기반</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>다중 언어 코드 분석</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>자연어 인사이트 생성</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold mb-3">보안 및 프라이버시</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>클라이언트 중심 처리</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>최소 권한 OAuth 요청</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>민감 정보 제외 처리</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA 섹션 */}
      <div className="py-16 bg-primary-800 text-white">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">지금 시작해보세요</h2>
          <p className="text-xl mb-8 text-primary-100">
            GitHub 계정을 연결하여 포트폴리오 생성을 자동화하고 개발자로서의 가치를 더 잘 표현하세요.
          </p>
          <Link
            href="/auth/github"
            className="text-primary-700 rounded-lg font-medium text-lg inline-flex items-center justify-center gap-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-primary-300"
          >
            <img 
              src="/images/github_login.webp" 
              alt="GitHub 로고" 
              className="w-60 rounded-lg"
            />
          </Link>
        </div>
      </div>
    </div>
  )
} 