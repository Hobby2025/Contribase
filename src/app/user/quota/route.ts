import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkUserAnalysisQuota } from '@/lib/userQuota';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }
    
    const quota = await checkUserAnalysisQuota(session.user.email);
    
    return NextResponse.json({ quota });
  } catch (error) {
    console.error('할당량 정보 조회 오류:', error);
    return NextResponse.json({ error: '할당량 정보를 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}