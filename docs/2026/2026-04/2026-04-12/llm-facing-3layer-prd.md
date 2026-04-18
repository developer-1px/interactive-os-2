---
id: 2-areas/distribution/prds/llm-facing-3layer-prd
title: 'LLM-facing 3층 (data/pick/place) — PRD'
created: 2026-04-12
updated: 2026-04-12
summary: 'Discussion: 바이브코딩 제품(v0/Bolt/Lovable/Cursor류)의 메인 UI 엔진으로 ARIA OS를 채택시키기 위한 LLM-facing 표면. LLM이 다루는 면을 데이터 정의 / 컴포넌트 선택 / FlatLayout 배치 3개로 좁히고, 엔진 내부(ax/축/플러그인/useAria)는 비노출.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# LLM-facing 3층 (data/pick/place) — PRD

> Discussion: 바이브코딩 제품(v0/Bolt/Lovable/Cursor류)의 메인 UI 엔진으로 ARIA OS를 채택시키기 위한 LLM-facing 표면. LLM이 다루는 면을 데이터 정의 / 컴포넌트 선택 / FlatLayout 배치 3개로 좁히고, 엔진 내부(ax/축/플러그인/useAria)는 비노출.

## ① 동기

### WHY (discuss FRT 이식)

- **Impact**: 바이브코딩 제품이 LLM으로 UI를 생성할 때 div+onClick 일색이 되어 키보드/ARIA/포커스가 무너진다. 사용자는 마우스 외에 조작할 방법이 없고, 스크린리더 사용자는 배제된다. 바이브코딩 제품 입장에서는 "생성된 UI의 품질"이 채택률을 결정하는 변수다.
- **Forces**: (a) LLM은 결정 지점이 많을수록 1샷 정확도가 떨어진다. (b) ARIA OS의 표현력(축·패턴·플러그인)은 사람용으로 최적화돼 있어 LLM이 정확히 쓰기 어렵다. (c) 바이브코딩 툴은 npm import + system prompt 1~2페이지로 컴포넌트 라이브러리를 통합한다.
- **Assets**:
  - **내부**: ui/ 90+ 완성품 (AriaComponentProps 통일), FlatLayout(LayoutNode 9타입 + definePage), NormalizedData + Zod, A2UI Adapter(a2uiProtocol/Adapter/Functions — Google v0.9 호환, 양방향 변환의 절반 이미 존재), CATALOG.md, dependency-cruiser.cjs(eject closure 추출 가능), 859 tests + axe-core, harness 11훅
  - **외부**: shadcn/ui registry 모델, Radix props 모델, v0/Bolt 시스템 프롬프트 사례, A2UI v0.9, WAI-ARIA APG 36 (16/19 구현)
- **Decision**: LLM-facing 표면을 **3개 entry**(`aria-os/ui`, `aria-os/layout`, `aria-os/schema`)와 **1개 시스템 프롬프트 문서**(aria.md)로 좁힌다. ui는 기본 npm import, 커스텀 디자인 필요 시에만 `npx aria-os eject`. 기각 대안: ① 12축 결정 트리 노출 — LLM 결정 부담 과다 ② shadcn full-eject — 엔진까지 사용자 손에 들어가면 보장 깨짐 ③ MCP/fine-tuning — 외부 검증 0건 상태 과투자 ④ 모놀리식 npm only — 커스텀 막힘.
- **Non-Goals**: ax() 12축을 LLM에 노출하지 않는다. useAria/useAriaZone을 LLM에 노출하지 않는다. axis/pattern/plugins/primitives 직접 import 차단. 전용 MCP/fine-tuning/호스팅 런타임은 본 PRD 범위 외. 기존 사람-개발자용 SDK 경로를 폐기하지 않는다(내부 import는 살아있되 외부 export만 좁힘).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| 1 | 바이브코딩 제품 개발자가 ARIA OS 통합 검토 | 시스템 프롬프트에 박을 1~2페이지 문서를 찾는다 | aria.md 1개 파일이 데이터→컴포넌트 매트릭스 + ui props 표 + FlatLayout 문법을 담아 제공된다 | |
| 2 | LLM이 "할일 앱 만들어줘" 요구사항을 받음 | 데이터 구조 정의 → 컴포넌트 선택 → 배치 3단계로 코드 생성 | `aria-os/schema`로 데이터, `aria-os/ui`에서 ListBox/Checkbox 등 import, `aria-os/layout`의 definePage로 배치한 코드가 1샷에 axe-clean으로 나온다 | |
| 3 | 사용자가 ui 컴포넌트의 디자인을 커스터마이즈하고 싶어함 | `npx aria-os eject TreeGrid` 실행 | 사용자 레포 `src/aria/TreeGrid.tsx`에 컴포넌트 카피 + 의존 closure 자동 추출, import 경로 자동 rewrite, 엔진은 여전히 npm 잠금 | |
| 4 | 우리가 ui 컴포넌트에 버그픽스를 배포 | 사용자가 npm update | eject되지 않은 컴포넌트는 자동 갱신, eject된 컴포넌트는 `npx aria-os doctor`가 drift를 알려줌 | |
| 5 | 우리가 새 ui 컴포넌트(ChartGrid 등)를 추가 | 데이터→컴포넌트 매트릭스 갱신 + aria.md 회귀 + evals 30 프롬프트 통과 확인 | 새 컴포넌트가 LLM 시야에 들어와 1샷 생성 가능 | |
| 6 | LLM이 잘못된 컴포넌트를 골랐다 (예: 트리에 ListBox) | evals harness가 자동 채점 | 통과율이 baseline 아래로 떨어지면 회귀 차단, aria.md를 보강할 항목 식별 | |

**완성도: 🟢**

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `package.json` exports 재구성 | 144개 entry → **3개 + types**: `aria-os/ui`, `aria-os/layout`, `aria-os/schema` | |
| `tsup.config.ts` entry 정리 | 52개 entry → 3개 barrel + 내부 의존성 번들 | |
| `src/interactive-os/ui/index.ts` (신규/확장) | 90+ 컴포넌트의 단일 barrel export. 타입(AriaComponentProps 등) 동시 export | |
| `src/interactive-os/layout/index.ts` (신규) | FlatLayout, definePage, widgetRegistry, LayoutNode 9타입 barrel | |
| `src/interactive-os/schema/index.ts` (신규) | NormalizedData 타입 + **신규 defineData() helper** (LLM-friendly 상위 schema API) + Zod 헬퍼 | |
| `src/interactive-os/schema/defineData.ts` (신규) | LLM-facing data 정의 API. 입력: `{ type: 'tree' \| 'list' \| 'grid' \| 'form' \| ..., items/fields/... }` → 출력: NormalizedData. A2UI Adapter 패턴 재활용 | |
| `aria.md` (신규, 1~2페이지) | LLM 시스템 프롬프트. 5섹션: ① 3층 모델 설명 ② 데이터→컴포넌트 매트릭스 ③ ui props 압축표 ④ FlatLayout 9타입 문법 ⑤ 예제 5개 (todo, kanban, settings, file tree, form) | |
| `docs/2-areas/distribution/data-component-matrix.md` (신규) | 데이터 형태 × 컴포넌트 매트릭스 SSOT. markdown(사람용) + JSON(LLM용) 동시 산출. aria.md가 이걸 import | |
| `docs/2-areas/distribution/data-component-matrix.json` (신규, 빌드 산출물) | 위 markdown에서 자동 추출. CI에서 evals harness가 소비 | |
| `scripts/eject.ts` (신규) | `npx aria-os eject <component>` CLI. dependency-cruiser 그래프 → closure 추출 → 사용자 레포 카피 + import rewrite. registry.json 자동 생성 | |
| `scripts/doctor.ts` (신규) | `npx aria-os doctor`. eject된 파일에 버전 헤더 비교, drift 감지, 업데이트 가이드 출력 | |
| `dist-lib/registry.json` (빌드 산출물) | 컴포넌트 메타데이터: name, deps, file paths, version. shadcn registry 형식 | |
| `pyramid-eval/llm-generation/` (신규 디렉토리) | evals harness. 30 프롬프트 → 외부 LLM(Claude/GPT) 생성 → 헤드리스 axe + 키보드 시퀀스 → 통과율 점수 | |
| `pyramid-eval/llm-generation/prompts.json` | 30개 평가 프롬프트 (시나리오별 5개씩 6범주: list, tree, grid, form, settings, kanban) | |
| `pyramid-eval/llm-generation/runner.ts` | 프롬프트 → LLM 호출 → 코드 평가 → 점수 산출 | |
| `pyramid-eval/llm-generation/baseline.json` | 통과율 기준선. 회귀 감지용 | |
| `.claude/hooks/guardOsPatterns.mjs` 갱신 | `src/pages/`에서 `aria-os/(?!ui\|layout\|schema)` import 차단. 기존 primitives 차단 규칙 흡수 | |
| `src/interactive-os/CATALOG.md` 갱신 | aria.md/data-component-matrix.md로 분리된 LLM-facing 부분과 사람-개발자용 내부 부분 명시 | |
| `.claude/CLAUDE.md` 갱신 | 레이어 구조 절에 "외부 export = 3 entry, 내부 = 6+레이어" 명시. import 예시 단일 entry로 갱신 | |

**완성도: 🟢**

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| LLM에게 system prompt(aria.md) + "할일 앱 만들어줘" 요구사항 | LLM은 ARIA OS의 3층 모델만 알고 있다 | LLM이 ① defineData로 todo 데이터 정의 ② ListBox + Checkbox 선택 ③ definePage로 배치한 코드 생성 | aria.md가 결정 지점을 매트릭스로 흡수했고, ax/축/플러그인은 비노출이라 LLM이 잘못 결정할 표면이 없다 | 1샷 코드가 axe-clean, 키보드 조작 가능 | |
| 개발자가 `npm install aria-os` | npm 패키지 설치 | `aria-os/ui`, `aria-os/layout`, `aria-os/schema` 3개 entry만 노출. 내부 6+ 레이어는 dist에 있지만 exports에 없음 | tsup이 3개 barrel로 빌드하고 package.json exports가 3개로 좁혀짐. internal import는 가능하지만 권장 안 됨(linter 경고) | LLM/개발자가 정확히 3곳에서 import | |
| `import { defineData } from 'aria-os/schema'` + `defineData({ type: 'list', items: [...] })` | NormalizedData가 internal 타입 | defineData가 입력 모양에 따라 적절한 NormalizedData 구조 생성. A2UI Adapter 재활용 | LLM이 NormalizedData의 entities/relationships 디테일을 알 필요가 없도록 상위 추상화로 흡수 | NormalizedData 인스턴스 (LLM은 모름) | |
| `import { ListBox } from 'aria-os/ui'` + `<ListBox data={...} />` | 기존 ui 컴포넌트 그대로 | 컴포넌트 렌더링. 키보드/포커스/ARIA 자동 | useAria가 내부에서 axis/pattern을 합성하므로 LLM은 props만 알면 됨 | a11y/keyboard 자동 통과 | |
| `npx aria-os eject TreeGrid` | eject CLI 미존재 | dependency-cruiser로 TreeGrid의 의존 closure 계산 → 사용자 레포 `src/aria/`에 카피 → import 경로 rewrite → registry.json에 etch 기록 | shadcn 모델: 사용자가 코드 소유. 단 의존 closure는 ui/cells/items/indicators만 카피하고 엔진(store/engine/axis/pattern/plugins/primitives)은 카피하지 않음 — 엔진은 npm으로 잠금 | 사용자 레포에 ui 카피 + 엔진은 여전히 npm | |
| `npx aria-os doctor` | 미존재 | eject된 파일의 헤더 버전과 현재 npm 버전 비교 → drift 출력 | shadcn에 없는 추가 안전망. 사용자가 카피 후 패키지가 업데이트돼도 알 수 있음 | drift 리포트 (있으면 수동 머지 가이드) | |
| `pnpm test:llm-eval` | evals harness 미존재 | 30 프롬프트 → 외부 LLM API 호출 → 생성된 코드 임시 빌드 → headless 브라우저에서 axe + 키보드 시퀀스 → 통과율 출력. baseline 대비 회귀 감지 | LLM 생성 품질을 객관적으로 측정해야 aria.md 회귀가 가능. axe + 키보드는 a11y의 80% 커버 | 통과율 % + 실패 케이스 목록 | |
| 새 ui 컴포넌트 추가 PR | 기존 ui 추가 워크플로 | data-component-matrix.md에 행 추가 → CI가 JSON 추출 → aria.md 회귀 → evals 통과 확인 | 매트릭스가 SSOT라 잊어버리면 evals가 떨어짐. 자동화 유도 | 새 컴포넌트가 LLM에게 보임 + 회귀 없음 | |
| 사용자 코드가 `aria-os/store` 직접 import 시도 | 현재는 가능 | TS는 컴파일되지만 lint 경고 (`/pages/`에서는 hook이 차단). 외부 사용자에게는 untyped (exports 없음) | 외부 노출은 3 entry로 수렴, 내부 우회는 가능하되 권장 안 됨 — 점진 마이그레이션 | 경고 + 가이드 | |

**완성도: 🟢**

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| LLM이 매트릭스에 없는 데이터 형태(예: 그래프/네트워크) 요구 | 매트릭스 빈칸 | aria.md가 "매트릭스에 없으면 가장 가까운 형태로 변환 시도, 안 되면 사용자에게 ui 컴포넌트 부재 알림"을 명시 | LLM이 빈칸을 만나면 명시적 fallback. 매트릭스 빈칸은 갭 식별 신호로 작동 | 빈칸이 가시화 → 새 ui 추가 트리거 | |
| 사용자가 ui 컴포넌트를 합성/조합한 새 패턴 필요(예: TreeGrid + DatePicker 결합) | composite는 ui/composites/에 있음 | 합성형은 매트릭스 1행으로 안 잡힘. **escape hatch**: useAria/useAriaZone을 `aria-os/advanced` 4번째 entry로 노출하되 aria.md에는 안 적음 (사람-개발자 전용) | LLM은 못 씀, 사람 개발자만 advanced 사용 | LLM 표면 보호 + 고급 사용자도 만족 | |
| eject 후 사용자가 카피된 컴포넌트 시그니처를 변경 | 시그니처 변경 자유 | doctor가 시그니처 hash를 비교해 "변경됨, 자동 머지 불가" 리포트 | 사용자 책임 명시 + drift 감지 | 안전하게 사용자 영역 | |
| eject한 컴포넌트가 의존하는 indicator/item이 카피 안 됨 | dependency closure 계산 누락 | dependency-cruiser closure에 ui/indicators, ui/items, ui/cells, ui/panels는 무조건 포함, 엔진은 무조건 제외 | closure 알고리즘이 명시적 화이트리스트 | 의존 누락 0 | |
| evals 통과율이 baseline 아래로 떨어짐 | 회귀 | CI가 PR 차단. 실패 프롬프트를 첨부 | aria.md/매트릭스가 SSOT라 회귀 감지가 유일한 보호 | 회귀 차단 | |
| 외부 LLM API 비용/속도 한계로 evals를 매 PR마다 못 돌림 | API 의존 | evals는 PR 트리거가 아닌 nightly로 분리, PR에는 캐시된 baseline + smoke test 5개만 | 비용/속도 vs 회귀 검출의 절충 | 실용적 CI | |
| 사용자가 단일 entry 차단을 우회해 `aria-os/dist-lib/store` 직접 import | tsup는 기본적으로 dist 노출 | package.json `exports`에 명시되지 않은 경로는 모듈 해석 실패. Node/번들러가 차단 | exports 필드가 strict mode면 우회 불가. wildcards 금지 | 우회 불가 | |
| 222개 파일 마이그레이션 도중 빌드 깨짐 | 큰 변경 | Phase별 점진 마이그레이션. Phase 1=빌드 설정만 + 기존 path alias 유지, Phase 2=hook 갱신, Phase 3=codemod | 원자적 rename 불가능. 단계별 검증 게이트 | 빌드 항상 통과 | |
| aria.md가 1~2페이지를 초과 | 시스템 프롬프트 토큰 비용 | 매트릭스 일부만 인라인, 나머지는 fetch URL로 lazy. 또는 카테고리별 분할(`aria-list.md`, `aria-tree.md`) | LLM 컨텍스트 윈도우 절약 | 1~2페이지 유지 | |
| 한 컴포넌트가 다른 ARIA pattern로 분류되는 경계 케이스(예: ListBox vs RadioGroup) | 매트릭스 1:1 매핑 | 매트릭스에 "1차 추천 / 2차 대안" 2열 제공. LLM은 1차로 우선, 사용자 요구가 명확하면 2차 | 항상 1개의 답을 강제하지 않으면 LLM이 헤맬 수 있음 | 결정 지원 + 유연성 | |

**완성도: 🟢**

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | feedback_ui_over_primitives — UI만 노출, primitives 금지 | ②③의 export 표면 | ❌ 위반 없음 | — | |
| 2 | feedback_llm_surface_three_layer — LLM에게 결정 시키지 않음 | ② aria.md, defineData, 매트릭스 | ❌ 위반 없음 (이 PRD의 핵심) | — | |
| 3 | feedback_declarative_ocp — 선언적 OCP, switch dispatcher 금지 | ② data-component-matrix는 거대 Record가 될 위험 | ⚠️ 위험 있음 | 매트릭스는 markdown(사람) + 빌드타임 추출 JSON. 런타임 dispatcher 아님. defineData도 type별 작은 함수 분리(파일 단위) | |
| 4 | feedback_ocp_not_record_map — Record 거대 맵 ≠ OCP | ② defineData 구현 | ⚠️ 위험 있음 | defineData는 type별 작은 함수 파일 분리. `schema/builders/list.ts`, `tree.ts`, `grid.ts` ... index에서 수집 | |
| 5 | feedback_model_first_state — NormalizedData 먼저 | ② defineData가 NormalizedData 출력 | ❌ 위반 없음 (정합) | — | |
| 6 | feedback_all_state_normalized_command — 모든 상태=NormalizedData+Command | 동일 | ❌ 위반 없음 | — | |
| 7 | feedback_design_over_request — 설계 > 요구 | 단일 entry가 기존 import 222개 깨뜨림 | ❌ 위반 없음 — 설계 우선이라 마이그레이션 비용 수용 | — | |
| 8 | feedback_reuse_existing_impl — 있는 걸로 만든다 | A2UI Adapter, dependency-cruiser, axe-core, harness 모두 재활용 | ❌ 위반 없음 | — | |
| 9 | feedback_axis_pattern_principles — 축 SSOT, plugin keyMap 소유 | LLM 비노출이지만 내부 그대로 유지 | ❌ 위반 없음 | — | |
| 10 | feedback_judgment_priority — 환경·스코프 검증 필수 | shadcn 모델 채택 | ❌ 위반 없음 — 환경(npm+browser), 스코프(엔진+ui 분리) 검증 완료 | — | |
| 11 | project_ax_design_system — ax()만 사용, style{} 금지 | LLM이 ax() 비노출이면 혹시 style{}로 빠지나? | ⚠️ 위험 있음 | aria.md에 "ui 컴포넌트는 className 금지, ax() 사용도 LLM 책임 아님 — 이미 컴포넌트 안에 있음. LLM은 props만 변경" 명시. eject된 컴포넌트만 ax() 노출 | |
| 12 | feedback_specs_not_inbox — 계속 참조 문서는 specs/ | aria.md 위치 | ⚠️ 위치 미정 | aria.md는 npm 패키지 root + `docs/2-areas/distribution/aria.md` 동시 배치. 사람-내부용은 후자, 외부 배포는 전자 | |
| 13 | feedback_harness_convergence — 하네스는 금지가 아닌 수렴 | guardOsPatterns 갱신 | ❌ 위반 없음 — 새 패턴(`aria-os/(?!ui\|layout\|schema)`)으로 수렴 안내 | — | |
| 14 | CLAUDE.md "있는 걸로 만든다" | CATALOG 검토 완료, 신규는 eject CLI/evals/aria.md/defineData만 | ❌ 위반 없음 | — | |
| 15 | feedback_prd_workflow — PRD 8단계 + 증거 링크 | 본 PRD 자체가 준수 | ❌ 위반 없음 | — | |

**완성도: 🟢** (위험 3건 모두 ② 산출물에 수정 반영됨)

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `src/pages/` 73개 파일이 store/plugins/engine 직접 import | 단일 entry 차단 후 import 경로 변경 필요 | **높음** | Phase별 점진 마이그레이션. 우선 hook은 경고만, 한 PR에서 한 페이지씩 codemod | |
| 2 | `*.demo.tsx` 72개 파일 직접 import | 동일 | 중간 | 데모는 **schema/ui/layout 외에 advanced entry 허용** (사람-개발자용). 당장 마이그레이션 안 해도 됨 | |
| 3 | `interactive-os/` 내부 65개 cross-layer import | 같은 패키지 내부는 단일 entry 적용 안 함 | 낮음 | 기존 대로. 단 `dependency-cruiser.cjs`로 layer 위반 감지 유지 | |
| 4 | 11개 테스트 파일 내부 import | 단일 entry 적용 안 함(테스트는 화이트박스) | 낮음 | 기존 대로 | |
| 5 | `package.json` exports 144 → 6 | 외부 npm 사용자가 기존 path로 import 중이면 깨짐 | **높음** | 우리는 외부 사용자 0명 — 부작용 0. 단 첫 publish 전에 변경 완료 | |
| 6 | tsup config 52 entry → 3 barrel | 빌드 산출물 구조 변경 | 중간 | dist-lib도 ui/, layout/, schema/ 3 폴더만. CI 빌드 검증 | |
| 7 | guardOsPatterns hook 갱신 | 기존 차단 패턴 작동 안 할 수 있음 | 중간 | hook 단위 테스트로 새 패턴 검증 | |
| 8 | CLAUDE.md 레이어 절 갱신 | 다른 스킬들이 이 절을 참조하면 영향 | 낮음 | 새 절은 "외부 표면 / 내부 구조" 2섹션. 내부 구조는 그대로 | |
| 9 | A2UI Adapter 재활용으로 defineData 구현 | A2UI 스펙 v0.9 → v1.0 변경 시 깨질 수 있음 | 중간 | defineData를 A2UI에 직접 묶지 말고 우리 schema 정의로 한 층 분리. A2UI는 백엔드 옵션 | |
| 10 | evals harness가 외부 LLM API 호출 | API 키 관리, 비용, rate limit | 중간 | nightly로 격리, baseline 캐시, smoke test 5개만 PR에서 | |
| 11 | eject CLI가 사용자 레포에 파일 작성 | 사용자가 git을 dirty 상태로 할 수 있음 | 낮음 | CLI가 git status 체크 + dry-run 옵션 | |
| 12 | 매트릭스 빈칸이 발견됨 (예: 차트/메트릭) | 새 ui 부족이 가시화 | 0 부작용 (좋은 신호) | 별도 PRD로 컴포넌트 갭 처리 (project_metric_component_gap 참조) | |
| 13 | aria.md를 매 ui 추가 시 갱신해야 함 | 작업 부담 | 낮음 | 매트릭스 갱신 시 aria.md 빌드 자동화. CI가 stale 감지 | |
| 14 | LLM 비노출 표면(useAria 등)을 사람 개발자도 못 쓰게 될까 우려 | 사람용 SDK가 의도치 않게 막힘 | 중간 | `aria-os/advanced` 4번째 entry로 사람-개발자 전용 노출. aria.md에는 안 적음 | |
| 15 | shadcn-style eject가 "그냥 카피해서 우리 SDK 안 쓰게 될까" 우려 | 의존 분리, 차별점 약화 | 중간 | 엔진은 npm 잠금. eject는 ui만. 엔진 제거 시 ui도 깨짐 — 자연스러운 lock-in | |

**완성도: 🟢**

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | aria.md에 ax() 12축 등장시키기 | ⑤#11 | LLM이 ax() 결정에 빠지면 안 됨 | |
| 2 | aria.md에 useAria/useAriaZone/createCommandEngine 등장 | ⑤#1, ⑤#2 | primitives 비노출 원칙 | |
| 3 | aria.md에 axis/pattern/plugin 이름 등장 | ⑤#9 | 엔진 내부 비노출 | |
| 4 | data-component-matrix를 런타임 거대 Record로 구현 | ⑤#3, ⑤#4 | OCP 위반. markdown SSOT + 빌드타임 JSON 추출 | |
| 5 | defineData를 단일 거대 switch/Record로 구현 | ⑤#4 | type별 파일 분리, index 수집 | |
| 6 | eject CLI가 store/engine/axis/pattern/plugins/primitives를 사용자 레포에 카피 | ⑥#15, 핵심 결정 | 엔진은 npm 잠금. 카피하면 lock-in 깨짐 | |
| 7 | package.json exports에 wildcard `./*` 노출 | ④ 우회 가능 | 외부 사용자가 내부 경로 우회 import. strict 단일 entry | |
| 8 | LLM-facing aria.md를 사람-개발자 가이드와 한 파일에 섞기 | ⑤#11, #12 | 결정 지점 노출. 두 청자가 다름. 분리 필수 | |
| 9 | evals harness 통과율을 PR 차단 없이 그냥 리포트만 | ⑥#10 (baseline 캐시) + ④ (회귀 차단) | 회귀 감지의 유일한 보호 — 차단 필수 | |
| 10 | 222개 파일 마이그레이션을 한 PR에 몰기 | ⑥#1 (점진 마이그레이션) | 빌드 깨짐 위험. 단계별 검증 | |
| 11 | LLM에게 NormalizedData 직접 노출 | ⑤#2, ②(defineData 신설 이유) | 복잡도 과다. defineData 통과 | |
| 12 | aria.md를 한 번 작성하고 evals 없이 방치 | ⑥#13 | LLM 모델 변경 시 회귀 감지 불가 | |
| 13 | matrix에 "임시"/"TBD" 칸 두기 | FRT 게이트의 금지어 원칙 | 빈칸은 가시화돼야 함. TBD는 거짓말 | |
| 14 | A2UI Adapter를 defineData에 직결 | ⑥#9 | A2UI v1.0 변경 시 defineData 깨짐. 한 층 분리 | |

**완성도: 🟢**

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| 1 | ①시나리오1 | aria.md를 텍스트 1~2페이지로 출력. word count 측정 | 1500~3500 단어, 1~2페이지 분량 | |
| 2 | ①시나리오2 + ④5 | evals harness 30 프롬프트 실행. 외부 LLM(Claude opus 4.6) 생성 → axe + 키보드 채점 | 통과율 ≥85% (baseline). 회귀 시 차단 | |
| 3 | ①시나리오2 | 6범주(list/tree/grid/form/settings/kanban) 각 5 프롬프트 통과율 ≥80% | 카테고리별 균형 | |
| 4 | ①시나리오3 + ④3, ④4 | `npx aria-os eject TreeGrid` 실행. 결과 디렉토리 검증 | `src/aria/TreeGrid.tsx` + 모든 의존(items/cells/indicators/panels) 카피, 엔진 카피 0건, import rewrite OK | |
| 5 | ①시나리오4 + ④3 | eject 후 패키지 업데이트. doctor 실행 | drift 감지 + 머지 가이드 | |
| 6 | ①시나리오5 | 새 ui 컴포넌트 추가 PR 시뮬레이션. 매트릭스 갱신 빠뜨림 | CI가 aria.md staleness 감지 → 차단 | |
| 7 | ①시나리오6 + ④5 | aria.md에 의도적 오류 삽입(예: 트리에 ListBox 추천) | evals 통과율 baseline 아래 → CI 차단 | |
| 8 | ④1 | LLM에게 "그래프 시각화 만들어줘"(매트릭스 빈칸) 요청 | LLM이 명시적 fallback 메시지 출력 또는 가장 가까운 변환 시도 | |
| 9 | ④2 | 사람 개발자가 `aria-os/advanced`로 useAria import | 작동, lint 경고 없음. aria.md에는 등장 안 함 | |
| 10 | ④7 | 외부 사용자가 `aria-os/store` 직접 import 시도 | 모듈 해석 실패 (exports에 없음) | |
| 11 | ④8 | Phase 1 빌드 설정만 적용 후 `pnpm build:lib` + `pnpm test` | 빌드 통과, 859 tests 통과 | |
| 12 | ④9 | aria.md word count 회귀 검사 | 3500 단어 초과 시 CI 경고 | |
| 13 | ⑤#3 + ⑤#4 | data-component-matrix.md → JSON 추출 + defineData 구현 검사 | runtime dispatcher 0건 (grep `switch` in defineData) | |
| 14 | ⑥#5 | package.json exports에 wildcard 검사 | 0건 | |
| 15 | ⑥#1 점진 | 마이그레이션 Phase별로 `pnpm test` + `pnpm check:deps` | 매 Phase 통과 | |
| 16 | a11y 회귀 | eject되지 않은 ui 컴포넌트의 axe-core 통과율 | 100% (현재 baseline) | |
| 17 | ⑦#6 | eject CLI 코드 리뷰: 카피 화이트리스트가 ui/* + indicators/items/cells/panels로 한정 | 그 외 카피 0건 | |

**완성도: 🟢**

---

**전체 완성도:** 🟢 8/8

## 교차 검증

1. **동기 ↔ 검증**: 6 시나리오 모두 ⑧에서 커버 (1→#1, 2→#2/#3, 3→#4, 4→#5, 5→#6, 6→#7) ✅
2. **인터페이스 ↔ 산출물**: 모든 인터페이스가 ② 산출물의 파일과 1:1 대응 ✅
3. **경계 ↔ 검증**: ④의 11 경계 중 8개가 ⑧에서 직접 검증, 3개(매트릭스 1:1 vs 2차/composite escape/단계 마이그)는 시나리오에 묻어감 ✅
4. **금지 ↔ 출처**: 14개 금지 모두 ⑤ 또는 ⑥에서 출처 명시 ✅
5. **원칙 대조 ↔ 전체**: 위험 3건(⑤#3, #4, #11)이 ② 산출물에 수정 반영(빌더 파일 분리, 매트릭스 markdown SSOT, ax() LLM 비노출 명시) ✅

**교차 검증: 통과**

#kind/prd #topic/distribution
