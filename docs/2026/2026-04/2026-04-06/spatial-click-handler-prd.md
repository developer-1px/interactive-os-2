---
id: 2-areas/axis/prds/spatial-click-handler-prd
title: 'Spatial Click Handler — PRD'
created: 2026-04-06
updated: 2026-04-08
summary: 'Discussion: CMS가 spatial depth를 click으로 전환할 때 12줄 우회 코드가 필요. spatial plugin에 click handler가 없어서 발생.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Spatial Click Handler — PRD

> Discussion: CMS가 spatial depth를 click으로 전환할 때 12줄 우회 코드가 필요. spatial plugin에 click handler가 없어서 발생.

## ① 동기

### WHY

- **Impact**: spatial navigation을 사용하는 모든 소비자(CMS, 향후 nested UI)가 click 시 depth 전환을 직접 구현해야 한다. CmsCanvas에서 12줄, 향후 다른 spatial 사용처에서도 동일한 코드 반복.
- **Forces**: (원인) spatial plugin은 키보드(Enter=enterChild, Escape=exitToParent)만 지원하고 click을 처리하지 않음. (제약) clickMap v1은 이미 존재하므로 기존 구조 활용해야 함. drag&drop과 겹치지 않아야 함.
- **Decision**: spatial plugin에 `clickToNavigate` handler 추가. 클릭된 노드의 depth를 자동 감지하여 enterChild/exitToParent/setFocus를 자동 dispatch. 기각 대안: (a) CMS 코드를 유지 — 다른 소비자에서 반복, (b) 새 axis 추가 — 과도한 추상화, spatial plugin 확장이 적절.
- **Non-Goals**: clickMap 구조 자체 변경 (이미 v1 작동 중). drag&drop 개선. contentEditable 개선.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | spatial view에서 루트 레벨 포커스 | 자식 노드 클릭 | enterChild(parent) + setFocus(child) 자동 dispatch | |
| S2 | 자식 레벨에서 포커스 | 같은 레벨의 다른 노드 클릭 | setFocus(target)만 dispatch | |
| S3 | 자식 레벨에서 포커스 | 루트 레벨 노드 클릭 | exitToParent + setFocus(target) 자동 dispatch | |
| S4 | 자식 레벨에서 포커스 | 더 깊은 자식 노드 클릭 | enterChild(targetParent) + setFocus(target) | |
| S5 | spatial view에서 | Shift+Click | selection 동작 유지 (spatial click과 충돌 안 함) | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `spatial plugin` 확장 | `clickToNavigate` handler — 클릭 시 depth 자동 전환 + setFocus | |
| `CmsCanvas.tsx` 리팩토링 | handleNodeClick 12줄 → spatial plugin 위임으로 제거 | |
| clickMap 바인딩 | spatial 사용 패턴에서 `'Click': spatialClickHandler` 자동 등록 | |

완성도: 🟢

## ③ 인터페이스

> 비-UI 인프라 변경. click 입력에 대한 상태 변환 명세.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Click(nodeId) | spatialParent = root, nodeId의 parent = sectionA | enterChild + setFocus | 클릭된 노드가 현재 depth보다 깊으므로 부모에 진입 후 포커스 | spatialParent = sectionA, focused = nodeId | |
| Click(nodeId) | spatialParent = sectionA, nodeId의 parent = sectionA | setFocus | 같은 depth이므로 포커스만 이동 | focused = nodeId | |
| Click(nodeId) | spatialParent = sectionA, nodeId의 parent = root | exitToParent + setFocus | 클릭된 노드가 현재 depth보다 얕으므로 부모로 복귀 후 포커스 | spatialParent = root, focused = nodeId | |
| Shift+Click | 어떤 상태든 | selection 처리 (기존 clickMap) | modifier가 있으면 spatial click이 아닌 selection으로 분기 | selection 변경 | |
| Click + dnd 진행 중 | 드래그 중 | 무시 | dnd 중에는 click이 spatial navigation을 트리거하면 안 됨 | 변화 없음 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 3단계 이상 깊이에서 2단계 올라가는 클릭 | depth=3, target의 parent=root | 한 번에 여러 depth를 올라가야 함 | exitToParent 반복 또는 루트까지 한 번에 복귀 + setFocus | spatialParent = root | |
| 삭제된 노드 클릭 (race condition) | 노드가 store에서 제거됨 | 유효하지 않은 노드에 포커스하면 안 됨 | 무시 (no-op) | 변화 없음 | |
| contentEditable 안에서 클릭 | 인라인 편집 모드 | 텍스트 커서 이동이어야지 spatial navigation이면 안 됨 | spatial click 무시, 기본 브라우저 동작 | 편집 모드 유지 | |
| spatial 미사용 패턴에서 클릭 | 일반 listbox | spatial handler가 등록되지 않으므로 기존 clickMap 동작 | 기존 동작 유지 | 기존 동작 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 선언적 OCP — 확장 = Record 추가 (feedback_declarative_ocp) | ② clickMap 바인딩 | ✅ 준수 | spatial plugin이 clickMap handler를 제공, pattern이 바인딩 | |
| 2 | 축 = capability SSOT, 패턴이 바인딩 (feedback_axis_pattern_principles) | ② spatial plugin | ✅ 준수 | plugin이 handler 제공, pattern이 `'Click': handler` 바인딩 | |
| 3 | focus ≠ selection ≠ activation (feedback_apg_three_concepts) | ③ Shift+Click | ✅ 준수 | modifier 분기로 selection과 spatial navigation 분리 | |
| 4 | Plugin은 keyMap까지 소유 (feedback_axis_pattern_principles) | ② plugin 확장 | ✅ 준수 | spatial plugin이 clickMap handler도 소유 (keyMap과 대칭) | |
| 5 | CMS는 OS 이용자 (feedback_cms_rules) | ② CMS 리팩토링 | ✅ 준수 | CMS 우회 코드 제거 → OS plugin 사용 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | spatial plugin의 keyMap | clickMap handler 추가로 plugin 크기 증가 | 낮음 | handler는 enterChild/exitToParent 재사용 (새 로직 최소) | |
| 2 | CmsCanvas.tsx의 handleNodeClick | 제거 후 spatial plugin에 위임 | 없음 | 기대 동작 — 코드 감소 | |
| 3 | 기존 clickMap 동작 (select 등) | spatial click과 select click 충돌 가능 | 중간 | modifier 분기: plain Click = spatial, Shift/Cmd+Click = select | |
| 4 | dnd plugin과의 상호작용 | drag 시작 시 click이 spatial을 트리거할 수 있음 | 중간 | dnd 진행 중 플래그 확인하여 spatial click 무시 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | clickMap 구조 자체 변경 | ⑤-1 OCP | v1 clickMap이 작동 중이므로 API 유지 | |
| 2 | modifier click을 spatial로 처리 | ⑤-3 APG 3개념 | Shift/Cmd+Click은 selection 전용 | |
| 3 | dnd 진행 중 spatial click 발동 | ⑥-4 | drag 도중 depth 변경은 혼란 | |
| 4 | contentEditable 내부에서 spatial click 발동 | ④ 경계 | 텍스트 편집 중 spatial navigation은 편집 방해 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 동기 | 루트에서 자식 노드 클릭 | enterChild + setFocus 자동 dispatch | |
| V2 | S2 동기 | 같은 레벨 노드 클릭 | setFocus만 | |
| V3 | S3 동기 | 부모 레벨 노드 클릭 | exitToParent + setFocus | |
| V4 | S5 동기 | Shift+Click | spatial 무시, selection 처리 | |
| V5 | E1 경계 | 3단계 깊이에서 루트 클릭 | 루트까지 복귀 + setFocus | |
| V6 | E2 경계 | 삭제된 노드 클릭 | no-op | |
| V7 | E3 경계 | 편집 모드에서 클릭 | spatial 무시, 브라우저 기본 동작 | |
| V8 | E4 경계 | spatial 미사용 패턴에서 클릭 | 기존 clickMap 동작 유지 | |
| V9 | ⑥-4 부작용 | dnd 중 클릭 | spatial 무시 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

#kind/prd #topic/axis
