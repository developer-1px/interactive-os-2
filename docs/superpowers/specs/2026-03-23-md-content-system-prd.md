# MD 기반 콘텐츠 관리 시스템 — PRD

> Discussion: MDX 제거, 순수 MD + `tsx render` codeblock 범용 컴포넌트 임베드, AxisSpec SSOT, routeConfig→MD 매핑

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | axis 구현체(navigate.ts)의 keyMap을 수정함 | MDX 스펙 테이블을 확인함 | 수동 동기화 필요 — 누락하면 문서↔코드 불일치 | |
| M2 | 새 axis를 추가하려 함 | showcase 페이지가 필요함 | Page*.tsx + MDX + 구현체 3파일을 각각 만들어야 함 | |
| M3 | MDX에서 React 컴포넌트를 import해 렌더하려 함 | navigate.mdx에 `<NavigateDemo />` 삽입 | 현재 broken — 컴포넌트 렌더 안 됨 | |
| M4 | `/area/axes/navigate`에서 문서를 봄 | ActivityBar에서 레이어 구분을 확인하려 함 | Area 하나에 모든 레이어가 묻혀 구분 안 됨 | |
| M5 | MD 파일 하나로 콘텐츠를 관리하고 싶음 | 현재 시스템을 확인함 | MDX + Page*.tsx 이중 관리 필요 — 비용 높음 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `MdPage` 컴포넌트 | MD 문자열을 받아 렌더하는 범용 컴포넌트. react-markdown + 커스텀 code 렌더러 | |
| `mdComponents` 레지스트리 | `tsx render` codeblock에서 사용 가능한 컴포넌트 매핑 객체. `{ NavigateDemo, AxisSpec, ... }` | |
| `AxisSpec` 컴포넌트 | axis 함수(navigate 등)를 호출해 keyMap/options를 읽고 스펙 테이블을 런타임 렌더 | |
| 간이 JSX 파서 | `tsx render` codeblock 내 셀프 클로징 JSX → `React.createElement` 변환. 지원: props 없음 / 문자열 props(`prop="value"`) / boolean flag(`compact`). 미지원: JS 표현식 `{}`, children, 중첩 JSX. eval 금지 | |
| routeConfig `md` 필드 | 각 item에 `md: 'axes/navigate'` 추가 → `docs/2-areas/${md}.md`를 MdPage로 렌더 | |
| 65개 `.md` 파일 | 기존 `.mdx` → `.md` 일괄 전환. navigate.md만 import문 제거 + `tsx render` codeblock 적용 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ActivityBar "Axis" 클릭 | 임의 페이지 | `/axis/navigate`로 이동 | routeConfig basePath 매핑 | MdPage가 `docs/2-areas/axes/navigate.md` 렌더 | |
| Sidebar "select" 클릭 | `/axis/navigate` | `/axis/select`로 이동 | routeConfig item `md: 'axes/select'` 매핑 | MdPage가 `docs/2-areas/axes/select.md` 렌더 | |
| MD 안 `tsx render` codeblock | 페이지 로드 중 | react-markdown이 code 노드 파싱 | lang=`tsx` + meta=`render`이면 간이 JSX 파서가 처리 | 레지스트리에서 컴포넌트 찾아 React.createElement로 렌더 | |
| `tsx render` 안 미등록 컴포넌트 | 페이지 렌더 중 | 레지스트리에서 컴포넌트 못 찾음 | 안전한 fallback 필요 | 에러 메시지 인라인 표시 (`Unknown component: Foo`) | |
| AxisSpec에 axis 이름 전달 | 페이지 렌더 중 | axis 함수 호출 → keyMap/options 추출 | 구현체가 SSOT — 런타임에 직접 읽음 | 키 바인딩 테이블 + 옵션 테이블 자동 렌더 | |
| `tsx render` codeblock에 문자열 props | 페이지 렌더 중 | `<AxisSpec axis="navigate" />` 파싱 | 간이 파서가 `prop="value"` → 문자열, `flag` → `true`로 변환 | 해당 props로 컴포넌트 렌더 | |
| `tsx render` codeblock에 boolean flag | 페이지 렌더 중 | `<SomeDemo compact />` 파싱 | 값 없는 attr → `compact: true`로 변환 | 해당 props로 컴포넌트 렌더 | |
| 일반 MD codeblock (lang≠`tsx` or meta≠`render`) | 페이지 렌더 중 | react-markdown 기본 code 렌더러 | render 메타 없으면 일반 코드 블록 | 기존 코드 하이라이팅 그대로 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| MD 파일 없는 경로 접근 (`/axis/nonexist`) | 라우팅 시도 | routeConfig에 없는 path는 라우트 자체가 생성 안 됨 | 404 또는 그룹 basePath로 redirect | 기존 동작 유지 | |
| `tsx render` codeblock에 중첩 JSX | 렌더 시도 | 간이 파서 범위 제한 — 중첩은 지원 불필요 | 파싱 실패 → 에러 메시지 인라인 표시 | codeblock을 코드 블록으로 표시 + 에러 | |
| `tsx render`에 JS 표현식 `{1+1}` | 렌더 시도 | eval 금지 — 간이 파서는 `"..."` 과 flag만 인식 | `{}` 포함 속성은 파싱 무시 — 해당 prop 누락으로 처리 | 컴포넌트는 prop 없이 렌더 (기본값 사용) | |
| axis 함수에 option 추가/제거 | 구현체 수정 | SSOT 원칙 — AxisSpec이 런타임에 읽으므로 자동 반영 | 스펙 테이블에 새 옵션 자동 표시/제거 | 문서 자동 동기화 | |
| `.mdx` 파일이 남아있는 상태 | 마이그레이션 중간 | glob이 `**/*.md`만 매칭 | `.mdx` 파일은 무시됨 — 누락 방지를 위해 일괄 전환 | 마이그레이션 완료 후 `.mdx` 없음 | |
| MD 파일에 기존 마크다운 테이블 (스펙 수동) | `tsx render` 도입 후 | 점진적 전환 — 수동 테이블도 계속 동작 | react-markdown이 GFM 테이블 정상 렌더 | 수동↔자동 공존 가능 | |
| 빈 MD 파일 | 새 항목 추가 시 | 빈 문서도 유효 — 점진적 채움 | 빈 페이지 렌더 (에러 아님) | 빈 페이지 표시 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 레이어 = 라우트 그룹 (feedback_layer_equals_route) | ② routeConfig, M4 | ✅ 준수 — ActivityBar 레이어 그룹 유지 | — | |
| P2 | 파일명 = 주 export 식별자 (feedback_filename_equals_export) | ② MdPage, AxisSpec | ✅ 준수 — `MdPage.tsx`, `AxisSpec.tsx` | — | |
| P3 | barrel export 금지 (global CLAUDE.md) | ② mdComponents 레지스트리 | ⚠️ 주의 — 레지스트리가 barrel처럼 보일 수 있음 | 레지스트리는 re-export가 아닌 매핑 객체이므로 barrel이 아님. 명확히 구분 | |
| P4 | 설계 원칙 > 사용자 요구 (feedback_design_over_request) | ③ 간이 JSX 파서 | ✅ 준수 — eval 금지 원칙 유지 | — | |
| P5 | 포커스는 결과를 가리킨다 (feedback_focus_is_result) | ③ 네비게이션 | ✅ 준수 — ActivityBar/Sidebar 포커스 → 해당 MD 렌더 | — | |
| P6 | walkthrough는 Area에 둔다 (feedback_walkthrough_in_area) | ② MD 파일 위치 | ✅ 준수 — 콘텐츠가 docs/2-areas/에 유지 | — | |
| P7 | 범용 도구, 도메인 전용 규칙 금지 (feedback_visual_cms_universal_tool) | ② `tsx render` codeblock | ✅ 준수 — axis 전용 아닌 범용 메커니즘 | — | |
| P8 | FSD architecture (global CLAUDE.md) | ② MdPage 위치 | ✅ 준수 — pages 레이어에 MdPage 배치 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `vite.config.ts` — `@mdx-js/rollup` 제거 | MDX 빌드 파이프라인 제거 → 다른 곳에서 MDX import하면 빌드 실패 | 중 | 65개 전부 `.md`로 전환 확인 후 제거. grep으로 `.mdx` import 잔존 검사 | |
| S2 | `package.json` — mdx 의존성 제거, react-markdown 추가 | 의존성 변경 | 낮 | 일반적 패키지 교체 | |
| S3 | `src/App.tsx` routeConfig — component 필드 변경 | 기존 Page 컴포넌트 참조 제거 → 미사용 Page import 잔존 가능 | 낮 | Page*.tsx 파일 삭제 + import 정리 | |
| S4 | `src/pages/AreaSidebar.tsx` — glob 패턴 변경 | `*.mdx` → `*.md`로 변경 필요. 미변경 시 사이드바 빈 목록 | 높 | AreaSidebar glob도 함께 변경 | |
| S5 | `/axis/*` 라우트 Page 제거 → 기존 demo 컴포넌트(NavigateDemo 등) | Page가 사라져도 demo 컴포넌트는 레지스트리 + MD에서 참조 — 삭제하면 안 됨 | 중 | demo 컴포넌트는 유지. Page wrapper만 제거 | |
| S6 | ActivityBar basePath | `/axis/navigate` 경로 유지 but 렌더러가 MdPage로 변경 — 외부에서 링크한 곳이 있으면 영향 없음 (경로 동일) | 낮 | 경로 유지이므로 영향 없음 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | `tsx render` codeblock에서 eval/new Function 사용 | ⑤ P4 설계 원칙 | 보안 위험 + CSP 충돌. 간이 JSX 파서로 제한 | |
| X2 | 도메인 전용 codeblock 언어 태그 (`axis-demo`, `axis-spec` 등) | ⑤ P7 범용 도구 | 새 도메인마다 파서 추가 필요. `tsx render` 하나로 통일 | |
| X3 | demo 컴포넌트(NavigateDemo 등) 삭제 | ⑥ S5 | MD에서 레지스트리를 통해 참조. Page wrapper만 제거 | |
| X4 | `@mdx-js/rollup` 제거를 `.md` 전환 전에 하기 | ⑥ S1 | 빌드 실패. 전환 완료 확인 후 제거 | |
| X5 | routeConfig 경로(`/axis/*` 등) 변경 | ⑥ S6 | 기존 링크/북마크 깨짐. 경로는 유지하고 렌더러만 교체 | |
| X6 | 레지스트리에 barrel export 패턴 사용 | ⑤ P3 | 매핑 객체로 구성. `export * from` 금지 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 SSOT | navigate.ts의 keyMap에 키 추가 → `/axis/navigate` 접근 | AxisSpec 테이블에 새 키 자동 표시 | |
| V2 | ①M2 추가 비용 | 새 axis `value`를 MD로 추가: `docs/2-areas/axes/value.md` 작성 + routeConfig에 `md: 'axes/value'` 추가 | Page 컴포넌트 없이 페이지 렌더 | |
| V3 | ①M3 컴포넌트 렌더 | navigate.md에 `` ```tsx render\n<NavigateDemo />\n``` `` 작성 | NavigateDemo가 라이브로 동작 (키보드 네비게이션 가능) | |
| V4 | ①M4 레이어 구분 | ActivityBar에서 "Axis" → Sidebar에 navigate/select/... 표시 | 기존과 동일한 레이어 구분 + MD 기반 콘텐츠 | |
| V5 | ①M5 단일 관리 | navigate.md 하나 수정 | `/axis/navigate`에 변경 즉시 반영. Page*.tsx 수정 불필요 | |
| V6 | ④ 미등록 컴포넌트 | `tsx render`에 `<NonExistent />` 작성 | 에러 메시지 인라인 표시, 페이지 크래시 없음 | |
| V7 | ④ 중첩 JSX | `tsx render`에 `<Outer><Inner /></Outer>` 작성 | 파싱 실패 → 에러 메시지 표시 | |
| V8 | ④ GFM 테이블 | MD 파일에 기존 마크다운 테이블 유지 | react-markdown + remark-gfm으로 정상 렌더 | |
| V9 | ⑥ S4 | `.mdx` → `.md` 전환 후 AreaSidebar 확인 | 사이드바 트리가 정상 빌드 (빈 목록 아님) | |
| V10 | ⑥ S1 | `@mdx-js/rollup` 제거 후 빌드 | 빌드 성공. `.mdx` import 잔존 없음 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
