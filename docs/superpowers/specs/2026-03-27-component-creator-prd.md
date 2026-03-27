# Component Creator — PRD

> Discussion: 컴포넌트 목록 + 라이브 Canvas + LLM 채팅 단일 페이지. 토큰 레이어에서만 편집, LLM 수정 → HMR 자동 반영. Storybook + v0 + shadcn/ui의 통합.

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: 컴포넌트를 만들거나 수정할 때 "코드 수정 → dev server 확인 → 페이지 이동 → 상태 재현"을 반복. 보기/조정/생성이 PageUiShowcase(목록), PageThemeCreator(토큰), Agent Viewer(채팅) 3개 페이지로 분리되어 하나의 워크플로우로 연결되지 않음.
- **Forces**: 기존 도구(Storybook/v0/shadcn)는 "라이브러리" 전제 — 내 디자인 시스템 안에서 실시간으로 만들고 고치는 워크플로우를 상정하지 않음. CSS는 개별 속성 언어라 번들 준수를 물리적으로 강제 불가 (제약). 토큰 레이어 위에서만 편집해야 일관성 유지 (제약).
- **Decision**: Canvas(라이브 렌더링) + Chat(LLM 구조 변경) 단일 페이지. Controls UI 따로 만들지 않음 — 채팅이 Controls. LLM이 코드 수정 → Vite HMR로 즉시 반영. 기각: (A) 번들 선택기 UI → 표현력 한계 + 구현 비용 대비 LLM 채팅이 우월 (B) CSS 파싱 → Controls 자동생성 → LLM이 대체, 파싱 엔진 불필요 (C) 정적 레지스트리 → 코드-선언 sync 문제.
- **Non-Goals**: 범용 컴포넌트 라이브러리 제작 도구 아님. 부분 커스텀(개별 색상 picker) 금지. dev-channel(Chat↔LLM 연결)은 추후 별도 구현 — 이 PRD는 Channel이 있다고 가정하고 UI 레이어만. Aria behavior 편집기 아님 (behavior는 코드에서).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | Component Creator 페이지 진입 | 컴포넌트 목록에서 Button 선택 | Canvas에 Button이 모든 variant × size 조합으로 렌더링됨 | |
| M2 | Canvas에 Button 렌더링 중 | 채팅에 "tone을 destructive로 바꿔" 입력 | LLM이 module.css 수정 → HMR → Canvas에 즉시 반영 | |
| M3 | Canvas에 TextInput 렌더링 중 | 채팅에 "icon slot 왼쪽에 추가해" 입력 | LLM이 TSX+CSS 수정 → HMR → Canvas에 새 구조 반영 | |
| M4 | 컴포넌트 목록 | 채팅에 "새 Badge 컴포넌트 만들어" 입력 | LLM이 Badge.tsx + Badge.module.css 생성 (3블록 레시피 + data-surface) → 목록에 자동 등록 → Canvas에 렌더링 | |
| M5 | Canvas에 컴포넌트 variant 매트릭스 표시 중 | variant 행의 props 토글 (icon: on/off 등) | 해당 variant의 렌더링이 props 반영하여 업데이트 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `PageComponentCreator.tsx` | 메인 페이지: SplitPane(Canvas + Chat) + 하단 컴포넌트 탭 | |
| `ComponentCanvas.tsx` | 선택된 컴포넌트를 variant × props 매트릭스로 라이브 렌더링 | |
| `ComponentChat.tsx` | ui/chat/* 모듈 소비자. ChatFeed + ChatInput 사용. 현재 선택 컴포넌트의 TSX+CSS를 시스템 컨텍스트로 주입. dev-channel 연결은 추후 | |
| `componentRegistry.ts` | module.css 파싱 → ComponentMeta 정규화. Block 2(--_ 선언) = variants, Block 3(shape/type override) = sizes. ui/ 디렉토리 자동 발견 | |
| `parseComponentCSS.ts` | module.css → ComponentMeta 파서. 3블록 판별: .root=base, --_bg선언=variant, shape override=size | |
| `PageComponentCreator.module.css` | 페이지 레이아웃 스타일 | |
| router.tsx 수정 | `/creator/*` 라우트 추가 | |

완성도: 🟢

## ③ 인터페이스

> Canvas + Chat + 컴포넌트 목록의 인터랙션. 키보드 체크리스트 적용.

### 페이지 레이아웃

```
┌─────────────────────────────────────────────────┐
│  ┌─ Canvas (좌) ──────────┐ ┌─ Chat (우) ─────┐ │
│  │ variant × props 매트릭스│ │ LLM 채팅        │ │
│  │ [실제 컴포넌트 렌더링] │ │                  │ │
│  │                         │ │ 입력 → LLM 수정 │ │
│  │                         │ │ → HMR 반영      │ │
│  └─────────────────────────┘ └──────────────────┘ │
│  [◀ Button] [TextInput] [TabGroup] [Combobox] [▶] │
└─────────────────────────────────────────────────┘
```

### 인터랙션

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 클릭: 하단 탭의 컴포넌트 이름 | 아무 컴포넌트 선택됨 | Canvas가 해당 컴포넌트로 교체 | 탭 = 컴포넌트 네비게이션. 선택 즉시 Canvas 갱신 | 새 컴포넌트 렌더링 + Chat 컨텍스트 갱신 | |
| ← → | 하단 탭 포커스 | 이전/다음 컴포넌트로 이동 | 탭은 가로 배치 → 좌우 키가 탐색 (APG tablist) | 포커스 이동 + Canvas 갱신 | |
| Enter | Chat 입력에 텍스트 있음 | 메시지 전송 → LLM 처리 | 채팅 전송의 표준 패턴 | LLM 응답 시작, 코드 수정 시 HMR 반영 | |
| Cmd+Enter | Chat 입력에 텍스트 있음 (?) | 줄바꿈 (?) | 멀티라인 입력 필요 시 | 텍스트에 줄바꿈 추가 | |
| Tab | Canvas 영역 | Canvas → Chat 입력으로 포커스 이동 | 두 패널 간 키보드 이동 (SplitPane 표준) | Chat 입력 포커스 | |
| Escape | Chat 입력 포커스 | Chat 입력 blur → Canvas 포커스 | 입력 취소/탈출의 표준 패턴 | Canvas 포커스 복귀 | |
| ↑ ↓ | Canvas 영역 | variant 매트릭스 세로 스크롤 | variant가 많으면 스크롤 필요 | Canvas 스크롤 | |
| Home/End | 하단 탭 포커스 | 첫/마지막 컴포넌트로 이동 | 긴 목록 빠른 탐색 | 해당 컴포넌트 선택 | |
| 클릭: Canvas 내 컴포넌트 인스턴스 | Canvas 렌더링 중 | 해당 인스턴스의 variant/props 정보를 Chat에 컨텍스트로 전달 (?) | 클릭한 것에 대해 채팅하고 싶을 때 | Chat에 "Button.accent.sm 선택됨" 표시 | |
| Space | N/A | — | Canvas 내 컴포넌트 자체의 동작 (Button 클릭 등) | 컴포넌트 고유 동작 | |

### ComponentMeta 정규화 (CSS → 매트릭스 소스)

module.css의 3블록 레시피를 파싱하여 Canvas 매트릭스의 소스 데이터를 생성.

| 판별 대상 | 판별 기준 | 추출 결과 |
|----------|----------|----------|
| Block 1 (base) | `.root` 클래스 또는 파일 첫 규칙 | shape/type/motion 번들 레벨 |
| Block 2 (variant) | `--_bg` 또는 `--_fg`를 선언하는 클래스 | 클래스 이름 = variant 이름 |
| Block 3 (size) | `--shape-*-radius` 또는 `--shape-*-py`를 override하는 클래스 | 클래스 이름 = size 이름 |

```ts
interface ComponentMeta {
  name: string             // 파일명에서 (Button.module.css → "Button")
  base: string             // "root" 또는 첫 규칙 이름
  variants: string[]       // ["accent", "dialog", "ghost", "destructive"]
  sizes: string[]          // ["sm", "lg"]
  surface: string          // TSX의 data-surface 값 ("action")
  tokens: {
    shape: string          // "xl" (base의 --shape-{level})
    type: string           // "body" (base의 --type-{level})
    motion: string         // "instant" (base의 --motion-{level})
  }
}
```

Canvas 매트릭스 = `variants.map(v => sizes.map(s => render(v, s)))`. variant 0개면 [default], size 0개면 [base].

### Canvas 렌더링 규칙

| 규칙 | 설명 | 왜 |
|------|------|---|
| variant × size 매트릭스 | 모든 조합을 격자로 표시 | 한 눈에 전체 변형을 비교. Storybook args matrix와 동일 목적 |
| props 토글 패널 | boolean props (icon, disabled 등) on/off | 조합 수가 폭발하므로 매트릭스는 variant×size만, props는 토글 |
| 라이브 HMR 반영 | CSS/TSX 변경 시 Canvas 자동 갱신 | Vite native HMR — 추가 구현 불필요 |
| 배경 체크보드 | 투명 배경 컴포넌트 시각화 | Canvas 배경과 컴포넌트 배경 구분 |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 컴포넌트가 0개 (ui/ 빈 디렉토리) | 목록 비어있음 | 빈 상태에서도 "새로 만들어" 채팅 가능해야 함 | Canvas에 empty state + Chat 활성. "새 컴포넌트 만들어" 가능 | 새 파일 생성 → 목록에 등장 | |
| LLM 응답 중 다른 컴포넌트로 전환 | Chat에 응답 스트리밍 중 | 진행 중 작업이 끊기면 혼란 | 경고 표시: "수정 진행 중입니다. 완료 후 전환하시겠습니까?" 또는 자동 완료 대기 | 사용자 선택에 따라 | |
| variant가 없는 컴포넌트 (Separator 등) | 매트릭스 구성 불가 | variant 없어도 단일 렌더링은 가능 | variant 1개(default)로 매트릭스 생성. size도 없으면 단일 인스턴스 | 최소 1개 렌더링 | |
| 매우 큰 컴포넌트 (Kanban board) | Canvas에 전체가 안 들어감 | 스크롤 + 축소 필요 | Canvas overflow-auto + 필요시 scale 조절 | 스크롤로 접근 | |
| LLM이 규칙 위반 코드 생성 | 토큰 레이어 위반 (raw 값 사용 등) | /design-implement 스킬이 방지하지만 100%는 아님 | HMR 반영 후 design lint가 위반 감지 → Chat에 경고 | 위반 표시 + 자동 수정 제안 | |
| Chat 없이 Canvas만 사용 | Chat 패널 축소 | 보기만 하는 것도 유효한 사용 패턴 | Chat 패널 collapsible. Canvas 단독 동작 | showcase viewer 모드 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 토큰 레이어에서만 편집 (feedback_token_layer_only_editing) | ③ Chat에서 편집 | ✅ 준수 — LLM이 /design-implement 스킬로 토큰 준수. Controls UI 없이 채팅만이므로 부분 커스텀 UI 자체가 없음 | — | |
| 2 | 같은 역할 = 같은 디자인 (feedback_same_role_same_design) | ② PageComponentCreator | ✅ 준수 — 기존 뷰어 페이지 패턴(SplitPane + sidebar) 재사용 | — | |
| 3 | 테스트 = 데모 = showcase (feedback_test_equals_demo) | ② ComponentCanvas | 🟡 검토 — Canvas가 showcase를 대체하는가? PageUiShowcase와 중복? | Canvas가 showcase의 상위 호환이면 UiShowcase를 여기로 통합 검토 | |
| 4 | 하나의 앱 = 하나의 store (feedback_one_app_one_store) | ② componentRegistry | ✅ 준수 — registry는 정적 메타데이터, store 아님 | — | |
| 5 | 선언적 OCP (feedback_declarative_ocp) | ② componentRegistry | ✅ 준수 — ui/ 디렉토리 자동 발견 = 등록은 파일 존재 자체 | — | |
| 6 | Focus는 결과물 (feedback_focus_is_result) | ③ 컴포넌트 선택 시 | ✅ 준수 — 탭 선택 → Canvas 갱신 = 포커스가 결과물을 가리킴 | — | |
| 7 | 사이드바 = 읽기 전용 아웃라인 (feedback_sidebar_readonly_outline) | ② 하단 컴포넌트 탭 | ✅ 준수 — 탭은 네비게이션만, 편집은 Chat에서 | — | |
| 8 | CSS 구조/디자인 분리 (feedback_css_structure_design_split) | ② module.css | ✅ 준수 — 기존 규칙 그대로 적용 | — | |
| 9 | 레이어 = 라우트 그룹 (feedback_layer_equals_route) | ② router | ✅ 준수 — /creator는 devtools 도메인 라우트 | — | |
| 10 | LLM은 UI 완성품만 (feedback_ui_over_primitives) | ③ Chat | ✅ 준수 — Chat이 생성하는 건 UI 완성품 (Button, TextInput 등), Aria primitives 노출 안 함 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | PageUiShowcase — 기능 중복 | Component Creator Canvas가 showcase 상위 호환 → UiShowcase 존재 의미 약화 | 중 | 당장은 공존. Creator가 안정되면 UiShowcase를 Creator로 리다이렉트 검토 | |
| 2 | router.tsx — 새 라우트 추가 | 라우트 수 증가 | 낮 | /creator/* 추가. 기존 라우트 영향 없음 | |
| 3 | uiCategories.ts — 컴포넌트 목록 공유 | Creator와 UiShowcase가 같은 소스 사용하면 유지보수 단순. 다른 소스면 불일치 가능 | 중 | componentRegistry가 uiCategories를 대체하거나 확장 | |
| 4 | Agent Viewer 채팅 — 기능 일부 중복 | Agent Viewer의 disabled chat placeholder와 Creator Chat 중복 | 낮 | Creator Chat은 컴포넌트 컨텍스트 특화. Agent Viewer는 범용 세션 모니터. 역할 다름 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | Canvas에 color picker / raw 값 입력 UI | ⑤#1 토큰 레이어만 | 부분 커스텀 → 일관성 파괴. 편집은 Chat에서 자연어로 | |
| 2 | 컴포넌트 목록 하드코딩 | ⑤#5 선언적 OCP | ui/ 디렉토리 자동 발견. 새 파일 추가 = 자동 등록 | |
| 3 | Chat에서 Aria behavior 직접 편집 | Non-Goals | behavior는 코드에서 직접. Creator는 시각적 레이어만 | |
| 4 | Canvas에서 컴포넌트 드래그 편집 | ⑤#1 토큰 레이어만 | 위치/크기 직접 조작 = raw 값 생성. 채팅으로 요청 | |
| 5 | componentRegistry를 별도 설정 파일로 | ⑤#5 선언적 OCP | 파일 시스템이 SSOT. 설정 파일은 sync 깨짐 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | /creator 진입 → Button 선택 | Canvas에 accent/ghost/dialog/destructive × sm/md/lg 매트릭스 렌더링 | |
| V2 | ①M2 | Canvas에 Button 표시 중 → Chat "tone을 destructive로" | module.css 수정 → HMR → Canvas 갱신 — 색상 변경 확인 | |
| V3 | ①M3 | Canvas에 TextInput 표시 중 → Chat "icon slot 추가" | TSX+CSS 수정 → HMR → Canvas에 icon 포함 TextInput 렌더링 | |
| V4 | ①M4 | Chat "새 Badge 컴포넌트 만들어" | Badge.tsx + Badge.module.css 생성 → 목록에 자동 등장 → Canvas에 렌더링 | |
| V5 | ①M5 | Canvas에 Button 매트릭스 → disabled 토글 ON | 모든 variant의 disabled 상태가 매트릭스에 반영 | |
| V6 | ④E1 | ui/ 비어있을 때 /creator 진입 | empty state + Chat 활성. "Badge 만들어" 가능 | |
| V7 | ④E3 | Separator(variant 없음) 선택 | 단일 인스턴스 렌더링. 매트릭스 아닌 단일 행 | |
| V8 | ④E6 | Chat 패널 축소 | Canvas 단독 showcase 모드로 동작 | |
| V9 | ④E5 | LLM이 raw px 값으로 코드 생성 | design lint 경고가 Chat에 표시 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8 — 교차 검증 통과
