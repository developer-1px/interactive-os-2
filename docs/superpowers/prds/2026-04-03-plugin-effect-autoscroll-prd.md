# Plugin Effect + Autoscroll — PRD

> Discussion: plugin 시스템에 effect(hook 팩토리) 레이어 추가, autoscroll을 첫 적용 사례로 구현

## ① 동기

### WHY (discuss FRT)

- **Impact**: autoscroll 로직이 ChatFeed(useScrollController)와 useStreamFeed에 하드코딩으로 중복. DOM side-effect를 plugin이 소유할 방법이 없어 ad-hoc 처리가 산재
- **Forces**: plugin = 순수 리듀서(`(store, payload) => store`). DOM effect는 React 생명주기가 필요. 두 세계를 연결할 슬롯이 없음
- **Decision**: plugin에 `useEffect` hook 팩토리 슬롯 추가. effect는 DOM read+write만 허용, dispatch/setState 금지. `Omit<Engine, 'dispatch'>` 타입으로 컴파일 타임 강제. 기각: (A) plain callback — React cleanup 못 씀 (B) store에 scroll 동기화 — 고빈도 리렌더
- **Non-Goals**: focusRecovery 등 기존 effect의 마이그레이션 (별도 PRD), effect 내 dispatch 허용

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | chat stream에 autoscroll plugin이 등록됨 | assistant 메시지가 추가됨 | 사용자가 바닥 근처면 자동 스크롤, 위로 스크롤했으면 유지 | |
| S2 | 사용자가 위로 스크롤한 상태 | 새 메시지 도착 | 스크롤 위치 유지 (autoscroll 비활성) | |
| S3 | autoscroll 비활성 상태 | 사용자가 바닥 근처(≤40px)로 스크롤 | autoscroll 재활성 | |
| S4 | user 메시지 전송 | 메시지가 피드에 추가됨 | 해당 메시지 위치로 smooth scroll | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `EffectContext` 타입 | `engine/types.ts` — `{ getStore, containerRef }` 화이트리스트. dispatch 접근 불가 | |
| `Plugin.useEffect` 슬롯 | `engine/types.ts` — `useEffect?: (ctx: EffectContext) => void` | |
| `PluginConfig.useEffect` | `plugins/definePlugin.ts` — 동일 슬롯 | |
| `definePlugin` 패스스루 | `plugins/definePlugin.ts` — useEffect를 결과 Plugin에 전달 | |
| plugin useEffect 호출 | `primitives/useAria.ts` — 등록된 plugin들의 useEffect를 순회 호출 | |
| `autoscroll` plugin | `plugins/autoscroll.ts` — definePlugin으로 autoscroll 선언 | |
| ChatFeed 하드코딩 제거 | `ui/chat/ChatFeed.tsx` — useScrollController 제거, autoscroll plugin으로 대체 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| rootIds.length 증가 | wasNearBottom=true | smooth scrollToBottom | 바닥에 있었으므로 새 콘텐츠 따라감 | 스크롤 바닥 | |
| rootIds.length 증가 | wasNearBottom=false | 스크롤 유지 | 의도적 위 스크롤 — 읽기 흐름 보존 | 위치 불변 | |
| wheel (위로) | wasNearBottom=true | wasNearBottom=false | 사용자 명시적 스크롤 의도 > autoscroll | autoscroll 비활성 | |
| scroll 이벤트 | gap ≤ 40px | wasNearBottom=true | 바닥 근처 = 최신 콘텐츠 따라가겠다는 의도 | autoscroll 재활성 | |
| user role 메시지 추가 | 아무 상태 | scrollIntoView(block:'start') | 자신의 입력은 항상 보여야 함 | 메시지 상단 정렬, wasNearBottom=true | |
| plugin useEffect 호출 | useAria 마운트 | plugins 순회 useEffect(ctx) 호출 | hook 순서 고정 = Rules of Hooks | effect 등록 | |
| containerRef.current=null | 마운트 전/후 | 모든 DOM 작업 skip | DOM 없으면 무동작 | 무동작 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 메시지 100개 연속 추가 | wasNearBottom=true | rAF 배칭으로 프레임당 1회만 — 성능 보호 | cancel 후 마지막 1회만 실행 | 바닥 도달 | |
| container 높이 0 | wasNearBottom=true | scrollHeight=clientHeight=0이면 무의미 | DOM 작업 skip | 상태 불변 | |
| plugin 배열 빈 배열 | useAria 마운트 | 순회할 게 없음 | 무동작 | 변화 없음 | |
| 여러 plugin 각각 useEffect | useAria 마운트 | 배열 순서대로 호출, 각 hook 독립 | 모든 effect 실행 | 각 effect 활성 | |
| wheel→바닥→wheel 반복 | streaming 중 | 입력에 즉각 반응해야 조작감 유지 | 상태 전환 즉시 | 마지막 입력 반영 | |
| useAria 언마운트 | effect 활성 | React cleanup이 리스너 해제 | wheel/scroll 제거, rAF cancel | 리소스 정리 | |
| containerRef 리마운트 | 이전 ref 리스너 | cleanup 후 재등록 | 이전 해제, 새 container 등록 | 새 container 추적 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | effect에서 dispatch/setState 금지 (discuss 합의) | ② EffectContext | ✅ 준수 | — | |
| 2 | 선언=등록, 합성 런타임 불변 (declarative_ocp) | ② definePlugin | ✅ 준수 | — | |
| 3 | UI만 노출, primitives 직접 사용 금지 (ui_over_primitives) | ② useAria 내부 | ✅ 준수 | — | |
| 4 | 모든 OS 상태는 NormalizedData+Command (all_state_normalized_command) | ③ wasNearBottom=useRef | ✅ 준수 — DOM 파생 값, 앱 상태 아님 | — | |
| 5 | addEventListener 금지=keydown/keyup 대상 (CLAUDE.md) | ③ wheel/scroll 리스너 | ✅ 준수 — 스크롤 이벤트는 keyMap 범위 밖 | — | |
| 6 | plugin keyMap 소유 (axis_pattern_principles) | ② autoscroll | ✅ 준수 — keyMap 불필요, 빈 슬롯 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `engine/types.ts` Plugin 인터페이스 | optional 추가, 기존 코드 영향 없음 | 낮 | 허용 | |
| 2 | `plugins/definePlugin.ts` | 패스스루 추가만, 기존 경로 불변 | 낮 | 허용 | |
| 3 | `primitives/useAria.ts` | plugin useEffect 순회 — 배열 길이 변경 시 hook 순서 깨짐 | 중 | plugin 배열 마운트 시 고정 전제 | |
| 4 | `ui/chat/ChatFeed.tsx` useScrollController 제거 | plugin 안 넘기면 autoscroll 없음 | 중 | ChatFeed 기본 plugins에 autoscroll 포함 | |
| 5 | `ui/useStreamFeed.ts` | 이번 변경 안 함 | 낮 | 별도 마이그레이션 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | effect 내 dispatch() | ⑤#1 | 단방향 종착점 위반, 무한 루프 | |
| 2 | effect 내 setState/store 변경 | ⑤#1 | effect는 DOM-only | |
| 3 | plugin 배열 렌더 중 동적 변경 | ⑥#3 | Rules of Hooks 위반 | |
| 4 | useStreamFeed 이번 마이그레이션 | Non-Goal | 범위 초과 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①S1 | autoscroll plugin + 메시지 추가, 바닥 근처 | scrollTop ≈ scrollHeight - clientHeight | |
| V2 | ①S2 | 위로 스크롤 후 메시지 추가 | scrollTop 변경 없음 | |
| V3 | ①S3 | 위로 스크롤 → 바닥 복귀 → 메시지 추가 | autoscroll 재활성, 바닥 스크롤 | |
| V4 | ①S4 | user role 메시지 추가 | 해당 메시지 viewport 상단 | |
| V5 | ④#1 | 100개 메시지 연속 추가 | rAF 배칭 1회, 성능 저하 없음 | |
| V6 | ④#6 | 컴포넌트 언마운트 | 리스너 해제, rAF cancel | |
| V7 | ⑦#1 | EffectContext에 dispatch 없음 | ctx.dispatch 접근 시 타입 에러 | |
| V8 | ⑥#4 | ChatFeed에 autoscroll 미전달 | autoscroll 동작 안 함 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
