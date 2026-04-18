---
id: 2-areas/ui/prds/code-viewer-prd
type: prd
slug: codeViewer
title: 'CodeViewer — PRD'
tags: [untagged]
created: 2026-04-17
updated: 2026-04-17
summary: 'Discussion: CodeBlock을 단일 fat 완성품 `CodeViewer`로 통합하여 PPT/md/chat/shorts/edit 5 사용처를 preset 레시피로 커버한다. VirtualCodeBlock 흡수, 원자적 rename, preset 4종(presentation/doc/chat/replay) 도입, ARIA 기본, softwrap·deleted 색·설정 공백 해소.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# CodeViewer — PRD

> Discussion: CodeBlock을 단일 fat 완성품 `CodeViewer`로 통합하여 PPT/md/chat/shorts/edit 5 사용처를 preset 레시피로 커버한다. VirtualCodeBlock 흡수, 원자적 rename, preset 4종(presentation/doc/chat/replay) 도입, ARIA 기본, softwrap·deleted 색·설정 공백 해소.

## ① 동기

### WHY

- **Impact**:
  - 개발자가 softwrap된 코드에서 라인 연속을 식별 못함 (스크린샷 증거, wrap line continuation 무표시)
  - deleted tone 15% 배경이 약해 연속 deleted 라인 구분 불가
  - CodeBlock × VirtualCodeBlock API 복제로 FilePreview에 조건부 분기 로직 적재 + 유지보수 중복
  - `fontSize`, `startLine`, `showLineNumbers`, `filename 헤더` 같은 기본 설정 부재
  - `filename` prop 전달되지만 미표시 — dead prop
  - `role="region"`, `aria-label`, 거터 `aria-hidden` 없음 → SR 경험 저하

- **Forces**:
  - 5개 사용처(PPT/md/chat/shorts/edit) 요구사항 분산
  - fat 컴포넌트 허용, 단 `feedback_ui_sdk_principles`("behavior 분류 금지") 준수 필수
  - 11곳 원자적 전환 (`feedback_atomic_restructure`)

- **Assets**:
  - 내부: shiki transformer, `useShikiTheme`, `shikiUtils`(IDENTIFIER_RE / EXT_TO_LANG / escapeHtml), CopyButton, `useVirtualScrollState`, ax() 24축, axes.css 토큰(`--tone-*`, `--indicator-width`, `--shape-*`)
  - 외부 레퍼런스: W3C APG(Region/Figure), WCAG 1.4.1, shiki transformers 공식, Ray.so/Carbon(mac chrome)

- **Decision**:
  - **Fat 단일 컴포넌트** + `preset` 레시피 축 (`project_ax_shadcn_insight`의 size×role 적용)
  - VirtualCodeBlock을 `virtualized` prop으로 흡수 (`feedback_dom_placement_is_component_reason`: 같은 DOM 위치, 다른 전략)
  - Magic Move는 **별도 컴포넌트**로 분리 (추후 별도 discuss)
  - **기각 대안**:
    - 시각 variant(`bordered/flush/compact`) 유지 — `feedback_ax_semantic_not_css`("의도 축") 위반
    - Compound export (`CodeViewer.Header` 등) — `feedback_ui_sdk_principles`("쓰기 편한 완성품") 위반
    - 훅 추출(`useShikiHighlight`)로 두 컴포넌트 유지 — fat 방향과 충돌
    - MECE 3축 분해(size × chrome × density) — 복잡도 증가, preset으로 충분

- **Non-Goals**:
  - Magic Move/editAnimation 통합 (별도 PRD)
  - Focus mode, Column-range highlight, Callout (2차)
  - Line anchor URL, 접기/fold, ANSI strip, forced-colors fallback, Step fragment, Multi-file 탭 (3차)
  - `dangerouslySetInnerHTML` 제거(HAST 전환, 백로그)
  - 테마 selector UI (외부 주입만)

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| 1 | 마크다운 문서에 ```ts fenced code 30줄 | MarkdownViewer가 `<CodeViewer preset="doc" filename="example.ts" code={...}/>` 렌더 | figure + figcaption(filename) + region 랜드마크 + 거터 라인번호 + 구문 강조 + CopyButton | |
| 2 | 채팅에서 LLM이 긴 JSON 응답 | ToolSummaryBlock이 `<CodeViewer preset="chat" code={...}/>` 렌더 | compact chrome + wrap 허용 + 라인번호 숨김 + 작은 폰트 | |
| 3 | Replay 세션에서 editAnimation 프레임 재생 | `<CodeViewer preset="replay" highlightLines={Map<tone>} code={...}/>` | 5 tone(edited/selected/deleted/inserted/context) 정확 렌더 + indicator bar | |
| 4 | 500줄 이상 파일 뷰어 | FilePreview가 `<CodeViewer preset="doc" virtualized code={big}/>` 렌더 | auto threshold로 virtualScroll 활성, visibleRange slice 렌더, jank 없음 | |
| 5 | (선제 대비) 발표 슬라이드에 코드 | `<CodeViewer preset="presentation" filename="app.tsx" code={...}/>` | mac 창 점 chrome + 큰 폰트(code-lg) + filename 헤더 + aria-hidden chrome | |
| 6 | SR 사용자가 markdown 문서 탐색 | `D` 키로 region 이동 | `preset="doc"` 주요 예시만 landmark, `chat`은 plain figure로 소음 방지 | |
| 7 | 4줄 연속 deleted tone | 사용자가 diff 확인 | 배경 25~30% tone-danger + 좌측 indicator bar 2px로 각 라인 경계 명확 | |
| 8 | softwrap 스크린샷 재현 | `wrap=true` 명시 or preset=chat | continuation 줄이 hanging indent로 구분되어 논리 라인 식별 가능 | |
| 9 | 긴 한 줄 200자 (wrap=false 기본) | 좁은 컨테이너 | `overflow-x: auto` + scrollable 영역에 `tabindex=0` 자동 부여 (WCAG 2.1.1) | |
| 10 | 토큰 `createStore` 클릭 | 동일 identifier 2개 존재 | 두 토큰 모두 `.code-token--highlighted` 하이라이트, 배경 클릭 시 해제 | |

완성도: 🟢

---

## ② 산출물

> `src/interactive-os/ui/` 하위, ui 레이어. 원자적 rename + VirtualCodeBlock 흡수.

### 신규/변경

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/interactive-os/ui/CodeViewer.tsx` | CodeBlock.tsx에서 rename + 기능 확장 (fat). export: `CodeViewer`, `HighlightTone`, `CodeViewerPreset` | |
| `src/interactive-os/ui/CodeViewer.css` | CodeBlock.css에서 rename. preset별 frame chrome + deleted 색 강화 + softwrap continuation indent | |
| `src/interactive-os/ui/CodeViewer.demo.tsx` | CodeBlock.demo.tsx에서 rename + preset 4종 데모 추가 | |
| `src/interactive-os/ui/CodeViewer.test.tsx` | 신규. preset 4종 / highlightLines Map·Set / startLine / wrap×virtualized warn 통합 테스트 10건 | |

### 삭제

| 산출물 | 이유 | 역PRD |
|--------|------|-------|
| `src/interactive-os/ui/VirtualCodeBlock.tsx` | `virtualized` prop으로 흡수 (`feedback_orphan_export_detection`) | |
| `src/interactive-os/ui/VirtualCodeBlock.demo.tsx` | demo 흡수 | |

### 수정 (import + prop 전환)

| 파일 | 수정 내용 | 역PRD |
|------|----------|-------|
| `src/interactive-os/ui/index.ts` | `CodeBlock` → `CodeViewer` re-export. `VirtualCodeBlock` export 삭제 | |
| `src/interactive-os/CATALOG.md` | `CodeBlock` → `CodeViewer`, `VirtualCodeBlock` 제거 | |
| `src/interactive-os/ui/FilePreview.tsx` | import 변경 + 조건부 분기 → `<CodeViewer virtualized/>` 단일 호출 | |
| `src/interactive-os/ui/MarkdownViewer.tsx` | import + `variant` → `preset="doc"` | |
| `src/interactive-os/ui/chat/ChatCodeBlock.tsx` | import + `variant="compact"` → `preset="chat"` | |
| `src/interactive-os/ui/chat/ToolSummaryBlock.tsx` | import + `variant="compact"` → `preset="chat"` | |
| `src/interactive-os/ui/chat/types.ts` | import 경로 | |
| `src/devtools/inspector/SourcePreview.tsx` | import + `variant="flush"` → `preset="doc"` | |
| `src/pages/creator/creatorWidgets.tsx` | import + `variant="flush"` → `preset="doc"` | |
| `src/interactive-os/ui/editAnimation.ts` | `HighlightTone` import 경로 | |
| `src/interactive-os/ui/FileViewer.tsx` | `HighlightTone` import 경로 | |
| `src/interactive-os/ui/fileRenderers.tsx` | `HighlightTone` import 경로 | |
| `src/interactive-os/ui/viewerTypes.ts` | `HighlightTone` import 경로 | |

### 문서 갱신

| 파일 | 수정 | 역PRD |
|------|------|-------|
| `docs/2-areas/ui/prds/virtual-code-block-task.md` | CodeViewer 흡수 기록 | |
| `docs/2-areas/ui/prds/virtual-scroll-plugin-prd.md` | VirtualCodeBlock 참조 갱신 | |
| `docs/2-areas/ui/prds/component-catalog-prd.md` | CodeBlock 참조 갱신 | |
| `docs/2-areas/design/prds/remove-module-css-plan.md` | CodeBlock.css → CodeViewer.css | |

### Type / Symbol 이전

| 기존 | 신규 |
|------|------|
| `CodeBlock` | `CodeViewer` |
| `@os/ui/CodeBlock` | `@os/ui/CodeViewer` |
| `./CodeBlock` (상대) | `./CodeViewer` |
| `variant: 'bordered' \| 'flush' \| 'compact'` | `preset: 'presentation' \| 'doc' \| 'chat' \| 'replay'` |
| `HighlightTone` | 동일 (CodeViewer.tsx에서 export) |
| `.code-block`, `.code-block--compact`, `.code-block--flush` | `.code-viewer`, `.code-viewer--{preset}` |

완성도: 🟢

---

## ③ 인터페이스

> UI 인터랙션 — props 입력/키보드/포인터 → 상태 변환. `feedback_minimum_impl_is_good`에 따라 촘촘한 명세.

### Props API

```ts
export type CodeViewerPreset = 'presentation' | 'doc' | 'chat' | 'replay'

export interface CodeViewerProps {
  code: string
  filename?: string
  preset?: CodeViewerPreset
  highlightLines?: Set<number> | Map<number, HighlightTone>
  startLine?: number
  showLineNumbers?: boolean
  wrap?: boolean
  virtualized?: boolean | number
}
```

### Preset 레시피 (shadcn size×role 방식)

| preset | font | showLineNumbers | wrap | chrome | surface | role | padding |
|--------|------|-----------------|------|--------|---------|------|---------|
| `presentation` | code-lg | true | false | frame (mac 점) | raised | region | lg |
| `doc` (default) | code | true | false | bordered | raised | region | md |
| `chat` | code-sm | false | true | compact | raised | — (plain figure) | sm |
| `replay` | code-sm | true | false | compact | raised | — (plain figure) | sm |

Override 규칙: `showLineNumbers`, `wrap`, `startLine` 개별 prop은 preset 기본값 덮어쓰기 허용. `font`/`surface`/`padding`은 preset 잠금(`project_ax_shadcn_insight`: 구조 잠금).

### 입력 → 결과 인과 체인

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `preset` 생략 | unmounted | `preset='doc'` fallback | 가장 흔한 사용처(md/file viewer) 기본값 | doc 레시피 적용 | |
| `filename` 제공 | — | `<figcaption id={uid}>{filename}</figcaption>` 렌더 + `aria-labelledby={uid}` | 보이는 텍스트와 접근 이름 일치 + SR 앵커 | figure with caption | |
| `filename` 생략 | — | figcaption 생략, `aria-label="Code example, {lang}"` | 중복 낭독 방지 + 언어 정보 제공 | plain figure | |
| `preset='doc' \| 'presentation'` | — | `<figure role="region" ...>` | W3C APG: 주요 예시만 랜드마크 | region 랜드마크 | |
| `preset='chat' \| 'replay'` | — | `<figure>` (role 없음) | 다수 블록에서 랜드마크 소음 방지 | plain figure | |
| `code` 변경 | 이전 html | `useEffect` → `codeToHtml` 비동기 + `cancelled` 플래그 | 레이스 컨디션 방지 (현재 구현 유지) | 새 shiki html | |
| `startLine={42}` | — | CSS `counter-reset: line 41` + gutter DOM `<span>{42+i}</span>` | partial diff view 지원 | 거터 42부터 | |
| `showLineNumbers={false}` | — | gutter DOM 미렌더 + `.code-viewer--no-gutter` 클래스 | chat/inline에서 공간 절약 | 거터 숨김 | |
| `wrap={true}` (or preset=chat) | — | `white-space: pre-wrap; overflow-wrap: break-word` + continuation hanging indent | 좁은 컨테이너에서 가로 스크롤 회피 + 논리 라인 구분 유지 | wrap 뷰 | |
| `wrap={false}` (default) | — | `white-space: pre; overflow-x: auto` | 논리 라인 유지 + 필요 시 가로 스크롤 | 스크롤 뷰 | |
| `virtualized={true}` | — | 무조건 `useVirtualScrollState` + `codeToTokens` 경로 | 큰 파일 성능 | 가상 렌더 | |
| `virtualized={number}` | — | `lines.length >= N`일 때만 가상화 | 임계값 제어 | 조건부 | |
| `virtualized` 생략 (auto) | — | `lines.length >= 500` 기본 임계 | 대부분 파일은 일반 렌더, 큰 파일만 가상화 | 자동 분기 | |
| `highlightLines: Set<number>` | — | 모든 지정 라인 `'edited'` tone 적용 | 하위 호환 + 간단 하이라이트 | edited tone 일괄 | |
| `highlightLines: Map<number, tone>` | — | 각 라인 tone 개별 적용 | 5 tone diff 표현 | 다색 tone | |
| 토큰 click (identifier) | idle | `setHighlightToken(text)` + DOM class 토글 | 같은 identifier 추적 | 동일 토큰 강조 | |
| 토큰 click (동일 토큰 재클릭) | highlighted | `setHighlightToken(null)` | 토글 | 해제 | |
| 빈 영역 click (non-token) | highlighted | `setHighlightToken(null)` | 외부 클릭 해제 | 해제 | |
| `Tab` 키 (overflow-x 발생 시) | unfocused | `<pre tabindex=0>` 포커스 | WCAG 2.1.1 (scrollable = 키보드 접근) | focus ring | |
| `Tab` 키 (overflow 없음) | unfocused | 포커스 없음 | non-scrollable에 tabindex 주면 Tab 소음 | skip | |
| `Cmd+C` (pre focus) | focused | 브라우저 기본 동작 (선택→복사) | 표준 선택 모델 유지 | 클립보드 복사 | |
| `CopyButton` click | — | 전체 `code` 복사 | 마우스 사용자 편의 | 클립보드 복사 | |
| 테마 전환 (`data-theme` 변경) | 이전 테마 | `useShikiTheme` MutationObserver → re-highlight | 다크/라이트 동기화 | 새 테마 적용 | |

완성도: 🟢

---

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| `code=""` | empty | shiki가 빈 입력 처리 가능하나 비용 낭비 | shiki 호출 skip, 빈 figure 렌더 | 빈 pre | |
| filename 확장자 없음 or `EXT_TO_LANG`에 없음 | — | shiki는 `text` fallback 필요 | `lang='text'` 폴백 + plain render | plain text | |
| shiki 로드 실패 (네트워크 등) | pending html `''` | FOUC 방지 | fallback `<pre><code>{code}</code></pre>` (현재 구현 유지) | fallback 렌더 | |
| 아주 긴 1줄 (wrap=false) | normal | `overflow-x: auto`로 가로 스크롤 + 키보드 접근 필수 | `tabindex=0` 자동 추가 + scroll shadow | scrollable | |
| 10,000줄 + `virtualized=auto` | normal | 500줄 임계 넘음 | 자동 virtualScroll 활성 | 가상 렌더 | |
| 10,000줄 + `virtualized=false` (명시) | — | 사용자 명시 오버라이드 존중 | 일반 렌더 (성능 경고 없음) | 일반 렌더 | |
| `wrap=true` + `virtualized=true` | 충돌 | wrap된 라인은 높이 가변 → 가상스크롤 estimatedItemHeight 모델과 불합치 | `wrap` 우선, `virtualized` 무시 + dev warning | wrap 렌더 | |
| `highlightLines: Set` + `Map` 혼용 | — | union type | `instanceof Map`으로 분기 (현재 구현 유지) | tone 결정 | |
| `startLine` 음수/0 | — | 의미 없음 | `Math.max(1, startLine)` 강제 | 1 이상 | |
| `startLine` + highlightLines 키 | — | 키는 "표시 라인 번호"인가 "배열 인덱스+1"인가 결정 필요 | **배열 인덱스+1 기준**(현재 구현). startLine은 거터 표시만 이동. highlightLines는 그대로. | 표시 ≠ 데이터 키 | |
| filename에 `<script>` 특수문자 | — | React text content 자동 escape | 그대로 텍스트 표시 | XSS 없음 | |
| 테마 전환 중 `cancelled` 레이스 | loading | 이전 요청 무효화 | 새 요청만 적용 (현재 구현 유지) | 마지막 테마 반영 | |
| ANSI escape 포함 코드 | raw | MVP: strip 없음 | 그대로 shiki로 전달 (ANSI 문자 텍스트로 표시) | 미처리 | |
| `preset='chat'`에서 `filename` 제공 | — | chat에서 filename 표시는 과한가? | 표시. 대신 figcaption 폰트 축소 (preset 레시피에 포함) | compact header | |
| `preset='chat'`에서 `showLineNumbers={true}` override | preset default false | 사용자 명시 override 존중 | 라인번호 표시 | override 적용 | |
| forced-colors 모드 (Windows HC) | — | `background-image`로 그린 diff tone 무시됨 | MVP: 대응 없음 (백로그: border-left fallback) | 시각 단서 소실 | |
| 토큰 click (동일 identifier 3+개) | — | `data-token` 매칭 모두 | `querySelectorAll` 전부 highlight | 전체 강조 | |
| virtualScroll + preset 전환 | — | preset 변경 시 gutter 크기 변함 → scroll state 재계산 필요 | preset을 key에 포함하거나 useEffect 의존성에 추가 | 정상 재렌더 | |
| `highlightLines`가 가상화 뷰 밖 라인 | — | virtualized 슬라이스에 없는 라인 | tone 적용 안 되지만 scroll하면 복원 (tokens 배열이 tone 정보 보유) | 스크롤 시 표시 | |

완성도: 🟢

---

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|------|----------|------------|-------|
| 1 | `feedback_ui_layer_rules` (UI만 노출, primitives 금지) | D/F/G | ✗ | — | |
| 2 | `feedback_ui_sdk_principles` (용도 분류, behavior 금지) | D/E/F | ✗ (preset=용도) | — | |
| 3 | `feedback_render_function_is_slot` (slot=render fn) | I | ✗ (chrome은 preset 내부 분기, slot 불필요) | — | |
| 4 | `feedback_dom_placement_is_component_reason` (DOM 위치=컴포넌트 이유) | C/I | ✗ (같은 DOM, 다른 전략) | — | |
| 5 | `feedback_aria_item_parent_prop` (prop 추가 선호) | C/F | ✗ (virtualized prop 흡수) | — | |
| 6 | `feedback_role_axis_design` (role=크기 SSOT) | I | ✗ (CodeViewer=컨테이너, role 4종 외) | — | |
| 7 | `feedback_design_css_principles` (간격→면→선, part 어휘) | B/I | ✗ (class: `.code-viewer-gutter` 역할 어휘) | — | |
| 8 | `feedback_color_system` (tone 체계, accent 1채널) | B | ✗ (`tone:danger` dim→base) | — | |
| 9 | `feedback_css_architecture` (@layer, style={} 금지) | F/B | **⚠ 주의** | shiki inline style만 3rd-party 격리 허용(토큰 트리 내부). frame/chrome은 ax 사용. 금지 ⑦#3~4로 이관 | |
| 10 | `feedback_ax_semantic_not_css` (축=의도) | E/F | ✗ (preset=의도/용도) | — | |
| 11 | `feedback_cs_padding_content` (콘텐츠 2:1) | I | ✗ (doc=md, chat=sm, presentation=lg) | — | |
| 12 | `feedback_padding_by_layout_type` (콘텐츠=md/lg) | I | ✗ | — | |
| 13 | `feedback_longtext_means_linebreak` (줄바꿈=콘텐츠) | A | ✗ (wrap opt-in, 기본 scroll) | — | |
| 14 | `feedback_focus_principles` (readonly도 focus 필요) | G | **⚠ 조건부** | tabindex는 overflow 시만 (WCAG ACT Rule 0ssw9k). 금지 ⑦#8로 이관 | |
| 15 | `feedback_atomic_restructure` (rename 원자적) | D | **⚠ 핵심** | 11곳 + CATALOG + 문서 단일 PR. 검증 ⑧V13 | |
| 16 | `feedback_orphan_export_detection` (export-import=orphan) | D | **⚠ 핵심** | VirtualCodeBlock 완전 삭제. 검증 ⑧V14 | |
| 17 | `feedback_minimum_impl_is_good` (촘촘 명세) | 전체 | ✗ (PRD로 명세) | — | |
| 18 | `project_ax_shadcn_insight` (구조 잠금+색 개방, size×role 레시피) | E | ✗ (preset=레시피, 구조 잠금) | — | |
| 19 | `project_ax_combination_invariants` (R1/R3 규칙) | I | ✗ (surface=raised 유지) | — | |
| 20 | `project_depth_ladder` (raised=코드블록) | I | ✗ (모든 preset raised 고정) | — | |

### 충돌 해소

- **C1 shiki inline style vs ax-only**: shiki 출력의 토큰 `<span style="color:...">`는 **토큰 트리 내부 한정**으로 3rd-party 격리 허용. frame/chrome/layout은 ax() 필수. CSS custom property(`--_gutter-offset` 등)의 `style={{}}` 주입은 "surface 속성 해치"가 아니므로 허용.
- **C4 토큰 승격 Gate**: preset 레시피가 ax 토큰 체계에 없는 값(`code-lg`/`code-sm` 등)을 요구하면 `calc()` last-mile 전에 토큰 승격 discuss 선행. 현재 MVP는 presentation `font-size: calc(*1.15)` 땜빵 → 백로그.
- **C2 ARIA APG readonly vs focus**: `<pre>`에 기본 tabindex 없음(표준). 프로젝트 규약 `feedback_focus_principles` 우선(`feedback_judgment_priority`). **scrollable일 때만** tabindex=0.
- **C3 region landmark 소음**: APG는 region 남용 금지 권고. preset에 따라 조건부 적용.

완성도: 🟢

---

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| P1 | 11곳 import 경로 (`./CodeBlock`, `@os/ui/CodeBlock`) | 동시 rename 미이행 시 빌드 실패 | 높음 | atomic rename 단일 PR (`feedback_atomic_restructure`) | |
| P2 | `variant` → `preset` prop 변환 (11곳) | 기존 호출 비호환 | 높음 | 매핑 표 기반 일괄 수정 (②문서 참조) | |
| P2b | MarkdownViewer `codeVariant` prop → `codePreset` 파급 | 외부 호출자 호환 | 중 | 동일 PR에서 rename (chat/*Block, creatorWidgets 등) | |
| P3 | `HighlightTone` export 위치 | 5곳 type import 경로 변경 필요 | 중 | CodeViewer.tsx에서 재export | |
| P4 | VirtualCodeBlock 삭제 | FilePreview의 `lineCount > 500` 분기 제거 → `<CodeViewer virtualized/>` 단일 호출 | 중 | FilePreview 단순화 + 동일 PR | |
| P5 | `CATALOG.md`, `@catalog` JSDoc | 문서와 실코드 불일치 | 낮 | 동일 PR에서 업데이트 | |
| P6 | `docs/2-areas/ui/prds/` 4개 문서 | 참조 불일치 | 낮 | 문자열 교체 | |
| P7 | `role="region"` 추가 | 모든 CodeBlock에 region 달면 landmark 소음 | 중 | preset=doc/presentation만 region, chat/replay는 plain figure. 금지 ⑦#7 | |
| P8 | 거터 DOM 전환 (`::before counter` → `<span aria-hidden>`) | CSS `:has(> .code-gutter)` 선택자는 이미 존재, line 매핑 유지 필요 | 낮 | 기존 코드와 정합 (이미 부분 준비됨) | |
| P9 | tabindex=0 무조건 추가 | non-scrollable `<pre>`에 Tab 스탑 증가 | 중 | 조건부 (overflow 발생 시) | |
| P10 | shiki `transformerNotationDiff`/`Highlight` 추가 (백로그) | `// [!code ++]` 같은 마커가 md 코드에 자동 적용 | 낮 | MVP 제외 (향후 별도 PR) | |
| P11 | 테스트 파일 부재 (`grep` 결과 0건) | 회귀 탐지 수단 없음 | 중 | 최소 통합 테스트 1개 (preset 매트릭스 렌더 + highlightLines Map/Set) | |
| P12 | replay 세션 JSONL | "CodeBlock" 문자열 포함 (과거 기록) | 무시 | 히스토리 데이터, 변경 불필요 | |
| P13 | virtualScroll 플러그인 계약 | `useVirtualScrollState` 시그니처 유지 | 낮 | 의존성 그대로 | |
| P14 | 토큰 하이라이트 DOM 조작 | preset 변경 시 gutter 너비 바뀌면서 token 위치 재계산 | 낮 | `useEffect` 의존성 배열에 preset 포함 | |
| P15 | deleted 색 강화 (25~30%) | 기존 replay 세션 미세 색 변화 | 낮 | 의도된 변경 (⑤#8 color system) | |

완성도: 🟢

---

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | `preset="minimal" \| "full"` 같은 기능 양 분류 | ⑤#2 | behavior 분류 = `feedback_ui_sdk_principles` 위반 | |
| 2 | `<CodeViewer.Header>`, `<CodeViewer.Gutter>` compound export | ⑤#2, #3 | 쓰기 편한 완성품 원칙 위반 | |
| 3 | CodeViewer 외곽에 `style={{...}}` 주입 | ⑤#9 | ax 축 우선 (`feedback_css_architecture`) | |
| 4 | shiki inline style 외 raw HTML 삽입 | ⑤#9 | XSS + 3rd-party 격리 원칙 | |
| 5 | `CodeBlock` re-export alias 유지 | ⑤#15, ⑥P1 | atomic rename 위반, 병렬 세션이 legacy 재사용 | |
| 6 | `VirtualCodeBlock.tsx` 파일 유지 | ⑤#16 | orphan export + 중복 유지 | |
| 7 | 모든 preset에 `role="region"` 강제 | ⑥P7 | 랜드마크 소음 | |
| 8 | non-scrollable `<pre>`에 `tabindex=0` | ⑤#14 | WCAG ACT Rule 0ssw9k 위반 + Tab 스탑 낭비 | |
| 9 | mac chrome 점을 `<button>`로 | UI 도메인 리서치 | 장식인데 focusable = 혼란 | |
| 10 | `CodeViewer.Root`, `CodeViewer.Pre` subcomponent 분리 | ⑤#2 | 용도별 완성품 원칙 | |
| 11 | `fontSize`, `padding` 개별 prop 노출 | ⑤#18 | preset 구조 잠금 (shadcn 원리) | |
| 12 | preset마다 `surface` 다르게 (sunken/base/raised 혼용) | ⑤#20 | depth ladder raised 고정 | |
| 13 | pages/에서 shiki 직접 호출 | ⑤#1 | UI 레이어 경유 필수 | |
| 14 | `style=` prop 노출 (外부 override용) | ⑤#9 | `feedback_css_architecture` 해치 원칙 | |
| 15 | `wrap=true` + `virtualized=true` 시 사용자 안내 없이 무시 | ④ 경계 | 숨은 동작 — dev warning 필수 | |
| 16 | `preset=chat`에서 `role="region"` 추가 override 허용 | ⑥P7 | 랜드마크 소음 정책 고정 | |

완성도: 🟢

---

## ⑧ 검증

> 동기 시나리오 × 경계 교차. `feedback_testing_principles`에 따라 통합/상태 검증, mock 호출 검증 금지.

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①시나리오1 | MarkdownViewer 렌더 `<CodeViewer preset="doc" filename="example.ts" code={sample}/>` | `<figure role="region" aria-labelledby>` + `<figcaption>example.ts</figcaption>` + 거터 span DOM + shiki 구문 강조 + CopyButton | |
| V2 | ①시나리오2 | ToolSummaryBlock preset=chat 긴 JSON | compact chrome + `white-space: pre-wrap` + 거터 없음 + CopyButton | |
| V3 | ①시나리오3 | replay preset + `highlightLines=Map<line, tone>` | 5 tone 각 라인 배경 + 좌측 indicator bar 2px 표시 | |
| V4 | ①시나리오4 + ④10000줄 | `virtualized=auto` + 600줄 | `useVirtualScrollState` 활성, visibleRange slice만 DOM 존재 | |
| V5 | ①시나리오5 | `preset="presentation"` | mac 창 점 3개 + code-lg 폰트 + filename 헤더 + chrome `aria-hidden="true"` | |
| V6 | ①시나리오6 | SR 시뮬레이션 (axe-core 또는 수동) | `preset="doc"`만 region landmark, `preset="chat"`은 figure only | |
| V7 | ①시나리오7 + ④"연속 deleted" | 4줄 연속 `tone='deleted'` | 각 라인 배경 25~30% + indicator bar 라인 경계 명확 | |
| V8 | ④"빈 문자열" | `code=""` | 빈 figure + 에러 없음 + 로그 없음 | |
| V9 | ④"긴 1줄" | 200자 1줄 + wrap=false | `overflow-x: auto` 발생 + `<pre tabindex=0>` (ACT Rule) | |
| V10 | ④"wrap=true + virtualized=true" | 충돌 입력 | wrap 우선, virtualized 무시, console.warn 출력 | |
| V11 | ③"토큰 click" | 동일 identifier 2개 | 두 토큰 모두 `.code-token--highlighted`, 배경 클릭 시 해제 | |
| V12 | ③"startLine=42" | `startLine=42`, 3줄 코드 | 거터 `42, 43, 44` 표시 | |
| V13 | ⑤#15 atomic rename 검증 | `grep -r "CodeBlock" src/` | 0건 (comment/string 포함) | |
| V14 | ⑤#16 orphan 검증 | `grep -r "VirtualCodeBlock" src/` | 0건 | |
| V15 | ⑥P11 통합 테스트 | `src/interactive-os/ui/CodeViewer.test.tsx` (신규) | preset 4종 × highlightLines Map/Set × virtualized 매트릭스 렌더 확인 | |
| V16 | 시각 회귀 | `pnpm screenshot` → 11곳 사용처 | 이전 대비 구조 파괴 없음 (색 강화는 의도된 변경) | |
| V17 | ⑦#5 re-export alias 부재 | `grep "CodeBlock" ui/index.ts` | 0건 | |
| V18 | ⑦#8 tabindex 조건부 | non-scrollable `<pre>` DOM 검사 | `tabindex` 속성 없음 | |
| V19 | ⑦#9 mac 점 장식 | `<button>` 태그 검사 | chrome 영역에 button 없음 | |
| V20 | ④"테마 전환 레이스" | `data-theme` 빠른 토글 | 마지막 테마만 적용, 중간 html 무시 | |
| V21 | ⑤ type import 경로 | `HighlightTone` import 5곳 | 모두 `@os/ui/CodeViewer`로 변경 | |
| V22 | ⑥P4 FilePreview 단순화 | FilePreview.tsx 내 `lineCount > 500` 분기 | 제거됨, `<CodeViewer virtualized/>` 단일 호출 | |

완성도: 🟢

---

## 교차 검증

- **동기 ↔ 검증**: 시나리오 1~10 모두 V1~V9, V11, V12에 매핑됨 ✓
- **인터페이스 ↔ 산출물**: Props API (③) ↔ 신규 산출물 (②) 일치. `HighlightTone` re-export 명시 ✓
- **경계 ↔ 검증**: 주요 경계(빈 문자열, 긴 1줄, 충돌, 토큰 click) V8, V9, V10, V11 커버 ✓
- **금지 ↔ 출처**: ⑦ 금지 16개 전부 ⑤/⑥에서 파생 ✓
- **원칙 대조 ↔ 전체**: 위반 없음, 조건부 주의(⑤#9, #14, #15, #16) 금지로 이관 ✓

## 전체 완성도

**🟢 8/8** — 구현 착수 가능.

### (?) 추측/확인 필요 항목

없음. 모든 항목 리서치 근거 확보.

### 주요 선행 작업 (⑥P4·P11·⑧V15 관련)

1. FilePreview.tsx 조건부 분기 제거 로직 설계 (동일 PR 범위)
2. CodeViewer.test.tsx 최소 통합 테스트 작성 (preset 매트릭스)
3. CATALOG.md + 4개 PRD 문서 문자열 교체

### 별도 PRD 분리 항목

- **CodeViewerMagicMove** — shiki-magic-move 래핑, before/after 입력. 별도 discuss → 별도 PRD.
- **2차 기능**: Focus mode / Column-range highlight / ANSI strip / forced-colors fallback / reduced-motion 가드 — 별도 작은 PRD로 묶음.
- **3차 기능**: Line anchor URL / Callout / 접기 / Multi-file tabs — 백로그.
