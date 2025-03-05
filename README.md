![License](https://img.shields.io/badge/License-MIT-black)&nbsp;
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)&nbsp;
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)&nbsp;
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)&nbsp;

![Contribase@1x](https://github.com/user-attachments/assets/ad20f071-c4f8-4405-a2d5-7471d6036c5e)

GitHub 활동 기반 포트폴리오 생성기

## 소개

Contribase는 개발자의 GitHub 활동을 분석하여 포트폴리오를 자동으로 생성해주는 웹 애플리케이션입니다. 규칙 기반 분석 시스템을 활용하여 커밋 메시지와 코드 변경 내역을 분석함으로써, 개발자의 실제 기여도와 기술적 성장을 객관적으로 문서화합니다.

개발자들은 다양한 프로젝트에 참여하며 값진 경험을 쌓지만, 이를 포트폴리오로 정리하는 과정에서 어려움을 겪습니다. Contribase는 이 과정을 자동화하여 개발자들이 자신의 경험과 역량을 보다 정확하고 전문적으로 표현할 수 있도록 돕습니다.

## 주요 기능

- **도메인 분석**: 프론트엔드/백엔드/인프라 등 분류 및 기술 스택 자동 감지
- **기여도 분석**: 커밋 기반 기여도 계산 및 코드 변경 패턴 분석
- **기능 분류**: 구현 기능 자동 분류 및 프로젝트별 주요 작업 요약
- **PDF 포트폴리오**: 분석 결과를 바탕으로 전문적인 PDF 포트폴리오 자동 생성
- **대시보드**: 실시간 분석 결과와 인터랙티브 차트 제공
- **GitHub 인증**: GitHub OAuth를 통한 안전한 인증 시스템

## 향후 개발 계획

현재 Contribase는 규칙 기반 분석 시스템을 사용하여 개발자의 활동을 분석합니다. 향후 버전에서는 다음과 같은 인공지능 기술을 도입할 예정입니다:

- **AI 기반 커밋 분석**: 머신러닝 모델을 활용한 고도화된 커밋 메시지 분석
- **코드 품질 평가**: 인공지능 기반 코드 품질 평가 및 개선 제안
- **개발자 프로필 생성**: 자연어 처리 기술을 활용한 맞춤형 개발자 프로필 자동 생성
- **기술 트렌드 분석**: 최신 기술 트렌드와 개발자 역량을 연계한 분석

이러한 개선을 통해 더욱 정확하고 인사이트 있는 분석 결과를 제공할 계획입니다.

## 설치 방법

1. 저장소 클론:
   ```bash
   git clone https://github.com/yourusername/contribase.git
   cd contribase
   ```

2. 환경 변수 설정:
   ```bash
   # .env.local 파일 생성
   
   # GitHub OAuth
   GITHUB_ID=your_github_client_id
   GITHUB_SECRET=your_github_client_secret

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_key_here
   
   # 분석 설정
   ANALYSIS_MODE=rule-based
   ```

3. 의존성 설치:
   ```bash
   npm install
   ```

4. 개발 서버 실행:
   ```bash
   npm run dev
   ```

5. 빌드:
   ```bash
   npm run build
   ```

## 기술 스택

### 프론트엔드
- **Next.js 15**: React 기반 프레임워크
- **TailwindCSS**: 스타일링
- **pdf-lib**: PDF 생성
- **Chart.js**: 데이터 시각화

### 백엔드
- **Next.js API Routes**: 서버리스 API
- **NextAuth.js**: 인증 시스템
- **GitHub OAuth**: 사용자 인증

### 인프라
- **Vercel**: 배포 및 호스팅
- **Edge Functions**: 서버리스 함수

## 시스템 요구사항

- Node.js 18.x 이상
- npm 9.x 이상

## 개발 환경

```
node -v  # v18.x 이상
npm -v   # v9.x 이상
```

## 프로젝트 구조

```
/
├── public/               # 정적 파일
├── src/
│   ├── app/              # Next.js 앱 라우터
│   │   ├── api/          # API 엔드포인트
│   │   │   ├── auth/     # 인증 관련 API
│   │   │   └── analysis/ # 분석 관련 API (PDF 생성 포함)
│   │   ├── auth/         # 인증 관련 페이지
│   │   │   ├── github/   # GitHub 로그인
│   │   │   ├── error/    # 인증 오류
│   │   │   └── login-required/ # 로그인 필요 안내
│   │   └── dashboard/    # 대시보드 및 분석 페이지
│   ├── components/       # 재사용 가능한 컴포넌트
│   ├── lib/              # 유틸리티 함수 및 API 
│   └── styles/           # 글로벌 스타일
├── package.json          # 의존성 및 스크립트
└── README.md             # 프로젝트 문서
```

## 주요 기능 사용법

### 1. GitHub 로그인
- 홈페이지에서 "로그인" 버튼을 클릭하여 GitHub 계정으로 로그인합니다.
- 로그인 후 자동으로 대시보드로 이동합니다.

### 2. 저장소 분석
- 대시보드에서 분석하고자 하는 저장소를 선택합니다.
- "분석하기" 버튼을 클릭하여 저장소 분석을 시작합니다.
- 분석이 완료되면 결과가 차트와 함께 표시됩니다.

### 3. PDF 다운로드
- 분석 결과 페이지 하단의 "PDF로 다운로드" 버튼을 클릭합니다.
- 생성된 PDF에는 저장소 정보, 기술 스택 분석, 기여도 분석, 코드 품질 평가가 포함됩니다.

## 버전 관리

커밋 메시지에 따라 자동으로 버전이 업데이트됩니다:

1. **일반 업데이트** (z 증가)
   - 일반적인 커밋
   - 예: `fix: 버그 수정`

2. **마이너 업데이트** (y 증가)
   - 커밋 메시지에 `#minor` 포함
   - 예: `feat: 새로운 기능 추가 #minor`

3. **메이저 업데이트** (x 증가)
   - 커밋 메시지에 `#major` 포함
   - 예: `feat: 주요 기능 변경 #major`

4. **버전 업데이트 제외**
   - 커밋 메시지에 `#noversion` 포함

## 기여자
<a href = "https://github.com/Hobby2025/Contribase/graphs/contributors">
  <img src = "https://contrib.rocks/image?repo=Hobby2025/Contribase" height="40"/>
</a>

## 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
