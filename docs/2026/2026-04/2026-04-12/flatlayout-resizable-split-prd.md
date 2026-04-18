---
id: 2-areas/layout/prds/flatlayout-resizable-split-prd
type: prd
slug: flatlayoutResizableSplit
title: 'FlatLayout Resizable Split — PRD'
tags: [untagged]
created: 2026-04-12
updated: 2026-04-12
summary: 'Discussion: FlatLayout split 렌더러를 SplitPane으로 위임하여 리사이즈 가능하게 하고, raised widget에 그림자 가시성 확보, CodeBlock fill clipping 구현'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# FlatLayout Resizable Split — PRD

> Discussion: FlatLayout split 렌더러를 SplitPane으로 위임하여 리사이즈 가능하게 하고, raised widget에 그림자 가시성 확보, CodeBlock fill clipping 구현

## ① 동기

### WHY

- **Impact**: FlatLayout 기반 페이지(Creator, CMS)에서 패널 크기를 조절할 수 없어 사용자가 작업 맥락에 맞게 화면을 구성하지 못함. raised 패널의 그림자가 잘려 시각 계층이 무너지고, CodeBlock이 rounded 부모를 삐져나옴
- **Forces**: FlatLayout은 선언적 NormalizedData 기반 — 인터랙티브 레이아웃(리사이즈)을 고려하지 않음. SplitPane은 children 기반 명령형 API — 선언적 트리와 브릿지 필요
- **Assets**: SplitPane(완성품, ARIA separator 포함), workspace:resize command, layout plugin(workspace 합성), definePage 선언 모델
- **Decision**: split 렌더러 내부에서 SplitPane 위임. 별도 타입(`resizable-split`) 대신 기본 resizable + opt-out(`resizable: false`). 근거: VS Code/Allotment 패턴 — constraint 기반 기본 on이 표준. react-resizable-panels도 handle 자동 삽입 패턴
- **Non-Goals**: SplitPane API 변경, layoutRenderers OCP 리팩토링(별도 과제), 새로운 영속 plugin 생성

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Creator 3패널(sidebar/preview/source) | separator를 드래그 | 패널 크기가 실시간 변경됨 | |
| S2 | Creator에서 패널 크기를 조절한 상태 | 새로고침 | 조절한 크기가 유지됨 | |
| S3 | Creator source 패널(raised) | 렌더링 | box-shadow가 보임 | |
| S4 | Creator source 패널 안의 CodeBlock | flush variant로 렌더 | 부모 rounded 모서리에 맞게 clipping됨 | |
| S5 | CMS split (resizable 기본 on) | separator를 드래그 | 리사이즈 가능 | |
| S6 | 키보드 사용자가 separator에 포커스 | Arrow 키 누름 | 패널 크기가 STEP만큼 변경 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `SplitNode.resizable` | `flatLayout.ts`에 `resizable?: boolean` 필드 추가 (기본 true) | |
| `LayoutRenderContext.dispatch` | context에 `dispatch: (command: Command) => void` 추가 | |
| split 렌더러 SplitPane 위임 | `layoutRenderers.split`이 `resizable !== false`일 때 SplitPane 렌더 | |
| split 렌더러 onResize 핸들러 | `workspace:resize` command dispatch | |
| FlatLayout.module.css clipping | raised widget의 내부 콘텐츠 clipping (overflow:hidden + border-radius) | |
| split 컨테이너 overflow 조정 | raised 자식의 shadow가 보이도록 split 컨테이너의 overflow 처리 | |
| PageComponentCreator 영속 | useState + localStorage로 layoutData 관리 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| separator 드래그 | sizes: [0.15, 'flex', 0.35] | SplitPane onResize → dispatch(workspace:resize(nodeId, newSizes)) | SplitPane이 드래그 delta를 비율로 변환, command가 NormalizedData의 split 노드 sizes를 업데이트 | sizes: [0.20, 'flex', 0.30] | |
| separator 키보드 Arrow | sizes: [0.15, 'flex', 0.35] | SplitPane 내부 keyboardResize → onResize | ARIA separator 패턴, STEP=0.02 per arrow | sizes: [0.17, 'flex', 0.33] | |
| onChange 호출 | FlatLayout store 변경됨 | 페이지의 onChange 콜백 실행 → localStorage.setItem | FlatLayout이 aria.onChange를 통해 변경된 NormalizedData를 전달, 페이지가 영속 | localStorage에 sizes 저장 | |
| 페이지 마운트 | localStorage에 저장된 layout 있음 | useState 초기값으로 localStorage 데이터 사용 | definePage 결과 대신 저장된 NormalizedData 복원 | 이전 세션의 sizes로 렌더 | |
| split `resizable: false` | 고정 비율 split | plain div로 렌더 (현재와 동일) | SplitPane 위임 없이 CSS var 고정 비율 | 리사이즈 불가 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 패널을 극단까지 축소 | sizes: [0.15, 'flex', 0.35] | SplitPane minRatio=0.1이 하한 보장 | 10% 미만으로 줄어들지 않음 | sizes: [0.10, 'flex', 0.40] | |
| localStorage에 오래된/잘못된 JSON | 페이지 마운트 | 깨진 데이터로 렌더하면 crash | JSON.parse 실패 시 definePage 기본값 fallback | 기본 sizes로 렌더 | |
| split 자식이 1개 | children.length === 1 | SplitPane은 1개면 separator 없이 단일 child 반환 | separator 없이 단일 패널 렌더 | 리사이즈 UI 없음 | |
| raised widget 안에 popup/overlay | raised + overflow:hidden | clipping이 popup을 잘라버리면 안 됨 | overflow:hidden은 widget 내부 콘텐츠 영역에만 적용, popup은 portal로 별도 레이어 | popup 정상 표시 | |
| shadow가 split 컨테이너에 잘림 | 부모 overflow:hidden | box-shadow는 부모의 overflow에 의해 clip됨 | split 컨테이너의 overflow를 visible로 변경하되, 각 splitPane 자식이 자체 scroll 소유 | shadow 가시 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | surface 소유 속성에 module.css last-mile 금지 (feedback_surface_no_lastmile) | raised clipping | ⚠️ 경계 | overflow:hidden은 surface 소유가 아님(layout 관심사) → last-mile 허용. 단 bg/border/radius는 ax()만 | |
| P2 | 배치=XY+Z, FlatLayout이 소유 (feedback_arrangement_xyz) | split overflow 변경 | ✅ 준수 | clipping은 layout(배치) 관심사이므로 FlatLayout이 소유하는 게 맞음 | |
| P3 | 모든 상태는 NormalizedData+Command (feedback_all_state_normalized_command) | resize 영속 | ✅ 준수 | resize → workspace:resize command → NormalizedData 변경 → onChange → localStorage. engine 경유 | |
| P4 | style={}는 해치 (feedback_style_is_hatch) | SplitPane 동적 비율 | ✅ 허용 | 동적 비율은 CSS variable로 주입 불가피. 기존 SplitPane/FlatLayout 모두 동일 패턴 | |
| P5 | @layer cascade 잠금 (feedback_css_layer_lock) | CSS 추가 | ✅ 준수 | FlatLayout.module.css는 이미 @layer component 안. 추가도 같은 layer 안에 | |
| P6 | pages에서 useAria 직접 사용 금지 (CLAUDE.md) | 페이지 영속 | ✅ 준수 | 페이지는 FlatLayout의 onChange prop만 사용. useAria는 FlatLayout 내부 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | 모든 FlatLayout split에 separator 출현 | CMS split에도 리사이즈 핸들이 보임 | 낮음 | 의도된 동작 — CMS도 리사이즈 가능하면 UX 향상. 문제 시 `resizable: false` opt-out | |
| E2 | split 컨테이너 overflow:hidden → visible 변경 | 자식 콘텐츠가 split 영역 밖으로 넘칠 수 있음 | 중간 | 각 splitPane 자식(.splitChild)이 자체 overflow:hidden 소유하여 콘텐츠는 잘리되 shadow만 보이게 | |
| E3 | SplitPane.css + FlatLayout.module.css 공존 | SplitPane separator 스타일이 FlatLayout 내부에서 적용됨 | 낮음 | 같은 @layer component, SplitPane.css는 separator 전용이므로 충돌 없음 | |
| E4 | FlatLayout.module.css .splitPane 클래스 | SplitPane 위임 후 CSS var 기반 .splitPane이 불필요해짐 | 낮음 | resizable:true일 때 SplitPane이 flex 관리, resizable:false일 때만 기존 .splitPane 사용. 조건부 유지 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | raised widget의 bg/border/shadow를 module.css에 재지정 | P1 surface 소유 | ax() surface가 소유. last-mile은 overflow만 허용 | |
| X2 | 페이지에서 직접 useAria 호출하여 resize 처리 | P6 pages 규칙 | FlatLayout 내부에서 dispatch, 페이지는 onChange만 수신 | |
| X3 | localStorage에 전체 NormalizedData 저장 | 성능/보안 | sizes 관련 데이터만 저장하거나, NormalizedData가 크지 않음을 확인한 뒤 전체 저장 | |
| X4 | SplitPane props 인터페이스 변경 | 제약 | 기존 SplitPane 사용처(Workspace, Inspector 등 9개)에 영향 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 드래그 | Creator에서 sidebar-preview separator 드래그 | sidebar 너비가 실시간 변경, preview가 나머지 채움 | |
| V2 | S2 영속 | Creator에서 크기 조절 후 새로고침 | 조절한 크기 유지 | |
| V3 | S3 그림자 | Creator source 패널(raised) | box-shadow 가시 확인 | |
| V4 | S4 clipping | Creator source CodeBlock(flush) | 부모 rounded 모서리에 맞게 잘림, 삐져나오지 않음 | |
| V5 | S6 키보드 | separator에 Tab으로 포커스 → Arrow Right | 패널 크기 0.02 변경 | |
| V6 | 경계: 극단 축소 | separator를 끝까지 드래그 | minRatio 하한(10%)에서 멈춤 | |
| V7 | 경계: 잘못된 localStorage | localStorage에 잘못된 JSON 후 마운트 | 기본 definePage sizes로 fallback | |
| V8 | 경계: resizable:false | split에 resizable:false 설정 | separator 없이 고정 비율 렌더 | |
| V9 | E1 CMS | CMS split에 separator | 리사이즈 가능, 기존 기능 정상 | |
| V10 | E2 overflow | raised widget 안 스크롤 콘텐츠 | 콘텐츠는 widget 안에서 스크롤, shadow는 밖에 보임 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
