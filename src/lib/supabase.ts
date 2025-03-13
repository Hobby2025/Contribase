import { createClient } from '@supabase/supabase-js'

// Supabase 설정 상수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// 클라이언트 초기화 여부 확인을 위한 플래그
let isSupabaseInitialized = false;
let isSupabaseAdminInitialized = false;

// 환경 변수 유효성 검사 및 로깅
if (!supabaseUrl || supabaseUrl.trim() === '') {
  console.error('NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다!');
} else if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다!');
} else {
  isSupabaseInitialized = true;
}

if (!supabaseServiceKey || supabaseServiceKey.trim() === '') {
  console.warn('SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다! 관리자 권한이 필요한 작업이 불가능합니다.');
} else if (isSupabaseInitialized) {
  isSupabaseAdminInitialized = true;
}

// 기본 클라이언트 (익명 사용자용)
export const supabase = isSupabaseInitialized 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

// 서버 측에서 관리자 권한으로 사용할 클라이언트 (서비스 롤)
export const supabaseAdmin = isSupabaseAdminInitialized
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
      }
    })
  : null;

// 서비스 롤 키의 초기화 상태 확인
console.log('Supabase 클라이언트 초기화 상태:', {
  기본클라이언트: isSupabaseInitialized ? '초기화됨' : '초기화 실패',
  관리자클라이언트: isSupabaseAdminInitialized ? '초기화됨' : '초기화되지 않음'
});

/**
 * Supabase 클라이언트가 초기화되었는지 확인하는 함수
 * @returns 초기화 상태 객체
 */
export function getSupabaseStatus() {
  return {
    isClientInitialized: isSupabaseInitialized,
    isAdminInitialized: isSupabaseAdminInitialized,
    url: supabaseUrl ? '설정됨' : '설정되지 않음',
    anonKey: supabaseAnonKey ? '설정됨' : '설정되지 않음', 
    serviceKey: supabaseServiceKey ? '설정됨' : '설정되지 않음'
  };
}

// 클라이언트 건전성 테스트 (개발 환경에서만 실행)
if (process.env.NODE_ENV === 'development') {
  (async () => {
    try {
      // 기본 클라이언트 테스트
      if (supabase) {
        const { data: versionData, error: versionError } = await supabase.from('_version').select('*').limit(1);
        
        if (versionError) {
          console.error('Supabase 기본 클라이언트 연결 테스트 실패:', versionError);
        } else {
          console.log('Supabase 기본 클라이언트 연결 테스트 성공');
        }
      } else {
        console.error('Supabase 기본 클라이언트가 초기화되지 않아 테스트할 수 없습니다.');
      }
      
      // 관리자 클라이언트 테스트 (존재하는 경우)
      if (supabaseAdmin) {
        const { error: adminError } = await supabaseAdmin.from('user_profiles').select('count').limit(1);
        
        if (adminError) {
          console.error('Supabase 관리자 클라이언트 연결 테스트 실패:', adminError);
        } else {
          console.log('Supabase 관리자 클라이언트 연결 테스트 성공');
        }
      } else {
        console.warn('Supabase 관리자 클라이언트가 초기화되지 않아 테스트할 수 없습니다.');
      }
    } catch (e) {
      console.error('Supabase 클라이언트 테스트 중 예외 발생:', e);
    }
  })();
}