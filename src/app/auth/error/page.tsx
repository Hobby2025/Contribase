'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AuthError() {
  const [errorMessage, setErrorMessage] = useState('인증 과정에서 오류가 발생했습니다.')
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      switch (error) {
        case 'Signin':
          setErrorMessage('로그인 중에 오류가 발생했습니다. 다시 시도해 주세요.')
          break
        case 'OAuthSignin':
          setErrorMessage('OAuth 인증을 시작하는 중에 오류가 발생했습니다.')
          break
        case 'OAuthCallback':
          setErrorMessage('OAuth 제공자로부터 응답을 받는 중에 오류가 발생했습니다.')
          break
        case 'OAuthCreateAccount':
          setErrorMessage('OAuth 계정을 생성하는 중에 오류가 발생했습니다.')
          break
        case 'EmailCreateAccount':
          setErrorMessage('이메일로 계정을 생성하는 중에 오류가 발생했습니다.')
          break
        case 'Callback':
          setErrorMessage('콜백 처리 중에 오류가 발생했습니다.')
          break
        case 'AccessDenied':
          setErrorMessage('접근이 거부되었습니다. 필요한 권한이 부여되지 않았습니다.')
          break
        case 'SessionRequired':
          setErrorMessage('이 페이지에 접근하려면 로그인이 필요합니다.')
          break
        default:
          setErrorMessage(`인증 과정에서 오류가 발생했습니다: ${error}`)
      }
    }
  }, [searchParams])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="bg-white shadow-md rounded-lg max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <svg className="mx-auto h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">인증 오류</h1>
        
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-700">{errorMessage}</p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Link 
            href="/auth/github"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            다시 로그인 시도하기
          </Link>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
} 