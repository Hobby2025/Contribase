'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useTheme } from './ThemeProvider'

export default function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const appVersion = process.env.APP_VERSION || '1.0.5' // 환경 변수에서 버전 가져오기, 없으면 기본값
  const { theme } = useTheme()
  const [isLoginLoading, setIsLoginLoading] = useState(false) // 로그인 로딩 상태

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 프로필 메뉴 토글 함수
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }

  // 프로필 메뉴 닫기 함수
  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false)
  }

  // 외부 클릭 시 프로필 메뉴 닫기 이벤트 핸들러
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isProfileMenuOpen && !target.closest('[data-profile-menu]')) {
        closeProfileMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileMenuOpen])

  // 로그인 상태가 변경되면 로딩 상태 해제
  useEffect(() => {
    if (status !== 'loading') {
      setIsLoginLoading(false)
    }
  }, [status])

  // 로그인 처리 함수
  const handleLogin = () => {
    setIsLoginLoading(true)
    
    // 명시적으로 대시보드 경로를 콜백 URL로 지정
    const callbackUrl = `/dashboard?t=${Date.now()}`;
    
    // GitHub 인증 상태 객체에 callbackUrl 정보 포함
    const stateObj = JSON.stringify({ callbackUrl });
    
    // NextAuth의 signIn 함수 사용 (대시보드로 리다이렉트 명시)
    signIn('github', {
      callbackUrl,
      redirect: true,
      state: stateObj
    }).then(() => {
      // 리다이렉트가 시작되면 여기로 오지 않음
      console.log('로그인 리다이렉트 중...')
    }).catch(error => {
      console.error('로그인 오류:', error)
      setIsLoginLoading(false)
    })
    
    // 리다이렉트 시작 후 일정 시간이 지나도 페이지가 이동하지 않는 경우를 대비한 안전장치
    setTimeout(() => {
      setIsLoginLoading(false)
    }, 10000) // 10초 후 로딩 상태 자동 해제
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md' : 'bg-white dark:bg-gray-900'}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
            <Image 
              src="/images/Contribase_logo.webp" 
              alt="Contribase 로고" 
              width={160} 
              height={30} 
              className="h-6 w-auto"
            />
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`text-sm font-medium ${pathname === '/' 
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 font-bold' 
              : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'}`}>
              홈
            </Link>
            <Link href="/dashboard" className={`text-sm font-medium ${pathname === '/dashboard' || pathname.startsWith('/dashboard/') 
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 font-bold' 
              : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'}`}>
              대시보드
            </Link>
            <Link href="/features" className={`text-sm font-medium ${pathname === '/features' 
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 font-bold' 
              : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'}`}>
              기능
            </Link>
            <Link href="/about" className={`text-sm font-medium ${pathname === '/about' 
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 font-bold' 
              : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'}`}>
              소개
            </Link>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              v{appVersion}
            </span>
            {session ? (
              <div className="relative" data-profile-menu>
                <button 
                  onClick={toggleProfileMenu} 
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  {session.user?.image ? (
                    <Image 
                      src={session.user.image} 
                      alt={session.user.name || "사용자"} 
                      width={32} 
                      height={32} 
                      className="h-8 w-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400">
                      {session.user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                </button>
                
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{session.user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user?.email}</p>
                    </div>
                    <button 
                      onClick={() => signOut()} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={handleLogin} 
                disabled={isLoginLoading}
                className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 py-2 px-4 rounded-lg transition-colors flex items-center"
              >
                {isLoginLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    로그인 중...
                  </>
                ) : (
                  "GitHub 로그인"
                )}
              </button>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-gray-600 dark:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 py-4 px-4 shadow-lg">
          <nav className="flex flex-col space-y-4">
            <Link href="/" className={`text-sm font-medium py-2 ${pathname === '/' 
              ? 'text-primary-600 dark:text-primary-400 border-l-4 border-primary-600 dark:border-primary-400 font-bold pl-2' 
              : 'text-gray-600 dark:text-gray-300'}`}>
              홈
            </Link>
            <Link href="/dashboard" className={`text-sm font-medium py-2 ${pathname === '/dashboard' || pathname.startsWith('/dashboard/') 
              ? 'text-primary-600 dark:text-primary-400 border-l-4 border-primary-600 dark:border-primary-400 font-bold pl-2' 
              : 'text-gray-600 dark:text-gray-300'}`}>
              대시보드
            </Link>
            <Link href="/features" className={`text-sm font-medium py-2 ${pathname === '/features' 
              ? 'text-primary-600 dark:text-primary-400 border-l-4 border-primary-600 dark:border-primary-400 font-bold pl-2' 
              : 'text-gray-600 dark:text-gray-300'}`}>
              기능
            </Link>
            <Link href="/about" className={`text-sm font-medium py-2 ${pathname === '/about' 
              ? 'text-primary-600 dark:text-primary-400 border-l-4 border-primary-600 dark:border-primary-400 font-bold pl-2' 
              : 'text-gray-600 dark:text-gray-300'}`}>
              소개
            </Link>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              v{appVersion}
            </span>
            {session ? (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                {session.user?.image && (
                  <div className="flex items-center space-x-3 mb-3">
                    <Image 
                      src={session.user.image} 
                      alt={session.user.name || "사용자"} 
                      width={32} 
                      height={32} 
                      className="h-8 w-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{session.user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user.email}</p>
                    </div>
                  </div>
                )}
                <button onClick={() => signOut()} className="text-sm font-medium text-gray-600 dark:text-gray-300 text-left">
                  로그아웃
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin} 
                disabled={isLoginLoading}
                className="text-sm font-medium text-primary-600 dark:text-primary-400 text-left flex items-center"
              >
                {isLoginLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    로그인 중...
                  </>
                ) : (
                  "GitHub 로그인"
                )}
              </button>
            )}
          </nav>
        </div>
      )}
    </nav>
  )
} 