import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { AnalysisResult } from '@/lib/analyzer'
import { getRepositoryDetails } from '@/lib/github'
import fs from 'fs'
import path from 'path'
// 분석 진행 캐시 직접 임포트
import { analysisProgressCache } from '@/app/api/analysis/progress/route'

// 한글 폰트 경로 지정
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', 'NanumGothic.ttf')

// 서버 측에서 분석 데이터를 가져오는 함수
async function fetchAnalysisData(accessToken: string, owner: string, repo: string): Promise<AnalysisResult> {
  try {
    const repoKey = `${owner}/${repo}`;
    console.log('PDF 생성: 캐시에서 실제 분석 결과 가져오기', { repoKey });
    
    // 캐시 키 목록 로깅
    const cachedKeys = Object.keys(analysisProgressCache);
    console.log('PDF 생성: 분석 캐시 키 목록:', cachedKeys);
    
    // 대소문자 구분 없이 키 찾기 시도 1 - 정확한 키
    let cachedData = analysisProgressCache[repoKey];
    
    // 대소문자 구분 없이 키 찾기 시도 2 - 대소문자 무시한 매칭
    if (!cachedData) {
      const matchingKey = cachedKeys.find(key => 
        key.toLowerCase() === repoKey.toLowerCase()
      );
      
      if (matchingKey) {
        console.log('PDF 생성: 대소문자 무시한 매칭 키 발견:', matchingKey);
        cachedData = analysisProgressCache[matchingKey];
      }
    }
    
    // 마지막 시도 - 부분 매칭
    if (!cachedData) {
      const similarKey = cachedKeys.find(key => 
        key.includes(owner) || key.includes(repo)
      );
      
      if (similarKey) {
        console.log('PDF 생성: 유사한 매칭 키 발견:', similarKey);
        cachedData = analysisProgressCache[similarKey];
      }
    }
    
    // 캐시에서 데이터 찾음
    if (cachedData && cachedData.completed && cachedData.result) {
      console.log('PDF 생성: 캐시에서 완료된 분석 결과 발견!', { 
        hasResult: true,
        resultKeys: Object.keys(cachedData.result)
      });
      return cachedData.result;
    }
    
    console.log('PDF 생성: 캐시에서 분석 결과를 찾을 수 없거나 분석이 완료되지 않음');
    
    // 캐시에서 데이터를 찾을 수 없는 경우, 보다 안정적인 기본 데이터 생성
    const fallbackData: AnalysisResult = {
      repositoryInfo: {
        owner,
        repo,
        url: `https://github.com/${owner}/${repo}`,
        isUserAnalysis: false,
        userLogin: '',
        aiAnalyzed: true,
        aiProjectType: '분석 데이터 없음',
      },
      techStack: [
        { name: 'Markdown', type: 'language', usage: 100, confidence: 100 },
      ],
      developerProfile: {
        totalCommits: 0,
        contributors: [],
        commitCategories: {
          '문서화': 0,
          '코드 추가': 0,
          '버그 수정': 0,
          '리팩토링': 0,
          '테스트': 0,
          '기타': 0,
        },
        activityPeriod: '데이터 없음'
      },
      domains: ['문서화'],
      characteristics: [
        { type: '문서화', score: 0, description: '분석 데이터가 없습니다' },
      ],
      developmentPattern: {
        commitFrequency: '데이터 없음',
        developmentCycle: '데이터 없음',
        teamDynamics: '데이터 없음',
        workPatterns: {
          time: '데이터 없음',
          dayOfWeek: '데이터 없음',
          mostActiveDay: '데이터 없음',
          mostActiveHour: 0
        }
      },
      keyFeatures: [
        { title: '데이터 없음', description: '분석 데이터가 없습니다', importance: 0 },
      ],
      insights: [
        { title: '분석 필요', description: '해당 저장소에 대한 분석 결과가 없습니다. 분석을 먼저 실행해 주세요.' },
      ],
      recommendations: [
        { title: '분석 실행', description: '대시보드에서 분석을 실행하여 자세한 인사이트를 얻으세요.', priority: 'high' },
      ],
      summary: `${owner}/${repo} 저장소에 대한 분석 결과가 없습니다. 대시보드에서 분석을 실행해 주세요.`,
      codeQuality: 0,
      codeQualityMetrics: [
        { name: '데이터 없음', score: 0, description: '분석 데이터가 없습니다' },
      ],
      meta: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    return fallbackData;
  } catch (error) {
    console.error('PDF 생성: 분석 데이터 조회 오류', error);
    throw new Error('분석 데이터를 가져오는 중 오류가 발생했습니다.');
  }
}

// 텍스트를 안전하게 처리하는 유틸리티 함수 수정
function safeText(text: string): string {
  if (!text) return '';
  
  // 모든 텍스트를 그대로 반환 (한글도 그대로 유지)
  return String(text);
}

/**
 * PDF 생성을 위한 API
 * GET /api/analysis/pdf/[owner]/[repo]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 2. 파라미터 확인
    const { owner, repo } = await params;
    if (!owner || !repo) {
      return NextResponse.json(
        { error: '저장소 정보가 없습니다.' },
        { status: 400 }
      );
    }

    console.log('PDF 생성 요청:', { owner, repo, user: session.user?.name });

    // 3. 분석 결과 가져오기
    const analysisResult = await getAnalysisResult(owner, repo);
    if (!analysisResult) {
      return NextResponse.json(
        { error: '분석 결과를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 4. PDF 문서 생성
    console.log('PDF 생성 시작');
    const pdfBytes = await generatePDF(analysisResult);

    // 5. PDF 응답 반환
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${owner}-${repo}-analysis.pdf"`
      }
    });
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    return NextResponse.json(
      { error: 'PDF 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 분석 결과를 가져오는 함수
 * 여러 방법으로 분석 결과를 찾아봅니다:
 * 1. 캐시에서 직접 검색
 * 2. 분석 진행 API 호출
 * 3. 개발 환경에서는 더미 데이터 제공
 */
async function getAnalysisResult(owner: string, repo: string): Promise<AnalysisResult | null> {
  const repoKey = `${owner}/${repo}`;
  console.log('분석 결과 조회:', repoKey);

  // 1. 캐시에서 직접 검색
  try {
    // 캐시 키 목록 확인
    const cachedKeys = Object.keys(analysisProgressCache);
    console.log('사용 가능한 캐시 키:', cachedKeys);

    // 정확한 키로 캐시 확인
    let cachedData = analysisProgressCache[repoKey];
    
    // 대소문자 구분 없이 매칭 시도
    if (!cachedData) {
      const matchingKey = cachedKeys.find(key => 
        key.toLowerCase() === repoKey.toLowerCase()
      );
      
      if (matchingKey) {
        console.log('대소문자 무시 매칭 키 발견:', matchingKey);
        cachedData = analysisProgressCache[matchingKey];
      }
    }
    
    // 부분 매칭 시도
    if (!cachedData) {
      const partialKey = cachedKeys.find(key => 
        key.includes(owner) || key.includes(repo)
      );
      
      if (partialKey) {
        console.log('부분 매칭 키 발견:', partialKey);
        cachedData = analysisProgressCache[partialKey];
      }
    }

    // 캐시에서 완료된 분석 결과 확인
    if (cachedData?.completed && cachedData?.result) {
      console.log('캐시에서 완료된 분석 결과 발견:', Object.keys(cachedData.result));
      return cachedData.result;
    }
  } catch (error) {
    console.error('캐시 검색 오류:', error);
  }

  // 2. 분석 진행 API 호출
  try {
    console.log('분석 진행 API 호출 시도');
    const apiUrl = `/api/analysis/progress?repo=${encodeURIComponent(repoKey)}`;
    const response = await fetch(`http://localhost:3000${apiUrl}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.completed && data.result) {
        console.log('API에서 완료된 분석 결과 발견');
        return data.result;
      }
    }
  } catch (error) {
    console.error('API 호출 오류:', error);
  }

  // 3. 개발 환경에서 더미 데이터 제공
  if (process.env.NODE_ENV === 'development') {
    console.log('개발 환경: 더미 분석 결과 생성');
    
    // 실제 분석 결과와 유사한 더미 데이터 생성
    return {
      repositoryInfo: {
        owner,
        repo,
        url: `https://github.com/${owner}/${repo}`,
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
      summary: `${owner}/${repo} 저장소는 주로 README.md 파일을 수차례 수정하여 문서화 작업을 진행하고 있습니다. 기여자는 여러 차례에 걸쳐 파일의 내용을 업데이트하고 있으며, 기본적으로 사용자 정보를 제공하는 README.md 파일이 중심입니다.`,
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
    };
  }

  console.log('분석 결과를 찾을 수 없음');
  return null;
}

/**
 * PDF 생성 함수
 */
async function generatePDF(analysisResult: AnalysisResult): Promise<Uint8Array> {
  try {
    // PDF 문서 생성
    const pdfDoc = await PDFDocument.create();
    
    // 폰트킷 등록 (한글 폰트 지원용)
    pdfDoc.registerFontkit(fontkit);
    
    // 기본 폰트 설정
    const defaultFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    
    // 첫 페이지 생성
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 사이즈
    
    // 여백 설정
    const margin = 50;
    const width = page.getWidth() - 2 * margin;
    let y = page.getHeight() - margin;
    
    // 파일 제목
    page.drawText(`Contribase: ${analysisResult.repositoryInfo.owner}/${analysisResult.repositoryInfo.repo}`, {
      x: margin,
      y,
      size: 18, 
      font: boldFont,
      color: rgb(0.1, 0.1, 0.7)
    });
    
    y -= 25;
    
    // 생성 날짜
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    page.drawText(`Generated: ${formattedDate}`, {
      x: margin,
      y,
      size: 10,
      font: defaultFont,
      color: rgb(0.4, 0.4, 0.4)
    });
    
    y -= 30;
    
    // 프로젝트 요약
    addSectionTitle(page, "Project Summary", margin, y, boldFont);
    y -= 20;
    
    // 요약 텍스트 - 한글 제거
    const summaryText = analysisResult.summary || "No summary available";
    const latinOnlySummary = latinizeText(summaryText);
    
    const summaryLines = splitToLines(latinOnlySummary, defaultFont, 10, width);
    for (const line of summaryLines) {
      page.drawText(line, {
        x: margin,
        y,
        size: 10,
        font: defaultFont
      });
      y -= 14;
    }
    
    y -= 20;
    
    // 저장소 정보
    addSectionTitle(page, "Repository Information", margin, y, boldFont);
    y -= 20;
    
    // 저장소 세부정보 테이블
    const repoInfo = [
      { label: "Owner", value: analysisResult.repositoryInfo.owner },
      { label: "Repository", value: analysisResult.repositoryInfo.repo },
      { label: "URL", value: analysisResult.repositoryInfo.url },
      { label: "Project Type", value: latinizeText(analysisResult.repositoryInfo.aiProjectType || "N/A") }
    ];
    
    for (const item of repoInfo) {
      page.drawText(`${item.label}: `, {
        x: margin,
        y,
        size: 10,
        font: boldFont
      });
      
      const labelWidth = boldFont.widthOfTextAtSize(`${item.label}: `, 10);
      
      page.drawText(item.value, {
        x: margin + labelWidth,
        y,
        size: 10,
        font: defaultFont
      });
      
      y -= 14;
    }
    
    y -= 20;
    
    // 기술 스택
    addSectionTitle(page, "Technology Stack", margin, y, boldFont);
    y -= 20;
    
    // 언어 필터링
    const languages = analysisResult.techStack.filter(tech => tech.type === 'language');
    
    if (languages.length === 0) {
      page.drawText("No language data available", {
        x: margin,
        y,
        size: 10,
        font: italicFont,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      y -= 14;
    } else {
      for (const lang of languages) {
        // 언어 이름 (한글 제거)
        const langName = latinizeText(lang.name);
        
        page.drawText(langName, {
          x: margin,
          y,
          size: 10,
          font: defaultFont
        });
        
        // 점선
        const dotLineWidth = 200;
        for (let i = 0; i < dotLineWidth; i += 3) {
          page.drawText('.', {
            x: margin + 80 + i,
            y: y + 2,
            size: 8,
            font: defaultFont,
            color: rgb(0.7, 0.7, 0.7)
          });
        }
        
        // 사용 비율
        page.drawText(`${lang.usage}%`, {
          x: margin + 320,
          y,
          size: 10,
          font: boldFont
        });
        
        y -= 14;
      }
    }
    
    y -= 20;
    
    // 기여도 분석
    addSectionTitle(page, "Contribution Analysis", margin, y, boldFont);
    y -= 20;
    
    page.drawText(`Total Commits: ${analysisResult.developerProfile.totalCommits}`, {
      x: margin,
      y,
      size: 10,
      font: boldFont
    });
    
    y -= 14;
    
    // 기여자 정보
    if (analysisResult.developerProfile.contributors.length === 0) {
      page.drawText("No contributor data available", {
        x: margin,
        y,
        size: 10,
        font: italicFont,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      y -= 14;
    } else {
      // 최대 5명의 기여자만 표시
      const topContributors = analysisResult.developerProfile.contributors
        .slice(0, 5);
      
      for (const contributor of topContributors) {
        const contributorText = `${contributor.author} - ${contributor.commits} commits (${contributor.percentage}%)`;
        
        page.drawText(contributorText, {
          x: margin,
          y,
          size: 10,
          font: defaultFont
        });
        
        y -= 14;
      }
    }
    
    y -= 14;
    
    // 커밋 카테고리
    const categories = Object.entries(analysisResult.developerProfile.commitCategories);
    
    if (categories.length === 0) {
      page.drawText("No commit category data available", {
        x: margin,
        y,
        size: 10,
        font: italicFont,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      y -= 14;
    } else {
      // 카테고리 목록
      for (const [category, count] of categories) {
        // 카테고리 이름 (한글 제거)
        const categoryName = latinizeText(category);
        const total = Object.values(analysisResult.developerProfile.commitCategories)
          .reduce((sum, val) => sum + val, 0);
        const percentage = total > 0 ? Math.round((count as number / total) * 100) : 0;
        
        page.drawText(`${categoryName}: ${count} (${percentage}%)`, {
          x: margin,
          y,
          size: 10,
          font: defaultFont
        });
        
        y -= 14;
      }
    }
    
    y -= 20;
    
    // 코드 품질
    addSectionTitle(page, "Code Quality", margin, y, boldFont);
    y -= 20;
    
    page.drawText(`Overall Score: ${analysisResult.codeQuality}/100`, {
      x: margin,
      y,
      size: 10,
      font: boldFont
    });
    
    y -= 14;
    
    // 품질 메트릭
    if (!analysisResult.codeQualityMetrics || analysisResult.codeQualityMetrics.length === 0) {
      page.drawText("No code quality data available", {
        x: margin,
        y,
        size: 10,
        font: italicFont,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      y -= 14;
    } else {
      for (const metric of analysisResult.codeQualityMetrics) {
        const metricName = latinizeText(metric.name);
        
        page.drawText(`${metricName}: ${metric.score}/100`, {
          x: margin,
          y,
          size: 10,
          font: defaultFont
        });
        
        y -= 14;
      }
    }
    
    // 푸터
    addFooter(page, formattedDate, defaultFont, margin);
    
    // PDF 생성 완료
    return await pdfDoc.save();
  } catch (error) {
    console.error('PDF 생성 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 섹션 제목 추가
 */
function addSectionTitle(page: any, title: string, x: number, y: number, font: any) {
  page.drawRectangle({
    x: x - 5,
    y: y - 5,
    width: page.getWidth() - 2 * x + 10,
    height: 24,
    color: rgb(0.94, 0.94, 0.98),
    borderColor: rgb(0.8, 0.8, 0.9),
    borderWidth: 1,
  });
  
  page.drawText(title, {
    x,
    y: y + 2,
    size: 12,
    font,
    color: rgb(0.1, 0.1, 0.7)
  });
}

/**
 * 푸터 추가
 */
function addFooter(page: any, date: string, font: any, margin: number) {
  const footerY = 30;
  
  // 로고
  page.drawText('Contribase', {
    x: margin,
    y: footerY,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.7)
  });
  
  // 날짜
  const dateText = `Generated on ${date}`;
  const dateWidth = font.widthOfTextAtSize(dateText, 8);
  
  page.drawText(dateText, {
    x: page.getWidth() - margin - dateWidth,
    y: footerY,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5)
  });
  
  // 구분선
  page.drawLine({
    start: { x: margin, y: footerY + 15 },
    end: { x: page.getWidth() - margin, y: footerY + 15 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8)
  });
  
  // 면책 조항
  const disclaimer = "FOR REFERENCE ONLY - This report is automatically generated based on the repository analysis.";
  const disclaimerWidth = font.widthOfTextAtSize(disclaimer, 8);
  
  page.drawText(disclaimer, {
    x: (page.getWidth() - disclaimerWidth) / 2,
    y: footerY - 15,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5)
  });
}

/**
 * 한글이 포함된 텍스트를 라틴 문자로만 변환 (표시 가능한 문자만 남김)
 */
function latinizeText(text: string): string {
  if (!text) return '';
  
  // 1. 한글->영어 매핑 먼저 시도
  const koreanMappings: Record<string, string> = {
    '코드 추가': 'Code Addition',
    '버그 수정': 'Bug Fix',
    '문서화': 'Documentation',
    '문서화 프로젝트': 'Documentation Project',
    '리팩토링': 'Refactoring',
    '테스트': 'Testing',
    '기타': 'Other',
    '데이터 없음': 'No Data',
    '가독성': 'Readability',
    '유지보수성': 'Maintainability',
    '테스트 커버리지': 'Test Coverage',
    '구조화': 'Architecture'
  };
  
  // 매핑된 텍스트가 있는지 확인
  for (const [kor, eng] of Object.entries(koreanMappings)) {
    if (text.includes(kor)) {
      text = text.replace(kor, eng);
    }
  }
  
  // 2. 여전히 한글이 있으면 모든 비-라틴 문자 제거
  return text.replace(/[^\x00-\x7F]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * 텍스트를 여러 줄로 나누는 함수
 */
function splitToLines(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  // 기존 함수의 버그를 수정한 버전
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    // 빈 단어는 건너뛰기
    if (!word) continue;
    
    // 라인이 비어있으면 단어 추가
    if (!currentLine) {
      currentLine = word;
      continue;
    }
    
    // 테스트 라인 생성 (현재 라인 + 새 단어)
    const testLine = `${currentLine} ${word}`;
    
    try {
      // 텍스트 너비 계산 시도
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      // 최대 너비보다 작으면 현재 라인에 추가
      if (textWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        // 아니면 새 라인 시작
        lines.push(currentLine);
        currentLine = word;
      }
    } catch (e) {
      // 오류 발생 시 (한글 등) 현재 라인을 추가하고 새 라인 시작
      console.warn('텍스트 너비 계산 오류 - 라인 분리:', e);
      if (currentLine) lines.push(currentLine);
      
      // 문제의 단어에서 라틴 문자만 추출
      const safeLine = latinizeText(word);
      currentLine = safeLine;
    }
  }
  
  // 마지막 라인 추가
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
} 