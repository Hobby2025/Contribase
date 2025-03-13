import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkUserAnalysisQuota } from '@/lib/userQuota';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * 사용자의 분석 할당량 정보를 반환하는 API 엔드포인트
 * GET /api/user/quota
 */

// API 핸들러에서 호출
export async function GET(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }
    
    // 사용자 ID
    const userId = session.user.email || '';
    
    // 할당량 확인
    const quota = await checkUserAnalysisQuota(userId);
    
    return NextResponse.json({ quota });
  } catch (error) {
    console.error('할당량 API 오류:', error);
    return NextResponse.json({ 
      error: '할당량 정보를 가져오는 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 