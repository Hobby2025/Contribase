import { supabase, supabaseAdmin } from './supabase';

// 일일 분석 제한 (역할별)
const ROLE_LIMITS = {
  'admin': Infinity, // 관리자는 무제한
  'user': 3          // 일반 사용자는 3회
};

// 사용자의 역할 조회
export async function getUserRole(userId: string): Promise<string> {
  if (!userId) {
    console.error('사용자 ID가 누락되었습니다');
    return 'user'; // 기본값 반환
  }
  
  try {
    console.log('역할 조회 시도 - 사용자 ID:', userId);
    
    // 관리자 클라이언트로 역할 조회 시도 (RLS 우회)
    if (supabaseAdmin) {
      console.log('관리자 클라이언트로 역할 조회...');
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        console.log('관리자 클라이언트로 역할 조회 성공:', data.role);
        return data.role;
      } else if (error) {
        console.log('관리자 클라이언트로 역할 조회 실패:', error.message);
      }
    } else {
      console.log('관리자 클라이언트가 초기화되지 않았습니다');
    }
    
    // 일반 클라이언트로 재시도
    console.log('일반 클라이언트로 역할 조회 시도...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) {
      // UUID 형식 오류인 경우 자세한 로그
      if (error.code === '22P02') {
        console.error('사용자 ID 형식 오류 (UUID 형식이 아님):', userId);
        console.error('데이터베이스 오류 세부사항:', error);
        
        // 이메일 형식을 확인하는 간단한 정규식
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(userId)) {
          console.log('이메일 형식의 ID 감지, 관리자로 이메일 기반 조회 시도...');
          
          if (supabaseAdmin) {
            const { data: emailData, error: emailError } = await supabaseAdmin
              .from('user_profiles')
              .select('role')
              .eq('email', userId)
              .single();
            
            if (!emailError && emailData) {
              console.log('이메일로 역할 조회 성공:', emailData.role);
              return emailData.role;
            }
          }
        }
      } else {
        console.error('사용자 역할 조회 오류:', error);
      }
      
      return 'user'; // 기본값으로 일반 사용자 반환
    }
    
    return data?.role || 'user';
  } catch (e) {
    console.error('예상치 못한 오류 (getUserRole):', e);
    return 'user'; // 예외 발생 시 기본값 반환
  }
}

// 사용자의 일일 분석 제한 조회
export async function getUserDailyLimit(userId: string): Promise<number> {
  const role = await getUserRole(userId);
  return role === 'admin' ? ROLE_LIMITS.admin : ROLE_LIMITS.user;
}

// 사용자의 분석 할당량 확인
export async function checkUserAnalysisQuota(userId: string): Promise<{
  hasQuota: boolean;
  used: number;
  limit: number;
  remaining: number;
  isAdmin: boolean;
}> {
  try {
    // 사용자 역할 조회
    const role = await getUserRole(userId);
    const isAdmin = role === 'admin';
    
    // 관리자인 경우 무제한 할당량 반환
    if (isAdmin) {
      return {
        hasQuota: true,
        used: 0,
        limit: Infinity,
        remaining: Infinity,
        isAdmin: true
      };
    }
    
    // 기본 제한 값
    const limit = ROLE_LIMITS.user;
    
    // 관리자 클라이언트가 없으면 기본값 반환
    if (!supabaseAdmin) {
      console.warn('관리자 클라이언트가 없어 사용량을 정확히 확인할 수 없습니다');
      return {
        hasQuota: true,
        used: 0,
        limit,
        remaining: limit,
        isAdmin: false
      };
    }
    
    try {
      // 오늘 날짜 (YYYY-MM-DD 형식)
      const today = new Date().toISOString().split('T')[0];
      
      // 직접 테이블 쿼리 (단순화)
      console.log('직접 테이블 쿼리 수행...');
      const { data, error } = await supabaseAdmin
        .from('analysis_usage')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      
      // 쿼리 결과가 없는 경우 (PGRST116 오류는 정상)
      if (error && error.code !== 'PGRST116') {
        console.error('사용량 조회 직접 쿼리 오류:', error);
        
        // 테이블이 없거나 쿼리 오류 발생 시 기본값 반환
        return {
          hasQuota: true,
          used: 0,
          limit,
          remaining: limit,
          isAdmin: false
        };
      }
      
      // 정상 처리
      const used = data?.count || 0;
      const remaining = Math.max(0, limit - used);
      
      console.log('사용량 조회 성공:', { used, limit, remaining });
      
      return {
        hasQuota: remaining > 0,
        used,
        limit,
        remaining,
        isAdmin: false
      };
    } catch (dbError) {
      console.error('데이터베이스 쿼리 예외 발생:', dbError);
      
      // 예외 발생 시 기본값 반환
      return {
        hasQuota: true,
        used: 0,
        limit,
        remaining: limit,
        isAdmin: false
      };
    }
  } catch (e) {
    console.error('예상치 못한 오류 (checkUserAnalysisQuota):', e);
    
    // 최상위 예외 발생 시 기본값 반환
    return {
      hasQuota: true,
      used: 0,
      limit: ROLE_LIMITS.user,
      remaining: ROLE_LIMITS.user,
      isAdmin: false
    };
  }
}

// 분석 사용량 증가
export async function incrementAnalysisUsage(userId: string): Promise<void> {
  console.log('=== 초단순화된 분석 사용량 증가 시작 ===');
  console.log('사용자 ID:', userId);
  
  if (!userId) {
    console.error('사용자 ID가 없어 사용량을 기록할 수 없습니다');
    return;
  }
  
  if (!supabaseAdmin) {
    console.error('관리자 클라이언트가 초기화되지 않아 사용량 기록 불가');
    return;
  }
  
  try {
    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];
    console.log('현재 날짜:', today);
    
    console.log('최대한 단순화된 방식으로 사용량 기록 시도...');
    
    // 1. 기존 레코드 조회
    try {
      const { data: existingData, error: selectError } = await supabaseAdmin
        .from('analysis_usage')
        .select('id, count')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
      
      console.log('기존 데이터 조회 결과:', existingData ? '있음' : '없음', selectError ? `(오류: ${selectError.message})` : '');
      
      if (!existingData && (!selectError || selectError.code === 'PGRST116')) {
        // 2. 데이터가 없으면 새로 생성
        console.log('새 레코드 생성 시도...');
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('analysis_usage')
          .insert({
            user_id: userId,
            date: today,
            count: 1,
            created_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('새 레코드 생성 실패:', insertError);
        } else {
          console.log('새 레코드 생성 성공!');
        }
      } else if (existingData) {
        // 3. 기존 데이터가 있으면 카운트 증가
        console.log('기존 레코드 업데이트 시도...');
        const newCount = (existingData.count || 0) + 1;
        
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('analysis_usage')
          .update({
            count: newCount,
            created_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
        
        if (updateError) {
          console.error('레코드 업데이트 실패:', updateError);
        } else {
          console.log(`레코드 업데이트 성공! (${existingData.count} → ${newCount})`);
        }
      }
    } catch (e) {
      console.error('사용량 처리 중 오류:', e);
    }
    
    console.log('=== 사용량 증가 처리 완료 ===');
  } catch (e) {
    console.error('예상치 못한 오류 (incrementAnalysisUsage):', e);
  }
}

// 관리자 권한 설정 함수 (서버 측에서만 사용)
export async function setUserAsAdmin(email: string): Promise<boolean> {
  if (!supabaseAdmin) {
    console.error('서비스 롤 키가 설정되지 않았습니다');
    return false;
  }
  
  const { error } = await supabaseAdmin.rpc('set_user_as_admin', { email });
  
  if (error) {
    console.error('관리자 설정 오류:', error);
    return false;
  }
  
  return true;
}