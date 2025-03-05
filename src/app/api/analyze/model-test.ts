import {
  loadRobertaModel,
  loadCodeBERTModel,
  analyzeCommitMessages,
  analyzeCodeChanges,
  getModelStatus
} from '@/lib/modelUtils';

/**
 * AI 모델 테스트 함수
 * 이 함수는 모델 로딩 및 기본 분석 기능을 테스트합니다.
 */
export async function testModels() {
  console.log('AI 모델 테스트를 시작합니다...');
  
  // 모델 상태 확인
  const modelStatus = getModelStatus();
  console.log('현재 모델 상태:', modelStatus);
  
  // Roberta 모델 테스트
  console.log('Roberta 모델 로딩 테스트...');
  try {
    const roberta = await loadRobertaModel();
    if (roberta) {
      console.log('Roberta 모델 로딩 성공');
      
      // 테스트 커밋 메시지로 개발자 프로필 분석
      const testCommitMessages = [
        "feat: Add user authentication feature",
        "fix: Resolve login page issues",
        "docs: Update README with new API documentation",
        "refactor: Improve code structure for better maintainability",
        "test: Add unit tests for user service"
      ];
      
      console.log('커밋 메시지 분석 테스트 중...');
      const developerProfile = await analyzeCommitMessages(testCommitMessages);
      console.log('개발자 프로필 분석 결과:', developerProfile);
    } else {
      console.log('Roberta 모델을 로드할 수 없습니다.');
    }
  } catch (error) {
    console.error('Roberta 모델 테스트 오류:', error);
  }
  
  // CodeBERT 모델 테스트
  console.log('CodeBERT 모델 로딩 테스트...');
  try {
    const codebert = await loadCodeBERTModel();
    if (codebert) {
      console.log('CodeBERT 모델 로딩 성공');
      
      // 테스트 코드 변경으로 개발 패턴 분석
      const testCodeChanges = [
        "function hello() { console.log('Hello, world!'); }",
        "class User { constructor(name) { this.name = name; } }",
        "const sum = (a, b) => a + b;"
      ];
      
      console.log('코드 변경 분석 테스트 중...');
      const developmentPattern = await analyzeCodeChanges(testCodeChanges);
      console.log('개발 패턴 분석 결과:', developmentPattern);
    } else {
      console.log('CodeBERT 모델을 로드할 수 없습니다.');
    }
  } catch (error) {
    console.error('CodeBERT 모델 테스트 오류:', error);
  }
  
  console.log('AI 모델 테스트를 완료했습니다.');
}

// 이 모듈이 직접 실행될 경우 테스트 실행
if (typeof window === 'undefined' && require.main === module) {
  testModels().then(() => {
    console.log('테스트 완료');
    process.exit(0);
  }).catch(error => {
    console.error('테스트 실패:', error);
    process.exit(1);
  });
} 