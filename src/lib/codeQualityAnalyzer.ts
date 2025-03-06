// GPT 기반 코드 품질 분석 유틸리티

import { AnalysisResult } from "@/types/analysis";

/**
 * 프로젝트 특성에 따라 코드 품질 메트릭을 생성하는 함수
 * 실제 프로젝트 데이터와 특성을 기반으로 코드 품질 점수를 계산
 */
export function analyzeCodeQuality(analysis: AnalysisResult): {
  readability: number;
  maintainability: number;
  testCoverage: number;
  documentation: number;
  architecture: number;
} {
  console.log('코드 품질 분석 시작 - 입력 데이터 확인:', JSON.stringify({
    hasCharacteristics: Boolean(analysis.characteristics?.length),
    hasTechStack: Boolean(analysis.techStack?.length),
    hasKeyFeatures: Boolean(analysis.keyFeatures?.length)
  }));

  // 프로젝트 특성 및 기술 스택 분석
  const characteristics = analysis.characteristics || [];
  const techStack = analysis.techStack || [];
  const keyFeatures = analysis.keyFeatures || [];
  
  // 기술 스택이 비어있거나 요구 사항을 충족하지 않으면 기본값 반환
  if (!techStack.length) {
    console.log('기술 스택이 비어있어 기본 점수 반환');
    return {
      readability: 65,
      maintainability: 60,
      testCoverage: 50,
      documentation: 55,
      architecture: 60
    };
  }
  
  // 기술 스택 기반 평가
  const hasTestingFrameworks = techStack.some(tech => 
    tech.name.toLowerCase().includes('test') || 
    tech.name.toLowerCase().includes('jest') || 
    tech.name.toLowerCase().includes('mocha') ||
    tech.name.toLowerCase().includes('junit')
  );
  
  const hasCICD = techStack.some(tech => 
    tech.name.toLowerCase().includes('jenkins') || 
    tech.name.toLowerCase().includes('travis') || 
    tech.name.toLowerCase().includes('github action') ||
    tech.name.toLowerCase().includes('gitlab ci')
  );
  
  const hasTypedLanguages = techStack.some(tech => 
    tech.name.toLowerCase().includes('typescript') || 
    tech.name.toLowerCase().includes('java') || 
    tech.name.toLowerCase().includes('c#') ||
    tech.name.toLowerCase().includes('kotlin')
  );
  
  const hasDocTools = techStack.some(tech => 
    tech.name.toLowerCase().includes('doc') || 
    tech.name.toLowerCase().includes('jsdoc') || 
    tech.name.toLowerCase().includes('swagger') ||
    tech.name.toLowerCase().includes('javadoc')
  );
  
  // 특성 기반 평가
  const codeQualityCharacteristic = characteristics.find(c => 
    c.type === '코드 품질' || 
    c.description.includes('코드 품질') || 
    c.description.includes('리팩토링')
  );
  
  const isEnterpriseProject = characteristics.some(c => 
    c.description.includes('엔터프라이즈') || 
    c.description.includes('기업용')
  );
  
  const isLongTermProject = characteristics.some(c => 
    c.description.includes('장기') || 
    c.description.includes('유지보수')
  );
  
  // 프로젝트 성격에 따른 기본 점수 계산
  const baseScores = {
    readability: 55, // 기본 가독성 점수 (65에서 55로 낮춤)
    maintainability: 50, // 기본 유지보수성 점수 (60에서 50으로 낮춤)
    testCoverage: hasTestingFrameworks ? 55 : 35, // 테스트 프레임워크 유무에 따른 기본값 (45/65에서 35/55로 낮춤)
    documentation: hasDocTools ? 60 : 45, // 문서화 도구 유무에 따른 기본값 (55/70에서 45/60으로 낮춤)
    architecture: 50 // 기본 구조화 점수 (60에서 50으로 낮춤)
  };
  
  // 프로젝트 특성에 따른 점수 조정
  let qualityScores = { ...baseScores };
  
  // 코드 품질 특성이 있으면 가산점
  if (codeQualityCharacteristic) {
    const bonus = Math.min(15, codeQualityCharacteristic.score * 1.5);
    qualityScores.readability += bonus;
    qualityScores.maintainability += bonus;
    qualityScores.architecture += bonus;
  }
  
  // 타입 언어 사용 시 가독성/유지보수성 향상
  if (hasTypedLanguages) {
    qualityScores.readability += 12;
    qualityScores.maintainability += 15;
  }
  
  // CI/CD 사용 시 테스트 커버리지 가산점
  if (hasCICD) {
    qualityScores.testCoverage += 12;
    qualityScores.maintainability += 5;
  }
  
  // 장기 프로젝트는 문서화와 아키텍처에 더 신경썼을 가능성 높음
  if (isLongTermProject) {
    qualityScores.documentation += 10;
    qualityScores.architecture += 8;
  }
  
  // 엔터프라이즈 프로젝트는 전체적으로 품질 요구사항이 높음
  if (isEnterpriseProject) {
    qualityScores.readability += 8;
    qualityScores.maintainability += 10;
    qualityScores.testCoverage += 15;
    qualityScores.documentation += 12;
    qualityScores.architecture += 15;
  }
  
  // 키 기능 수에 따른 아키텍처 복잡도 반영 (부정적 영향 강화)
  if (keyFeatures.length > 5) {
    qualityScores.architecture -= Math.min(15, (keyFeatures.length - 5) * 3);
    qualityScores.maintainability -= Math.min(12, (keyFeatures.length - 5) * 2);
  }
  
  // 기술 스택 다양성에 따른 복잡도 반영
  if (techStack.length > 10) {
    qualityScores.maintainability -= Math.min(10, (techStack.length - 10) * 1.5);
    qualityScores.documentation -= Math.min(8, (techStack.length - 10));
  }
  
  // 최종 점수 범위 조정 (0-100 사이)
  const finalScores = {
    readability: Math.max(0, Math.min(100, Math.round(qualityScores.readability))),
    maintainability: Math.max(0, Math.min(100, Math.round(qualityScores.maintainability))),
    testCoverage: Math.max(0, Math.min(100, Math.round(qualityScores.testCoverage))),
    documentation: Math.max(0, Math.min(100, Math.round(qualityScores.documentation))),
    architecture: Math.max(0, Math.min(100, Math.round(qualityScores.architecture)))
  };
  
  return finalScores;
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
  // 각 메트릭의 가중치 설정
  const weights = {
    readability: 0.2,
    maintainability: 0.3,
    testCoverage: 0.2,
    documentation: 0.15,
    architecture: 0.15
  };
  
  // 가중 평균 계산
  const weightedScore = 
    metrics.readability * weights.readability +
    metrics.maintainability * weights.maintainability +
    metrics.testCoverage * weights.testCoverage +
    metrics.documentation * weights.documentation +
    metrics.architecture * weights.architecture;
  
  return Math.round(weightedScore);
} 