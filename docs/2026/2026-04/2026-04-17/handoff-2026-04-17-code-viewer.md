---
id: 0-inbox/handoff-2026-04-17-code-viewer
type: handoff
slug: codeViewer
title: 'Handoff: CodeViewer — preset 4종 + ARIA + VirtualCodeBlock 흡수'
tags: [untagged]
created: 2026-04-17
updated: 2026-04-17
summary: 'CodeBlock → CodeViewer 원자적 rename. VirtualCodeBlock을 `virtualized` prop으로 흡수. preset 4종(presentation/doc/chat/replay)으로 용도 레시피 도입. ARIA 기본(figure + role="region" 조건부). 11곳 사용처 일괄 전환. 통합 테스트 10건 신규.'
legacy:
  created_at: 2026-04-17
  session_topic: 'CodeViewer 대대적 개선'
  status: inbox
  kind: handoff
  topics: [0-inbox]
  relates: []
  supersedes: []
---
# Handoff: CodeViewer — preset 4종 + ARIA + VirtualCodeBlock 흡수

> CodeBlock → CodeViewer 원자적 rename. VirtualCodeBlock을 `virtualized` prop으로 흡수. preset 4종(presentation/doc/chat/replay)으로 용도 레시피 도입. ARIA 기본(figure + role="region" 조건부). 11곳 사용처 일괄 전환. 통합 테스트 10건 신규.

## 완료

| 커밋 | 내용 |
|------|------|
| `cc31eeaa` | feat(ui): CodeViewer — preset 4종 + ARIA + VirtualCodeBlock 흡수 |

**Discuss → PRD → Retro 풀 사이클 완주**
- discuss: 4개 불편(softwrap/deleted 색/코드 중복/설정 부족) → preset 축 도입 합의
- PRD: `docs/2-areas/ui/prds/code-viewer-prd.md` — 8단계 🟢 완성, 병렬 리서치 4 에이전트 + 블라인드 평가 합격
- retro 일치율 8/8 (G1 startLine CSS var 버그 + G4 테스트 자율 수정 완료)

**핵심 구현 결정**
- `PRESET_RECIPES` SSOT + CSS class `.code-viewer--{preset}` 구조 잠금
- `StandardBody` / `VirtualizedBody` 내부 분기 (wrap 우선, wrap×virtualized 충돌 시 warn)
- `ResizeObserver` scrollable 감지 → tabindex 조건부 (WCAG ACT 0ssw9k)
- mac chrome dots `<span>` + `aria-hidden` (presentation만)
- CSS custom property 주입은 style={{}} 해치 규칙 외 허용 명시 (PRD C1 보강)

## 남은 것

### 즉시 (다음 세션 첫 작업 후보)
없음. CodeViewer MVP는 완결 상태. 다음 작업은 사용자 선택.

### 이후 (backlog)

**토큰/CSS 갭**
- `code-lg`/`code-sm` textStyle 토큰 ax.ts 승격 → `docs/BACKLOGS.md`
- `keylineMap.json:609` VirtualCodeBlock 잔재 (자동생성, 다음 갱신에서 자연 제거) → `docs/BACKLOGS.md`

**테스트 커버리지**
- V9 scrollable tabindex (ResizeObserver 모킹) → `docs/BACKLOGS.md`
- V11 token click 토글 → `docs/BACKLOGS.md`
- V16 11곳 screenshot 회귀 → `docs/BACKLOGS.md`

**별도 컴포넌트 (이 PRD 범위 외)**
- `CodeViewerMagicMove` — shiki-magic-move 래핑. 별도 discuss/PRD/구현 → `docs/BACKLOGS.md`

**2차/3차 기능 (PRD에 명시)**
- Focus mode / Column-range highlight / ANSI strip / forced-colors fallback / reduced-motion 가드 — 묶어서 소형 PRD
- Line anchor URL / Callout / 접기 / Multi-file tabs — 백로그

## 컨텍스트

- **PRD**: `docs/2-areas/ui/prds/code-viewer-prd.md`
- **관련 memory**:
  - `feedback_ui_sdk_principles` (용도별 완성품, behavior 분류 금지) — preset 축 정당화 근거
  - `project_ax_shadcn_insight` (size×role 프리셋) — PRESET_RECIPES SSOT 설계 근거
  - `feedback_atomic_restructure` (rename 원자적) — 11곳 동시 전환 원칙
  - `feedback_css_architecture` (style={} 금지) — CSS custom property 주입 예외 합의
- **주의**:
  - `MarkdownViewer` prop rename `codeVariant` → `codePreset` 파급. 외부에서 옛 prop 쓰면 깨짐
  - `chat/types.ts`의 `CodeBlock` 타입은 메시지 블록 union 멤버 — UI 컴포넌트 아님, rename 제외
  - `dangerouslySetInnerHTML` 유지 (shiki 출력 신뢰). HAST 전환은 백로그
  - 기존 40개 테스트 실패 + 325 deps 위반은 타 모듈 선행 이슈 — CodeViewer refactor와 무관

## 세션 외 잔여

이번 세션 시작 전부터 working tree에 있던 기존 수정들(Breadcrumb, CalendarGrid, Grid, NavList, Progress, Slider, TabList, Table, TextInput, TreeGrid, composites/*, items/MenubarItem, styles/ax.*, reset.css, pages/** 다수)은 이 세션 범위 밖. unstage 상태로 유지.

## 이어받는 법

다음 세션에서 `/handoff`를 치면 이 파일을 자동으로 찾아 읽는다. CodeViewer 확장이 필요하면 backlog의 항목을 꺼내 새 discuss/PRD 사이클 시작.

#kind/handoff
