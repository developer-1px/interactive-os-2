# Viewer Parts Extraction (Phase 1) — PRD

> Discussion: 뷰어 내부 부품(FileIcon, CodeBlock, Breadcrumb)을 `interactive-os/ui/`로 완성품 수준 분리. leaf 컴포넌트 3개 먼저. 기존 뷰어 동작 유지.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | CodeBlock이 `src/pages/viewer/`에 있고 `PageViewer.module.css`에 스타일 커플링 | 다른 페이지(Agent 뷰어, CMS 등)에서 코드 표시가 필요하다 | `interactive-os/ui/CodeBlock`에서 import하여 독립적으로 사용 가능 | |
| M2 | Breadcrumb이 뷰어 전용 경로에 있다 | 다른 페이지에서 경로 네비게이션이 필요하다 | `interactive-os/ui/Breadcrumb`에서 import하여 독립적으로 사용 가능 | |
| M3 | FileIcon이 뷰어 전용 경로에 있다 | 다른 페이지에서 파일 타입 아이콘이 필요하다 | `interactive-os/ui/FileIcon`에서 import하여 독립적으로 사용 가능 | |
| M4 | 3개 부품이 모두 `PageViewer.module.css`를 import — 900줄+ CSS에서 자기 스타일만 사용 | 부품을 분리하면 | 각 부품이 자체 CSS module만 가짐. PageViewer.module.css에서 해당 스타일 제거 | |

완성도: 🟢

## ② 산출물

> 리팩터링: 파일 이동 + CSS 분리. 새 기능 없음.

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `interactive-os/ui/FileIcon.tsx` | `src/pages/viewer/FileIcon.tsx` 이동. 자체 `FileIcon.module.css` | `FileIcon.tsx::FileIcon` |
| `interactive-os/ui/FileIcon.module.css` | `PageViewer.module.css`에서 `.vw-icon*` 스타일 추출 | `FileIcon.module.css` |
| `interactive-os/ui/CodeBlock.tsx` | `src/pages/viewer/CodeBlock.tsx` 이동. 자체 `CodeBlock.module.css` | `CodeBlock.tsx::CodeBlock` |
| `interactive-os/ui/CodeBlock.module.css` | `PageViewer.module.css`에서 `.code-block*` + `:global(.code-token*)` + `:global(.code-line--edited)` 스타일 추출 | `CodeBlock.module.css` |
| `interactive-os/ui/Breadcrumb.tsx` | `src/pages/viewer/Breadcrumb.tsx` 이동. 자체 `Breadcrumb.module.css` | `Breadcrumb.tsx::Breadcrumb` |
| `interactive-os/ui/Breadcrumb.module.css` | `PageViewer.module.css`에서 `.vw-breadcrumb*` 스타일 추출 | `Breadcrumb.module.css` |
| `PageViewer.module.css` 수정 | 이동된 스타일 블록 제거 | `PageViewer.module.css` |
| import 경로 갱신 | PageViewer.tsx, FileViewerModal.tsx, MarkdownViewer.tsx, QuickOpen.tsx 등에서 import 경로를 `../../interactive-os/ui/` 또는 `../interactive-os/ui/`로 변경 | `PageViewer.tsx, FileViewerModal.tsx, MarkdownViewer.tsx, QuickOpen.tsx` |

완성도: 🟢

## ③ 인터페이스

> 리팩터링이므로 동작 변경 없음. 각 부품의 props/API는 그대로 유지.

| 부품 | 현재 API | 분리 후 API | 변화 | 역PRD |
|------|---------|-----------|------|-------|
| FileIcon | `{ name: string; type: string; expanded?: boolean }` | 동일 | 없음 | |
| CodeBlock | `{ code: string; filename: string; highlightLines?: Set<number> }` | 동일 | 없음 | |
| Breadcrumb | `{ path: string; root: string }` | 동일 | 없음 | |

인터페이스 체크리스트: N/A — 리팩터링, 인터랙션 변경 없음.

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1: CodeBlock의 `:global(.code-token*)` 스타일 | 현재 `PageViewer.module.css`에서 `:global()` 사용 | Shiki가 생성하는 HTML의 class는 CSS module이 해시하면 안 됨 → `:global()` 필수 | CodeBlock.module.css로 이동 후에도 `:global()` 유지 | 토큰 하이라이팅 동작 유지 | |
| E2: FileIcon 색상 토큰 `--file-ts`, `--file-folder` 등 | tokens.css에 정의됨 | FileIcon은 색상 토큰에만 의존, 뷰어에 의존하지 않음 | 분리 후에도 토큰 참조만으로 색상 동작 | 색상 정상 | |
| E3: CodeBlock의 MutationObserver (테마 감지) | module 레벨에서 1개 observer 공유 | 여러 CodeBlock 인스턴스가 있어도 observer는 1개 | 분리 후에도 module-level singleton 유지 | 테마 전환 시 모든 CodeBlock 업데이트 | |
| E4: MarkdownViewer가 CodeBlock import | 현재 `./CodeBlock`으로 상대 경로 import | 경로 변경 필요 | `../../interactive-os/ui/CodeBlock`으로 변경 | 마크다운 내 코드블록 렌더 유지 | |
| E5: QuickOpen이 FileIcon import | 현재 `./FileIcon`으로 상대 경로 import | 경로 변경 필요 | `../../interactive-os/ui/FileIcon`으로 변경 | 검색 결과 아이콘 유지 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 파일명 = 주 export 식별자 (feedback_filename_equals_export) | ② 산출물 | ✅ 준수 — CodeBlock.tsx → export function CodeBlock, 동일 패턴 | — | |
| P2 | barrel export 금지 (CLAUDE.md) | ② 산출물 | ✅ 준수 — 개별 파일에서 직접 import | — | |
| P3 | 이동 시 git mv 필수 (feedback_filename_equals_export) | ② 산출물 | ✅ 준수 — git mv로 이동하여 히스토리 보존 | — | |
| P4 | 과도한 추상화 금지 (project_v1_abstraction_failure) | ② 전체 | ✅ 준수 — API 변경 없이 위치만 이동. 새 추상화 0 | — | |
| P5 | UI 완성품은 interactive-os/ui/ (feedback_ui_sdk_principles) | ② 산출물 | ✅ 준수 — 목적지가 interactive-os/ui/ | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | PageViewer.tsx | import 경로 변경 필요 | 낮 | 갱신 | |
| S2 | FileViewerModal.tsx | CodeBlock, Breadcrumb, FileIcon import 경로 변경 | 낮 | 갱신 | |
| S3 | MarkdownViewer.tsx | CodeBlock import 경로 변경 | 낮 | 갱신 | |
| S4 | QuickOpen.tsx | FileIcon import 경로 변경 | 낮 | 갱신 | |
| S5 | PageAgentViewer.tsx | FileViewerModal을 통해 간접 의존. FileViewerModal 자체는 안 건드리므로 영향 없음 | 낮 | 허용 | |
| S6 | PageViewer.module.css | 스타일 블록 제거됨. 다른 곳에서 해당 클래스 사용 안 하는지 확인 필요 | 중 | 확인 — 제거 전 grep으로 다른 사용처 검증 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | API(props) 변경 | ⑤ P4 | 리팩터링이므로 인터페이스 변경 금지. 호출 코드 수정 최소화 | |
| F2 | 새 추상화/래퍼 추가 | ⑤ P4 | 위치 이동 + CSS 분리만. 범용화는 다음 단계 | |
| F3 | MarkdownViewer, QuickOpen 이동 | 범위 초과 | 이번 Phase 1은 leaf 3개만. 의존 있는 컴포넌트는 Phase 2 | |
| F4 | `git mv` 없이 파일 복사+삭제 | ⑤ P3 | git 히스토리 보존 필수 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | M1 | `/viewer`에서 파일 선택 → 코드 표시 | Shiki 하이라이팅, 라인 넘버, 토큰 클릭 하이라이트 동작 | ❌ 테스트 없음 |
| V2 | M2 | `/viewer`에서 파일 선택 → 상단 breadcrumb 경로 표시 | 세그먼트 구분, 마지막 세그먼트 볼드 | ❌ 테스트 없음 |
| V3 | M3 | `/viewer`에서 파일 트리 → 아이콘 표시 | 파일 타입별 색상 아이콘 (.ts=파랑, 폴더=노랑 등) | ❌ 테스트 없음 |
| V4 | M4 | 분리 후 PageViewer.module.css에서 제거된 스타일이 다른 곳에서 안 쓰이는지 확인 | grep 결과 0건 | ❌ 테스트 없음 |
| V5 | E1 | 코드 내 토큰 클릭 → 같은 이름 토큰 하이라이트 | `:global(.code-token--highlighted)` 동작 유지 | ❌ 테스트 없음 |
| V6 | E3 | 다크→라이트 테마 전환 | CodeBlock이 github-light 테마로 재렌더 | ❌ 테스트 없음 |
| V7 | E4 | `/viewer`에서 .md 파일 선택 → 마크다운 내 코드블록 | MarkdownViewer가 CodeBlock을 정상 렌더 | ❌ 테스트 없음 |
| V8 | E5 | `/viewer`에서 Cmd+P → QuickOpen 검색 결과 | FileIcon이 검색 결과 옆에 정상 표시 | ❌ 테스트 없음 |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

교차 검증:
1. 동기 ↔ 검증: ✅ M1~M4 → V1~V4로 커버
2. 인터페이스 ↔ 산출물: ✅ API 변경 없음 (리팩터링)
3. 경계 ↔ 검증: ✅ E1~E5 → V5~V8로 커버
4. 금지 ↔ 출처: ✅ F1~F4 전부 ⑤/⑥에서 파생
5. 원칙 대조 ↔ 전체: ✅ 위반 없음
