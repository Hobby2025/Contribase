import { NextRequest, NextResponse } from 'next/server'

/**
 * PDF 생성 API 라우트 - 일시적으로 비활성화됨
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    // PDF 기능 비활성화 - 개선 전까지 수정
    return NextResponse.json(
      { 
        error: 'PDF 기능이 일시적으로 비활성화되었습니다.', 
        message: '기능 개선이 완료될 때까지 잠시 사용할 수 없습니다.' 
      },
      { status: 503, headers: { 'Retry-After': '86400' } }
    );
  } catch (error) {
    console.error('PDF 기능 비활성화 오류:', error);
    return NextResponse.json(
      { error: 'PDF 서비스를 처리하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 