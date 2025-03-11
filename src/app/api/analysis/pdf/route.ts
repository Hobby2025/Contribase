import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyzeRepository } from '@/modules/analyzer'

export async function POST(request: NextRequest) {
  try {
    // 인증 세션 확인
    const session = await getServerSession(authOptions)
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      )
    }

    // 요청 본문 파싱
    const { owner, repo } = await request.json()
    
    if (!owner || !repo) {
      return NextResponse.json(
        { error: '저장소 소유자와 이름이 필요합니다.' },
        { status: 400 }
      )
    }

    // 저장소 분석 실행
    const analysisResult = await analyzeRepository(
      session.accessToken,
      owner,
      repo
    )

    // 응답 반환
    return NextResponse.json({
      success: true,
      data: analysisResult,
      pdfUrl: `/api/analysis/pdf/${owner}/${repo}`
    })
  } catch (error) {
    console.error('PDF 생성 API 오류:', error)
    return NextResponse.json(
      { error: '분석 결과 PDF를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 