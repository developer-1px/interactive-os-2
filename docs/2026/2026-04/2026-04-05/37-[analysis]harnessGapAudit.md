---
id: '3-resources/37-[analysis]harnessGapAudit'
title: 'Harness Gap Audit: 기술부채와 강제 메커니즘의 빈틈'
status: reference
kind: analysis
created: 2026-04-05
updated: 2026-04-05
topics: [3-resources, analysis]
relates: []
supersedes: []
---
# Harness Gap Audit: 기술부채와 강제 메커니즘의 빈틈

## 핵심 진단

```
현재:  규칙 100% 선언 → 35% 강제 → 65% 우연한 구멍
목표:  규칙 100% 선언 → 85% 강제 → 15% 의도적 해치(escape hatch)
```

부채 청산 = 하네스 재설계의 입력. 부채를 하나씩 고치면서 "막을 것 / 해치로 열 것"을 판별한다.

---

## 1. 강제는 있으나 구멍이 있는 규칙

| 규칙 | hook | 뚫리는 패턴 | 해치 여부 |
|------|------|------------|----------|
| `style={{}}` 금지 | guardOsPatterns | 템플릿 리터럴 `` `calc(${depth} * ...)` `` 통과 | **해치 필요** — 동적 depth 계산은 축으로 표현 불가 |
| addEventListener 금지 | guardOsPatterns | 멀티라인 분할 시 정규식 미매칭 | 막아야 함 |
| onKeyDown 금지 | guardOsPatterns | CmsDetailPanel에 실존하나 미탐지 | 막아야 함 |
| 토큰만 사용 | checkDesignTokens | `style={{ width: resizer.size }}` 변수 미검출 | **해치 필요** — 리사이저는 런타임 값 |
| 레이어 의존 | check:deps | **pages/ 미스캔** | 막아야 함 |
| 테스트 게이트 | stopTestGate | 실행 여부만 확인, 통과 여부 안 봄 | 막아야 함 |

### 의도적 해치로 전환할 것

- **동적 style**: `data-dynamic` 또는 CSS custom property(`--_*`) 패턴으로 허용 범위 명시
- **리사이저/depth 같은 런타임 값**: `style={{ '--_depth': depth }}` + CSS에서 `var(--_depth)` 사용 패턴을 공식 해치로 정의

### 구멍을 막아야 할 것

- check:deps에 `src/pages/` 추가
- stopTestGate에서 exit code 확인
- guardOsPatterns 정규식을 멀티라인 대응으로 강화

---

## 2. 규칙은 있으나 강제 수단이 없는 것 (65%)

| 규칙 | 현재 강제 | 필요한 강제 | 해치 |
|------|----------|------------|------|
| module.css = last-mile만 | 없음 | 허용 속성 화이트리스트 or 라인 수 제한 | **해치**: `/* @harness-exempt: full-layout */` 주석 |
| 파일명 = 주 export | 없음 | lint rule or hook | 불필요 |
| 커밋 전 /simplify | 없음 | pre-commit hook or stop gate | 불필요 |
| /design-implement 필수 | 없음 | CSS 편집 시 스킬 호출 확인 | **해치**: tokens.css/axes.css 직접 편집은 허용 |
| PROGRESS.md 갱신 | 없음 | /close 스킬에서 강제 | 불필요 |
| git mv로 rename | 없음 | hook에서 삭제+생성 패턴 감지 | 불필요 |

---

## 3. 레거시 위반 (기존 코드) — 후진 게이트 부재

hook은 Write/Edit 시점에만 동작 → 기존 위반은 영원히 잔존.

### 발견된 레거시 위반

**레이어 위반 (pages → primitives 직접 import): 11건**
- PageWriter.tsx — Aria, EditKeyContext, AriaRoute, RouteKeyMap
- PageI18nEditor.tsx — Aria
- PageCms.tsx, PageViewer.tsx, PageBirdseye.tsx — AriaRoute
- CmsPresentMode.tsx — AriaRoute
- FilePanel.tsx — AriaRoute
- showcase/RenameDemo, HistoryDemo — Aria
- showcase/CrudDemo — ariaRegistry

**style={{}} 위반: 50건+**
- showcase/ 전역 (FormDemo, ClipboardDemo, DndDemo, EngineDiffDemo 등)
- PageI18nEditor.tsx (padding, border, borderRadius)

**useState로 인터랙션 상태: 5건+**
- IndicatorsDemo.tsx — expanded, checked, selected, on
- CmsDetailPanel.tsx — expanded
- PageIncidentInterface.tsx — selectedEvent
- CmsSidebarContent — pickerOpen

**ref.focus() 직접 호출: 3건**
- CmsPresentMode.tsx, CmsSidebar.tsx (2곳)

**onKeyDown 직접 핸들러: 5건+**
- CmsDetailPanel.tsx (3곳), CmsInlineEditable.tsx, ComponentChat.tsx

**hardcoded px in module.css: ~80건**
- 주요: Kanban(240px), QuickOpen(560px), PanelHeader(36px), DatePicker(28px)

**과대 module.css (last-mile 위반)**
- MarkdownViewer.module.css: 223줄
- Kanban.module.css: 153줄
- CodeBlock.module.css: 101줄

### 후진 게이트 전략

전체 스캔 CI 파이프라인:
1. `check:deps` 범위 확장 (pages/ 포함)
2. `pnpm lint` 에 커스텀 ESLint rule 추가 (primitives import 금지, useState 인터랙션 패턴)
3. `stylelint` 에 토큰 강제 규칙 추가
4. module.css 허용 속성 화이트리스트 (layout 속성 금지)
5. `/score:design` 확장 — 위반 카운트 트래킹

---

## 4. 부채 청산 순서 (하네스 보강과 동시 진행)

### Phase 1: 강제 범위 확장 (빈틈 봉합)
1. check:deps에 pages/ 추가 → 레이어 위반 11건 가시화
2. stopTestGate에서 exit code 확인 → 테스트 통과 강제
3. guardOsPatterns 정규식 강화 → 멀티라인 우회 차단

### Phase 2: 레거시 청산 (가장 오염도 높은 곳부터)
1. showcase/ style={{}} → ax() 전환 (50건+)
2. pages→primitives import → ui/ 래퍼 생성 (AriaRoute, Aria)
3. module.css 레이아웃 속성 → ax()/structure.css 이전

### Phase 3: 의도적 해치 명시
1. 동적 style 해치 패턴 정의 (`--_*` custom property)
2. module.css exempt 주석 규약
3. 해치 목록을 CLAUDE.md에 명시

### Phase 4: 새 강제 수단
1. module.css 허용 속성 화이트리스트 hook
2. 파일명=export 검사 hook
3. /simplify 실행 여부 stop gate

---

## 5. 해치 설계 원칙

> 우연한 구멍은 기술부채. 의도적 해치는 설계 결정.

- 해치에는 반드시 **이유 주석**이 붙는다: `/* @hatch: dynamic-depth — 트리 들여쓰기 런타임 계산 */`
- 해치 목록은 CLAUDE.md에 SSOT로 관리
- 해치 사용은 `pnpm score:design`에서 카운트 → 0이 아닌 것은 허용하되 추적
- 해치가 3건 이상 같은 패턴이면 → 축(axis) 또는 토큰 확장을 검토

---

## 6. 소급 적용 결과 (Phase 1 실행)

### 완료된 수정

**하네스 강화:**
- `check:deps` — pages/ 포함 스캔 + `pages-no-primitives` 규칙 추가
- `stopTestGate` — 마지막 테스트 exit_code 확인 (실패 시 block)
- `logAgentOps` — Bash exit_code 기록 추가 (stopTestGate 연동)
- `guardOsPatterns` — addEventListener/onKeyDown 정규식 멀티라인 대응

**레거시 부채 청산:**
- FormDemo — style={{}} 18건 → ax() 전환 (surface/controlSize/textStyle/tone/layout/gap)
- TypeaheadDemo — style={{}} 2건 → className 전환
- ClipboardDemo — style={{}} 4건 → ax()/op-*/wt-* 클래스 + `--_indent` 해치
- DndDemo — style={{}} 2건 → ax()/wt-* + `--_indent` 해치
- EngineCommandDemo — style={{}} 8건 → ax()/op-*/debug-log-entry 클래스
- EngineDiffDemo — style={{}} 15건 → ax()/op-*/debug-log-entry + surface:ghost 버튼
- PageI18nEditor — style={{}} 2건 → ax({ padding, layout, surface, shape })
- PanelHeader.module.css — `36px` → `var(--toolbar-height)`
- Kanban.module.css — `height: 2px` → `var(--indicator-width)`
- Kanban.module.css — `--tone-positive-base` (미정의) → `--tone-success-base`

### 설계가 필요하여 미수정 (backlog)

#### 1. pages → primitives `Aria` 직접 import (5곳)
- PageWriter, PageI18nEditor, HistoryDemo, RenameDemo, CrudDemo
- **문제**: `Aria.Editable`, `Aria.SearchHighlight` 등 서브 컴포넌트를 renderItem 콜백 안에서 사용
- **설계 필요**: Grid/ListBox 등 ui/ 컴포넌트가 이 서브 컴포넌트를 prop/context로 제공하거나, ui/에서 re-export 계층을 만들어야 함
- **결정 포인트**: 서브 컴포넌트를 ui/ re-export로 노출할 것인가, 아니면 renderItem API를 확장하여 primitives 의존을 제거할 것인가

#### 2. module.css 레이아웃 속성 분리
- MarkdownViewer.module.css (223줄), Kanban.module.css (153줄), CodeBlock.module.css (101줄)
- **문제**: display:flex, flex-direction, gap 등 레이아웃 속성이 module.css에 있음
- **설계 필요**: 허용 속성 화이트리스트 정의, "레이아웃은 ax()/structure" 경계를 명확히 해야 함
- **결정 포인트**: module.css에서 layout 속성을 완전 금지할 것인가, compact variant 같은 조건부 레이아웃은 허용할 것인가

#### 3. showcase/ IndicatorsDemo의 useState 인터랙션 상태
- expanded, checked, selected, on — 4건
- **문제**: 데모 목적의 로컬 상태. engine/store를 사용하면 데모가 과도하게 복잡해짐
- **설계 필요**: showcase는 os 규칙 예외 구역으로 명시할 것인가, 아니면 Indicators 자체를 AriaZone 기반으로 만들 것인가
- **결정 포인트**: showcase를 guard hook exempt 경로로 추가할 것인가

#### 4. hardcoded px 토큰 확장
- Kanban `width: 240px` — `--storymap-col-width`(220px)과 불일치
- DatePicker `28px` — 기존 아이콘 토큰(14/16/18/24px)과 불일치
- QuickOpen `560px` — `--overlay-width`(360px)과 불일치
- **설계 필요**: 컴포넌트별 전용 토큰(`--kanban-col-width`, `--datepicker-cell-size`)을 tokens.css에 추가할지, 컴포넌트 로컬 `--_*` 변수로 처리할지

#### 5. EngineCommandDemo/EngineDiffDemo 디버그 패널
- `debug-log-entry` 클래스가 아직 어디에도 정의되지 않음
- **설계 필요**: app.css에 디버그 패널 공통 스타일을 추가하거나, showcase 전용 module.css를 만들거나, devtools/ 레이어로 이동

#### 6. 커밋 전 /simplify, CSS 편집 시 /design-implement 강제
- 현재 강제 수단 없음 (CLAUDE.md 문서 규칙만 존재)
- **설계 필요**: stop gate에서 스킬 호출 여부를 체크하려면 agent-ops 로그에 스킬 호출을 기록해야 함
- **결정 포인트**: 스킬 호출을 hook으로 강제할 것인가, Claude의 자율에 맡기되 회고에서 추적할 것인가
