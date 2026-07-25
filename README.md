# 🎨 프롬프트 갤러리

AI 이미지 생성 프롬프트를 수집하고 관리하는 웹 애플리케이션입니다.

## 🌐 Live Demo

**https://miyaza-tech.github.io/Prompt-Gallery/**

## ✨ 주요 기능

### 데이터 관리
- **Cloud Firestore**: NoSQL 기반 실시간 동기화
- **Firebase Storage**: 이미지 파일 업로드 (최대 10MB, 5GB 무료 스토리지)
- **실시간 동기화**: 여러 PC/브라우저에서 동시 사용 가능
- **JSON 백업/복원**: 데이터 내보내기 및 가져오기

### 프롬프트 관리
- **다중 카테고리 선택**: Nano, GPT, Midjourney, Photo, real_ch, real_bg, US_ch, US_bg, JP_ch, JP_bg, etc (11개 카테고리)
- **단일 필터**: 한 번에 하나의 카테고리만 필터링
- **_sref 필드**: 스타일 참조 코드 저장
- **이미지 지원**: URL 또는 파일 업로드 (Firebase Storage 통합)
- **클립보드 복사**: 프롬프트 및 _sref 원클릭 복사

### 보안 & 권한
- **보안 규칙**: 인증된 사용자만 읽기/쓰기 가능
- **Firebase Authentication**: 이메일/비밀번호 인증
- **로그인 필수**: 로그인해야만 프롬프트 보기 가능
- **자동 이미지 관리**: 프롬프트 삭제 시 Storage 이미지도 자동 삭제

### UI/UX
- **모달 팝업 폼**: Add/Edit 폼이 중앙 팝업으로 표시
- **4열 그리드 레이아웃**: 카드 형태의 갤러리 뷰
- **카테고리 배지**: 각 카드에 선택된 카테고리 표시
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

## 🚀 시작하기

### 온라인 사용 (권장)
**https://miyaza-tech.github.io/Prompt-Gallery/**

- **로그인 필수**: 관리자 비밀번호로 로그인해야 프롬프트 확인 가능
- **편집 권한**: 로그인 후 추가/수정/삭제 가능

### 로컬 개발
```bash
# Python 3
python -m http.server 8000

# 브라우저에서 http://localhost:8000 접속
```

## 📁 파일 구조

```
prompt-gallery/
├── css/
│   └── style.css               # 커스텀 스타일 (모달 애니메이션, 스크롤바)
├── js/
│   ├── app.js                  # 메인 로직 (CRUD, 필터링, 인증) - classic script
│   └── firebase-config.js      # Firebase 초기화 - ES module, window.fb 노출
├── data/                       # JSON 백업 저장용 (옵션)
├── assets/                     # 정적 파일 (이미지, 아이콘)
├── .github/
│   ├── workflows/deploy.yml    # GitHub Pages 자동 배포
│   └── copilot-instructions.md # AI 코딩 가이드
├── firestore.rules             # Firestore 보안 규칙 (콘솔에 붙여넣기)
├── storage.rules               # Storage 보안 규칙 (콘솔에 붙여넣기)
├── index.html                  # 메인 HTML
├── README.md                   # 이 파일
└── .gitignore
```

## 🛠️ 기술 스택

### Frontend
- **Vanilla JavaScript**: 프레임워크 없음 (~1000 lines)
- **Tailwind CSS**: CDN (v3.x)
- **HTML5**: 시맨틱 마크업

### Backend (Firebase)
- **Firebase JS SDK**: v12.16.0 modular, gstatic CDN에서 ES module로 로드
- **Cloud Firestore**: `prompts` 컬렉션
- **Storage**: 이미지 파일 저장 (`prompt-images/` 폴더)
- **Authentication**: 이메일/비밀번호
- **Realtime**: `onSnapshot` 리스너로 실시간 동기화

## 📝 사용 방법

### 관리자 (로그인 필요)
1. **로그인**: 우측 상단 "Login" 버튼
   - 관리자 비밀번호 입력 (기본값: 코드에 설정됨)
   - localStorage에 세션 저장
2. **프롬프트 보기**: 로그인 후 모든 프롬프트 확인
3. **필터링**: 상단 카테고리 버튼으로 단일 필터 (한 번에 하나만 선택 가능)
4. **복사**: 카드 호버 → "_sref" 또는 "prompt" 버튼 클릭
5. **새 항목 추가**: "New Item" 버튼 클릭
   - **이미지 선택**:
     - URL: 외부 이미지 링크 입력
     - File: 로컬 파일 업로드 (최대 10MB, Firebase Storage 자동 업로드)
   - **카테고리 선택**: 버튼 형태로 여러 개 선택 가능 (회색 배경 = 선택됨)
   - **프롬프트 입력**: 최대 1000자
   - **_sref 입력**: 스타일 참조 코드
6. **수정/삭제**: 카드 호버 → "edit" 버튼
7. **백업**: "Export" → JSON 다운로드
8. **복원**: "Import" → JSON 업로드

## 🎯 주요 특징

### 실시간 동기화
- Firestore `onSnapshot`으로 모든 변경사항 즉시 반영
- 여러 기기에서 동시 작업 가능
- 자동 새로고침 없이 실시간 업데이트

### 이미지 관리
- **Firebase Storage 통합**: 5GB 무료 스토리지 (Blaze 요금제 필요)
- **파일 업로드**: 최대 10MB (자동 업로드 및 URL 생성)
- **URL 지원**: 외부 이미지 링크 직접 입력
- **자동 삭제**: 프롬프트 삭제 시 Storage 이미지도 함께 삭제 (직접 업로드한 파일만)
- 약 5,000개 이미지 저장 가능 (1MB 기준)

### 보안 시스템
- **Firestore / Storage 보안 규칙**:
  - 읽기/쓰기/삭제: 인증된 사용자만 가능
- **Firebase Authentication**: 이메일/비밀번호 기반 인증
- **로그인 필수**: 로그인하지 않으면 데이터 표시 안 됨
- **UI 권한 제어**: 로그인 상태에 따라 버튼 표시/숨김

### 다중 카테고리
- 버튼 UI로 여러 카테고리 동시 선택
- 각 프롬프트에 여러 카테고리 할당 가능
- 카테고리 배지로 시각적 표시

### 유효성 검사
- 파일 크기 제한 (10MB)
- 프롬프트 길이 제한 (1000자)
- 실시간 글자 수 카운터
- 필수 입력 검증

## 💡 브라우저 호환성

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔥 Firebase 설정

### 1. 프로젝트 생성
1. https://console.firebase.google.com 에서 프로젝트 생성
2. 프로젝트 설정 → 일반 → 내 앱 → 웹 앱(`</>`) 추가
3. 표시되는 `firebaseConfig` 값을 `js/firebase-config.js`의 `firebaseConfig`에 붙여넣기

> `apiKey`는 비밀값이 아닙니다. 실제 접근 제어는 아래 보안 규칙으로 합니다.

### 2. Authentication
1. Authentication → Sign-in method → **이메일/비밀번호** 사용 설정
2. Users → 사용자 추가로 관리자 계정 생성

> 앱에는 회원가입 화면이 없습니다. 계정은 콘솔에서 직접 만듭니다.

### 3. Firestore Database
1. Firestore Database → 데이터베이스 만들기 (**프로덕션 모드**)
2. 컬렉션 이름은 `prompts` (변경하려면 `js/firebase-config.js`의 `COLLECTION` 수정)
3. Rules 탭에 [`firestore.rules`](firestore.rules) 내용 붙여넣기 후 게시

문서 구조 (컬렉션이므로 미리 만들 필요 없음):

| 필드 | 타입 | 설명 |
|---|---|---|
| `prompt` | string | 프롬프트 본문 (필수) |
| `category` | string | 쉼표+공백으로 구분된 카테고리 (`US_ch, sketch`) |
| `sref` | string | 스타일 레퍼런스 코드 |
| `image` | string | 이미지 URL |
| `created_at` | timestamp | 정렬 기준 (내림차순) |

> 문서 ID는 Firestore가 자동 생성하는 **문자열**입니다.

### 4. Storage
1. Storage → 시작하기 → 기본 버킷 생성
2. Rules 탭에 [`storage.rules`](storage.rules) 내용 붙여넣기 후 게시
3. 업로드 경로는 `prompt-images/` 폴더

> ⚠️ **Blaze(종량제) 요금제 필수.** 2026년 2월 3일부로 Cloud Storage for Firebase는 결제 계정 연결이 필요합니다. Spark(무료) 요금제에서는 버킷 접근이 402/403으로 거부됩니다. 무료 사용량(5GB 저장, 월 100GB 전송)은 그대로라 소규모 사용 시 청구액은 0원이지만, 카드 등록은 반드시 필요합니다.
> 참고: [Cloud Storage 정책 변경 FAQ](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)

### 5. 승인된 도메인
Authentication → Settings → 승인된 도메인에 `miyaza-tech.github.io` 추가 (로그인 허용)

## 📦 배포

### GitHub Pages (현재 배포됨)
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)이 `main` push를 감지해 자동 배포합니다.

```bash
git add .
git commit -m "Update"
git push origin main   # 이후 Actions가 자동 배포
```

> 저장소 Settings → Pages → Source가 **GitHub Actions**로 설정되어 있어야 합니다.
> "Deploy from a branch"로 되어 있다면 `gh-pages` 브랜치에 `main`을 머지해 push해야 합니다.

### 환경 변수
`js/firebase-config.js`의 `firebaseConfig`에 Firebase 콘솔 값 입력:
```javascript
const firebaseConfig = {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
};
```

> 이 값들은 비밀값이 아니라 공개되어도 되는 식별자입니다. 실제 접근 제어는 보안 규칙이 담당합니다.

## 🔧 커스터마이징

### 카테고리 추가
`index.html`에서 세 곳 수정:
1. Add Form의 카테고리 버튼
2. Edit Form의 카테고리 버튼
3. 상단 필터 바 버튼

### 파일 크기 제한 변경
`js/app.js`에서 수정:
```javascript
if (file.size > 10 * 1024 * 1024) { // 10MB
```

## 💡 브라우저 호환성

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 트러블슈팅

### 이미지 업로드가 402/403으로 실패해요
- Firebase 프로젝트가 **Blaze 요금제**인지 확인 (Spark 요금제는 Storage 사용 불가)
- Storage 규칙이 [`storage.rules`](storage.rules) 내용으로 게시되었는지 확인

### 로그인이 안 돼요
- Authentication → Sign-in method에서 이메일/비밀번호가 사용 설정되었는지 확인
- Authentication → Users에 해당 계정이 있는지 확인
- Authentication → Settings → 승인된 도메인에 배포 도메인이 등록되었는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 추가/수정/삭제가 안 돼요
- 로그인했는지 확인
- Firestore 규칙이 [`firestore.rules`](firestore.rules) 내용으로 게시되었는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 목록이 비어 있어요
- Firestore 정렬은 `created_at` 기준입니다. **이 필드가 없는 문서는 목록에 나타나지 않습니다.**
- 콘솔에서 직접 문서를 만들었다면 `created_at`(timestamp)을 반드시 넣으세요.

### 페이지는 뜨는데 아무 동작도 안 해요
- 콘솔에 `Firebase failed to initialize`가 있는지 확인 → `js/firebase-config.js` 설정값 확인
- CSP 위반 에러가 있다면 `index.html`의 `Content-Security-Policy`에 해당 도메인 추가

## 📄 라이선스

MIT License
