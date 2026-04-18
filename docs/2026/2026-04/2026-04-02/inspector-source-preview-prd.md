---
id: 1-projects/viewer/prds/inspector-source-preview-prd
type: prd
slug: inspectorSourcePreview
title: 'Inspector Source Preview — PRD'
tags: [untagged]
created: 2026-04-02
updated: 2026-04-08
summary: 'Discussion: inspector lock 상태에서 모달 없이 소스코드를 즉시 확인 — 탐색 흐름 유지'
legacy:
  status: active
  kind: prd
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Inspector Source Preview — PRD

> Discussion: inspector lock 상태에서 모달 없이 소스코드를 즉시 확인 — 탐색 흐름 유지

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: inspector로 엘리먼트를 탐색하는 개발자가, 소스코드를 보려면 lock→파일명 클릭→모달이라는 3단계를 거쳐야 하고, 모달이 overlay를 가려서 탐색 흐름이 끊긴다
- **Forces**: inspector는 overlay 위에서 동작해야 하므로 모달이 자연스러운 선택이었으나, 모달은 overlay를 가림. 흐름 유지 vs 충분한 코드 영역 표시가 충돌
- **Decision**: contextmenu/popover처럼 마우스 근처에 floating panel을 띄우되, viewport 경계를 인식해 자동 배치. 배치 로직은 범용 유틸로 분리하여 재사용. 기각: 사이드 고정 패널(범용성 떨어짐), snippet만 표시(컨텍스트 부족)
- **Non-Goals**: FileViewerModal 제거(공존), 코드 편집 기능, 외부 에디터 연동

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | inspector 활성, 엘리먼트 hover 중 | 클릭 | 마우스 근처에 해당 라인 ±2줄(~5줄) 소스 preview가 뜸. 동시에 lock됨 | |
| S2 | preview가 떠 있음 (lock 상태) | 다른 엘리먼트 클릭 | 새 엘리먼트의 소스 preview로 교체, lock 대상 변경 | |
| S3 | preview가 떠 있음 (lock 상태) | 빈 곳 클릭 or Escape | preview 닫힘, unlock | |
| S4 | 마우스가 화면 우측 가장자리 | 클릭 | preview가 좌측에 뜸 (flip) | |
| S5 | 마우스가 화면 하단 가장자리 | 클릭 | preview가 viewport 안으로 shift | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/misc/computePlacement.ts` | 순수 함수. `(anchor, content, viewport) → {top, left}`. flip + shift 전략 | |
| `src/devtools/inspector/SourcePreview.tsx` | ~5줄 코드 preview. `/api/fs/file` fetch → 해당 라인 ±2줄 → CodeBlock 렌더. computePlacement로 위치 결정 | |
| `InspectorOverlay.tsx` 수정 | lock 시 SourcePreview 표시. 기존 tooltip 유지 | |
| `ComponentInspector.tsx` 수정 | 클릭 시 lock + preview 마우스 좌표 전달 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 클릭 (엘리먼트 위) | inspector 활성, hover 중 | lock + 마우스 좌표에 ~5줄 preview 표시 | 클릭 = "이거 보고 싶다". 바로 소스를 보여줘야 흐름 유지 | lock + preview 표시 | |
| 클릭 (다른 엘리먼트) | lock + preview 표시 중 | preview 새 소스로 교체, 새 마우스 좌표로 이동 | 탐색 계속. 이전 것은 관심 해제 | lock 대상 변경 + preview 교체 | |
| 클릭 (빈 곳) | lock + preview 표시 중 | preview 닫힘, unlock | 빈 곳 = 관심 해제 | unlocked, preview 없음 | |
| Escape | lock + preview 표시 중 | preview 닫힘, unlock | 기존 inspector Escape 동작 일치 | unlocked, preview 없음 | |
| Cmd+Up | lock + preview 표시 중 | 부모로 이동, preview 내용 교체 (위치 유지) | 기존 순회 유지. 마우스 안 움직이니 위치 고정 | lock=부모, preview 갱신 | |
| Cmd+Down | lock + preview 표시 중 | 자식으로 복귀, preview 내용 교체 (위치 유지) | 기존 순회 유지 | lock=자식, preview 갱신 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1: `data-inspector-line` 없는 엘리먼트 | hover 중 | 모든 엘리먼트에 소스 정보가 있진 않음 | lock되지만 preview 안 뜸. tooltip만 표시 | lock, preview 없음 | |
| E2: `/api/fs/file` fetch 실패 | 클릭 직후 | 파일 삭제/경로 변경 가능 | "Source not available" 표시 | lock + 에러 preview | |
| E3: 라인이 파일 처음 2줄 이내 | 클릭 직후 | ±2줄이 음수가 됨 | `max(1, line-2)`로 클램핑. 있는 만큼만 표시 | preview (5줄 미만) | |
| E4: 라인이 파일 끝 2줄 이내 | 클릭 직후 | ±2줄이 파일 길이 초과 | 파일 끝까지만 표시 | preview (5줄 미만) | |
| E5: viewport 매우 좁음 | 클릭 직후 | 480px가 viewport보다 클 수 있음 | `min(480, viewport - 16)` 제한 | 축소된 preview | |
| E6: 빠르게 연속 클릭 | 이전 fetch 진행 중 | race condition 발생 가능 | AbortController로 이전 fetch 취소, 마지막만 반영 | 최신 preview만 표시 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | UI → ui/ 완성품 사용 (CLAUDE.md) | ② SourcePreview | 비위반 — CodeBlock은 ui/ 완성품 | — | |
| P2 | ax()만 사용, style={} 금지 (CLAUDE.md) | ② SourcePreview | 허용 — devtools/inspector 전체가 style={} 관례 | — | |
| P3 | 배치 유틸은 misc/ 순수 함수 (discuss 제약) | ② computePlacement | 비위반 — 순수 계산, 레이어 의존 없음 | — | |
| P4 | addEventListener 금지, KeyMap 선언 (CLAUDE.md) | ③ 인터페이스 | 비위반 — 새 키바인딩 추가 없음. 기존 핸들러 내 상태 연동만 | — | |
| P5 | 중첩 이벤트 버블링 가드 (feedback) | ③ 클릭 | 비위반 — preview는 pointerEvents:none, 기존 가드 충분 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| B1 | InspectorOverlay tooltip | preview가 tooltip과 겹칠 수 있음 | 낮 | computePlacement가 겹침 회피 | |
| B2 | ComponentInspector 클릭 핸들러 | lock에 preview 상태 추가 | 낮 | 허용 — lock 유지, preview는 시각적 결과 추가 | |
| B3 | `inspector:open-source` → FileViewerModal | inspector에서 preview가 모달 대체 | 중 | inspector 맥락: 클릭→preview. 모달은 다른 경로에서 공존 | |
| B4 | `/api/fs/file` API | 클릭마다 fetch 발생 | 낮 | 같은 파일 연속 요청 시 메모리 캐시 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| N1 | FileViewerModal 삭제 | ⑥ B3 | 다른 경로에서 여전히 사용. 공존 | |
| N2 | preview에 코드 편집 기능 추가 | ① Non-Goals | scope 밖 | |
| N3 | preview에서 파일 전체 로드 후 슬라이싱 | ⑥ B4 | 대용량 파일 비용. 기존 API 전체만 지원 시 클라이언트 슬라이싱 허용 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①S1 | inspector 활성 → 엘리먼트 클릭 | 마우스 근처에 ~5줄 소스 preview 표시 | |
| V2 | ①S2 | preview 상태에서 다른 엘리먼트 클릭 | preview 내용·위치가 새 엘리먼트로 교체 | |
| V3 | ①S3 | preview 상태에서 Escape | preview 닫힘 | |
| V4 | ①S4 | 화면 우측 가장자리에서 클릭 | preview가 좌측에 뜸 (flip) | |
| V5 | ①S5 | 화면 하단 가장자리에서 클릭 | preview가 위로 shift | |
| V6 | ④E1 | source 정보 없는 엘리먼트 클릭 | lock되지만 preview 안 뜸 | |
| V7 | ④E6 | 빠르게 3개 엘리먼트 연속 클릭 | 마지막 클릭의 소스만 표시 | |

완성도: 🟢

---

**전체 완성도:** 🟢 구현 완료

## 역PRD

| 항목 | 증거 |
|------|------|
| computePlacement | `src/misc/computePlacement.ts` — 순수 배치 함수 |
| SourcePreview | `src/devtools/inspector/SourcePreview.tsx` — ~5줄 코드 preview |
| InspectorOverlay 통합 | `src/devtools/inspector/InspectorOverlay.tsx` — SourcePreview 참조 |
