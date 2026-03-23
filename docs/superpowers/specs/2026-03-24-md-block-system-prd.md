# MD Block System — PRD

> Discussion: 모든 페이지를 MD 기반으로 통일하되, 기술 제품 홈페이지 품질 유지. showcase(.tsx)와 area(.md)의 이원 구조를 MD + 시각 블록 inject로 통합.

## Scope

- **홈페이지(카드 그리드 오버뷰):** React 컴포넌트로 유지 (변경 없음)
- **개별 상세 페이지:** .tsx → docs/2-areas/ MD로 전환, 데모를 ```tsx render로 embed
- **AreaSidebar:** glob 자동 감지로 신규 MD 페이지가 자동으로 네비게이션에 추가

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | 개발자가 홈페이지에서 Accordion 카드 클릭 → 상세 페이지 진입 | 페이지 전환 | area(Axes) 페이지와 같은 prose 기반 레이아웃으로 렌더링된다 (이질감 없음) | |
| M2 | 새 패턴/축/플러그인을 문서화할 때 | docs/2-areas/에 .md 파일 하나 작성 | 라이브 데모 + prose + 키보드 테이블이 한 파일에서 완성. sidebar에 자동 등록 | |
| M3 | 기존 showcase .tsx를 MD로 전환할 때 | Demo 컴포넌트를 추출하고 .md에서 embed | 기존과 동일한 인터랙티브 경험 유지 + prose 문서 추가 가능 | |

완성도: 🟢 ✅

## ② 산출물

> 기존 인프라: MdPage.tsx + remarkRender.ts + parseJsx.ts + mdComponents.ts
> ```` ```tsx render ```` 블록 안에 `<ComponentName prop="value" />` → parseJsx가 파싱 → mdComponents에서 컴포넌트 조회 → 렌더링

### 전환 전후 비교

**Before (PageAccordion.tsx):**
```tsx
export default function PageAccordion() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Accordion</h2>
        <p className="page-desc">Expandable sections following W3C APG</p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>
      </div>
      <div className="card"><Accordion data={data} ... /></div>
      <ApgKeyboardTable {...apgAccordion} />
    </div>
  )
}
```

**After (accordion.md):**
```md
# Accordion

> Expandable sections following W3C APG accordion pattern.

`↑↓` navigate  `Enter` toggle  `Home` first  `End` last

```tsx render
<AccordionDemo />
`` `

## Keyboard Shortcuts

```tsx render
<ApgTable pattern="accordion" />
`` `
```

### 산출물 목록

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| **Demo 컴포넌트 추출** | 기존 PageXxx.tsx에서 데모 부분을 독립 컴포넌트로 추출 (AccordionDemo, TreeDemo 등). 데이터 + 렌더링 자체 포함. | |
| **ApgTable 래퍼** | 기존 ApgKeyboardTable을 mdComponents 호환 래퍼로 감싸기. `pattern` prop으로 apg-data에서 데이터 선택. | |
| **mdComponents 확장** | 추출된 Demo + ApgTable을 레지스트리에 등록 | |
| **showcase .md 파일** | docs/2-areas/{patterns,plugins,...}/ 에 MD 파일 생성. 1차: Accordion, Tree, Listbox, Disclosure, Dialog (대표 5개) | |
| **routeConfig 전환** | 1차 대상 5개 라우트를 `{ component: PageXxx }` → area MD 경로로 전환. 홈페이지 카드 클릭 → area 상세 페이지 | |
| **홈페이지 카드 링크 변경** | 카드 클릭 시 기존 /internals/pattern/accordion → /internals/area/patterns/accordion 으로 이동 | |

완성도: 🟢 ✅

## ③ 인터페이스

> 이 시스템은 키보드 인터랙션 대상이 아님 — 콘텐츠 렌더링 파이프라인.
> 입력 = MD 파일 작성, 출력 = 렌더링된 페이지.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| MD 파일에 `# Title` 작성 | 빈 페이지 | h1이 page title로 렌더링 | AreaViewer.module.css의 prose h1 스타일이 적용 | 29px 700 title 표시 | |
| MD 파일에 `> description` 작성 | title만 있음 | blockquote가 설명으로 렌더링 | prose blockquote 스타일 (secondary color, left border) | title 아래 설명 표시 | |
| MD 파일에 `` `키` hint `` 인라인 코드 작성 | title + desc | 인라인 코드가 키 힌트로 렌더링 | prose inline code 스타일 (mono, background) | 키보드 힌트 줄 표시 | |
| MD 파일에 ```` ```tsx render\n<AccordionDemo />\n``` ```` 작성 | 키 힌트까지 표시 | remarkRender가 base64 인코딩 → MdPage가 디코딩 → parseJsx가 파싱 → mdComponents에서 AccordionDemo 조회 → 렌더링 | 기존 ```tsx render 메커니즘 (remarkRender.ts + parseJsx.ts) | 라이브 데모 위젯 표시 | |
| MD 파일에 `## Heading` + prose 작성 | 데모 아래 | h2 + p가 prose 스타일로 렌더링 | AreaViewer.module.css heading/body 스타일 | 데모 아래 문서 섹션 표시 | |
| MD 파일에 `<ApgTable pattern="accordion" />` 작성 | 문서 섹션 아래 | ApgTable이 apg-data에서 accordion 데이터 조회 → 키보드 테이블 렌더링 | mdComponents 레지스트리에서 ApgTable 조회, pattern prop으로 데이터 선택 | W3C APG 키보드 테이블 표시 | |
| mdComponents에 없는 컴포넌트명 사용 | 어떤 상태든 | parseJsx가 이름을 파싱하지만 레지스트리에 없음 | 레지스트리 miss → 빈 렌더링 (에러 아님) | 해당 블록 자리가 비어있음 (콘솔 경고) | |
| 홈페이지 카드 클릭 | 홈페이지 그리드 | 카드 링크가 /internals/area/patterns/accordion 으로 navigate | 기존 area 라우트 인프라가 처리 — MdPage가 docs/2-areas/patterns/accordion.md 로드 | area 상세 페이지 표시, sidebar에 해당 항목 활성화 | |

완성도: 🟢 ✅

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| Demo 컴포넌트가 내부 state를 가짐 (Accordion 펼침 상태 등) | MD 렌더링 완료 | 각 Demo는 독립 state를 가져야 함 — 다른 블록에 영향 없이 인터랙션 가능해야 하므로 | Demo가 자체 useState/store로 동작, 외부 의존 없음 | 사용자가 demo와 인터랙션, 다른 블록 무영향 | |
| MD 파일이 존재하지 않는 경로로 접근 | 라우트는 있지만 MD 파일 없음 | 404가 아닌 빈 상태를 보여주면 혼란 | MdPage가 glob에서 파일 못 찾으면 "페이지를 찾을 수 없습니다" 표시 | 에러 메시지 표시 | |
| 하나의 MD에 ```tsx render 블록이 5개 이상 | 복잡한 showcase 페이지 | 여러 데모가 한 페이지에 공존하는 것은 자연스러움 (Combobox 페이지처럼) | 각 블록이 독립적으로 렌더링, 순서는 MD 순서대로 | 모든 블록 정상 표시 | |
| 기존 .tsx 라우트와 .md 라우트가 동시에 존재하는 전환기 | 점진적 마이그레이션 | 일부는 .tsx, 일부는 .md — 둘 다 동작해야 전환 가능 | routeConfig에서 component와 md를 모두 지원, 라우트별 선택 | 두 방식 공존 | |
| parseJsx에서 표현 불가능한 complex props (객체, 배열, 함수) | Demo에 복잡한 설정 필요 | parseJsx는 string/boolean만 지원 — 복잡한 데이터는 Demo 내부에 캡슐화해야 | Demo 컴포넌트가 자체적으로 데이터를 import하고 내부에 하드코딩 | Demo가 외부 props 없이 자체 완결 | |

완성도: 🟢 ✅

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 파일명 = 주 export 식별자 (CLAUDE.md) | Demo 컴포넌트 파일명 | ✅ 준수 | AccordionDemo.tsx → export function AccordionDemo | |
| P2 | MDX 제거, 순수 MD + ```tsx render (project_md_content_system) | ③ 렌더링 경로 | ✅ 준수 | 기존 remarkRender 메커니즘 그대로 사용, MDX 도입 안 함 | |
| P3 | barrel export 금지 (CLAUDE.md) | mdComponents.ts | ✅ 준수 | 개별 import, barrel 아닌 레지스트리 객체 | |
| P4 | 테스트: 계산=unit, 인터랙션=통합 (CLAUDE.md) | ⑧ 검증 | ✅ 준수 | Demo 컴포넌트의 인터랙션은 기존 통합테스트에서 커버. MD 렌더링은 브라우저 확인. | |
| P5 | FSD 아키텍처 (CLAUDE.md) | Demo 파일 위치 | ✅ 준수 | src/pages/demos/ 디렉토리. 기존 axis/ demos를 여기로 이동. mdComponents.ts가 일괄 import. | |
| P6 | 하나의 앱 = 하나의 store (feedback_one_app_one_store) | Demo 내부 state | ✅ 준수 | 각 Demo가 자체 로컬 store/state, 전역 store 오염 없음 | |
| P7 | UI 컴포넌트만 노출, Aria primitives 노출 금지 (feedback_ui_over_primitives) | Demo가 보여주는 것 | ✅ 준수 | Demo는 UI 완성품(Accordion, TreeView 등)을 사용 | |

완성도: 🟢 ✅

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | routeConfig.ts — 기존 component 라우트 제거 | 홈페이지 카드 링크가 깨질 수 있음 | 중 | 카드 링크를 동시에 업데이트, 점진적 전환 (1차 5개만) | |
| S2 | AreaSidebar — 새 MD가 추가되면 sidebar 트리 변경 | 기존 L2 섹션(Patterns 등)에 새 항목이 갑자기 나타남 | 낮 | 허용 — 자동 감지가 의도된 동작 | |
| S3 | mdComponents.ts — 레지스트리 크기 증가 | 번들 크기 증가 (Demo 컴포넌트 import) | 중 | lazy import로 코드 스플리팅. 또는 1차는 그냥 static import (5개면 무시 가능) | |
| S4 | 기존 PageXxx.tsx — 전환 후 dead code | 사용하지 않는 파일이 남음 | 낮 | 전환 완료된 .tsx는 삭제 | |
| S5 | 홈페이지 카드 그리드의 status badge (tested 등) | MD에는 status 정보가 없음 | 중 | routeConfig에서 status를 유지하거나, MD frontmatter로 이전 | |

완성도: 🟢 ✅

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | MDX 도입 | P2 (MD content system 결정) | 프로젝트가 MDX를 의도적으로 제거함. ```tsx render로 충분 | |
| F2 | Demo에 외부 props 전달에 의존 | ④ 경계 (parseJsx 한계) | parseJsx는 string/boolean만 지원. Demo는 자체 완결 필수 | |
| F3 | 전환 기간에 같은 페이지의 .tsx와 .md 라우트 동시 존재 | S1 (라우트 충돌) | 하나의 경로에 하나의 소스. 전환 시 .tsx 라우트 제거 → .md 추가 atomic하게 | |
| F4 | Demo 컴포넌트에서 전역 store 참조 | P6 (one app one store) | 독립 실행 가능해야 함. 페이지 간 상태 오염 방지 | |

완성도: 🟢 ✅

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | M1 | 홈페이지 → Accordion 카드 클릭 → 상세 페이지 | prose 기반 레이아웃, 라이브 데모 동작, sidebar에 Accordion 활성화 | |
| V2 | M2 | docs/2-areas/patterns/에 새 .md 파일 추가 | sidebar Patterns 섹션에 자동 등록, 클릭 시 렌더링 | |
| V3 | M3 | AccordionDemo에서 ↑↓ Enter 키보드 조작 | 기존 PageAccordion.tsx와 동일한 인터랙션 | |
| V4 | ④-1 | Demo 컴포넌트 내부 state 변경 (펼침/접힘) | 다른 ```tsx render 블록에 영향 없음 | |
| V5 | ④-2 | 존재하지 않는 MD 경로 접근 | 에러 메시지 또는 404, 크래시 없음 | |
| V6 | ④-4 | 전환기: .tsx 라우트 5개 제거 + .md 5개 추가 | 기존 url로 접근 시 정상 동작 (리다이렉트 또는 직접) | |
| V7 | S5 | 홈페이지 카드에 status badge 표시 | 전환된 페이지도 tested/ready badge 유지 | |

완성도: 🟢 ✅

---

**전체 완성도:** 🟢 8/8
