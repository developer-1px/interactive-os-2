# Viewer Dependency Graph — Plan

> PRD: docs/superpowers/prds/2026-03-20-viewer-dependency-graph-prd.md

## Tasks

### Task 1: `/api/fs/imports` 엔드포인트 (`vite-plugin-fs.ts`)

1. import문 정규식 파서 작성 — `import ... from '...'`, `import('...')`, `export ... from '...'` 패턴
2. 상대경로 → 절대경로 resolve (`.ts`, `.tsx`, `/index.ts` 확장자 자동 탐색)
3. 레이어 판정 함수 — `src/interactive-os/{layer}/` → layer, `src/pages/` → "pages", 나머지 → "root"
4. importedBy 역방향 lookup — `src/` 전체 스캔 + 메모리 캐시
5. `/api/fs/imports?path=...` 엔드포인트 등록

### Task 2: Viewer mermaid 그래프 패널 (`PageViewer.tsx`)

1. `fetchImports(path)` 함수 — `/api/fs/imports` 호출
2. `generateMermaid(data)` 함수 — 응답 JSON → mermaid graph LR 문법 (subgraph by layer, current node 강조)
3. 코드 블록 위에 `<MermaidBlock>` 조건부 렌더링 (소스 파일일 때만)
4. 노드 클릭 → `selectFile()` 연결 (mermaid SVG 내 노드에 click 이벤트)

### Task 3: CSS 스타일링

1. 그래프 영역 스타일 (배경, 패딩, 코드 블록과의 구분)

## 의존관계

Task 1 → Task 2 (엔드포인트가 있어야 클라이언트 연동 가능)
Task 3은 Task 2와 병행 가능

## 실행 방식

Task 1, 2를 순차 구현 (긴밀 의존). TDD 적용.
