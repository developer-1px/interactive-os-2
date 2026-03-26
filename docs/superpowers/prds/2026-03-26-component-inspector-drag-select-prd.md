# Component Inspector: 아키텍처 분리 + 드래그 영역 선택 — PRD

> Discussion: Component Inspector의 요소 선택 UX 개선(드래그 마키 선택) + vite plugin 경량화(LOC만) + UI를 os 레이어로 이동

## ① 동기

### WHY

- **Impact**: 밀집/중첩 UI(Zone > Item > Field > Trigger)에서 Component Inspector로 원하는 요소를 선택하려면 hover 1개씩 순회 + Cmd+Up/Down 반복이 필요. 디버깅/디자인 튜닝의 피드백 루프가 느림
- **Forces**: (1) 현재 선택 모델이 `elementFromPoint` 기반 단일 포인트 — 가장 안쪽 요소만 잡힘 (2) vite plugin이 빌드 타임 LOC 주입 + 런타임 UI를 모두 담당 — os가 이미 컴포넌트 트리를 알고 있는데 별도로 DOM 탐색 (3) os 없이 inspector 단독 사용 불가해지는 의존 방향
- **Decision**: (A) vite plugin은 `data-inspector-line`/`data-inspector-loc` 주입만 남기고 UI 코드 제거 (B) Inspector UI를 os/devtools 레이어로 이동하여 os 트리 모델 기반 선택 (C) 기존 hover+click 유지 + 드래그 마키 선택 추가. 기각 대안: vite plugin 안에서 drag select 추가 — os 트리 모델과 중복, 기각
- **Non-Goals**: (1) 드래그로 요소 이동/리사이즈 같은 시각 조작 (2) AI 기반 의도 해석 (Google AI Studio Annotation Mode처럼) (3) 코드 자동 반영 (Inspector → source code writeback)

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | Inspector 활성, 밀집된 TreeGrid 영역 | 빈 영역에서 드래그하여 사각형 그림 | 영역 내 교차하는 요소 후보 리스트가 나타남 | |
| M2 | 후보 리스트 표시 중 | 리스트에서 항목 하나를 클릭 | 해당 요소가 선택(lock)되고 overlay + tooltip 표시 | |
| M3 | Inspector 활성, 요소 위에서 | 클릭 (드래그 없이) | 기존과 동일하게 해당 요소 lock/unlock | |
| M4 | Inspector 활성 | Cmd+Shift+D | Inspector 토글 (기존과 동일) | |
| M5 | Inspector 비활성 | 일반 드래그 동작 | Inspector가 개입하지 않음, 앱 동작 정상 | |

완성도: 🟢 90%

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `vite-plugin-inspector.ts` (수정) | LOC 주입만 남김. UI 마운트 코드(`client.tsx` import), middleware 제거 | |
| `src/devtools/inspector/ComponentInspector.tsx` (신규) | Inspector UI 메인 — 상태 관리, 이벤트 핸들링, overlay 렌더링. os 앱 안에서 overlay로 동작 (`Cmd+Shift+D` 토글). 기존 `DebugManager.tsx` 역할 | |
| `src/devtools/inspector/InspectorOverlay.tsx` (이동) | box model 시각화 + tooltip. 기존 코드 이동, os 트리 모델 연동 추가 | |
| `src/devtools/inspector/MarqueeSelect.tsx` (신규) | 드래그 사각형 렌더링 + 영역 내 요소 수집 + 후보 리스트 UI | |
| `src/devtools/inspector/inspectorUtils.ts` (이동) | 기존 `utils.ts` 이동. fiber 탐색 + LOC 읽기 + os 컴포넌트 감지 | |
| `vite-plugins/component-inspector/` (삭제) | UI 디렉토리 전체 삭제. vite plugin 본체만 잔류 | |

완성도: 🟢 90%

## ③ 인터페이스

### 인터페이스 체크리스트

- [x] ↑ 키: 후보 리스트에서 이전 항목으로 이동. 리스트가 세로 목록이므로
- [x] ↓ 키: 후보 리스트에서 다음 항목으로 이동
- [x] ← 키: N/A (후보 리스트는 1차원)
- [x] → 키: N/A
- [x] Enter: 후보 리스트에서 현재 항목 선택(lock). 선택 확정 동작
- [x] Escape: 후보 리스트 닫기 / Inspector 비활성화. 취소 계층
- [x] Space: N/A (Enter와 중복 방지)
- [x] Tab: N/A (Inspector overlay는 앱 탭 순서 밖)
- [x] Home/End: 후보 리스트 첫/끝 항목. 리스트가 길어질 수 있으므로
- [x] Cmd+Up/Down: 기존 부모/자식 탐색 유지
- [x] Cmd+Shift+D: Inspector 토글 (기존)
- [x] 클릭: 요소 위 = lock/unlock (기존), 후보 리스트 항목 = 선택
- [x] 더블클릭: N/A
- [x] 드래그: 마키 사각형 → 후보 수집
- [x] 이벤트 버블링: Inspector overlay는 `pointerEvents: none` 기본, 후보 리스트만 `pointerEvents: auto`

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| mousedown + 5px 이상 이동 | Inspector 활성, 잠금 없음 | 마키 사각형 렌더링 시작 | 5px threshold로 click과 drag 분리 — Figma/OS 표준 패턴 | 드래그 중 | |
| mouseup (드래그 종료) | 드래그 중, 사각형 존재 | 사각형과 교차하는 요소 수집 → 후보 리스트 표시 | `getBoundingClientRect` 교차 판정, os 트리 모델에서 역할/이름 조회 | 후보 리스트 표시 | |
| ↑/↓ | 후보 리스트 표시 | 포커스 이동 + 해당 요소 하이라이트 | 시각적 프리뷰로 어떤 요소인지 확인 가능 | 리스트 포커스 변경 + overlay 갱신 | |
| Enter / 클릭 | 후보 리스트에서 항목 포커스 | 해당 요소를 lock, 리스트 닫힘 | 선택 확정 → 기존 lock 상태로 전환 | 요소 locked, overlay + tooltip 표시 | |
| Escape | 후보 리스트 표시 | 리스트 닫힘, 선택 취소 | 취소 = 이전 상태 복귀 | Inspector 활성, 잠금 없음 | |
| 클릭 (요소 위, 비드래그) | Inspector 활성 | lock/unlock 토글 (기존 동작) | 5px 미만 이동 = click으로 판정 | 요소 locked/unlocked | |
| Cmd+Up | 요소 locked | 부모로 이동 (기존) | DOM 트리 탐색 | 부모 요소 locked | |
| Escape | Inspector 활성, 잠금 없음 | Inspector 비활성화 | 최상위 취소 | Inspector 비활성 | |

완성도: 🟢 90%

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 마키 영역 내 요소 0개 | 드래그 종료 | 빈 리스트는 노이즈, 무시가 자연스러움 | 리스트 표시 안 함, 사각형 소멸 | Inspector 활성, 잠금 없음 | |
| 마키 영역 내 요소 1개 | 드래그 종료 | 후보가 1개면 리스트를 거칠 이유 없음 | 바로 해당 요소 lock | 요소 locked | |
| 마키 영역 내 요소 50+개 | 드래그 종료 | 긴 리스트는 스크롤 가능해야 하고, 최대 높이 제한 필요 | 스크롤 가능한 리스트, max-height 제한 | 후보 리스트 표시 (스크롤) | |
| 드래그 중 Escape | 드래그 진행 중 | 취소 의도가 명확 | 마키 사각형 소멸, 수집 취소 | Inspector 활성, 잠금 없음 | |
| display:contents 요소 | 드래그 종료 | bounding rect가 0이므로 교차 판정 불가 | 자식 요소들의 합성 rect로 대체 (기존 inspector 로직) | 후보에 포함 | |
| Inspector 비활성 상태에서 드래그 | 앱 일반 동작 | Inspector가 이벤트를 가로채면 앱 기능 파괴 | Inspector 개입 없음 | 앱 정상 동작 | |
| 후보 리스트 표시 중 외부 클릭 | 후보 리스트 표시 | 리스트 외부 클릭 = 취소 의도 | 리스트 닫힘 | Inspector 활성, 잠금 없음 | |
| 드래그 중 스크롤 시도 | 드래그 진행 중 | 드래그 중 좌표 보정 복잡도 대비 이득 낮음, 첫 버전 스코프 아웃 | 스크롤 안 됨 (드래그 우선) | 드래그 계속 | |

완성도: 🟢 90%

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② 산출물 파일명 | 준수 | — | |
| P2 | 중첩 렌더링에서 이벤트 버블링 가드 필수 (feedback) | ③ 마키 드래그 이벤트 | 준수 — Inspector overlay는 pointerEvents:none + capture phase | — | |
| P3 | os 레이어 의존 방향 (layer_structure_v2) | ② devtools → os 방향 | 준수 — devtools는 크로스커팅, os API를 읽기 전용으로 소비 | — | |
| P4 | CSS 모든 수치는 토큰 필수 (feedback) | 마키 사각형 / 후보 리스트 스타일링 | 예외 — devtools overlay는 디자인 시스템 밖, 앱 토큰 의존 시 디버깅 도구가 앱 테마에 종속됨 | — | |
| P5 | 선언적 OCP (feedback) | 후보 리스트 필터링 | 준수 — os 트리 모델 기반 쿼리, 하드코딩 분기 없음 | — | |
| P6 | 테스트: 계산은 unit, 인터랙션은 통합 (CLAUDE.md) | ⑧ 검증 | 준수 — 교차 판정 = unit, 드래그→선택 = userEvent 통합 | — | |

완성도: 🟢 90%

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `vite-plugin-inspector.ts` — UI 마운트 코드 제거 | vite plugin만으로 inspector UI 불가 | 중 | 의도된 변경. os 레이어에서 UI 담당 | |
| S2 | `vite-plugins/component-inspector/ui/` 삭제 | 기존 import 경로 깨짐 | 높 | 전수 grep + 경로 업데이트 | |
| S3 | `createReproRecorder.ts` — inspector 이벤트 리스닝 | `inspector:element-selected` 커스텀 이벤트 유지 필요 | 중 | 새 ComponentInspector에서 동일 이벤트 dispatch | |
| S4 | 기존 hover+click 동작 | drag 판정 로직 추가로 click 지연 가능성 | 낮 | 5px threshold는 즉각적, 체감 지연 없음 | |
| S5 | body.debug-mode-active 클래스 | 새 위치에서도 동일 클래스 토글 필요 | 낮 | 그대로 유지 | |

완성도: 🟢 90%

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| N1 | Inspector 비활성 시 드래그 이벤트 가로채기 | ⑥ S4 | 앱의 정상 드래그 동작(DnD 등) 파괴 | |
| N2 | 후보 리스트에서 os 상태 변경 (dispatch) | ⑤ P3 읽기 전용 | Inspector는 관찰 도구, 상태 변경은 Store Inspector 영역 | |
| N3 | vite plugin에 런타임 UI 코드 남기기 | ⑥ S1 아키텍처 분리 목적 | 빌드 타임/런타임 관심사 혼재 재발 방지 | |
| N4 | `inspector:element-selected` 이벤트 형식 변경 | ⑥ S3 REC 연동 | 기존 소비자(REC)와의 계약 유지 | |
| N5 | 드래그 중 스크롤 보정 구현 | 스코프 관리 | 첫 버전에서 복잡도 대비 이득 낮음. 드래그 중 스크롤 안 됨이 허용됨 | |

완성도: 🟢 90%

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | Inspector 활성 → 빈 영역 드래그 → 사각형 렌더링 | 마키 사각형이 드래그 영역에 표시됨 | |
| V2 | ①M1 + ①M2 | 마키 드래그 종료 → 영역 내 요소 3개 | 3개 항목의 후보 리스트 표시 (역할, 이름 포함) | |
| V3 | ①M2 | 후보 리스트에서 ↓↓ Enter | 세 번째 항목 선택 → lock → overlay 표시 | |
| V4 | ①M3 | 요소 위에서 클릭 (5px 미만 이동) | 기존 lock/unlock 동작 그대로 | |
| V5 | ①M5 | Inspector 비활성 → 드래그 | 앱 정상 동작, Inspector 개입 없음 | |
| V6 | ④ 요소 0개 | 빈 영역 마키 드래그 | 리스트 표시 안 함, 사각형 소멸 | |
| V7 | ④ 요소 1개 | 단일 요소 포함 마키 | 리스트 없이 바로 lock | |
| V8 | ④ Escape | 후보 리스트 중 Escape | 리스트 닫힘, 선택 취소 | |
| V9 | ④ 외부 클릭 | 후보 리스트 외부 클릭 | 리스트 닫힘 | |
| V10 | ⑥ S3 | 마키로 요소 선택 후 | `inspector:element-selected` 이벤트 발생, REC 수신 가능 | |
| V11 | ② 산출물 | vite plugin 수정 후 빌드 | `data-inspector-line` 속성 정상 주입, UI 코드 없음 | |
| V12 | ③ Cmd+Up | 마키로 선택 후 Cmd+Up | 기존 부모 탐색 동작 정상 | |

완성도: 🟢 90%

---

**전체 완성도:** 🟢 8/8
