---
id: 2-areas/ui/prds/camera-primitive-prd
title: 'Camera 프리미티브 — PRD'
created: 2026-04-17
updated: 2026-04-17
summary: 'Discussion: ZoomPane(imperative) + ZoomPanCanvas(user wheel/pan)를 단일 Camera 프리미티브로 통합. 선언형 shot 시퀀스(time/end/signal advance) + 명령형 focus API, interact/view 모드 분리, 사용자 조작 시 언제나 pause.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Camera 프리미티브 — PRD

> Discussion: ZoomPane(imperative) + ZoomPanCanvas(user wheel/pan)를 단일 Camera 프리미티브로 통합. 선언형 shot 시퀀스(time/end/signal advance) + 명령형 focus API, interact/view 모드 분리, 사용자 조작 시 언제나 pause.

## ① 동기

### WHY

- **Impact**: replay·FileViewer·Lightbox 3개 소비자가 각기 다른 뷰포트 컴포넌트를 쓴다. 선언형 shot 시퀀스가 없어 replay 재생 엔진이 zoom/reset을 수동으로 orchestration해야 하고, ZoomPane(programmatic)과 ZoomPanCanvas(user-only) 사이에 상태 공유가 없어 "자동 편집 중 사용자 조작" 시나리오가 미정의다.
- **Forces**: transform 모델 충돌(origin-based vs translate-based), 애니메이션 종료 신호 신뢰성(transitionend 유실 가능), 사용자 조작↔자동 재생 충돌. 제약: ax() 전용, ui/ 레이어, 기존 ZoomPane API를 쓰는 FileViewer·replay는 동작 유지.
- **Assets**: ZoomPane `scrollToLineAwait`(600ms safety + scrollend + rAF idle), ZoomPanCanvas `wheel+ctrl zoom-to-cursor`, FileViewer command dispatch 패턴, TimedFrame 타입.
- **Decision**: 단일 Camera 프리미티브. 내부 모델은 **translate + scale** (사용자 팬과 호환). 선언형 `shots` + 명령형 `focus()` 양쪽. 모드 `interact | view` 명시 분리. 기각 대안: (P) ZoomPane 확장 — 사용자 조작 불가, (Q) ZoomPanCanvas 확장 — selector·keyframe 없음, (R) framer-motion — "있는 걸로" 위배.
- **Non-Goals**: camera axis 체계 편입(2D 연속값은 axis 모델과 맞지 않음). pinch-gesture 독립 이벤트(Safari 전용). 시퀀스 autoplay 중 idle-resume. 미니맵·줌 UI 컨트롤.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| 1 | replay 재생 중 (mode='view') | delta가 line 42 zoom 요청 | Camera가 해당 라인으로 translate+scale, scroll 정착 대기 후 애니메이션 | |
| 2 | 시퀀스 진행 중 | 사용자가 wheel/drag 입력 | 시퀀스 paused=true, shotIndex 보존, 사용자 조작이 상태에 반영 | |
| 3 | Lightbox 열림 (mode='interact') | 사용자 휠+ctrl | 포인터 중심 줌, translate+scale 누적 | |
| 4 | mode='view', shots 배열 | `advance:'end'`인 shot A → B | A 애니메이션 `finished` resolve + hold 경과 후 B 시작 | |
| 5 | mode='view', `advance:'signal'` shot | 외부에서 `next()` 호출 | 다음 shot 시작 | |
| 6 | paused=true 상태 | 소비자가 `play()` 호출 | 보존된 shotIndex부터 시퀀스 재개 | |
| 7 | 임의 상태 | 소비자가 `ref.focus(target)` | mode 무시하고 즉시 실행 (명시적 명령이 이김) | |
| 8 | prefers-reduced-motion | 모든 shot | duration=0 강제, 즉시 transform | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/interactive-os/ui/Camera.tsx` | Camera 컴포넌트 + `CameraHandle` + 타입 export | |
| `Camera.Shot` 타입 | `{ target: Rect \| string \| RefObject; scale?: number; duration?: number; hold?: number; advance: 'time' \| 'end' \| 'signal'; at?: number }` | |
| `Camera.Target` 정규화 유틸 | 내부: selector/ref/rect → Rect로 정규화 | |
| viewport reducer | `state = { x, y, scale, mode, paused, shotIndex }`, actions: `USER_PAN`, `USER_ZOOM`, `SHOT_START`, `SHOT_END`, `PAUSE`, `PLAY`, `SET_MODE`, `FOCUS` | |
| shot scheduler | advance별 dispatcher: time(setTimeout), end(WAAPI `.finished`), signal(외부 cue) | |
| `Camera.demo.tsx` | 3개 데모: interact 모드, view 시퀀스, focus imperative | |
| CATALOG.md 갱신 | ZoomPane/ZoomPanCanvas 제거, Camera 등록 | |
| 마이그레이션 | FileViewer(`zoomToLine`→`focus`), Lightbox(`<ZoomPanCanvas>`→`<Camera mode="interact">`), PageReplay/SessionDetailModal(zoomActiveRef→camera) | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `<Camera shots={S} mode="view" />` 마운트 | 초기 | 첫 shot 자동 시작 | view 모드 = 선언형 시퀀스 실행 권한 | shotIndex=0, paused=false, 첫 shot 애니메이션 중 | |
| shot `advance:'time'`, at=2000 | 시퀀스 idle | 2000ms 타이머 → SHOT_START | 절대 타임라인은 전역 시간 기준 | 해당 shot 실행 | |
| shot `advance:'end'` (직전 shot 종료) | 직전 shot 애니메이션 | WAAPI `animation.finished` resolve + hold | end = 연결된 리듬, hold는 별도 머무름 | 다음 shot 시작 | |
| `advance:'signal'` + 외부 `next()` | 해당 shot 대기 | SHOT_START 디스패치 | 외부 소비자(replay tick)가 진행 소유 | 다음 shot 시작 | |
| 사용자 wheel (mode 무관) | 임의 | PAUSE + USER_ZOOM | "사용자 조작 시 언제나 pause" 원칙 | paused=true, 사용자 변환 반영, shotIndex 보존 | |
| 사용자 drag (mode 무관) | 임의 | PAUSE + USER_PAN | 동상 | paused=true, translate 누적 | |
| 사용자 wheel+ctrl | 임의 | PAUSE + USER_ZOOM (포인터 중심) | zoom-to-cursor 공식 | paused=true, scale·translate 보정 | |
| `ref.focus(target, {scale, duration})` | 임의 | FOCUS 디스패치, 시퀀스 무시 | 명시 명령이 모드/paused 이김 | 새 transform, paused 유지(명령만 실행) | |
| `ref.play()` | paused=true | PLAY, 보존된 shotIndex부터 재개 | 재개는 소비자 책임 | paused=false | |
| `ref.stop()` | 임의 | 시퀀스 종료 + shotIndex=0 | 명시적 종료 | idle | |
| `ref.setMode('interact')` | 임의 | SET_MODE | 소비자가 모드 소유 | 시퀀스 무시, 사용자 입력만 활성 | |
| 키보드 `+`/`-` (focus 시) | 임의 | PAUSE + USER_ZOOM step | 접근성 표준 | paused=true, scale 증감 | |
| 키보드 화살표 (focus 시) | 임의 | PAUSE + USER_PAN step | 접근성 표준 | paused=true, translate 증감 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| `target` DOM 노드가 시퀀스 시작 시점에 없음 | shot 실행 직전 | 선택자 앵커는 리플로우 후에만 측정 가능 | rAF 다음 틱까지 대기, 여전히 없으면 shot skip + warn | shotIndex+1 | |
| `finished` promise 유실 (transition 취소) | shot 진행 중 새 FOCUS | WAAPI 취소 시 reject 가능성 | 600ms safety 타임아웃으로 SHOT_END 강제 | 다음 shot 진행 | |
| 사용자 조작 도중 프로그래밍 focus 호출 | paused=true | 명시 명령 우선 | FOCUS 실행, paused 유지 (시퀀스 재개 아님) | 새 transform | |
| 같은 target으로 연속 focus | idle | 재측정 없이 반복 금지 | 이전 rect 캐시 무효화, 재측정 후 transform | 변환 재적용 | |
| `prefers-reduced-motion: reduce` | 모든 shot | 접근성 표준 | duration 0으로 덮어쓰기, transition 제거 | 즉시 transform | |
| scale < 0.1 또는 > 10 | USER_ZOOM | 기존 ZoomPanCanvas와 동일 가드 | clamp 적용 | 경계값 유지 | |
| shots 배열이 중간에 prop 교체됨 | view 모드 재생 중 | 선언형 OCP: 합성 런타임 불변 권고. 그러나 React 재렌더는 불가피 | 현재 shot은 완주, 다음부터 새 배열 적용 | shotIndex 보존(배열 길이 내), 초과 시 stop | |
| mode='interact' 중 shots 제공됨 | — | 시퀀스는 view 전용 | 무시 (조용히 대기) | — | |
| 시퀀스 autoplay off (예: 외부 제어) | view 모드 | `autoplay?: boolean` (기본 true) | false면 play() 호출 전까지 idle | shotIndex=0, paused=true | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 제1원칙 "있는 걸로" (CLAUDE.md) | ② 산출물 | OK — ZoomPane/Canvas 로직 흡수, 신규는 reducer/scheduler 최소 | — | |
| 2 | UI 레이어 규칙 (feedback_ui_layer_rules) | 배치 | OK — ui/에 위치, 완성품 | — | |
| 3 | 선언적 OCP (feedback_ocp_principles) | ③ advance dispatcher | 잠재 위반: switch-case로 advance 분기 금지 | advance별 handler 맵(`{time: ..., end: ..., signal: ...}`) 선언 | |
| 4 | Event 선언적 맵 (feedback_event_handling) | wheel/pointer | OK — 핸들러 맵 사용, 사용자 조작 감지 시 일괄 PAUSE 디스패치 | — | |
| 5 | 자동 파생 (feedback_auto_derivation_is_system) | shot duration 기본값 | 기본 duration/scale은 reduced-motion·target 크기에서 자동 파생 | 기본값 테이블 금지, 함수로 계산 | |
| 6 | Reversible motion (feedback_reversible_motion) | USER_PAN/ZOOM | OK — 같은 조작 역방향 복귀 가능 (휠 반대/드래그 반대) | — | |
| 7 | Focus 결과 지향 (feedback_focus_principles) | target 없음 시 | 예외 분기 금지, fallback 체인 | shot skip + warn (④ 첫 행) | |
| 8 | Animation buys time (feedback_animation_buys_time) | hold | OK — hold = 의도적 페이싱 | — | |
| 9 | Render function = slot (feedback_render_function_is_slot) | children | OK — Camera는 children을 transform 대상으로만 쓰고 내부 state 주입 없음 | — | |
| 10 | camera를 axis 체계에 편입 금지 (리서치) | 아키텍처 | 독립 프리미티브로 설계 (Non-Goal 명시) | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | FileViewer.tsx zoomRef 호출 (L21, 54, 57, 63, 79) | `zoomToLine` 시그니처 변경 | 높음 | Camera handle에 `focus(selector, ...)` 제공, 어댑터 불필요 | |
| 2 | Lightbox.tsx `<ZoomPanCanvas initialScale>` (L81) | initialScale 적용 경로 | 중간 | 마운트 시 `useEffect`에서 `cameraRef.current?.focus(rect, { duration: 0, scale: initial })` 호출 (선언형 shot 대신 명령형 즉시 focus — 더 단순하고 동작 동일) | |
| 3 | PageReplay·SessionDetailModal zoomActiveRef | 플래그 기반 로직을 advance:'signal'로 대체 | 높음 | replay dispatcher가 Camera handle에 `focus()` 직접 호출, zoomActiveRef 제거 | |
| 4 | transform 모델 전환 (origin → translate) | subpixel 렌더링 차이로 텍스트 블러 가능 | 중간 | `translate: round(px)` + `will-change: transform`, 시각 회귀 데모로 검증 | |
| 5 | CATALOG.md (ZoomPanCanvas 등록, ZoomPane 미등록) | 외부 API 경로 변경 | 낮음 | ZoomPane/Canvas 제거, Camera 등록 | |
| 6 | scrollToLineAwait 내부 600ms safety | WAAPI 전환 시 scroll 정착 대기 로직 재배치 | 중간 | FOCUS 액션 내부에 보존 (scroll → measure → animate 순차) | |
| 7 | 데모 파일 부재로 회귀 감지 불가 | 마이그레이션 시각 차이 놓침 | 중간 | Camera.demo.tsx + 기존 호출부 수동 스모크 테스트 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | advance 처리를 `switch(advance)`로 구현 | ⑤#3 | 선언적 OCP 위반, 새 advance 추가 시 여러 곳 수정 | |
| 2 | `mode === 'view' ? ... : ...` 3항 조건으로 핸들러 분기 | ⑤#3 | keyMap/핸들러 맵을 모드 시점에 합성 | |
| 3 | 사용자 조작 후 idle 타이머로 auto-resume | discuss 결정(α) | "언제나 pause" 원칙, resume은 소비자 책임 | |
| 4 | shot 기본 duration을 상수 테이블로 지정 | ⑤#5 | 자동 파생 원칙, reduced-motion·target 크기에서 계산 | |
| 5 | camera를 axis로 편입 | Non-Goals | 2D 연속값은 axis 모델과 맞지 않음 | |
| 6 | `idle-resume` 옵션 prop 추가 | discuss 결정 | 복잡도↑ 이득↓ | |
| 7 | children에 ReactNode 외 slotProps 주입 | ⑤#9 | Camera는 transform 컨테이너, children 상태 의존 금지 | |
| 8 | transform-origin 기반 모델 유지 | ⑥#4, Decision | 사용자 팬과 호환 불가 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| 1 | ①#1 | mode='view', shot target=`[data-line="42"]`, scale=1.5 | 라인 42로 translate+scale, scrollToLineAwait 대기 확인 | |
| 2 | ①#2, ④#3 | 시퀀스 진행 중 wheel 이벤트 디스패치 | paused=true, shotIndex 보존, 변환 반영 | |
| 3 | ①#3 | mode='interact', wheel+ctrl at (100,100) | 포인터 중심 줌, scale·translate 보정 | |
| 4 | ①#4, ④#2 | shot A (advance:'end', duration:400, hold:1000) → shot B | 400ms 후 B는 시작 안 함 → 1400ms 후 B 시작 | |
| 5 | ①#5 | advance:'signal', 외부 next() | next 호출 전까지 대기, 호출 후 진행 | |
| 6 | ①#6 | pause 상태에서 play() | 보존된 shotIndex부터 재개 | |
| 7 | ①#7 | 임의 mode에서 ref.focus(target) | 즉시 transform, paused 상태 유지 | |
| 8 | ①#8, ④ reduced-motion | prefers-reduced-motion:reduce + shot | duration=0, 즉시 transform | |
| 9 | ④#1 | target selector 불일치 | rAF 후에도 없으면 warn + skip, 시퀀스 계속 | |
| 10 | ④ scale clamp | USER_ZOOM으로 scale=20 시도 | 10으로 clamp | |
| 11 | ⑥#1 마이그레이션 | FileViewer `focus(lineSelector, {scale:1.5})` | 기존 zoomToLine과 동일 시각 결과(허용 오차 ±3px) | |
| 12 | ⑥#3 마이그레이션 | replay delta "zoom line N" | Camera handle 통해 재생, zoomActiveRef 없이 동작 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

**교차 검증:**
1. 동기 ↔ 검증: 시나리오 1~8 전부 ⑧#1~8에 매핑 ✅
2. 인터페이스 ↔ 산출물: CameraHandle(focus/play/stop/setMode) ↔ reducer actions 일치 ✅
3. 경계 ↔ 검증: ④의 target 부재·clamp·reduced-motion 모두 ⑧에 포함 ✅
4. 금지 ↔ 출처: 8개 항목 모두 ⑤ 또는 discuss 결정에 연결 ✅
5. 원칙 대조 재검: 수정(⑤#3 dispatcher 맵, ⑤#5 자동 파생, ⑤#7 fallback) 후 신규 위반 없음 ✅

**(?) 추측 항목**: 없음. 모든 항목 discuss·리서치 근거 확보.

#kind/prd #topic/ui
