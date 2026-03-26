# Contents 폴더 분리 — PRD

> Discussion: 이름 중심 도메인 관리. docs/2-areas를 contents/로 분리하여 홈페이지 IA와 1:1 매핑. PARA area는 본래 역할(내부 지식)로 복귀.

## ① 동기

### WHY

- **Impact**: 개발자/LLM이 도메인 전체를 조망할 수 없다. 코드에 있는데 있다는 사실을 모르고, 없어야 할 것과 아직 없는 것을 구분 못 한다. 홈페이지가 조망 도구가 되어야 하는데 콘텐츠 구조가 IA와 1:1이 아니라 불가능.
- **Forces**: SSOT(코드가 ground) vs 빈칸 표현(코드 없이도 의도 선언 필요). PARA 체계 유지 vs 홈페이지 콘텐츠 분리. 원자적 실행 vs 변경 범위 크기.
- **Decision**: `contents/` 루트 폴더로 분리. 이유: docs/2-areas가 PARA area(내부 지식) + 홈페이지 콘텐츠(공개 정제물)를 겸하고 있어 IA 매핑 불가. co-location(src 안) 기각 — 빈칸 표현 불가. docs/ 내 유지 기각 — 과적 해소 안 됨.
- **Non-Goals**: SSG 전환 (나중), PRD target 태깅 (별도 PRD), 유저스토리/features 연결 (별도 PRD)

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 개발자가 새 axis를 구현 완료 | 홈페이지에서 axis 목록 조회 | 새 axis가 개념적 순서에 맞게 나타남 | |
| S2 | contents/axis/edit.md가 ⬜ 상태 | 홈페이지에서 axis 목록 조회 | edit이 빈칸/placeholder로 표시됨 | |
| S3 | src/에 새 파일 추가, contents/ 미갱신 | 동형성 스크립트 실행 | "contents/에 대응 파일 없음" 경고 출력 | |
| S4 | contents/에 MD 있으나 src/에 코드 없음 | 동형성 스크립트 실행 | ⬜(의도적 빈칸)으로 판정, 경고 아님 | |
| S5 | LLM이 프로젝트 구조 파악 | contents/ 폴더 읽기 | 홈페이지 IA와 동일한 트리 구조로 도메인 전체 조망 | |
| S6 | _meta.yaml에 navigate, select, expand 순서 선언 | 홈페이지 사이드바 렌더링 | 알파벳이 아닌 선언된 개념적 순서로 표시 | |

완성도: 🟡

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `contents/` | 프로젝트 루트의 홈페이지 콘텐츠 디렉토리. 폴더 구조 = 홈페이지 IA | |
| `contents/_meta.yaml` | 루트 메타: 레이어 순서 + 레이어별 src 매핑 경로 | |
| `contents/{layer}/_meta.yaml` | 레이어별 메타: 항목 순서 + 레이어 설명 | |
| `contents/{layer}.md` | L2 문서 — 레이어 개요 (기존 2-areas/{layer}.md 이동) | |
| `contents/{layer}/{name}.md` | L3 문서 — 개별 모듈 (기존 2-areas/{layer}/{name}.md 이동) | |
| `src/pages/MdPage.tsx` 수정 | glob 경로 `/docs/2-areas/` → `/contents/` | |
| `src/pages/AreaSidebar.tsx` 수정 | L2_ORDER 하드코딩 → _meta.yaml 기반 트리 생성 | |
| `src/pages/PageAreaViewer.tsx` 수정 | URL→MD 경로 매핑 변경 | |
| `scripts/checkContentsIsomorphism.mjs` | contents/ ↔ src/ 동형성 검증 스크립트 | |

### contents/ 폴더 구조

```
contents/
├── _meta.yaml              ← 레이어 순서 + src 매핑
├── overview.md
├── vision.md
├── axis.md                 ← L2 개요
├── axis/
│   ├── _meta.yaml          ← 항목 순서: navigate, select, activate, expand, dismiss, tab
│   ├── navigate.md
│   ├── select.md
│   ├── activate.md
│   ├── expand.md
│   ├── dismiss.md
│   └── tab.md
├── pattern.md
├── pattern/
│   ├── _meta.yaml
│   ├── listbox.md
│   ├── treegrid.md
│   └── ...
├── plugins.md
├── plugins/
│   ├── _meta.yaml
│   └── ...
├── primitives.md
├── primitives/
│   ├── _meta.yaml
│   └── ...
├── engine.md
├── engine/
│   ├── _meta.yaml
│   └── ...
├── store.md
├── store/
│   ├── _meta.yaml
│   └── ...
├── ui.md
├── ui/
│   ├── _meta.yaml
│   └── ...
└── devtools.md
    devtools/
    ├── _meta.yaml
    └── ...
```

### _meta.yaml 스키마

**루트 `contents/_meta.yaml`:**
```yaml
order:
  - overview
  - vision
  - axis
  - pattern
  - plugins
  - primitives
  - engine
  - store
  - ui
  - devtools

srcMap:
  axis: src/interactive-os/axis
  pattern: src/interactive-os/pattern
  plugins: src/interactive-os/plugins
  primitives: src/interactive-os/primitives
  engine: src/interactive-os/engine
  store: src/interactive-os/store
  ui: src/interactive-os/ui
  devtools: src/devtools
```

**레이어 `contents/axis/_meta.yaml`:**
```yaml
label: Axis
description: ARIA 인터랙션의 단일 축. 하나의 행동 차원.
order:
  - navigate
  - select
  - activate
  - expand
  - dismiss
  - tab
```

### docs/2-areas/ 잔류 파일 (이동 대상 아님)

PARA area 본래 역할(내부 작업 지식)로 남는 파일들:

| 파일 | 이유 |
|------|------|
| `interactiveOsArchitectureVision.md` | 내부 설계 문서, 공개 콘텐츠 아님 |
| `plugin-showcase.md` | 내부 쇼케이스 계획, 공개 콘텐츠 아님 |
| `ui-dictionary.md` | 내부 UI 용어 사전 |
| `ui-usage-concept.md` | 내부 UI 사용 컨셉 |
| `axis/axisV2FiveAxesModel.md` | 내부 설계 메모 (v2 모델 탐색) |
| `pattern/patternCompositionLogicTree.md` | 내부 설계 메모 (패턴 합성 로직트리) |
| `primitives/osMultiViewGap.md` | 내부 갭 분석 |

완성도: 🟡

## ③ 인터페이스

> 비-UI 구조 변경이므로 키보드 인터페이스 대신 시스템 인터페이스를 명세한다.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| URL `/internals/area/axis/navigate` | 라우트 활성 | PageAreaViewer가 URL에서 MD 경로 추출 | URL 세그먼트가 contents/ 경로와 1:1이므로 `axis/navigate`를 직접 사용 | MdPage에 `md="axis/navigate"` 전달 | |
| MdPage `md="axis/navigate"` | glob에 `/contents/axis/navigate.md` 존재 | glob에서 raw string 로드 | contents/ glob이 빌드 타임에 모든 MD를 수집하므로 경로만으로 조회 가능 | react-markdown으로 렌더링 | |
| AreaSidebar 초기화 | 빌드 타임 | _meta.yaml의 order 배열 순서로 트리 생성 | 알파벳 순이 아닌 개념적 순서를 _meta.yaml이 선언하므로 | 선언된 순서의 TreeView 렌더링 | |
| `pnpm check:contents` 실행 | — | contents/ MD 목록과 src/ export 파일 목록 대조 | srcMap이 레이어별 src 경로를 선언하므로 기계적 대조 가능 | 누락(src에 있으나 contents에 없음) 목록 출력 | |
| _meta.yaml order에 없는 MD 파일 존재 | MD 파일은 있으나 순서 미지정 | AreaSidebar가 order에 없는 항목을 끝에 알파벳순 추가 | 순서 미지정이 파일 누락보다 가벼운 오류이므로 표시는 하되 숨기지 않음 | 경고 + 끝에 표시 | |

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| contents/에 MD 있으나 src/에 코드 없음 | ⬜ 빈칸 | 빈칸은 의도적 선언(주기율표 빈칸)이므로 경고가 아님 | 동형성 스크립트가 `⬜ placeholder`로 보고 | 정상 | |
| src/에 파일 있으나 contents/에 MD 없음 | 누락 | 코드는 있는데 문서가 없으면 조망에서 보이지 않음 | 동형성 스크립트가 `⚠ missing`으로 경고 | 경고 출력 | |
| _meta.yaml이 없는 레이어 폴더 | 순서 미정 | _meta.yaml 없이도 폴더 내 MD를 발견해야 사이트가 깨지지 않음 | 알파벳 순 fallback + 콘솔 경고 | 정상 동작 + 경고 | |
| contents/ 폴더가 비어있음 | 빈 사이트 | 이동 중 중간 상태가 발생하면 안 됨 (원자적 실행) | git mv로 한 커밋에 이동 | 깨지는 중간 상태 없음 | |
| L2 MD(axis.md)는 있으나 L2 폴더(axis/)가 없음 | 리프 레이어 | 모든 레이어가 하위 항목을 가질 필요 없음 | 사이드바에 리프 노드로 표시 | 정상 | |
| 같은 이름이 다른 레이어에 존재 (plugins/combobox, pattern/combobox) | 이름 충돌 | 레이어가 네임스페이스 역할을 하므로 같은 이름 허용 | 각 레이어 내에서 독립 표시 | 정상 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② MD 파일명 | 준수 | — | |
| P2 | 레이어 = 라우트 그룹 (feedback_layer_equals_route) | ② contents 구조, 라우트 | 준수 — contents/{layer}/ = /internals/area/{layer}/ | — | |
| P3 | 원자적 restructure (feedback_atomic_restructure) | 전체 실행 | 준수 — 한 세션, 한 커밋 | — | |
| P4 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② 레이어/항목 이름 | 준수 — 기존 이름 그대로 이동 | — | |
| P5 | 선언적 OCP (feedback_declarative_ocp) | ② _meta.yaml | 준수 — 순서를 선언으로 등록, 런타임 불변 | — | |
| P6 | SSOT (discuss 합의) | ② contents + srcMap | 준수 — 코드가 ground, contents는 코드에서 파생 불가능한 정보(의도/빈칸/순서) | — | |
| P7 | 같은 역할 = 같은 디자인 (feedback_same_role_same_design) | ③ MdPage 렌더링 | 준수 — 모든 콘텐츠가 동일 MdPage로 렌더링 | — | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | MdPage.tsx glob 경로 | 기존 `/docs/2-areas/` 참조가 모두 깨짐 | 높 | 원자적으로 glob 경로와 파일 이동을 동시에 변경 | |
| E2 | AreaSidebar.tsx L2_ORDER | 사이드바 트리 구조 변경 | 중 | _meta.yaml에서 동일 순서 재현 후 전환 | |
| E3 | PageAreaViewer 경로 파싱 | URL→MD 경로 매핑 변경 | 중 | `/internals/` prefix strip 로직 수정 | |
| E4 | 기존 docs/2-areas/ 참조하는 다른 코드 | import 경로 깨짐 | 중 | grep으로 모든 참조 찾아 일괄 수정 | |
| E5 | vite-plugin-agent-ops 등 빌드 도구 | docs/ glob을 사용하는 플러그인이 있을 수 있음 | 낮 | 사전 검색으로 확인 | |
| E6 | docs/2-areas/에 남는 내부 문서 | 기존 AreaSidebar에서 보이던 항목이 사라짐 | 낮 | 내부 문서는 원래 홈페이지에 불필요 — 의도적 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | 이동 중 중간 커밋 생성 | P3 원자적 restructure | 중간 상태에서 빌드 깨짐 | |
| F2 | MD 파일 내용 수정 (이동만) | 범위 제한 | 이동과 내용 변경을 섞으면 diff 추적 불가 | |
| F3 | _meta.yaml에 코드 로직 삽입 | P5 선언적 OCP | 순수 데이터 선언만. 조건부 로직 금지 | |
| F4 | 내부 문서(axisV2FiveAxesModel 등)를 contents/에 포함 | discuss 합의 — area는 내부, contents는 공개 | 내부 설계 메모는 PARA area에 잔류 | |
| F5 | docs/2-areas/ 폴더 삭제 | PARA 유지 | 비워지더라도 PARA area 폴더로 유지. 내부 문서 잔류 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 동기 | `pnpm dev` 후 `/internals/area/axis/navigate` 접속 | navigate.md 내용 렌더링 | |
| V2 | S2 동기 | ⬜ MD 파일(내용 없음)에 대한 라우트 접속 | 빈 페이지 또는 placeholder 표시 (에러 아님) | |
| V3 | S3 동기 | `pnpm check:contents` 실행 시 src/에만 있는 파일 | `⚠ missing` 경고 출력 | |
| V4 | S4 동기 | `pnpm check:contents` 실행 시 contents/에만 있는 파일 | `⬜ placeholder` 보고 (경고 아님) | |
| V5 | S6 동기 | 사이드바에서 axis 항목 순서 확인 | _meta.yaml의 order 순서와 일치 | |
| V6 | 경계1 | _meta.yaml 없는 폴더의 사이드바 | 알파벳 순 fallback + 콘솔 경고 | |
| V7 | E1 부작용 | 이동 후 `pnpm typecheck` | 타입 에러 없음 | |
| V8 | E4 부작용 | 이동 후 `grep -r "2-areas" src/` | 잔여 참조 없음 (docs/ 내 참조는 허용) | |
| V9 | 전체 | 이동 후 `pnpm dev` 빌드 성공 | 에러 없이 빌드 | |

완성도: 🟡

---

**전체 완성도:** 🟡 8/8 (AI 초안, 사용자 확인 전)
