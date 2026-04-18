---
id: 2-areas/ui/prds/component-catalog-prd
title: 'Component Catalog — PRD'
status: active
kind: prd
created: 2026-04-10
updated: 2026-04-10
summary: 'Discussion: ui/ 75개 중 24개만 showcase 등록. 수동 fixture 비용이 병목. *.demo.tsx 컨벤션 + FlatLayout 자동 카탈로그 + visual UI 레이어 + ax() 승격 루프.'
topics: [2-areas]
relates: []
supersedes: []
---
# Component Catalog — PRD

> Discussion: ui/ 75개 중 24개만 showcase 등록. 수동 fixture 비용이 병목. *.demo.tsx 컨벤션 + FlatLayout 자동 카탈로그 + visual UI 레이어 + ax() 승격 루프.

## ① 동기

### WHY

- **Impact**: 개발자(자신)가 75개+ 부품 중 뭐가 있는지 눈으로 확인할 수 없다. "있는 걸로 만든다" 제1원칙이 실효성을 잃는다. LLM도 카탈로그 없이는 부품 선택을 못 한다.
- **Forces**: behavior-first로 엔진/패턴이 완성됐지만, visual skin을 체계적으로 씌우지 않았다. showcase는 수동 fixture 의존이라 24개에 멈춤. ax() 실전 커버리지도 미검증.
- **Decision**: `*.demo.tsx` 컨벤션으로 각 컴포넌트 인접에 demo를 두고, `import.meta.glob`으로 자동 수집하여 FlatLayout 기반 카탈로그 렌더링. 기각: A(showcaseRegistry 확장 — 현재 병목 원인), C(정적 문서 — 유지보수 불가).
- **Non-Goals**: 외부 배포용 Storybook 빌드. npm 패키지 문서. 전체 visual UI 완성(이 PRD는 카탈로그 인프라 + 첫 번째 demo 배치까지).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 개발자가 부품을 찾고 싶다 | `/catalog` 라우트 진입 | ui/ 전체 컴포넌트가 카테고리별로 실물 렌더링되어 보인다 | |
| S2 | 새 ui 컴포넌트를 추가했다 | `Foo.demo.tsx`를 작성하면 | 카탈로그에 자동으로 나타난다 (registry 수정 불필요) | |
| S3 | demo가 없는 컴포넌트가 있다 | 카탈로그 진입 | 이름만 표시되고 "demo 없음"으로 갭이 가시화된다 | |
| S4 | LLM이 컴포넌트를 선택해야 한다 | 카탈로그 데이터를 참조 | 부품 목록 + 카테고리 + props 패턴으로 판단 가능 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `*.demo.tsx` 컨벤션 | 각 ui 컴포넌트 인접에 `{Name}.demo.tsx`. named export: `demo: () => JSX`, `meta: { slug, category, label }` | |
| `catalogLoader.ts` | `import.meta.glob('../ui/**/*.demo.tsx')` — demo 파일 자동 수집 + 카테고리 분류 | |
| `PageCatalog.tsx` | `/catalog` 라우트 진입점. FlatLayout 기반. catalogLoader에서 받은 demo를 WidgetRegistry에 등록 | |
| `catalogLayout.ts` | FlatLayout용 NormalizedData — 카테고리별 stack 안에 widget 배치 | |
| 첫 번째 demo 배치 | AriaComponentProps 공통 패턴 컴포넌트 대상 demo 파일 (우선순위: showcase 미등록 51개) | |

### demo.tsx 컨벤션

```tsx
// ListBox.demo.tsx
import { ListBox } from './ListBox'
import type { NormalizedData } from '@os/store/types'

const data: NormalizedData = { /* fixture */ }

export const meta = {
  slug: 'listbox',
  category: 'ui',        // 'ui' | 'indicator' | 'item' | 'cell' | 'panel' | 'composite'
  label: 'ListBox',
}

export function demo() {
  return <ListBox data={data} onChange={() => {}} />
}
```

### 카테고리 분류

| category | 소스 디렉토리 | 단독 렌더링 |
|----------|-------------|------------|
| ui | `ui/*.tsx` | O — 대부분 AriaComponentProps |
| indicator | `ui/indicators/*.tsx` | O — props만으로 렌더링 |
| item | `ui/items/*.tsx` | △ — 부모 컴포넌트 래퍼 필요 |
| cell | `ui/cells/*.tsx` | △ — Grid/Table 래퍼 필요 |
| panel | `ui/panels/*.tsx` | O |
| composite | `ui/composites/*.tsx` | O |

### 표시 전용 컴포넌트 (~15개)

Badge, Avatar, Kbd, Skeleton, EmptyState, Divider, FileIcon, CodeBlock, Progress, Link, Breadcrumb, Tooltip, FilePreview 등은 AriaComponentProps를 안 쓴다. demo.tsx에서 자유 시그니처로 작성.

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `/catalog` 라우트 진입 | 초기 | catalogLoader가 glob으로 demo 수집 → FlatLayout에 WidgetRegistry 전달 → 렌더링 | glob이 파일시스템에서 자동 발견하므로 수동 등록 불필요 | 전체 카탈로그 표시 | |
| 카테고리 필터 클릭 | 전체 표시 | FlatLayout data에서 해당 카테고리 stack만 visible | FlatLayout이 NormalizedData 기반 가시성 제어 지원 | 선택 카테고리만 표시 | |
| 새 `Foo.demo.tsx` 파일 추가 | 카탈로그에 Foo 없음 | Vite HMR이 glob 재평가 → catalogLoader에 자동 포함 | import.meta.glob이 빌드타임 파일 발견 | Foo가 카탈로그에 나타남 | |
| demo 없는 컴포넌트 | — | catalogLoader가 ui/*.tsx glob과 demo glob을 비교 → 차집합 계산 | uiProgressStore.ts가 이미 ui/ 전체 glob 수행 중, 동일 패턴 재활용 | "demo 없음" 플레이스홀더 표시 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| demo에서 에러 발생 | 렌더링 중 | 한 demo의 에러가 전체 카탈로그를 죽이면 안 됨 | ErrorBoundary로 해당 demo만 에러 표시, 나머지 정상 | 에러 demo만 fallback | |
| demo 파일이 0개 | 초기 | 카탈로그가 빈 상태에서도 동작해야 점진적 추가 가능 | EmptyState 표시 | 빈 카탈로그 | |
| 75개+ demo 동시 렌더링 | 스크롤 중 | 전부 eager 렌더링하면 초기 로드 느림 | `import.meta.glob` eager: false + Suspense lazy loading | 뷰포트 근처만 로드 | |
| items/cells demo가 부모 없이 렌더 | 단독 | items/cells는 ARIA context(role, aria-selected 등)가 부모에서 와야 동작 | demo.tsx에서 최소 부모 래퍼를 직접 제공 | 부모 안에서 정상 렌더링 | |
| uiProgressStore glob과 demo 파일 충돌 | 빌드 | uiProgressStore가 `ui/*.tsx`를 glob — demo.tsx도 잡힐 수 있음 | demo 파일명이 `*.demo.tsx`이므로 기존 glob `*.tsx`에 잡히지만, uiProgressStore에서 `.demo.` 포함 파일 필터링 | 충돌 없음 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | ax()만 사용 (CLAUDE.md) | 카탈로그 UI, demo 전체 | 준수 | — | |
| P2 | test=demo=showcase (feedback_testing_principles) | demo.tsx 컨벤션 | **주의** — demo.tsx가 테스트에서도 import 가능해야 함 | demo 함수를 vitest에서 render 가능한 순수 컴포넌트로 설계. 별도 test 파일에서 `import { demo } from './Foo.demo'` 후 render+assert | |
| P3 | OCP 파일 단위 분리 (feedback_ocp_not_record_map) | catalogLoader | 준수 — glob이 파일 단위 수집, 거대 Record 없음 | — | |
| P4 | pages에서 useAria 직접 사용 금지 (CLAUDE.md) | PageCatalog.tsx | **주의** — FlatLayout을 ui/ 컴포넌트로 사용하면 준수 | PageCatalog에서 FlatLayout(ui/) import, useAria 직접 사용하지 않음 | |
| P5 | 제1원칙: 있는 걸로 만든다 (CLAUDE.md) | 카탈로그 전체 | 준수 — FlatLayout, EmptyState 등 기존 부품 활용 | — | |
| P6 | surface 소유 속성에 last-mile 금지 (feedback_surface_no_lastmile) | demo visual styling | 준수 — visual UI 작업 시 ax() surface 축 사용 | — | |
| P7 | 레이어 의존 순서 (CLAUDE.md) | catalogLoader 위치 | 준수 — pages 레이어에 위치, ui를 import | — | |
| P8 | UI 컴포넌트만 노출, primitives 숨김 (feedback_ui_over_primitives) | 카탈로그 노출 범위 | 준수 — ui/ 레벨만 카탈로그에 표시 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | uiProgressStore.ts의 `ui/*.tsx` glob | `*.demo.tsx` 파일이 glob에 잡혀 progress 계산에 포함됨 | 중 | uiProgressStore에서 `.demo.tsx` 제외 필터 추가 | |
| E2 | ui-showcase-coverage.integration.test | components 배열 길이 단언이 깨질 수 있음 | 저 | 이 PRD 범위에서는 기존 showcaseRegistry를 건드리지 않음. 카탈로그는 별도 라우트 | |
| E3 | ShowcaseDemo의 slug 해석 | 공존 기간 중 slug 충돌 가능 | 저 | 카탈로그는 `/catalog` 라우트, showcase는 `/ui` 라우트로 분리 유지 | |
| E4 | 번들 사이즈 | 75개 demo를 eager import하면 초기 번들 증가 | 중 | `eager: false` + React.lazy로 코드 스플리팅 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | 중앙 registry 파일에 demo를 수동 등록 | ⑤ P3 OCP | 현재 병목의 원인. glob 자동 수집만 허용 | |
| F2 | PageCatalog에서 useAria/useAriaZone 직접 사용 | ⑤ P4 | FlatLayout ui/ 컴포넌트를 통해야 함 | |
| F3 | demo.tsx에서 style={} 사용 | ⑤ P1 | ax()만 사용 | |
| F4 | demo.tsx에서 showcaseFixtures 의존 | 설계 | co-location 원칙 — demo는 자기 fixture를 소유 | |
| F5 | eager: true로 전체 demo glob | ⑥ E4 | 번들 사이즈. lazy loading 필수 | |
| F6 | 기존 showcaseRegistry 삭제 | ⑥ E2/E3 | 공존 후 점진적 대체 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 동기 | `/catalog` 진입 시 카테고리별 컴포넌트 목록이 렌더링된다 | 6개 카테고리(ui, indicator, item, cell, panel, composite) 섹션이 보임 | |
| V2 | S2 동기 | `Foo.demo.tsx` 파일 추가 후 카탈로그 새로고침 | Foo가 해당 카테고리에 자동 표시 | |
| V3 | S3 동기 | demo 없는 컴포넌트 확인 | 이름 + "demo 없음" 플레이스홀더가 표시되어 갭 가시화 | |
| V4 | ④ 경계 | demo에서 throw Error 발생 | 해당 demo만 에러 fallback, 나머지 정상 | |
| V5 | ④ 경계 | 75개 demo가 있을 때 초기 로드 | lazy loading으로 뷰포트 근처만 로드, 스크롤 시 추가 로드 | |
| V6 | ⑥ E1 | uiProgressStore가 demo 파일을 progress에 포함하지 않는다 | `*.demo.tsx` 필터링 확인 | |
| V7 | ⑤ P2 | demo 함수를 vitest에서 import하여 render할 수 있다 | `import { demo } from './ListBox.demo'` → render(demo()) → 에러 없음 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
