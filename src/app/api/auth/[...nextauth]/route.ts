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
      // GitHub에서 사용자 저장소 정보를 읽을 수 있는 권한 요청
      authorization: {
        params: {
          scope: 'read:user user:email repo',
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