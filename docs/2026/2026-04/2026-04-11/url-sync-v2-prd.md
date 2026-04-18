---
id: 2-areas/engine/prds/url-sync-v2-prd
type: prd
slug: urlSyncV2
title: 'urlSync v2 — 상용 수준 URL 상태 동기화 PRD'
tags: [explain]
created: 2026-04-11
updated: 2026-04-11
summary: 'Discussion: viewer URL 딥링크 미작동에서 출발 → urlSync를 nuqs/TanStack Router 표준급으로 보강 Explain: `docs/0-inbox/78-[explain]urlSync-three-layer-problem.md`'
legacy:
  status: active
  kind: prd
  topics: [2-areas, explain]
  relates: []
  supersedes: []
---
# urlSync v2 — 상용 수준 URL 상태 동기화 PRD

> Discussion: viewer URL 딥링크 미작동에서 출발 → urlSync를 nuqs/TanStack Router 표준급으로 보강
> Explain: `docs/0-inbox/78-[explain]urlSync-three-layer-problem.md`

## ① 동기

### WHY

- **Impact**: URL을 복사해 공유하면 상대방이 같은 상태를 볼 수 없다. 브라우저 뒤로가기가 앱 상태에 반영되지 않는다. 소비처 3곳(Pipeline, ThemeCreator, Viewer) 모두 동일한 한계.
- **Forces**: EffectContext는 DOM-only 불변 → popstate→store dispatch를 플러그인 내부에서 할 수 없다. 그러나 popstate는 페이지의 onChange/store 재초기화로 처리 가능하므로 아키텍처 확장 불필요.
- **Assets**: urlSync middleware (단방향), getInitialTabFromUrl (초기화 유틸), onChange 콜백 (os 컴포넌트 표준 prop), React Router navigate (Viewer), createReproRecorder (push/replace monkey-patch 호환)
- **Decision**: middleware 확장 + 유틸 범용화 + popstate 훅 신규. EffectContext/onExternalEvent 아키텍처 확장은 오컴 위반으로 기각.
- **Non-Goals**: 타입 파서 세트 (int/bool/date — os store가 관리), throttle/debounce (focus는 즉시 반영), SSR/RSC (SPA), EffectContext 변경

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Pipeline 페이지, hash에 #project-a | 페이지 로드 | project-a 탭 선택됨 | |
| S2 | Pipeline에서 project-b 탭 클릭 | 탭 전환 | URL hash가 #project-b로 변경 | |
| S3 | S2 상태에서 브라우저 뒤로가기 | popstate 발생 | project-a 탭으로 복귀 | |
| S4 | Viewer에서 `/viewer/docs/0-inbox/foo.md` 직접 접속 | 페이지 로드 | docs 트리 로드 + foo.md 선택 + 프리뷰 | |
| S5 | Viewer에서 파일 탐색 중 3개 파일 순회 | 뒤로가기 2번 | 2번째 전 파일로 복귀 | |
| S6 | ThemeCreator에서 URL 복사 → 다른 탭에 붙여넣기 | 페이지 로드 | 동일 섹션 표시 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `urlSync.ts` 확장 | `urlSync(options)` — write 전략 주입, 커맨드 필터 선언적 config | |
| `urlParsers.ts` (신규) | `createParser({parse, serialize})`, `pathParser`, `hashParser`, `searchParser` — read/write 전략 객체 | |
| `useUrlSync.ts` (신규) | popstate 리스너 + URL→store 재초기화 훅 (페이지 레벨) | |
| `PageViewer.tsx` 수정 | L1 버그 수정 (currentRoot URL 파싱) + useUrlSync 적용 | |

완성도: 🟢

## ③ 인터페이스

### urlSync 플러그인 API

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `urlSync()` (옵션 없음) | — | hash 모드, replace, selection 감시 | 하위 호환: 기존 소비처 동작 유지 | 현재와 동일 | |
| `urlSync({ parser: hashParser() })` | — | hash 모드 명시 | parser가 read/write 전략을 소유 | hash 동기화 | |
| `urlSync({ parser: searchParser('tab') })` | — | `?tab=xxx` 모드 | parser가 key를 소유 | search param 동기화 | |
| `urlSync({ parser: pathParser({ prefix: 'viewer', root }) })` | — | pathname 모드 | parser가 prefix/root로 경로 변환 | pathname 동기화 | |
| `urlSync({ history: 'push' })` | — | pushState 사용 | push=뒤로가기 가능, 기본 replace | 히스토리 스택에 추가 | |
| `urlSync({ commandFilter: cmd => cmd.type.startsWith('core:') })` | — | 지정된 커맨드만 URL 반영 | 선언적 필터로 OCP 준수 | 필터 통과 커맨드만 URL 업데이트 | |

### Parser 전략 객체

| parser | read(location) → string \| null | write(id, history) → void | 왜 이 분리가 필요한가 | 역PRD |
|--------|------|------|---------|-------|
| `hashParser()` | `location.hash.slice(1)` | `history.[push\|replace]State(null, '', '#' + id)` | hash는 서버에 안 감, 가장 단순 | |
| `searchParser(key)` | `URLSearchParams.get(key)` | `url.searchParams.set(key, id)` → `history.*State` | 다중 키 가능, 서버 도달 | |
| `pathParser({ prefix, root })` | pathname에서 prefix 제거 → 파일 경로 | `/${prefix}/${relative}` → `history.*State` | 파일 브라우저처럼 경로=상태인 경우 | |

### useUrlSync 훅

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `useUrlSync({ parser, onUrlChange })` | 마운트됨 | popstate 리스너 등록 | 브라우저 뒤로/앞으로 감지 필요 | 리스너 활성 | |
| 브라우저 뒤로가기 | URL 변경됨 | `parser.read(location)` → `onUrlChange(id)` | popstate 발생 → parser로 ID 추출 → 콜백 | 페이지가 store 재초기화 | |
| 컴포넌트 언마운트 | 리스너 활성 | `removeEventListener` | cleanup 보장 | 리스너 해제 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| URL에 없는 ID | store에 해당 entity 없음 | 존재하지 않는 노드 select 시도는 무시 | 무시 (현재 선택 유지) | 변경 없음 | |
| pushState 후 같은 ID 연속 | 이미 해당 ID 선택 | 같은 URL 중복 push는 히스토리 오염 | push 스킵 (현재값과 같으면) | 변경 없음 | |
| popstate 중 store 로딩 미완료 | initialStore === null | 아직 트리를 못 불러옴 | popstate 무시 또는 큐잉 | 로딩 완료 후 반영 | |
| 여러 urlSync 플러그인 동시 사용 | 같은 페이지에 2개 os 컴포넌트 | 각자 독립 URL 키 사용해야 충돌 없음 | parser별 독립 키 → 충돌 없음 | 각각 동기화 | |
| Viewer: URL이 `/viewer/docs/...`인데 docs 트리 미로드 | currentRoot='src' 하드코딩 | URL이 SSOT이므로 URL에서 root 결정 | `docs` 트리 로드 | docs 트리 표시 | |
| hash에 특수문자 (공백, 한글) | — | encodeURIComponent 필요 | 자동 인코딩/디코딩 | 정상 동작 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 선언=등록, dispatcher 금지 (declarative_ocp) | ③ commandFilter | 현재 위반 (하드코딩 `core:toggle-select`) → 설계에서 해소 | `commandFilter` 옵션으로 선언적 분리 ✅ | |
| 2 | OCP≠거대 Record 맵 (ocp_not_record_map) | ② urlParsers | 위반 가능 → parser를 전략 객체로 분리하여 해소 | `hashParser/searchParser/pathParser` 파일 분리 ✅ | |
| 3 | 증상 패칭 금지, 하나의 규칙 (occams_razor) | ③ parser 추상화 | hash/search/pathname 3-way 분기 위험 → parser 주입으로 분기 0 | ✅ | |
| 4 | 모든 상태는 NormalizedData+Command (all_state_normalized_command) | ③ useUrlSync | popstate→onChange는 engine 외부? → 페이지가 store data를 재설정하면 engine이 재초기화. engine 우회 아님 | ✅ 허용 | |
| 5 | EffectContext DOM-only 불변 | ② 전체 | 건드리지 않음 | ✅ | |
| 6 | 기존 구현 재활용 (reuse_existing_impl) | ② getInitialTabFromUrl | 범용화하여 유지 | ✅ | |
| 7 | 읽기가 기본, 쓰기만 명시 (readonly_default) | ③ history 옵션 | 기본=replace (비파괴), push는 opt-in | ✅ | |
| 8 | 하네스=수렴 (harness_convergence) | ③ API | preset 패턴 (`urlSync()` 무옵션=hash/replace) 유지 | ✅ | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | PagePipeline `urlSync()` 호출 | 하위 호환 — 옵션 없으면 현재 동작 유지 | 낮음 | 기본값 = 현재 동작 (hash, replace) | |
| 2 | PageThemeCreator `urlSync()` 호출 | 동일 | 낮음 | 동일 | |
| 3 | getInitialTabFromUrl 시그니처 | 반환 타입 유지, 옵션 확장만 | 낮음 | optional 필드 추가만 | |
| 4 | createReproRecorder pushState monkey-patch | push 모드 시 route entry 자동 포착 | 낮음 | 의도된 동작, 대응 불필요 | |
| 5 | PageViewer React Router navigate | useUrlSync 도입 시 navigate와 popstate 핸들러 경합 가능 | 중간 | Viewer는 urlSync middleware 대신 navigate 유지 + useUrlSync의 onUrlChange로 store 재초기화 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | EffectContext에 dispatch 추가 | ⑤-5 원칙 | DOM-only 불변 유지 | |
| 2 | onExternalEvent 등 새 lifecycle 추가 | ⑤-3 오컴 | 존재하지 않는 문제의 해법 | |
| 3 | urlSync middleware 안에서 popstate 리스너 등록 | ⑤-5 원칙 | middleware에 lifecycle 없음, cleanup 보장 불가 | |
| 4 | parser 내부에 hash/search/pathname 분기문 | ⑤-1,2 OCP | 전략 객체로 분리 | |
| 5 | urlSync 옵션에 `param: 'hash' \| 'search' \| 'pathname'` 분기 확장 | ⑤-3 오컴 | parser 주입으로 대체, 기존 `param` 필드는 deprecated → parser로 전환 | |
| 6 | withDefault를 plugin closure 변수로 구현 | ⑤-4 (model_first_state) | default는 store 초기화 시점에 결정 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | hashParser: 페이지 로드 시 `#project-a` → 초기 선택 | `getInitialFromUrl(hashParser())` === 'project-a' | |
| V2 | S2 | hashParser + replace: 탭 전환 → URL 변경 | `location.hash` === '#project-b', history.length 불변 | |
| V3 | S2 | hashParser + push: 탭 전환 → URL 변경 | `location.hash` === '#project-b', history.length +1 | |
| V4 | S3 | useUrlSync + popstate: 뒤로가기 → 콜백 호출 | `onUrlChange('project-a')` 호출됨 | |
| V5 | S4 | pathParser: `/viewer/docs/0-inbox/foo.md` 직접 접속 | currentRoot='docs', foo.md 선택+프리뷰 | |
| V6 | S5 | pathParser + push + useUrlSync: 뒤로가기 2번 | 2번째 전 파일로 복귀 | |
| V7 | ④-1 | URL에 없는 ID → popstate | 무시, 현재 선택 유지 | |
| V8 | ④-2 | 같은 ID 연속 push | push 스킵, history.length 불변 | |
| V9 | ④-6 | hash에 한글 ID | encodeURIComponent 적용, 정상 라운드트립 | |
| V10 | 하위호환 | `urlSync()` 무옵션 호출 | 현재 동작과 100% 동일 (hash, replace, selection 감시) | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

### 교차 검증

1. **동기 ↔ 검증**: S1~S6 → V1~V10 커버 ✅
2. **인터페이스 ↔ 산출물**: parser 전략 = urlParsers.ts, middleware = urlSync.ts, 훅 = useUrlSync.ts ✅
3. **경계 ↔ 검증**: ④의 6개 극단 → V7~V9 + V5 커버 ✅ (popstate 중 로딩 미완료는 Viewer 특화 — V5에서 간접 검증)
4. **금지 ↔ 출처**: 6개 금지 모두 ⑤ 원칙에서 파생 ✅
5. **원칙 대조 ↔ 전체**: 위반 수정이 새 위반 없음 ✅

---

PRD 저장 완료: `docs/2-areas/engine/prds/url-sync-v2-prd.md`

### 요약

- **8단계 전부 🟢** — 구현 착수 가능
- **`(?)` 추측 항목**: 없음
- **리서치 주요 발견**:
  - 기존 `param: 'hash' | 'search'` 분기는 OCP 위반 → parser 전략 객체로 교체
  - popstate 리스너는 프로젝트 전체에 0개 → 충돌 없음
  - createReproRecorder가 pushState를 monkey-patch → push 모드 자동 호환
  - 테스트 0개 → V1~V10 신규 작성 필요

수정/추가 사항 있으시면 말씀해주세요. 리뷰 완료되면 바로 진행합니다.
