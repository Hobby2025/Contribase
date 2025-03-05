import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { AnalysisResult } from '@/lib/analyzer'
import { getRepositoryDetails } from '@/lib/github'

// 서버 측에서 분석 데이터를 가져오는 함수
async function fetchAnalysisData(accessToken: string, owner: string, repo: string): Promise<AnalysisResult> {
  try {
    // 프로덕션 환경에서는 DB나 캐시에서 분석 데이터를 가져올 수 있습니다
    // 여기서는 간단한 예제 데이터를 반환합니다
    return {
      techStack: [
        { name: 'JavaScript', percentage: 45 },
        { name: 'TypeScript', percentage: 30 },
        { name: 'HTML', percentage: 15 },
        { name: 'CSS', percentage: 10 },
      ],
      contributions: [
        { category: 'Feature', percentage: 40 },
        { category: 'Bug Fix', percentage: 20 },
        { category: 'Refactoring', percentage: 15 },
        { category: 'Documentation', percentage: 15 },
        { category: 'Testing', percentage: 10 },
      ],
      keyFeatures: [
        { title: 'User Authentication', description: 'Implemented user authentication using GitHub OAuth', importance: 5 },
        { title: 'Repository Analysis', description: 'Code analysis and statistics for repositories', importance: 5 },
        { title: 'PDF Download', description: 'Download analysis results as PDF', importance: 4 },
      ],
      projectCharacteristics: [
        { type: 'Web Application', score: 4.5, description: 'Provides web-based interface' },
        { type: 'Data Analysis', score: 4.2, description: 'Repository data visualization and analysis' },
      ],
      summary: `This project is a web application that analyzes GitHub repositories to visualize developer contribution patterns and project characteristics. It is primarily developed using TypeScript and Next.js, providing a user-friendly interface.`,
      codeQuality: 4.2,
      recommendations: [
        { title: 'Add Tests', description: 'Need to strengthen unit tests and integration tests', priority: 'high' },
        { title: 'Performance Optimization', description: 'Need to improve performance when analyzing large repositories', priority: 'medium' },
      ],
      developerInsights: [
        { title: 'Web Development Expertise', description: 'Shows strength in frontend technologies' },
        { title: 'Data Visualization Experience', description: 'Has experience in data visualization and analysis' },
      ],
      developerProfile: {
        workStyle: '협업형',
        strengths: ['프론트엔드 개발', '데이터 시각화', 'UI/UX 디자인'],
        growthAreas: ['테스트 자동화', '성능 최적화'],
        collaborationPattern: '적극적인 코드 리뷰어',
        communicationStyle: '명확하고 간결한 커뮤니케이션',
      },
      developmentPattern: {
        peakProductivityTime: '오후 2시-6시',
        commitFrequency: '주 3-4회',
        codeReviewStyle: '세부적이고 구체적인 피드백',
        iterationSpeed: '중간 속도',
        focusAreas: ['UI 컴포넌트', '데이터 처리', '인증 시스템'],
      },
      codeQualityMetrics: {
        readability: 75,
        maintainability: 80,
        testCoverage: 60,
        documentation: 70,
        architecture: 85
      },
    };
  } catch (error) {
    console.error('Analysis data fetch error:', error);
    throw new Error('Error while fetching analysis data.');
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    // 인증 세션 확인
    const session = await getServerSession(authOptions)
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized request' },
        { status: 401 }
      )
    }

    // Next.js 15에서는 params가 Promise이므로 await로 처리해야 합니다
    const { owner, repo } = await params;
    
    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Repository information is missing' },
        { status: 400 }
      )
    }

    // 저장소 분석 결과 가져오기
    const analysisResult = await fetchAnalysisData(
      session.accessToken,
      owner,
      repo
    )

    // PDF 문서 생성
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 사이즈
    
    // 폰트 추가 (StandardFonts는 한글을 지원하지 않음)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // 여백 설정
    const margin = 50

    let y = page.getHeight() - margin
    const width = page.getWidth() - 2 * margin
    
    // 헤더 추가 (영어로 작성)
    page.drawText(`${owner}/${repo} Analysis Report`, {
      x: margin,
      y,
      size: 24,
      font: boldFont,
      color: rgb(0.31, 0.27, 0.9) // primary 색상
    })
    
    y -= 30
    
    const today = new Date()
    const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
    
    page.drawText(`Generated: ${formattedDate}`, {
      x: margin,
      y,
      size: 12,
      font,
      color: rgb(0.3, 0.3, 0.3)
    })
    
    y -= 40
    
    // 요약 섹션 (영어로 작성)
    page.drawText('Project Summary', {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.31, 0.27, 0.9)
    })
    
    y -= 25
    
    const summaryLines = splitTextToLines(analysisResult.summary, font, 12, width)
    for (const line of summaryLines) {
      page.drawText(line, {
        x: margin,
        y,
        size: 12,
        font,
        color: rgb(0.2, 0.2, 0.2)
      })
      y -= 18
    }
    
    y -= 30
    
    // 기술 스택 섹션 (영어로 작성)
    page.drawText('Technology Stack Analysis', {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.31, 0.27, 0.9)
    })
    
    y -= 30
    
    // 기술 스택 바 차트 그리기
    const barHeight = 25
    const barGap = 10
    const barWidth = width
    
    for (const tech of analysisResult.techStack) {
      // 라벨
      page.drawText(`${tech.name} (${tech.percentage}%)`, {
        x: margin,
        y,
        size: 12,
        font,
        color: rgb(0.2, 0.2, 0.2)
      })
      
      y -= 20
      
      // 배경 바
      page.drawRectangle({
        x: margin,
        y: y - barHeight,
        width: barWidth,
        height: barHeight,
        color: rgb(0.9, 0.9, 0.9)
      })
      
      // 데이터 바
      page.drawRectangle({
        x: margin,
        y: y - barHeight,
        width: barWidth * (tech.percentage / 100),
        height: barHeight,
        color: rgb(0.31, 0.47, 0.9)
      })
      
      y -= barHeight + barGap
    }
    
    y -= 30
    
    // 기여도 분석 섹션 (영어로 작성)
    page.drawText('Contribution Analysis', {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.31, 0.27, 0.9)
    })
    
    y -= 30
    
    // 파이 차트를 대체하여 테이블 형식으로 변경
    const tableStartY = y;
    const tableWidth = width;
    const rowHeight = 30;
    const colWidth = tableWidth / 2;
    
    // 테이블 헤더
    page.drawRectangle({
      x: margin,
      y: tableStartY - rowHeight,
      width: tableWidth,
      height: rowHeight,
      color: rgb(0.9, 0.9, 0.95)
    });
    
    page.drawText('Category', {
      x: margin + 20,
      y: tableStartY - rowHeight/2 - 5,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    
    page.drawText('Percentage', {
      x: margin + colWidth + 20,
      y: tableStartY - rowHeight/2 - 5,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    
    // 테이블 내용
    let currentY = tableStartY - rowHeight;
    
    for (let i = 0; i < analysisResult.contributions.length; i++) {
      const contrib = analysisResult.contributions[i];
      const rowY = currentY - rowHeight;
      
      // 행 배경 (홀수/짝수 행 구분)
      page.drawRectangle({
        x: margin,
        y: rowY,
        width: tableWidth,
        height: rowHeight,
        color: i % 2 === 0 ? rgb(0.95, 0.95, 0.95) : rgb(1, 1, 1)
      });
      
      // 첫 번째 열 - 카테고리
      page.drawText(contrib.category, {
        x: margin + 20,
        y: rowY + rowHeight/2 - 5,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2)
      });
      
      // 두 번째 열 - 퍼센트
      page.drawText(`${contrib.percentage}%`, {
        x: margin + colWidth + 20,
        y: rowY + rowHeight/2 - 5,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2)
      });
      
      // 열 구분선
      page.drawLine({
        start: { x: margin + colWidth, y: rowY },
        end: { x: margin + colWidth, y: rowY + rowHeight },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      });
      
      currentY = rowY;
    }
    
    // 테이블 외곽선
    page.drawLine({
      start: { x: margin, y: tableStartY },
      end: { x: margin + tableWidth, y: tableStartY },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6)
    });
    
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: margin + tableWidth, y: currentY },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6)
    });
    
    page.drawLine({
      start: { x: margin, y: tableStartY },
      end: { x: margin, y: currentY },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6)
    });
    
    page.drawLine({
      start: { x: margin + tableWidth, y: tableStartY },
      end: { x: margin + tableWidth, y: currentY },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6)
    });
    
    y = currentY - 40;
    
    // 코드 품질 점수 (영어로 작성)
    page.drawText('Code Quality Assessment', {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.31, 0.27, 0.9)
    })
    
    y -= 30
    
    const score = analysisResult.codeQuality
    const scoreText = `${score.toFixed(1)} / 5.0`
    
    page.drawText(scoreText, {
      x: margin + 50,
      y,
      size: 24,
      font: boldFont,
      color: rgb(0.31, 0.6, 0.4)
    })
    
    // 하단에 참고용 텍스트 추가
    const disclaimerText = "FOR REFERENCE ONLY - This report is automatically generated and should be used for reference purposes only."
    const textWidth = font.widthOfTextAtSize(disclaimerText, 10)
    
    page.drawText(disclaimerText, {
      x: (page.getWidth() - textWidth) / 2,
      y: 30, // 페이지 하단에서 30 픽셀 위에 배치
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5)
    })
    
    // 페이지 하단에 라인 추가
    page.drawLine({
      start: { x: margin, y: 50 },
      end: { x: page.getWidth() - margin, y: 50 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    })
    
    // PDF 바이트 배열로 직렬화
    const pdfBytes = await pdfDoc.save()
    
    // PDF 응답 반환
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${owner}-${repo}-analysis.pdf"`
      }
    })
    
  } catch (error) {
    console.error('PDF generation API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while generating PDF.' },
      { status: 500 }
    )
  }
}

// 텍스트를 여러 줄로 분할하는 헬퍼 함수
function splitTextToLines(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const textWidth = font.widthOfTextAtSize(testLine, fontSize)
    
    if (textWidth <= maxWidth) {
      currentLine = testLine
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  return lines
} 