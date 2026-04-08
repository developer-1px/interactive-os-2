# FilePanel 대규모 파일 가상화

## 목표
대규모 코드 파일(1000줄+)을 가상 스크롤로 렌더하여 DOM 부하를 줄인다.

## 현재 문제
- `CodeBlock`이 Shiki `codeToHtml`로 전체 파일을 한 번에 HTML 변환 → DOM에 전부 삽입
- 수천 줄 파일에서 초기 렌더 + Shiki 하이라이팅 모두 느림

## 구현 계획

### 1. `VirtualCodeBlock` — ui/ 완성품 신규
- `codeToTokens`(Shiki)로 줄별 토큰 배열 획득 (한 번만)
- `useVirtualScroll`로 보이는 줄만 렌더
- monospace → `estimatedItemHeight` 고정 (line-height 기반)
- 줄 번호, 토큰 클릭 하이라이트, highlightLines tone 지원

### 2. `FilePreview` 분기
- 줄 수 임계값(500줄) 초과 시 VirtualCodeBlock으로 위임
- 이하 시 기존 CodeBlock 유지

### 파일 목록
- 신규: `src/interactive-os/ui/VirtualCodeBlock.tsx`
- 수정: `src/interactive-os/ui/FilePreview.tsx`
