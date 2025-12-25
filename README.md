# 🎨 프롬프트 갤러리

AI 이미지 생성 프롬프트를 수집하고 관리하는 웹 애플리케이션입니다.

## 🌐 Live Demo

**https://miyaza-tech.github.io/Prompt-Gallery/**

## ✨ 주요 기능

### 데이터 관리
- **Supabase 데이터베이스**: PostgreSQL 기반 실시간 동기화
- **Supabase Storage**: 이미지 파일 업로드 (최대 10MB, 1GB 무료 스토리지)
- **실시간 동기화**: 여러 PC/브라우저에서 동시 사용 가능
- **JSON 백업/복원**: 데이터 내보내기 및 가져오기

### 프롬프트 관리
- **다중 카테고리 선택**: Nano, GPT, Midjourney, Photo, real_ch, real_bg, US_ch, US_bg, JP_ch, JP_bg, etc (11개 카테고리)
- **단일 필터**: 한 번에 하나의 카테고리만 필터링
- **_sref 필드**: 스타일 참조 코드 저장
- **이미지 지원**: URL 또는 파일 업로드 (Supabase Storage 통합)
- **클립보드 복사**: 프롬프트 및 _sref 원클릭 복사

### 보안 & 권한
- **Row Level Security (RLS)**: 읽기는 모두, 쓰기는 인증된 사용자만
- **관리자 로그인**: 간단한 비밀번호 인증 (localStorage 기반)
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
│   ├── app.js                  # 메인 로직 (CRUD, 필터링, 인증)
│   └── supabase-config.js      # Supabase 클라이언트 설정
├── data/                       # JSON 백업 저장용 (옵션)
├── assets/                     # 정적 파일 (이미지, 아이콘)
├── .github/
│   └── copilot-instructions.md # AI 코딩 가이드
├── index.html                  # 메인 HTML
├── README.md                   # 이 파일
└── .gitignore
```

## 🛠️ 기술 스택

### Frontend
- **Vanilla JavaScript**: 프레임워크 없음 (~1000 lines)
- **Tailwind CSS**: CDN (v3.x)
- **HTML5**: 시맨틱 마크업

### Backend (Supabase)
- **Database**: PostgreSQL (Prompt-Gallery 테이블)
- **Storage**: 이미지 파일 저장 (prompt-images 버킷)
- **Authentication**: 간단한 관리자 비밀번호 (localStorage 기반)
- **Realtime**: 실시간 데이터 동기화

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
     - File: 로컬 파일 업로드 (최대 10MB, Supabase Storage 자동 업로드)
   - **카테고리 선택**: 버튼 형태로 여러 개 선택 가능 (회색 배경 = 선택됨)
   - **프롬프트 입력**: 최대 1000자
   - **_sref 입력**: 스타일 참조 코드
6. **수정/삭제**: 카드 호버 → "edit" 버튼
7. **백업**: "Export" → JSON 다운로드
8. **복원**: "Import" → JSON 업로드

## 🎯 주요 특징

### 실시간 동기화
- Supabase Realtime으로 모든 변경사항 즉시 반영
- 여러 기기에서 동시 작업 가능
- 자동 새로고침 없이 실시간 업데이트

### 이미지 관리
- **Supabase Storage 통합**: 1GB 무료 스토리지
- **파일 업로드**: 최대 10MB (자동 업로드 및 URL 생성)
- **URL 지원**: 외부 이미지 링크 직접 입력
- **자동 삭제**: 프롬프트 삭제 시 Storage 이미지도 함께 삭제
- 약 1,000개 이미지 저장 가능 (1MB 기준)

### 보안 시스템
- **Row Level Security (RLS)**: 
  - SELECT: 누구나 읽기 가능
  - INSERT/UPDATE/DELETE: 인증된 사용자만
- **관리자 인증**: localStorage 기반 간단한 비밀번호 로그인
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

## � Supabase 설정

### 1. 프로젝트 생성
1. https://supabase.com 에서 프로젝트 생성
2. Settings → API에서 URL과 anon key 확인

### 2. 데이터베이스 테이블
```sql
CREATE TABLE "Prompt-Gallery" (
  id BIGSERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,
  category TEXT,
  sref TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Row Level Security (RLS)
```sql
ALTER TABLE "Prompt-Gallery" ENABLE ROW LEVEL SECURITY;

-- 읽기는 모두 가능
CREATE POLICY "Anyone can read prompts"
ON "Prompt-Gallery" FOR SELECT
USING (true);

-- 쓰기는 인증된 사용자만
CREATE POLICY "Only authenticated users can insert"
ON "Prompt-Gallery" FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update"
ON "Prompt-Gallery" FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete"
ON "Prompt-Gallery" FOR DELETE
USING (auth.uid() IS NOT NULL);
```

### 4. Storage 설정
1. Storage → New bucket → `prompt-images` (Public)
2. Policies 설정:
```sql
-- 읽기는 모두 가능
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'prompt-images');

-- 업로드는 인증된 사용자만
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prompt-images' AND auth.uid() IS NOT NULL);

-- 삭제는 인증된 사용자만
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'prompt-images' AND auth.uid() IS NOT NULL);
```

### 5. Supabase Authentication 설정
1. Authentication → Settings → Email Auth 활성화
2. 관리자 계정 생성 (Email/Password)
3. `index.html`에서 이메일 기본값 수정 (선택사항):
```html
<input type="email" id="loginEmail" value="your@email.com">
```

**참고**: Supabase Auth를 사용하여 RLS 정책이 자동으로 작동합니다. 인증된 사용자만 데이터를 추가/수정/삭제할 수 있습니다.

## 📦 배포

### GitHub Pages (현재 배포됨)
```bash
# main 브랜치에 커밋
git add .
git commit -m "Update"
git push origin main

# gh-pages 브랜치에 배포
git checkout gh-pages
git merge main
git push origin gh-pages
git checkout main
```

### 환경 변수
`js/supabase-config.js`에 Supabase 자격 증명 입력:
```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

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

### 이미지가 안 보여요
- Supabase Storage 버킷이 Public인지 확인
- Storage Policies가 올바르게 설정되었는지 확인

### 로그인이 안 돼요
- `js/app.js`에서 올바른 관리자 비밀번호를 확인하세요
- localStorage가 활성화되어 있는지 확인 (시크릿 모드에서는 작동 안 함)
- 브라우저 콘솔에서 에러 메시지 확인

### 추가/수정/삭제가 안 돼요
- 로그인했는지 확인
- RLS 정책이 올바르게 설정되었는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

## 📄 라이선스

MIT License
