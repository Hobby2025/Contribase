import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'

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
        params: {
          // 기본 스코프는 사용자 정보와 이메일, 저장소 읽기 권한만 포함
          scope: 'read:user user:email repo',
          // 항상 권한 동의 화면이 표시되도록 설정
          prompt: 'consent'
        },
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