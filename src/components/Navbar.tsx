'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useTheme } from './common/ThemeProvider'
import { APP_VERSION } from '@/utils/config'

// 메뉴 항목 타입 정의
type MenuItem = {
  path: string;
  label: string;
  matchPattern?: RegExp;
};

// 메뉴 항목 데이터
const MENU_ITEMS: MenuItem[] = [
  { path: '/', label: '홈' },
  { path: '/dashboard', label: '대시보드', matchPattern: /^\/dashboard(\/.*)?$/ },
  { path: '/features', label: '기능' },
  { path: '/about', label: '소개' }
];

export default function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { theme } = useTheme()
  const [isLoginLoading, setIsLoginLoading] = useState(false)

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 프로필 메뉴 토글
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }

  // 외부 클릭 시 프로필 메뉴 닫기
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-profile-menu]')) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileMenuOpen])

  // 로그인 상태 변경 감지
  useEffect(() => {
    if (status !== 'loading') {
      setIsLoginLoading(false)
    }
  }, [status])

  // 로그인 처리
  const handleLogin = () => {
    setIsLoginLoading(true)
    signIn('github', { callbackUrl: '/dashboard' })
      .catch(error => {
        console.error('로그인 오류:', error)
        setIsLoginLoading(false)
      })
    
    // 안전장치: 15초 후 로딩 상태 자동 해제 (기존 10초에서 증가)
    setTimeout(() => setIsLoginLoading(false), 15000)
  }

  // 메뉴 아이템이 현재 경로와 일치하는지 확인
  const isActiveMenuItem = (item: MenuItem) => {
    if (item.matchPattern) {
      return item.matchPattern.test(pathname);
    }
    return pathname === item.path;
  };

  // 메뉴 아이템 렌더링
  const renderMenuItem = (item: MenuItem) => {
    const isActive = isActiveMenuItem(item);
    const activeClass = 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 font-bold';
    const inactiveClass = 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400';
    
    return (
      <Link 
        key={item.path}
        href={item.path} 
        className={`text-sm font-medium ${isActive ? activeClass : inactiveClass}`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md' : 'bg-white dark:bg-gray-900'}`}>
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
              priority
            />
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-8">
            {MENU_ITEMS.map(renderMenuItem)}
            
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              v{APP_VERSION}
            </span>
            
            {session ? (
              <div className="relative" data-profile-menu>
                <button 
                  onClick={toggleProfileMenu} 
                  className="flex items-center space-x-2 focus:outline-none"
                  aria-label="프로필 메뉴 열기"
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
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-100 dark:border-gray-700">
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
                className={`text-sm font-medium text-white py-2 px-4 rounded-lg transition-all flex items-center ${isLoginLoading ? 'bg-primary-500 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
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
                  <>GitHub 로그인</>
                )}
              </button>
            )}
          </div>

          {/* 모바일 햄버거 메뉴 */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="text-gray-600 dark:text-gray-300 focus:outline-none"
              aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col space-y-4">
              {MENU_ITEMS.map((item) => {
                const isActive = isActiveMenuItem(item);
                const activeClass = 'text-primary-600 dark:text-primary-400 font-bold';
                const inactiveClass = 'text-gray-600 dark:text-gray-300';
                
                return (
                  <Link 
                    key={item.path}
                    href={item.path} 
                    className={`text-base font-medium ${isActive ? activeClass : inactiveClass}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                {session ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {session.user?.image ? (
                        <Image 
                          src={session.user.image} 
                          alt={session.user.name || "사용자"} 
                          width={36} 
                          height={36} 
                          className="h-9 w-9 rounded-full border-2 border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400">
                          {session.user?.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{session.user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user?.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }} 
                      className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                    >
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      handleLogin();
                      setIsMenuOpen(false);
                    }} 
                    disabled={isLoginLoading}
                    className={`w-full text-sm font-medium text-white py-3 px-4 rounded-lg transition-all flex items-center justify-center ${isLoginLoading ? 'bg-primary-500 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
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
                      <>GitHub 로그인</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
} 