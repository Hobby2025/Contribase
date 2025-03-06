import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { OAuthConfig } from 'next-auth/providers'

// 환경에 따른 URL 설정
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : process.env.NEXTAUTH_URL || 'http://localhost:3000';

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
      // 동적으로 scope를 처리할 수 있도록 설정
      authorization: {
        url: "https://github.com/login/oauth/authorize",
        params: {
          // 기본 스코프는 사용자 정보와 이메일, 저장소 읽기 권한만 포함
          scope: 'read:user user:email repo'
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // 사용자가 로그인하면 GitHub 액세스 토큰을 JWT에 저장
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      // 세션에 액세스 토큰 추가
      session.accessToken = token.accessToken
      return session
    },
    async redirect({ url, baseUrl }) {
      // state 매개변수에서 callbackUrl 추출 시도
      try {
        // 상대 경로인 경우 baseUrl과 결합
        const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;
        const urlObj = new URL(fullUrl);
        const state = urlObj.searchParams.get('state');
        
        if (state) {
          try {
            const stateObj = JSON.parse(decodeURIComponent(state));
            if (stateObj.callbackUrl) {
              return `${baseUrl}${stateObj.callbackUrl}`;
            }
          } catch (e) {
            console.error('state 파싱 오류:', e);
          }
        }
      } catch (e) {
        console.error('URL 파싱 오류:', e);
      }
      
      // 기타 경우, URL이 baseUrl로 시작하면 그대로 사용
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // 상대 경로인 경우 baseUrl과 결합
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // GitHub 인증 후 항상 대시보드로 리다이렉트
      return `${baseUrl}/dashboard?t=${Date.now()}`;
    },
  },
  pages: {
    signIn: '/auth/github', // 커스텀 로그인 페이지
    error: '/auth/error',   // 에러 페이지
    signOut: '/',           // 로그아웃 후 리디렉션 페이지
    newUser: '/dashboard',  // 새 사용자 등록 후 리디렉션 페이지
  },
  secret: process.env.NEXTAUTH_SECRET,
  // 환경에 따른 쿠키 설정
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
})

export { handler as GET, handler as POST } 