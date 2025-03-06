/**
 * 애플리케이션 설정 및 환경 변수를 중앙화하는 파일입니다.
 * 환경 변수에 직접 접근하는 대신 이 파일의 상수를 사용하세요.
 */

// 애플리케이션 버전
export const APP_VERSION = process.env.APP_VERSION || '1.0.5';

// API 엔드포인트 설정
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
export const GITHUB_API_URL = 'https://api.github.com';

// 모델 관련 설정
export const MODEL_CONFIG = {
  ANALYSIS_MODE: 'ai',
  MAX_BATCH_SIZE: parseInt(process.env.MAX_BATCH_SIZE || '50', 10),
  TIMEOUT_MS: parseInt(process.env.MODEL_TIMEOUT_MS || '30000', 10)
};

// 분석 기능 관련 설정
export const ANALYSIS_CONFIG = {
  // 분석 기능 활성화 여부 (개발 중인 기능에 대한 플래그)
  ENABLE_REPOSITORY_ANALYSIS: process.env.ENABLE_REPOSITORY_ANALYSIS !== 'false',
  ENABLE_DEVELOPER_ANALYSIS: process.env.ENABLE_DEVELOPER_ANALYSIS !== 'false',
  ENABLE_TEAM_ANALYSIS: process.env.ENABLE_TEAM_ANALYSIS === 'true',
  
  // 분석 제한 설정
  MAX_COMMITS_TO_ANALYZE: parseInt(process.env.MAX_COMMITS_TO_ANALYZE || '1000', 10),
  MAX_FILES_TO_ANALYZE: parseInt(process.env.MAX_FILES_TO_ANALYZE || '100', 10),
  
  // 캐싱 관련 설정
  CACHE_DURATION_MS: parseInt(process.env.ANALYSIS_CACHE_DURATION_MS || '3600000', 10) // 기본 1시간
};

// 인증 관련 설정
export const AUTH_CONFIG = {
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'default-secret-do-not-use-in-production',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000'
};

// 개발 환경 확인
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_TEST = process.env.NODE_ENV === 'test'; 