import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// 간단한 인메모리 캐시로 진행 상태를 저장
// 실제 프로덕션에서는 Redis나 다른 상태 저장소를 사용하는 것이 좋습니다
export const analysisProgressCache: Record<string, {
  progress: number;
  stage: 'preparing' | 'fetching' | 'analyzing' | 'finalizing';
  completed: boolean;
  error?: { message: string };
  result?: any;
  message?: string;
  lastUpdated: number;
}> = {};

// 캐시 상태 디버깅용 함수
function logCacheState(repo: string) {
  console.log(`캐시 상태 확인 (${repo}):`, {
    exists: !!analysisProgressCache[repo],
    completed: analysisProgressCache[repo]?.completed,
    hasResult: !!analysisProgressCache[repo]?.result,
    keys: analysisProgressCache[repo] ? Object.keys(analysisProgressCache[repo]) : []
  });
}

// 테스트용 기본 데이터 생성 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  // 테스트용 더미 데이터 추가
  analysisProgressCache['test/testrepo'] = {
    progress: 75,
    stage: 'analyzing',
    completed: false,
    message: '테스트 저장소 분석 중',
    lastUpdated: Date.now()
  };
  
  console.log('개발 환경 - 테스트 데이터가 캐시에 추가되었습니다.');
}

/**
 * GET /api/analysis/progress
 * 
 * 분석 진행 상태를 가져오는 API 엔드포인트입니다.
 * 쿼리 파라미터로 repo를 전달해야 합니다.
 */
export async function GET(request: NextRequest) {
  try {
    // URL에서 저장소 이름 가져오기
    const searchParams = request.nextUrl.searchParams;
    const repo = searchParams.get('repo');
    
    if (!repo) {
      return NextResponse.json(
        { error: '저장소 이름이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    console.log('진행 상태 조회 요청:', repo);
    console.log('요청 URL:', request.url);
    console.log('query 파라미터:', Object.fromEntries(searchParams.entries()));
    
    // 진행 상태 확인
    const progressData = analysisProgressCache[repo];
    
    // 캐시 키 목록 로깅
    const cachedKeys = Object.keys(analysisProgressCache);
    console.log('캐시 데이터 존재?:', !!progressData);
    console.log('현재 캐시에 있는 저장소:', cachedKeys.join(', '));
    
    // 진행 상태 캐시가 없는 경우 개발 모드에서만 더미 데이터 생성
    if (!progressData && process.env.NODE_ENV === 'development') {
      console.log(`${repo}에 대한 진행 상태 데이터가 없습니다.`);
      
      // 더미 데이터 생성
      analysisProgressCache[repo] = {
        progress: 100,
        stage: 'finalizing',
        completed: true,
        result: {
          repositoryInfo: {
            owner: repo.split('/')[0],
            repo: repo.split('/')[1],
            url: `https://github.com/${repo}`,
            isUserAnalysis: true,
            userLogin: 'stjoo0925',
            aiAnalyzed: true,
            aiProjectType: '문서화 프로젝트',
          },
          techStack: [
            { name: 'Markdown', type: 'language', usage: 100, confidence: 100 },
          ],
          developerProfile: {
            totalCommits: 10,
            contributors: [
              { author: 'stjoo0925', email: 'stjoo0925@github.com', commits: 10, percentage: 100 }
            ],
            commitCategories: {
              '문서화': 10,
              '코드 추가': 0,
              '버그 수정': 0,
              '리팩토링': 0,
              '테스트': 0,
              '기타': 90,
            },
            activityPeriod: '2개월'
          },
          domains: ['문서화'],
          characteristics: [
            { type: '문서화', score: 100, description: 'README 파일 중심의 프로젝트' },
          ],
          developmentPattern: {
            commitFrequency: '규칙적',
            developmentCycle: '단기',
            teamDynamics: '개인',
            workPatterns: {
              time: '낮',
              dayOfWeek: '주중',
              mostActiveDay: '목요일',
              mostActiveHour: 14
            }
          },
          keyFeatures: [
            { title: 'README 문서 관리', description: '프로젝트와 관련된 정보를 제공하는 README.md 파일을 중점적으로 관리하고 개선함', importance: 100 },
          ],
          insights: [
            { title: '활발하지 않은 기여', description: '현재 프로젝트는 기여자 \'stjoo0925\' 외에 다른 기여자가 없으며, 스타나 포크도 없는 상태로 저조한 인지도를 보여줍니다.' },
            { title: '지속적인 업데이트', description: '기여자가 README.md를 여러 번 업데이트하며 프로젝트 내용을 계속 개선하려는 노력이 보입니다.' },
          ],
          recommendations: [
            { title: '프로젝트 가시성 증대', description: '프로젝트를 더욱 많은 사람들에게 알리기 위해 GitHub 외의 플랫폼에서 프로젝트 홍보를 검토해보는 것이 좋습니다.', priority: 'high' },
            { title: '다양한 기여자 모집', description: '커뮤니티 참여를 유도하기 위해 더 많은 기여자를 모집하려는 노력이 필요합니다.', priority: 'medium' },
            { title: '의존성 관리', description: '프로젝트의 안정성을 높이기 위해 의존성을 추가하고 필요한 패키지를 통합하는 것이 좋습니다.', priority: 'low' },
          ],
          summary: '이 프로젝트는 주로 README.md 파일을 수차례 수정하여 문서화 작업을 진행하고 있습니다. 기여자는 여러 차례에 걸쳐 파일의 내용을 업데이트하고 있으며, 기본적으로 사용자 정보를 제공하는 README.md 파일이 중심입니다. 이 프로젝트는 현재 사용자 기여가 전부이며 외부 기여나 수정은 없는 상태입니다.',
          codeQuality: 70,
          codeQualityMetrics: [
            { name: '가독성', score: 70, description: '코드 가독성이 매우 좋습니다' },
            { name: '유지보수성', score: 65, description: '일반적인 유지보수 난이도를 가집니다' },
            { name: '테스트 커버리지', score: 50, description: '기본적인 테스트가 작성되어 있습니다' },
            { name: '문서화', score: 60, description: '기본적인 문서화가 되어 있습니다' },
            { name: '구조화', score: 75, description: '아키텍처 설계가 우수합니다' },
          ],
          meta: {
            generatedAt: new Date().toISOString(),
            version: '1.0.0'
          }
        },
        lastUpdated: Date.now()
      };
      
      console.log(`개발 환경 - ${repo}에 대한 더미 데이터를 생성했습니다. `);
    }
    
    // 다시 확인
    const updatedProgressData = analysisProgressCache[repo];
    
    if (updatedProgressData) {
      console.log(`${repo}에 대한 분석이 ${updatedProgressData.completed ? '완료되었습니다.' : '진행 중입니다.'}`);
      console.log(`결과 데이터 존재?: ${!!updatedProgressData.result}`);
      
      if (updatedProgressData.result) {
        console.log(`결과 데이터 확인: ${Object.keys(updatedProgressData.result).join(', ')}`);
      }
      
      // 캐시 상태 확인 (디버깅용)
      logCacheState(repo);
      
      return NextResponse.json(updatedProgressData);
    }
    
    // 진행 상태 데이터가 없으면 진행 중이 아님을 응답
    return NextResponse.json(
      {
        progress: 0,
        stage: 'not_started',
        completed: false,
        message: '분석이 아직 시작되지 않았습니다.',
        lastUpdated: Date.now()
      }
    );
  } catch (error) {
    console.error('진행 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '진행 상태를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analysis/progress
 * 
 * 분석 진행 상태를 업데이트하는 API 엔드포인트입니다.
 * 쿼리 파라미터로 repo를 전달해야 하고, 요청 본문에 progress, stage 등을 포함해야 합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // URL에서 저장소 이름 가져오기
    const searchParams = request.nextUrl.searchParams;
    const repo = searchParams.get('repo');
    
    if (!repo) {
      return NextResponse.json(
        { error: '저장소 이름이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // 요청 본문 파싱
    const body = await request.json();
    const { progress, stage, completed, error, result } = body;
    
    // 진행 상태 업데이트
    analysisProgressCache[repo] = {
      progress: progress ?? 0,
      stage: stage ?? 'preparing',
      completed: completed ?? false,
      error,
      result,
      message: body.message,
      lastUpdated: Date.now()
    };
    
    console.log(`${repo}의 분석 진행 상태가 업데이트되었습니다.`);
    console.log(`진행률: ${progress}%, 단계: ${stage}, 완료: ${completed}`);
    
    if (completed) {
      console.log(`분석 결과 캐시에 저장 완료: ${repo}`);
      console.log(`캐시 상태 (completed): ${analysisProgressCache[repo].completed}`);
      console.log(`캐시 결과 유무: ${!!analysisProgressCache[repo].result}`);
      
      // 캐시 상태 로깅
      logCacheState(repo);
    }
    
    // 결과 반환
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('분석 진행 상태 업데이트 API 오류:', error);
    
    // 오류 응답
    return NextResponse.json(
      { 
        error: '진행 상태 업데이트 중 서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 