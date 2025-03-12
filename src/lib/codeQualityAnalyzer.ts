// GPT 기반 코드 품질 분석 유틸리티

import { AnalysisResult } from "@/modules/analyzer";
import { callOpenAI, createCodeQualityPrompt } from "./ai/openAiUtils";

/**
 * AI 기반 코드 품질 분석을 수행하는 함수
 */
export async function analyzeCodeQuality(analysis: AnalysisResult): Promise<{
  readability: number;
  maintainability: number;
  testCoverage: number;
  documentation: number;
  architecture: number;
}> {
  try {
    console.log('[AI 분석] 코드 품질 분석 시작');

    // 분석에 필요한 데이터 준비
    const analysisData = {
      techStack: analysis.techStack || [],
      characteristics: analysis.characteristics || [],
      keyFeatures: analysis.keyFeatures || [],
      commitCategories: analysis.developerProfile?.commitCategories || {},
      insights: analysis.insights || [],
      summary: analysis.summary || ''
    };

    // 커밋 카테고리 분석
    const commitStats = {
      total: Object.values(analysisData.commitCategories).reduce((a, b) => a + b, 0),
      refactoring: analysisData.commitCategories['리팩토링'] || 0,
      test: analysisData.commitCategories['테스트'] || 0,
      docs: analysisData.commitCategories['문서화'] || 0,
      feature: analysisData.commitCategories['기능'] || 0
    };

    // 기술 스택 분석
    const techAnalysis = {
      hasTypescript: analysisData.techStack.some(t => t.name.toLowerCase().includes('typescript')),
      hasTests: analysisData.techStack.some(t => 
        t.name.toLowerCase().includes('jest') || 
        t.name.toLowerCase().includes('test') ||
        t.name.toLowerCase().includes('cypress')
      ),
      hasLinter: analysisData.techStack.some(t => 
        t.name.toLowerCase().includes('eslint') || 
        t.name.toLowerCase().includes('prettier')
      ),
      hasDocs: analysisData.techStack.some(t => 
        t.name.toLowerCase().includes('doc') || 
        t.name.toLowerCase().includes('swagger')
      )
    };

    // 통합 AI 유틸리티를 사용하여 프롬프트 생성 및 호출
    const aiPrompt = createCodeQualityPrompt({
      techStack: analysisData.techStack,
      commitStats,
      techAnalysis,
      keyFeatures: analysisData.keyFeatures,
      insights: analysisData.insights,
      summary: analysisData.summary
    });

    // GPT-4 Mini API 호출
    const response = await callOpenAI(aiPrompt);
    console.log('[AI 분석] 코드 품질 분석 결과:', response);

    // 응답 형식 변환 (한글 키 → 영문 키)
    const responseMetrics = {
      readability: response['가독성']?.['점수'] || 0,
      maintainability: response['유지보수성']?.['점수'] || 0,
      testCoverage: response['테스트 커버리지']?.['점수'] || 0,
      documentation: response['문서화']?.['점수'] || 0,
      architecture: response['아키텍처']?.['점수'] || 0
    };

    // 기본 점수 계산 (실제 데이터 기반)
    const baseScores = {
      readability: techAnalysis.hasLinter ? 65 : 45,
      maintainability: techAnalysis.hasTypescript ? 60 : 40,
      testCoverage: techAnalysis.hasTests ? 55 : 35,
      documentation: techAnalysis.hasDocs ? 60 : 40,
      architecture: 50
    };

    // AI 분석 결과와 기본 점수를 결합
    const finalScores = {
      readability: Math.round((baseScores.readability + responseMetrics.readability) / 2),
      maintainability: Math.round((baseScores.maintainability + responseMetrics.maintainability) / 2),
      testCoverage: Math.round((baseScores.testCoverage + responseMetrics.testCoverage) / 2),
      documentation: Math.round((baseScores.documentation + responseMetrics.documentation) / 2),
      architecture: Math.round((baseScores.architecture + responseMetrics.architecture) / 2)
    };

    return finalScores;
  } catch (error) {
    console.error('[AI 분석] 코드 품질 분석 중 오류 발생:', error);
    
    // 오류 발생 시 기본값 반환
    return {
      readability: 50,
      maintainability: 45,
      testCoverage: 40,
      documentation: 45,
      architecture: 50
    };
  }
}

/**
 * 코드 품질 총점 계산
 */
export function calculateOverallQuality(metrics: {
  readability: number;
  maintainability: number;
  testCoverage: number;
  documentation: number;
  architecture: number;
}): number {
  const weights = {
    readability: 0.2,
    maintainability: 0.3,
    testCoverage: 0.2,
    documentation: 0.15,
    architecture: 0.15
  };
  
  const weightedScore = 
    metrics.readability * weights.readability +
    metrics.maintainability * weights.maintainability +
    metrics.testCoverage * weights.testCoverage +
    metrics.documentation * weights.documentation +
    metrics.architecture * weights.architecture;
  
  return Math.round(weightedScore);
} 