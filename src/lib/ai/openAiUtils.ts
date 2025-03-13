import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
let openai: OpenAI | null = null;

// 서버 사이드에서만 초기화하도록 수정
if (typeof window === 'undefined') {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OpenAI API 키가 설정되지 않았습니다. 환경 변수를 확인하세요.');
  } else {
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
}

/**
 * OpenAI 모델 타입 정의
 */
export type OpenAIModel = 'gpt-4o-mini' | 'gpt-4-turbo-preview' | 'gpt-4o';

/**
 * 프롬프트 메시지 타입 정의
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * AI 응답 처리를 위한 인터페이스
 */
export interface AIRequestOptions {
  model: OpenAIModel;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
}

/**
 * OpenAI API 호출을 위한 통합 함수
 * 모든 OpenAI API 호출은 이 함수를 통해 이루어져야 함
 * @param options - AI 요청 옵션
 * @returns 처리된 응답 (JSON 또는 텍스트)
 */
export async function callOpenAI<T = any>(options: AIRequestOptions): Promise<T> {
  try {
    console.log(`[AI 분석] ${options.model} 호출 시작`);
    
    // OpenAI 클라이언트가 초기화되지 않은 경우 처리
    if (!openai) {
      console.error('[AI 분석] OpenAI 클라이언트가 초기화되지 않았습니다.');
      throw new Error('OpenAI 클라이언트가 초기화되지 않았습니다.');
    }
    
    const completion = await openai.chat.completions.create({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature || 0.2,
      max_tokens: options.max_tokens,
      response_format: options.response_format
    });
    
    const content = completion.choices[0]?.message?.content || '';
    console.log(`[AI 분석] ${options.model} 응답 수신 완료`);
    
    // JSON 응답인 경우 파싱
    if (options.response_format?.type === 'json_object') {
      try {
        // 응답이 비어있는 경우 처리
        if (!content || content.trim() === '') {
          console.error('[AI 분석] AI 응답이 비어 있습니다.');
          throw new Error('AI 응답이 비어 있습니다.');
        }
        
        const jsonContent = JSON.parse(content) as T;
        
        // developmentPattern 필드 확인 및 로깅
        if (jsonContent && typeof jsonContent === 'object' && 'developmentPattern' in jsonContent) {
          console.log('[AI 분석] 개발 패턴 데이터:', JSON.stringify((jsonContent as any).developmentPattern, null, 2));
        }
        
        return jsonContent;
      } catch (error) {
        console.error('[AI 분석] JSON 파싱 실패:', error);
        console.error('[AI 분석] 원본 응답:', content);
        throw new Error('AI 응답을 JSON으로 파싱할 수 없습니다.');
      }
    }
    
    // 텍스트 응답인 경우 그대로 반환
    return content as unknown as T;
  } catch (error) {
    console.error(`[AI 분석] ${options.model} 호출 실패:`, error);
    
    // 기본 응답 생성
    if (options.response_format?.type === 'json_object') {
      console.log('[AI 분석] 오류 발생으로 기본 JSON 응답 반환');
      return createFallbackResponse() as unknown as T;
    }
    
    // 텍스트 응답인 경우 오류 메시지 반환
    return '분석 중 오류가 발생했습니다. 다시 시도해 주세요.' as unknown as T;
  }
}

/**
 * API 오류 시 기본 응답 생성
 */
function createFallbackResponse() {
  return {
    "aiProjectType": "웹 애플리케이션",
    "가독성": {
      "점수": 50,
      "근거": {
        "코드 스타일 도구 사용 여부": "확인 불가",
        "타입스크립트 사용 여부": "확인 불가",
        "리팩토링 커밋 비율": "확인 불가"
      }
    },
    "유지보수성": {
      "점수": 50,
      "근거": {
        "기술 스택의 현대성": "확인 불가",
        "리팩토링 활동 빈도": "확인 불가",
        "코드 구조화 수준": "확인 불가"
      }
    },
    "테스트 커버리지": {
      "점수": 50,
      "근거": {
        "테스트 코드 유무": "확인 불가",
        "테스트 관련 커밋 비율": "확인 불가",
        "테스트 프레임워크 사용": "확인 불가"
      }
    },
    "문서화": {
      "점수": 50,
      "근거": {
        "문서화 수준": "확인 불가",
        "주석 사용 정도": "확인 불가",
        "문서 관련 커밋 비율": "확인 불가"
      }
    },
    "아키텍처": {
      "점수": 50,
      "근거": {
        "코드 구조": "확인 불가",
        "디자인 패턴 사용": "확인 불가",
        "모듈화 수준": "확인 불가"
      }
    }
  };
}

/**
 * 코드 품질 분석을 위한 AI 요청 생성
 * @param analysisData - 분석에 필요한 데이터
 * @returns AI 요청 옵션
 */
export function createCodeQualityPrompt(analysisData: {
  techStack: any[];
  commitStats: {
    total: number;
    refactoring: number;
    test: number;
    docs: number;
    feature: number;
  };
  techAnalysis: {
    hasTypescript: boolean;
    hasTests: boolean;
    hasLinter: boolean;
    hasDocs: boolean;
  };
  keyFeatures: any[];
  insights: any[];
  summary: string;
}): AIRequestOptions {
  return {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 소프트웨어 품질 분석 전문가입니다. 
다음 기준으로 0-100 사이의 점수를 매기되, 실제 데이터를 기반으로 엄격하게 평가해주세요.

평가 기준:
1. 가독성 (Readability):
   - 코드 스타일 도구 사용 여부
   - 타입스크립트 사용 여부
   - 리팩토링 커밋 비율

2. 유지보수성 (Maintainability):
   - 기술 스택의 현대성
   - 리팩토링 활동 빈도
   - 코드 구조화 수준

3. 테스트 커버리지 (Test Coverage):
   - 테스트 도구 존재 여부
   - 테스트 관련 커밋 수
   - 테스트 코드 비율

4. 문서화 (Documentation):
   - 문서화 도구 사용 여부
   - 문서화 관련 커밋 수
   - API 문서 존재 여부

5. 아키텍처 (Architecture):
   - 프로젝트 구조의 명확성
   - 기술 선택의 적절성
   - 확장성 고려 여부

점수 기준:
- 0-49: 즉시 개선 필요
- 50-69: 개선 필요
- 70-100: 양호

다음 정확한 JSON 형식으로 응답해주세요:
{
  "가독성": {
    "점수": 70,
    "근거": {
      "코드 스타일 도구 사용 여부": "true/false",
      "타입스크립트 사용 여부": "true/false",
      "리팩토링 커밋 비율": "비율 정보"
    }
  },
  "유지보수성": {
    "점수": 65,
    "근거": {
      "기술 스택의 현대성": "평가",
      "리팩토링 활동 빈도": "빈도 정보",
      "코드 구조화 수준": "평가"
    }
  },
  "테스트 커버리지": {
    "점수": 50,
    "근거": {
      "테스트 도구 존재 여부": "true/false",
      "테스트 관련 커밋 수": "수량",
      "테스트 코드 비율": "비율 정보"
    }
  },
  "문서화": {
    "점수": 60,
    "근거": {
      "문서화 도구 사용 여부": "true/false",
      "문서화 관련 커밋 수": "수량",
      "API 문서 존재 여부": "평가"
    }
  },
  "아키텍처": {
    "점수": 75,
    "근거": {
      "프로젝트 구조의 명확성": "평가",
      "기술 선택의 적절성": "평가",
      "확장성 고려 여부": "평가"
    }
  }
}`
      },
      {
        role: 'user',
        content: `다음 프로젝트 정보를 기반으로 코드 품질을 분석해주세요:

# 프로젝트 요약
${analysisData.summary}

# 기술 스택 분석
- TypeScript 사용: ${analysisData.techAnalysis.hasTypescript}
- 테스트 도구: ${analysisData.techAnalysis.hasTests}
- 린터/포맷터: ${analysisData.techAnalysis.hasLinter}
- 문서화 도구: ${analysisData.techAnalysis.hasDocs}

# 커밋 통계
- 전체 커밋 수: ${analysisData.commitStats.total}
- 리팩토링 커밋: ${analysisData.commitStats.refactoring}
- 테스트 커밋: ${analysisData.commitStats.test}
- 문서화 커밋: ${analysisData.commitStats.docs}
- 기능 개발 커밋: ${analysisData.commitStats.feature}

# 기술 스택 상세
${JSON.stringify(analysisData.techStack, null, 2)}

# 주요 기능
${JSON.stringify(analysisData.keyFeatures, null, 2)}

# 프로젝트 통찰
${JSON.stringify(analysisData.insights, null, 2)}

각 메트릭에 대해 실제 데이터를 기반으로 한 점수와 그 근거를 JSON 형식으로 응답해주세요.`
      }
    ],
    response_format: { type: 'json_object' }
  };
}

/**
 * 저장소 분석을 위한 AI 요청 생성
 * @param repositoryData - 저장소 분석 데이터
 * @param options - 추가 옵션
 * @returns AI 요청 옵션
 */
export function createRepositoryAnalysisPrompt(
  repositoryData: {
    repositoryContent: string;
    commitMessages: string[];
    fileTypes: Record<string, number>;
    languages: Record<string, number>;
    description?: string;
    topics?: string[];
  },
  options: {
    personalAnalysis: boolean;
    userLogin?: string;
    userEmail?: string;
  }
): AIRequestOptions {
  // 사용자 중심 분석 또는 저장소 전체 분석인지 표시
  const userFocus = options.personalAnalysis && options.userLogin 
    ? `주 분석 대상은 GitHub 사용자 '${options.userLogin}'(이메일: '${options.userEmail || '불명'}')의 기여입니다.` 
    : '저장소 전체에 대한 분석입니다.';
    
  return {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 GitHub 저장소를 심층 분석하는 AI 전문가입니다. 개발자에게 유용한 인사이트를 제공해야 합니다.
        
반드시 아래 정확한 JSON 구조로 응답해주세요:
{
  "projectType": "프로젝트 유형(예: 웹 애플리케이션, 라이브러리, CLI 도구 등)",
  "summary": "프로젝트에 대한 전체적인 요약 (3-4문장)",
  "techStack": [
    {"name": "기술명", "type": "language|framework|library|tool", "usage": 90, "confidence": 95}
  ],
  "characteristics": [
    {"type": "혁신성", "score": 75, "description": "특성에 대한 설명"},
    {"type": "협업", "score": 80, "description": "특성에 대한 설명"}
  ],
  "keyFeatures": [
    {"title": "주요 기능 1", "description": "설명", "importance": 9}
  ],
  "domains": ["관련 도메인/산업 1", "관련 도메인/산업 2"],
  "developmentPattern": {
    "commitFrequency": "주 3-4회",
    "developmentCycle": "짧은 사이클",
    "teamDynamics": "소규모 팀",
    "workPatterns": {
      "time": "주로 오후",
      "dayOfWeek": "주중",
      "mostActiveDay": "화요일",
      "mostActiveHour": 14
    }
  },
  "insights": [
    {"title": "통찰 제목", "description": "통찰 내용"}
  ],
  "recommendations": [
    {"title": "추천 제목", "description": "추천 내용", "priority": "high|medium|low"}
  ]
}

모든 필드를 포함한 완전한 JSON을 반환해야 하며, 형식을 절대 변경하지 마세요.`
      },
      {
        role: 'user',
        content: `다음 GitHub 저장소를 분석해주세요:

${userFocus}

# 저장소 컨텐츠
${repositoryData.repositoryContent}

# 커밋 메시지 (최근 10개)
${repositoryData.commitMessages.join('\n')}

# 파일 확장자 분포
${Object.entries(repositoryData.fileTypes).map(([ext, count]) => `${ext}: ${count}개`).join('\n')}

# 언어 사용 비율
${Object.entries(repositoryData.languages).map(([lang, percent]) => `${lang}: ${percent}%`).join('\n')}

자세한 분석과 인사이트를 제공해주세요.`
      }
    ],
    response_format: { type: 'json_object' }
  };
}

/**
 * 프로젝트 정의를 위한 AI 요청 생성
 */
export function createProjectDefinitionPrompt(
  commits: { 
    message: string; 
    date: string; 
    files?: string[]; 
  }[],
  repoInfo: {
    description: string;
    topics: string[];
    dependencies: Record<string, string>;
  },
  fileExtensions: Map<string, number>
): AIRequestOptions {
  return {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 코드 저장소를 분석하고 프로젝트의 목적, 타입, 기능 등을 요약하는 전문가입니다. 
제공된 데이터를 바탕으로 프로젝트에 대한 간결하고 정확한 정의를 생성해주세요.
JSON 형식으로 응답해야 합니다: { "name": "프로젝트명", "type": "프로젝트 타입", "description": "설명", "features": ["기능1", "기능2", ...], "technologies": ["기술1", "기술2", ...], "suggestion": "개선 제안" }`
      },
      {
        role: 'user',
        content: `다음 GitHub 저장소 정보를 분석하여 프로젝트 정의를 생성해주세요:
        
# 저장소 정보
${repoInfo.description ? `설명: ${repoInfo.description}\n` : ''}
${repoInfo.topics.length > 0 ? `주제: ${repoInfo.topics.join(', ')}\n` : ''}

# 의존성 패키지 (상위 20개)
${Object.entries(repoInfo.dependencies)
  .slice(0, 20)
  .map(([name, version]) => `${name}: ${version}`)
  .join('\n')}

# 파일 확장자 분포
${Array.from(fileExtensions.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([ext, count]) => `${ext}: ${count}개 파일`)
  .join('\n')}

# 최근 커밋 메시지 (일부)
${commits.slice(0, 10).map(c => `- ${c.message.split('\n')[0]}`).join('\n')}

이 데이터를 기반으로 프로젝트 정의를 분석해주세요. 특히:
1. 이 프로젝트가 무엇인지 (웹 앱, 라이브러리, 도구 등)
2. 주요 기능이 무엇인지
3. 사용된 주요 기술이 무엇인지
4. 한국어로 작성된 간결한 프로젝트 설명문

이 모든 것을 위에서 설명한 JSON 형식으로 반환해주세요.`
      }
    ],
    response_format: { type: 'json_object' }
  };
} 