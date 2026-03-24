# UI 공식 문서 SSOT 통합 — PRD

> Discussion: Area MD를 SSOT로 삼아 showcase 콘텐츠를 흡수. 빈 뼈대 구조를 먼저 확정하여 23종 × 변경 비용을 방지. 레거시(showcaseRegistry + internals/pattern + internals/collection) ↔ 최종(Area MD + MdPage) 공존 해소.

## IA (Information Architecture)

```
interactive-os
├── /                              Landing (hero + MiniDemo grid)
├── /docs                          Getting Started
│
├── /ui                            ★ 공식 UI 문서 (Area MD SSOT)
│   │                              URL: flat (/ui/{slug}), 사이드바: 범주 그룹
│   ├── Navigation
│   │   ├── navlist                  NavList
│   │   ├── tab-list                 TabList
│   │   ├── menu-list                MenuList
│   │   ├── toolbar                  Toolbar
│   │   ├── accordion                Accordion
│   │   └── disclosure-group         DisclosureGroup
│   ├── Selection
│   │   ├── listbox                  ListBox
│   │   ├── combobox                 Combobox
│   │   ├── radio-group              RadioGroup
│   │   ├── checkbox                 Checkbox
│   │   ├── switch-group             SwitchGroup
│   │   ├── toggle                   Toggle
│   │   └── toggle-group             ToggleGroup
│   ├── Data
│   │   ├── tree-grid                TreeGrid
│   │   ├── grid                     Grid
│   │   ├── tree-view                TreeView
│   │   └── kanban                   Kanban
│   ├── Input
│   │   ├── slider                   Slider
│   │   └── spinbutton               Spinbutton
│   └── Feedback
│       ├── dialog                   Dialog
│       ├── alert-dialog             AlertDialog
│       ├── toaster                  Toaster
│       └── tooltip                  Tooltip
│
├── /examples
│   ├── /examples/cms              Visual CMS
│   ├── /examples/viewer           문서 뷰어
│   ├── /examples/agent            Agent Viewer
│   └── /examples/i18n-grid        i18n DataTable (Grid + clipboard + edit 조합)
│
└── /internals                     walkthrough 전용
    ├── store/inspector
    ├── engine/command, diff
    ├── axis/*                     MdPage (이미 SSOT)
    ├── plugin/*                   crud, clipboard, history, dnd, rename, typeahead
    ├── components/*               aria, cell, hooks
    ├── area/*                     Area 문서 뷰어
    └── theme
```

**삭제 대상:** `/internals/pattern/*`, `/internals/collection/*` → `/ui/*`로 흡수
**URL 정책:** flat (`/ui/{slug}`), 사이드바에서만 범주 그룹핑
**범주 기준:** 컴포넌트의 용도 (Navigation, Selection, Data, Input, Feedback)

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | 새 세션이 UI 컴포넌트 문서를 수정하려 함 | showcaseRegistry.tsx와 docs/2-areas/ui/*.md 두 곳이 있음 | 어디를 수정해야 하는지 혼동, 레거시에 내용을 추가하여 이중 관리 악화 | |
| M2 | 외부 개발자가 `/ui/listbox`를 방문 | 데모만 있고 Props/Accessibility/When-to-use 설명이 없음 | 컴포넌트 사용법을 이해할 수 없음 | |
| M3 | Area MD에 내용을 채우려 함 | MD 템플릿 구조가 없어 세션마다 다른 형식으로 작성 | 15종 문서 형식 불일치, 나중에 통일 비용 발생 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `docs/2-areas/ui/{Name}.md` × 23종 | 빈 뼈대 MD — 6개 섹션 헤딩 + tsx render placeholder. SSOT. 신규 8종(Toaster, Toggle, ToggleGroup, Toolbar, AlertDialog, Checkbox, Dialog, NavList) 추가 | `docs/2-areas/ui/*.md` (23종 확인) |
| `src/pages/ShowcaseDemo.tsx` | showcaseRegistry의 render+makeData를 래핑. MD에서 `<ShowcaseDemo slug="listbox" />` 호출 | `ShowcaseDemo.tsx::ShowcaseDemo` |
| `src/pages/mdComponents.ts` 확장 | ShowcaseDemo, ApgKeyboardTable 등록 | `mdComponents.ts::mdComponents` |
| `src/pages/PageUiShowcase.tsx` 수정 | ComponentDemo → MdPage 렌더러로 교체. 사이드바를 범주 그룹(Navigation/Selection/Data/Input/Feedback)으로 재구성 | `PageUiShowcase.tsx::PageUiShowcase` |
| `src/pages/uiCategories.ts` | 범주 정의 — slug→category 매핑 + 사이드바 순서 | `uiCategories.ts::uiCategories, slugToMdFile` |
| `src/routeConfig.ts` 수정 | `/internals/pattern`, `/internals/collection` 그룹 삭제. AppShell navItems에서도 제거 | `routeConfig.ts::routeConfig` |
| `src/AppShell.tsx` 수정 | internalNavItems에서 pattern/collection 제거 | `AppShell.tsx::AppShell` |

### MD 템플릿 구조 (6개 섹션)

```markdown
# {Name}

> {한 줄 설명}

## Demo

```tsx render
<ShowcaseDemo slug="{slug}" />
```

## Usage

```tsx
{usage 코드}
```

## Props

| prop | type | default | description |
|------|------|---------|-------------|

## Keyboard

```tsx render
<ApgKeyboardTable slug="{slug}" />
```

## Accessibility

- **Role**: {role}
- **Child role**: {childRole}

## Internals

- **Behavior**: {behavior name}
- **DOM**: {DOM structure}
```

완성도: 🟡 — ShowcaseDemo 컴포넌트 설계가 핵심 결정. 아래 인터페이스에서 구체화.

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 사용자가 `/ui/listbox` 접속 | PageUiShowcase 렌더, slug=listbox | PageUiShowcase가 MdPage에 `md="ui/ListBox"` 전달 | Area MD가 SSOT이므로 MD 파일이 페이지 콘텐츠를 소유 | ListBox.md가 렌더됨 — Demo, Usage, Props, Keyboard 섹션 표시 | |
| MD 안의 `<ShowcaseDemo slug="listbox" />` | showcaseRegistry에 listbox 엔트리 존재 | ShowcaseDemo가 registry에서 render+makeData를 가져와 TestRunnerPanel 또는 LiveDemo 렌더 | 데모 로직(state, behavior 연결)은 코드에 남아야 하므로 registry가 데모 소스 역할 유지 | 데모가 MD 안에 임베드되어 렌더됨 | |
| MD 안의 `<ApgKeyboardTable slug="listbox" />` | apg-data.ts에 apgListbox 존재 | ApgKeyboardTable이 slug로 APG 데이터를 찾아 키보드 표 렌더 | APG 데이터도 코드 SSOT — MD에 표를 복사하면 이중 관리 | 키보드 표가 MD 안에 임베드되어 렌더됨 | |
| 새 세션이 ListBox 문서를 개선하려 함 | `docs/2-areas/ui/ListBox.md` 존재 | MD 파일만 수정 — 코드 변경 불필요 | MD가 SSOT이므로 문서 변경은 MD 한 곳에서만 | `/ui/listbox` 페이지에 즉시 반영 | |

완성도: 🟡 — ShowcaseDemo의 slug→registry 연결 방식 확인 필요

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1: testPath 없는 컴포넌트 (checkbox 등) | registry에 testPath 없음 | TestRunnerPanel 없이도 데모는 보여야 함 | ShowcaseDemo가 LiveDemo fallback 렌더 | 데모는 보이되 테스트 결과는 없음 | |
| E2: apg 없는 컴포넌트 (toaster 등) | registry에 apg 없음 | 키보드 표 없는 컴포넌트도 존재 | ApgKeyboardTable이 "No keyboard shortcuts" 또는 섹션 자체를 MD에서 생략 | 빈 표 대신 깔끔한 처리 | |
| E3: MD 파일이 아직 빈 뼈대 | 섹션 헤딩만 있고 내용 없음 | 점진적 채움이 전략이므로 빈 상태도 유효 | 빈 섹션은 렌더하지 않거나 "Coming soon" placeholder | 사용자에게 불완전하게 보이지 않음 | |
| E4: showcaseRegistry에 없는 slug | MD에 `<ShowcaseDemo slug="nonexistent" />` | 에러를 삼키면 디버깅 불가 | "Unknown slug: nonexistent" 에러 메시지 렌더 | 개발자가 오타를 바로 인지 | |
| E5: Landing MiniDemo | PageLanding이 showcaseRegistry 직접 사용 | Landing은 MD 기반이 아니라 코드 기반 — 별도 | showcaseRegistry는 Landing + ShowcaseDemo 두 곳에서 사용 | showcaseRegistry 유지 (삭제 아님) | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | MD = SSOT (project_md_content_system) | ② 전체 | ✅ 준수 | — | |
| P2 | 파일명 = 주 export (CLAUDE.md) | ② ShowcaseDemo.tsx | ✅ 준수 — export function ShowcaseDemo | — | |
| P3 | 테스트=데모=showcase 수렴 (feedback_test_equals_demo) | ③ ShowcaseDemo | ✅ 준수 — TestRunnerPanel이 데모+테스트 통합 | — | |
| P4 | UI 컴포넌트만 노출, primitives 금지 (feedback_ui_over_primitives) | ② MD 내용 | ✅ 준수 — Props만 노출, 내부 구조는 Internals 섹션 | — | |
| P5 | 하나의 앱 = 하나의 store (feedback_one_app_one_store) | ③ ShowcaseDemo | ✅ 준수 — 데모별 독립 store | — | |
| P6 | v1 과도한 추상화 실패 (project_v1_abstraction_failure) | ② ShowcaseDemo | ⚠️ 주의 — ShowcaseDemo가 범용 래퍼로 과도해지지 않도록. slug→registry 직접 조회만 | — | |
| P7 | ActivityBar 레이어 그룹 유지 (project_md_content_system) | ② 라우팅 | ✅ 준수 — `/ui/*` 그대로 유지 | — | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | PageUiShowcase.tsx — ComponentDemo 교체 | 기존 데모 렌더링 방식 변경 | 중 | MdPage 렌더러로 교체하되, MD 로드 실패 시 기존 ComponentDemo fallback | |
| S2 | showcaseRegistry.tsx — 역할 축소 | Landing MiniDemo가 여전히 의존 | 낮 | 삭제 안 함. Demo 소스 + Landing 소스로 유지 | |
| S3 | docs/2-areas/ui/*.md — 15개 기존 + 8개 신규 | 기존 내용(Props, behavior 대응) 유실 가능 | 중 | 기존 내용을 새 템플릿의 해당 섹션으로 마이그레이션 | |
| S4 | mdComponents.ts — 등록 컴포넌트 증가 | 번들 사이즈 증가 | 낮 | ShowcaseDemo가 lazy import하면 해결 — 단, 1차에서는 직접 import으로 시작 | |
| S5 | routeConfig — pattern/collection 그룹 삭제 | 기존 `/internals/pattern/*`, `/internals/collection/*` URL 깨짐 | 중 | `*` catch-all에서 `/` redirect로 처리. 내부 개발용이므로 외부 영향 없음 | |
| S6 | AppShell — navItems 축소 | ActivityBar에서 Pattern/Collection 아이콘 사라짐 | 낮 | 의도된 변경. internals가 walkthrough 전용으로 축소되면서 자연스러움 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | showcaseRegistry 삭제 | ⑥ S2 | Landing MiniDemo가 의존 | |
| X2 | MD에 데모 코드(state, behavior) 직접 작성 | ⑤ P6 | 데모 로직은 코드 SSOT — MD에 복사하면 이중 관리 | |
| X3 | MD에 APG 키보드 표를 수동 복사 | ⑤ P1 | apg-data.ts가 SSOT — MD에 복사하면 동기화 깨짐 | |
| X4 | 15종 MD 내용을 한 번에 채우기 | Discussion 합의 | 구조만 먼저, 내용은 점진적 | |
| X5 | 기존 Area MD 내용 삭제 | ⑥ S3 | Props, behavior 대응 등 기존 내용은 새 섹션으로 마이그레이션 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | 새 세션이 ListBox 설명을 개선 → `docs/2-areas/ui/ListBox.md`만 수정 | `/ui/listbox` 페이지에 변경 반영, 코드 수정 불필요 | ❌ 테스트 없음 |
| V2 | ①M2 | `/ui/listbox` 접속 | Demo + Usage + Props + Keyboard + Accessibility 섹션 모두 표시 | ❌ 테스트 없음 |
| V3 | ①M3 | 23개 MD 파일 구조 검사 | 모두 동일한 6개 섹션 헤딩 보유 | ❌ 테스트 없음 |
| V4 | ④E1 | `/ui/checkbox` 접속 (testPath 없음) | LiveDemo fallback 렌더, 크래시 없음 | ❌ 테스트 없음 |
| V5 | ④E3 | 빈 Props 표 상태의 MD 페이지 접속 | 빈 섹션이 어색하지 않게 처리됨 | ❌ 테스트 없음 |
| V6 | ④E5 | Landing 페이지 접속 | MiniDemo 그리드 정상 동작 (showcaseRegistry 의존 유지) | ❌ 테스트 없음 |
| V7 | — | `npx tsc --noEmit && npx vitest run` | 0 에러, 705+ 테스트 통과 | ❌ 테스트 없음 |
| V8 | ⑥S5 | `/internals/pattern/accordion` 접속 | `/`로 redirect (기존 URL 깨지지 않고 graceful 처리) | ❌ 테스트 없음 |
| V9 | — | 사이드바 범주 그룹 | Navigation/Selection/Data/Input/Feedback 5개 그룹으로 23개 컴포넌트 표시 | ❌ 테스트 없음 |

완성도: 🟡

---

**전체 완성도:** 🟡 8/8 (모두 🟡 — AI 초안 + IA 확정, 사용자 최종 확인 대기)
