'use client'

// 동적 임포트 사용 - 서버 사이드 렌더링에서 오류 방지
let transformers: any = null;

// 클라이언트 측에서만 모듈 로드 시도
if (typeof window !== 'undefined') {
  import('@xenova/transformers').then(module => {
    transformers = module;
    // 웹 워커를 사용하지 않고 메인 스레드에서 모델 실행 (테스트용)
    transformers.env.allowLocalModels = true;
    transformers.env.useBrowserCache = true;
  }).catch(error => {
    console.error('Transformers 모듈 로드 실패:', error);
  });
}

// 더미 분류기 및 분석기 인터페이스 정의
interface CommitClassifier {
  classify(text: string): Promise<Array<{label: string, score: number}>>;
}

interface CodeAnalyzer {
  __call__(code: string): Promise<Array<Array<number>>>;
}

// 싱글톤 패턴을 사용하여 모델 초기화 관리
class ModelLoader {
  private static instance: ModelLoader;
  private commitClassifier: CommitClassifier | null = null;
  private codeAnalyzer: CodeAnalyzer | null = null;
  private isLoadingCommitModel = false;
  private isLoadingCodeModel = false;

  private constructor() {}

  public static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  // 커밋 메시지 분석 모델 로드 (RoBERTa-tiny)
  public async getCommitClassifier(): Promise<CommitClassifier> {
    if (this.commitClassifier !== null) {
      return this.commitClassifier;
    }

    if (this.isLoadingCommitModel) {
      // 모델이 로드 중인 경우 완료될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.getCommitClassifier();
    }

    // transformers 모듈이 로드되지 않은 경우 더미 분류기 반환
    if (!transformers) {
      console.warn('Transformers 모듈이 로드되지 않아 더미 분류기를 사용합니다.');
      return {
        async classify(text: string) {
          // 간단한 규칙 기반 분류
          const lowerText = text.toLowerCase();
          if (lowerText.includes('feat') || lowerText.includes('add') || lowerText.includes('new')) {
            return [{ label: '기능 추가', score: 0.9 }];
          } else if (lowerText.includes('fix') || lowerText.includes('bug')) {
            return [{ label: '버그 수정', score: 0.9 }];
          } else if (lowerText.includes('refactor') || lowerText.includes('clean')) {
            return [{ label: '리팩토링', score: 0.9 }];
          } else if (lowerText.includes('doc') || lowerText.includes('readme')) {
            return [{ label: '문서화', score: 0.9 }];
          } else if (lowerText.includes('test')) {
            return [{ label: '테스트', score: 0.9 }];
          } else if (lowerText.includes('style') || lowerText.includes('css')) {
            return [{ label: '스타일', score: 0.9 }];
          } else {
            return [{ label: '기타', score: 0.9 }];
          }
        }
      };
    }

    try {
      this.isLoadingCommitModel = true;
      // 텍스트 분류 파이프라인 초기화 (사전 훈련된 RoBERTa 모델 사용)
      this.commitClassifier = await transformers.pipeline(
        'text-classification',
        'Xenova/distilroberta-base', // 더 작은 RoBERTa-tiny와 유사한 경량 모델
        { quantized: true } // 양자화된 버전을 사용하여 크기 및 속도 최적화
      ) as CommitClassifier;
      return this.commitClassifier;
    } catch (error) {
      console.error('커밋 분석 모델 로딩 오류:', error);
      // 오류 발생 시 더미 분류기 반환
      return {
        async classify(text: string) {
          return [{ label: '기타', score: 0.9 }];
        }
      };
    } finally {
      this.isLoadingCommitModel = false;
    }
  }

  // 코드 변경 분석 모델 로드 (CodeBERT-small)
  public async getCodeAnalyzer(): Promise<CodeAnalyzer> {
    if (this.codeAnalyzer !== null) {
      return this.codeAnalyzer;
    }

    if (this.isLoadingCodeModel) {
      // 모델이 로드 중인 경우 완료될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.getCodeAnalyzer();
    }

    // transformers 모듈이 로드되지 않은 경우 더미 분석기 반환
    if (!transformers) {
      console.warn('Transformers 모듈이 로드되지 않아 더미 분석기를 사용합니다.');
      return {
        async __call__(code: string) {
          // 더미 임베딩 반환
          return [[0, 0, 0]];
        }
      };
    }

    try {
      this.isLoadingCodeModel = true;
      // 텍스트 분류 파이프라인 초기화 (사전 훈련된 CodeBERT 모델 사용)
      this.codeAnalyzer = await transformers.pipeline(
        'feature-extraction',
        'Xenova/codebert-base', // CodeBERT-small과 유사한 모델
        { quantized: true } // 양자화된 버전을 사용하여 크기 및 속도 최적화
      ) as CodeAnalyzer;
      return this.codeAnalyzer;
    } catch (error) {
      console.error('코드 분석 모델 로딩 오류:', error);
      // 오류 발생 시 더미 분석기 반환
      return {
        async __call__(code: string) {
          return [[0, 0, 0]];
        }
      };
    } finally {
      this.isLoadingCodeModel = false;
    }
  }
}

export default ModelLoader; 