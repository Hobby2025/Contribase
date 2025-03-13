import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { supabase, supabaseAdmin } from './supabase'

/**
 * 사용자 프로필 생성 함수
 * 이미 프로필이 존재하면 true 반환, 새로 생성하면 true 반환, 오류 발생 시 false 반환
 */
async function createUserProfileIfNotExists(email: string): Promise<boolean> {
  if (!email) {
    console.error('이메일이 제공되지 않았습니다');
    return false;
  }
  
  try {
    // supabaseAdmin이 null인지 확인
    if (!supabaseAdmin) {
      console.error('supabaseAdmin이 초기화되지 않았습니다. 환경 변수 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
      return false;
    }
    
    // 1. 먼저 관리자 클라이언트로 사용자 프로필이 존재하는지 확인
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', email)
      .single();
    
    // 2. 프로필이 이미 존재하는 경우
    if (data && !error) {
      console.log(`사용자 프로필이 이미 존재합니다: ${email}`);
      return true;
    }
    
    // 3. 프로필이 존재하지 않는 경우 (PGRST116: 결과 없음)
    if (error && (error.code === 'PGRST116' || !data)) {
      console.log(`관리자 권한으로 사용자 프로필을 생성합니다: ${email}`);
      
      // 관리자 클라이언트로 프로필 생성 (RLS 우회)
      const { error: insertError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: email,
          email: email,
          role: 'user',
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('관리자 권한으로 프로필 생성 오류:', insertError);
        return false;
      } else {
        console.log(`사용자 프로필 생성 성공: ${email}`);
        return true;
      }
    } else {
      console.error('사용자 프로필 확인 중 예상치 못한 오류:', error);
      return false;
    }
  } catch (e) {
    console.error('사용자 프로필 생성 중 예외 발생:', e);
    return false;
  }
}

// 프로필 생성 상태를 추적하는 맵
const profileCreationInProgress = new Map<string, Promise<boolean>>();

/**
 * 중복 호출을 방지하는 사용자 프로필 생성 래퍼 함수
 */
async function ensureUserProfile(email: string): Promise<boolean> {
  if (!email) return false;
  
  // 이미 진행 중인 프로필 생성 작업이 있는지 확인
  if (profileCreationInProgress.has(email)) {
    return profileCreationInProgress.get(email) as Promise<boolean>;
  }
  
  // 새 프로필 생성 작업 시작 및 맵에 저장
  const creationPromise = createUserProfileIfNotExists(email)
    .finally(() => {
      // 작업 완료 후 맵에서 제거
      profileCreationInProgress.delete(email);
    });
  
  profileCreationInProgress.set(email, creationPromise);
  return creationPromise;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: 'read:user user:email repo'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // 액세스 토큰을 JWT에 포함
      if (account) {
        token.accessToken = account.access_token
      }
      
      // 사용자 로그인 시 프로필 생성 처리
      if (user?.email) {
        // 백그라운드에서 프로필 생성 처리
        ensureUserProfile(user.email)
          .catch(e => console.error('프로필 생성 백그라운드 작업 오류:', e));
      }
      
      return token
    },
    async session({ session, token }: { session: any, token: any }) {
      // 세션에 액세스 토큰 추가
      session.accessToken = token.accessToken
      
      // 사용자가 세션을 시작할 때도 프로필 생성 확인
      if (session?.user?.email) {
        // 백그라운드에서 프로필 생성 처리 (중복 생성 방지)
        ensureUserProfile(session.user.email)
          .catch(e => console.error('세션 갱신 시 프로필 생성 오류:', e));
      }
      
      return session
    },
    async signIn({ user }) {
      // 사용자 로그인 직후 프로필 생성
      if (user?.email) {
        try {
          return await ensureUserProfile(user.email);
        } catch (e) {
          console.error('로그인 시 프로필 생성 오류:', e);
          // 오류가 있어도 로그인은 허용
          return true;
        }
      }
      
      return true
    }
  },
  pages: {
    signIn: '/auth/github',
    error: '/auth/error',
    signOut: '/',
    newUser: '/dashboard'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일 (초 단위)
  },
  // 환경에 따른 URL 설정
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
} 