import Link from 'next/link'

export default function About() {
  return (
    <div className="bg-white dark:bg-gray-900">
      {/* 헤더 섹션 */}
      <div className="bg-primary-700 dark:bg-primary-800 text-white py-16">
        <div className="container max-w-5xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-6 text-center">Contribase 소개</h1>
          <p className="text-xl text-primary-100 text-center max-w-3xl mx-auto">
            규칙 기반 GitHub 분석 서비스로 개발자들의 포트폴리오 생성을 자동화합니다.
          </p>
        </div>
      </div>

      {/* 미션 섹션 */}
      <div className="py-16 dark:bg-gray-900">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">미션</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
              개발자들이 자신의 기술적 경험과 기여를 효과적으로 표현할 수 있도록 지원하는 것이 우리의 미션입니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">문제 정의</h3>
              <div className="prose prose-lg dark:prose-invert">
                <p className="dark:text-gray-300">
                  개발자들은 다양한 프로젝트에 참여하며 값진 경험을 쌓지만, 이를 포트폴리오로 정리하는 과정에서 어려움을 겪습니다. 과거 프로젝트에서의 기여 내역이나 사용한 기술 스택을 회상하고 문서화하는 것은 많은 시간과 노력이 필요합니다.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">해결책</h3>
              <div className="prose prose-lg dark:prose-invert">
                <p className="dark:text-gray-300">
                  Contribase는 규칙 기반 분석 시스템을 활용하여 GitHub 커밋 이력을 자동으로 분석함으로써, 개발자의 실제 기여도와 기술적 성장을 객관적으로 문서화합니다. 이를 통해 개발자들은 자신의 경험과 역량을 보다 정확하고 전문적으로 표현할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 핵심 가치 섹션 */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">핵심 가치</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-primary-100 dark:bg-gray-600 text-primary-700 dark:text-primary-300 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">자동화</h3>
              <p className="text-gray-600 dark:text-gray-300">AI 기반 GitHub 활동 분석으로 수작업을 최소화합니다.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-primary-100 dark:bg-gray-600 text-primary-700 dark:text-primary-300 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">신뢰성</h3>
              <p className="text-gray-600 dark:text-gray-300">실제 커밋 기반 기여도 분석으로 객관적인 데이터를 제공합니다.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-primary-100 dark:bg-gray-600 text-primary-700 dark:text-primary-300 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">프라이버시</h3>
              <p className="text-gray-600 dark:text-gray-300">클라이언트 중심 처리로 개인 정보를 안전하게 보호합니다.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-primary-100 dark:bg-gray-600 text-primary-700 dark:text-primary-300 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">접근성</h3>
              <p className="text-gray-600 dark:text-gray-300">누구나 쉽게 사용할 수 있도록 무료 서비스를 제공합니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 기술 스택 섹션 */}
      <div className="py-16 dark:bg-gray-900">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">기술 스택</h2>
          
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-xl font-bold mb-4 border-b pb-2 dark:text-white dark:border-gray-700">프론트엔드</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-primary-500 rounded-full mr-3"></span>
                  <span className="dark:text-gray-300">Next.js - React 프레임워크</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-primary-500 rounded-full mr-3"></span>
                  <span className="dark:text-gray-300">TailwindCSS - 스타일링</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-primary-500 rounded-full mr-3"></span>
                  <span className="dark:text-gray-300">React-PDF - PDF 생성</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-primary-500 rounded-full mr-3"></span>
                  <span className="dark:text-gray-300">Chart.js - 데이터 시각화</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4 border-b pb-2 dark:text-white dark:border-gray-700">AI 모델</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-primary-500 rounded-full mr-3"></span>
                  <span className="dark:text-gray-300">RoBERTa-tiny (30MB) - 커밋 메시지 분석</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-primary-500 rounded-full mr-3"></span>
                  <span className="dark:text-gray-300">CodeBERT-small (40MB) - 코드 변경 분석</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-primary-500 rounded-full mr-3"></span>
                  <span className="dark:text-gray-300">클라이언트 & Edge 모델 최적화</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 향후 발전 계획 섹션 (새로 추가) */}
      <div className="py-16 dark:bg-gray-900">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">향후 발전 계획</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-10 text-center">
            현재 Contribase는 규칙 기반 분석 시스템을 사용하고 있으며, 향후 버전에서는 인공지능 기술을 도입하여 더욱 정확하고 인사이트 있는 분석을 제공할 계획입니다.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">AI 기반 커밋 분석</h3>
              <p className="text-gray-600 dark:text-gray-300">머신러닝 모델을 활용하여 커밋 메시지의 의도와 패턴을 더 정확하게 파악합니다.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">코드 품질 평가</h3>
              <p className="text-gray-600 dark:text-gray-300">인공지능 기반 코드 품질 평가 시스템을 통해 코드 개선 방향을 제안합니다.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">개발자 프로필 생성</h3>
              <p className="text-gray-600 dark:text-gray-300">자연어 처리 기술을 활용한 맞춤형 개발자 프로필을 자동으로 생성합니다.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">기술 트렌드 분석</h3>
              <p className="text-gray-600 dark:text-gray-300">최신 기술 트렌드와 개발자의 역량을 연계한 심층 분석을 제공합니다.</p>
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