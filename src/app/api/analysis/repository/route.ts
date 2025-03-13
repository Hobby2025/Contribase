import { NextRequest, NextResponse } from 'next/server';
import { analyzeRepository } from '@/modules/analyzer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkUserAnalysisQuota, incrementAnalysisUsage } from '@/lib/userQuota';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// 분석 진행 캐시 참조
import { analysisProgressCache } from '@/lib/cache';

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
    
    // 사용자 할당량 확인
    const userId = session.user?.email;
    
    // 디버깅: 사용자 세션 정보 출력
    console.log('-------------------------------------');
    console.log('저장소 분석 API 호출됨');
    console.log('세션 정보:', {
      email: session.user?.email,
      name: session.user?.name
    });
    console.log('사용할 사용자 ID:', userId);
    
    const quotaInfo = await checkUserAnalysisQuota(userId || '');
    console.log('할당량 정보:', quotaInfo);
    
    // 할당량이 부족한 경우
    if (!quotaInfo.hasQuota) {
      console.log('분석 요청 거부 - 할당량 소진:', userId);
      return NextResponse.json({
        error: "오늘의 분석 횟수를 모두 사용했습니다. 내일 다시 시도해 주세요.",
        quotaExceeded: true,
        quota: quotaInfo
      }, { status: 429 });
    }
    
    // 요청 본문 파싱
    const reqBody = await request.json();
    const { owner, repo, options } = reqBody;
    
    console.log('분석 요청 본문:', {
      owner,
      repo,
      options: {
        ...options,
        accessToken: options?.accessToken ? '******' : undefined
      }
    });
    
    if (!owner || !repo) {
      return NextResponse.json(
        { error: '저장소 소유자와 이름이 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 저장소 분석 키
    const repoKey = `${owner}/${repo}`;
    
    // 기존 캐시 데이터가 있는지 확인
    const existingCache = analysisProgressCache[repoKey];
    if (existingCache && existingCache.completed) {
      console.log('이미 완료된 분석이 있습니다. 새 분석을 시작합니다.');
    }
    
    // 캐시에 분석 시작 상태 초기화 (중요!)
    analysisProgressCache[repoKey] = {
      progress: 0,
      stage: 'preparing',
      completed: false,
      lastUpdated: Date.now()
    };
    
    console.log('저장소 분석 요청 시작:', owner, repo);
    console.log('캐시 초기화 완료:', repoKey);
    console.log('현재 캐시 키 목록:', Object.keys(analysisProgressCache).join(', ') || '없음');
    
    // 중요: 분석 프로세스를 먼저 시작한 후 응답을 반환합니다.
    let analysisPromise = null;
    
    // 분석 프로세스 시작 (백그라운드에서 실행)
    const startAnalysis = async () => {
      try {
        // 저장소 분석 실행
        console.log(`분석 시작: ${owner}/${repo}`);
        const result = await analyzeRepository(
          session.accessToken as string,
          owner,
          repo,
          options
        );
        
        // 분석 성공 시 사용량 증가
        try {
          console.log('사용량 증가 시도 중...', userId || '');
          
          // 직접 데이터베이스에 삽입 시도 (디버깅용)
          const today = new Date().toISOString().split('T')[0];
          if (supabaseAdmin) {
            console.log('관리자 클라이언트로 직접 삽입 시도...');
            try {
              const { data: directData, error: directError } = await supabaseAdmin
                .from('analysis_usage')
                .insert({
                  user_id: userId || '',
                  date: today,
                  count: 1
                })
                .select();
                
              if (directError) {
                console.error('직접 삽입 실패:', directError);
                console.error('오류 코드:', directError.code);
                console.error('오류 세부 정보:', directError.details);
              } else {
                console.log('직접 삽입 성공:', directData);
              }
            } catch (directInsertErr) {
              console.error('직접 삽입 중 예외 발생:', directInsertErr);
            }
          }
          
          // 기존 방식으로도 시도
          await incrementAnalysisUsage(userId || '');
          console.log('분석 사용량 증가 성공:', userId);
        } catch (usageError) {
          console.error('분석 사용량 증가 실패:', usageError);
          console.error('오류 세부 정보:', usageError instanceof Error ? usageError.message : String(usageError));
        }
        
        // 업데이트된 할당량 정보 조회 - 결과 데이터에 포함
        const updatedQuota = await checkUserAnalysisQuota(userId || '');
        
        // 분석 결과를 캐시에 저장 (할당량 정보 포함)
        analysisProgressCache[repoKey] = {
          progress: 100,
          stage: 'finalizing',
          completed: true,
          result: { ...result, quota: updatedQuota },
          lastUpdated: Date.now()
        };
        
        console.log(`분석 완료: ${owner}/${repo}`);
        console.log('분석 결과 캐시에 저장 완료:', repoKey);
        console.log('캐시 상태 (completed):', analysisProgressCache[repoKey].completed);
        console.log('캐시 결과 유무:', !!analysisProgressCache[repoKey].result);
        
      } catch (error) {
        console.error(`분석 실패: ${owner}/${repo}`, error);
        
        // 오류 메시지 가공
        let errorMessage = '알 수 없는 오류가 발생했습니다.';
        
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // 네트워크 관련 오류 메시지를 사용자 친화적으로 변경
          if (errorMessage.includes('other side closed') || 
              errorMessage.includes('ECONNRESET') ||
              errorMessage.includes('ETIMEDOUT')) {
            errorMessage = 'GitHub API 연결이 끊어졌습니다. 잠시 후 다시 시도해 주세요.';
          } else if (errorMessage.includes('rate limit')) {
            errorMessage = 'GitHub API 호출 제한에 도달했습니다. 잠시 후 다시 시도해 주세요.';
          }
        }
        
        // 오류 상태 저장
        analysisProgressCache[repoKey] = {
          progress: 100,
          stage: 'finalizing',
          completed: true,
          error: { message: errorMessage },
          lastUpdated: Date.now()
        };
        
        console.log('오류 정보를 캐시에 저장했습니다:', errorMessage);
      }
    };
    
    // 백그라운드에서 분석 시작 (반드시 .catch를 붙여 프로미스 체인이 끊어지지 않도록 함)
    analysisPromise = startAnalysis().catch(err => {
      console.error('백그라운드 분석 시작 실패:', err);
    });
    
    // 중요: 응답을 반환하기 전에 프로세스가 시작되었는지 확인
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('분석 시작 완료, 클라이언트에 응답 반환');
    console.log('-------------------------------------');
    
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