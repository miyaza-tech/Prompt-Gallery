# 🎨 프롬프트 갤러리 (순수 HTML/CSS/JS)

AI 이미지 생성 프롬프트를 수집하고 관리하는 웹 애플리케이션입니다.

## ✨ 주요 기능

- **프롬프트 추가**: URL 또는 파일 업로드로 이미지와 함께 프롬프트 저장
- **카테고리 관리**: 나노, GPT, 미드저니, 영상, 실사, 캐주얼, 재패니메이션
- **필터링**: 카테고리별로 항목 필터링
- **클립보드 복사**: 원클릭으로 프롬프트 복사 (2초간 피드백)
- **localStorage 자동 저장**: 브라우저 재시작 후에도 데이터 유지
- **JSON 가져오기/내보내기**: 백업 및 복원
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

## 🚀 실행 방법

### 방법 1: 직접 열기
`index.html` 파일을 더블클릭하여 브라우저에서 바로 실행

### 방법 2: 로컬 서버 (권장)
```bash
# Python 3
python -m http.server 8000

# 브라우저에서 http://localhost:8000 접속
```

## 📁 파일 구조

```
prompt-gallery-static/
├── index.html    # 메인 HTML (Tailwind CDN 포함)
├── app.js        # 모든 JavaScript 로직
└── README.md     # 이 파일
```

## 🛠️ 기술 스택

- **순수 HTML5**: 별도의 빌드 과정 불필요
- **Tailwind CSS**: CDN으로 로드
- **Vanilla JavaScript**: 프레임워크 없음
- **localStorage**: 데이터 영속성

## 📝 사용 방법

1. **새 항목 추가**: "새 항목" 버튼 클릭
2. **이미지 선택**: 
   - URL 입력: 이미지 링크 붙여넣기
   - 파일 업로드: 로컬 이미지 선택 (최대 5MB)
3. **카테고리 선택**: 드롭다운에서 선택
4. **프롬프트 입력**: 최대 1000자
5. **필터링**: 상단 카테고리 버튼 클릭
6. **복사**: 카드의 "프롬프트 복사" 버튼
7. **백업**: "내보내기" → JSON 다운로드
8. **복원**: "가져오기" → JSON 업로드 (병합/교체 선택)

## 🎯 특징

### localStorage 자동 동기화
- 항목 추가/삭제 시 자동 저장
- 브라우저 재시작 후에도 데이터 유지

### 이미지 업로드
- URL: 외부 이미지 링크 지원
- 파일: Base64 인코딩하여 저장 (5MB 제한)
- 이미지 로드 실패 시 플레이스홀더 표시

### 유효성 검사
- URL 형식 확인
- 파일 크기 제한 (5MB)
- 프롬프트 길이 제한 (1000자)
- 실시간 글자 수 표시

### JSON 백업/복원
- 날짜별 파일명: `prompt-gallery-backup-2025-10-17.json`
- 가져오기 시 병합 또는 교체 선택 가능

## 💡 브라우저 호환성

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📦 배포

### GitHub Pages
1. GitHub에 업로드
2. Settings → Pages → Source: main branch
3. 자동 배포됨

### 기타 호스팅
- Netlify: 드래그 앤 드롭
- Vercel: GitHub 연동
- Cloudflare Pages: GitHub 연동

## 🔧 커스터마이징

### 카테고리 추가
`index.html`과 `app.js`에서 카테고리 배열 수정:

```javascript
// app.js에는 별도 배열 없음
// index.html의 select와 filterBar에서 직접 수정
```

### 색상 변경
Tailwind 클래스 수정 (예: `bg-purple-600` → `bg-blue-600`)

### 저장 용량 확장
localStorage는 브라우저당 약 5-10MB 제한
더 큰 용량 필요 시 IndexedDB 사용 고려

## 🐛 알려진 제한사항

- localStorage 용량 제한 (브라우저당 5-10MB)
- 대용량 이미지는 Base64 인코딩 시 용량 증가
- 오프라인 모드 없음 (URL 이미지는 인터넷 필요)

## 📄 라이선스

MIT License
