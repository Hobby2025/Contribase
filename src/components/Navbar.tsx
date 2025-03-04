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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
              <div className="flex items-center space-x-4">
                <button onClick={() => signOut()} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  로그아웃
                </button>
              </div>
            ) : (
              <button onClick={() => signIn('github')} className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 py-2 px-4 rounded-lg transition-colors">
                GitHub 로그인
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
              <>
                <button onClick={() => signOut()} className="text-sm font-medium text-gray-600 dark:text-gray-300 text-left">
                  로그아웃
                </button>
              </>
            ) : (
              <button onClick={() => signIn('github')} className="text-sm font-medium text-primary-600 dark:text-primary-400 text-left">
                GitHub 로그인
              </button>
            )}
          </nav>
        </div>
      )}
    </nav>
  )
} 