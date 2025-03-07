import { NextRequest, NextResponse } from 'next/server';
import { analyzeRepository } from '@/lib/analyzer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 분석 진행 캐시 참조
import { analysisProgressCache } from '../progress/route';

/**
 * POST /api/analysis/repository
 * 
 * 저장소 분석을 처리하는 API 엔드포인트입니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 세션 확인
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }
    
    // 요청 본문 파싱
    const { owner, repo, options } = await request.json();
    
    if (!owner || !repo) {
      return NextResponse.json(
        { error: '저장소 소유자와 이름이 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 저장소 분석 키
    const repoKey = `${owner}/${repo}`;
    
    // 캐시에 분석 시작 상태 초기화 (중요!)
    analysisProgressCache[repoKey] = {
      progress: 0,
      stage: 'preparing',
      completed: false,
      lastUpdated: Date.now()
    };
    
    console.log('저장소 분석 요청 시작:', owner, repo);
    console.log('캐시 초기화 완료:', repoKey);
    
    // 분석 프로세스 시작 (백그라운드에서 실행)
    (async () => {
      try {
        // 저장소 분석 실행
        const result = await analyzeRepository(
          session.accessToken as string,
          owner,
          repo,
          options
        );
        
        // 분석 결과를 캐시에 저장
        analysisProgressCache[repoKey] = {
          progress: 100,
          stage: 'finalizing',
          completed: true,
          result: result,
          lastUpdated: Date.now()
        };
        
        console.log('분석 결과 캐시에 저장 완료:', repoKey);
        console.log('캐시 상태 (completed):', analysisProgressCache[repoKey].completed);
        console.log('캐시 결과 유무:', !!analysisProgressCache[repoKey].result);
      } catch (error) {
        console.error('백그라운드 분석 처리 오류:', error);
        
        // 오류 상태 저장
        if (analysisProgressCache[repoKey]) {
          analysisProgressCache[repoKey] = {
            ...analysisProgressCache[repoKey],
            completed: true,
            error: { message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' },
            lastUpdated: Date.now()
          };
        }
      }
    })();
    
    // 분석 요청이 시작되었음을 즉시 응답
    return NextResponse.json({
      success: true,
      message: '저장소 분석이 시작되었습니다. 진행 상황을 확인하세요.'
    });
  } catch (error) {
    console.error('저장소 분석 API 오류:', error);
    
    return NextResponse.json(
      { 
        error: '분석 처리 중 서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 