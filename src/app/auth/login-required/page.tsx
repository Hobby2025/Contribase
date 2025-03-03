'use client'

import Link from 'next/link'

export default function LoginRequired() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="bg-white shadow-md rounded-lg max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <svg className="mx-auto h-12 w-12 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-primary-900 mb-2">로그인 필요</h1>
        
        <div className="mt-6">
          <div className="bg-yellow-50 p-4 rounded-md mb-4">
            <p className="text-yellow-700">이 페이지에 접근하려면 로그인이 필요합니다.</p>
          </div>
          <Link
            href="/auth/github"
            className="mt-6 text-primary-700 rounded-lg font-medium text-lg inline-flex items-center justify-center gap-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-primary-300"
          >
            <img 
              src="/images/github_login.webp" 
              alt="GitHub 로고" 
              className="w-60 rounded-lg"
            />
          </Link>
        </div>
        <p className="mt-8 text-sm text-primary-500">
          GitHub 계정을 연결하면 Contribase가 공개 저장소에 접근할 수 있게 됩니다. 
          저희는 귀하의 개인 정보를 보호하며, 모든 분석은 클라이언트 측에서 처리됩니다.
        </p>
      </div>
    </div>
  )
} 