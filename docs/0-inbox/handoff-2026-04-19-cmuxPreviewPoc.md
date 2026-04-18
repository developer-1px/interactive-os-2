---
created_at: 2026-04-19
---

# Handoff: cmux preview POC — 선언만으로 매트릭스 + 엔진 버그 2건 수정

> /discuss 에서 출발해 "LLM의 시각 미결정성을 FlatLayout 으로 해소한다"는 방향을 검증. `/cmux/preview?scenario=X` 라우트 + 5 시나리오 스냅 매트릭스로 definePage 선언-only 경로가 A2UI 수준으로 작동함을 실증. 파이프라인의 부산물로 엔진 버그 2건 수정, SRP/OCP 위반 1건 지적 받아 backlog 로 이관.

## 완료

| 영역 | 파일 | 내용 |
|------|------|------|
| POC 라우트 | `src/router.tsx` | `/cmux/preview` 등록 |
| POC 페이지 | `src/pages/cmux-preview/PageCmuxPreview.tsx` | definePage 1 + Provider + `<FlatLayout/>` 1회 (선언 only) |
| POC widget | `src/pages/cmux-preview/cmuxPreviewWidgets.tsx` | 5개 presentation widget, pull 모델 (`feedback_flatlayout_pull_not_push`) |
| POC context | `src/pages/cmux-preview/cmuxPreviewContext.ts` | domain Context — scenario 스위치의 축 |
| POC scenarios | `src/pages/cmux-preview/cmuxPreviewScenarios.ts` | 5 scenario: default / single / split / multi / empty |
| **엔진 버그 #1** | `src/interactive-os/layout/flatLayout.ts:117~129` | `definePage` factory가 TabNode.label 같은 사용자 선언 label 을 자동 생성 label 로 덮어쓰던 것 → 보존 fallback. backward-compat. |
| **엔진 버그 #2** | `src/interactive-os/ui/FlatLayout.tsx` tabgroup renderer | `+` 새 탭 어포던스 부재 (G-new-tab) → 탭바 우측에 `+` 버튼 인라인. active tab clone 후 addTab. **임시 인라인이라 OCP 위반** (backlog T3으로 분리 예정) |
| 매트릭스 증거 | `screenshots/cmux-preview/{default,single,split,multi,empty}.png` | 5장. G-new-tab 회귀 검증 완료 (default/single/split 에서 + 가시, multi 는 overflow 로 가려짐) |

## 남은 것

### 미완료 (세션 이어서도 OK)

1. **G-overflow** 부터 처리 — ViewerTabList 탭 overflow 처리 (scroll/ellipsis). 이게 풀리면 S4 multi 에서도 `+` 버튼이 보이고 G-new-tab 검증이 5/5 완료됨. `docs/5-backlogs/cmuxUiResidualGaps.md` 참조.
2. 매트릭스 재촬영으로 회귀 확인.

### 이후 (backlog)

- **FlatLayout SRP/OCP 리팩토링** → `docs/5-backlogs/flatLayoutSrpOcpRefactor.md` (T1 `/srp` + T2 `/ocp` + T3 affordance 플러그인). **이 세션에서 인라인으로 박은 `+` 버튼 60줄이 T3의 첫 피해자**.
- **cmux UI 잔여 gap** (G-active-content · G-tab-width · G-empty-state) → `docs/5-backlogs/cmuxUiResidualGaps.md`
- **A2UI simulation pipeline** (POC → 정식) → `docs/5-backlogs/a2uiSimulationPipeline.md`
- **Node v20 → v22+ 업그레이드** → `docs/BACKLOGS.md#infra` (이번 세션 `pnpm lint / test / check:deps` 가 `util.styleText` 미존재로 전부 차단됨)

## 컨텍스트

- **관련 memory**:
  - `project_flat_layout_engine` — FlatLayout=엔진, widget=React, layout=pull
  - `project_a2ui_composites` — ui/composites/ 의도 수준 컴포넌트 (POC 연장선)
  - `project_target_vibe_coding_engine` — 바이브코딩/Anthropic 앱 빌더 1차 고객
  - `feedback_flatlayout_pull_not_push` — definePage 는 구조만, widget 이 Context pull (이번 세션에 guardOsPatterns 훅으로 차단 경험)
  - `feedback_slot_existence_vs_intent` — DOM 테스트 pass ≠ 시각 완성도 (본 세션의 출발점)
  - `project_chat_cmux_layout` — /chat Wave A~D 산출물, 이번 POC 가 참조한 기반

- **참고 PRD**: `docs/2026/2026-04/2026-04-19/cmux-layout-prd.md` (지난 세션 — Wave A~D 의 원 PRD)

- **주의사항**:
  - `src/interactive-os/ui/FlatLayout.tsx` 에 **임시 인라인 + 버튼 코드** 있음. SRP/OCP 리팩토링 진행 시 반드시 `renderers/affordances/newTabAffordance.tsx` 로 분리해야 함.
  - `src/interactive-os/layout/flatLayout.ts` label fallback 수정은 **fallback 보존**이라 기존 pages 에 회귀 없음. 다만 label 을 생략한 기존 선언은 여전히 자동 생성 label (`${type}: ${id}`) 을 쓴다.
  - 이 세션의 `pnpm lint / test / check:deps` 는 Node 버전 이슈로 실행 불가. 내 변경 경계는 (1) typecheck 에러 리스트에 내 파일 없음, (2) `/cmux/preview` 5 scenario 브라우저 렌더 성공 으로 보증.
  - 활성 타 세션 있음 (`activeSessions exit 1`). `git add -A` 금지, 내 파일만 명시 add.

- **미해결 설계 질문**:
  - `+` 버튼이 어떤 기본 동작이어야 하는가? (현재는 "active tab clone + addTab + setActiveTab". cmux/브라우저 관행은 active clone 이지만 PRD 에 명시되지 않음)
  - G-active-content 의 해결 방향은 "widget 이 `useFlatLayoutSurface().tabData.contentRef` 를 읽는다" 인데, 이 패턴이 A2UI 의미 노드 승격 (H1) 과 어떻게 수렴할지.

## 이어받는 법 (다음 세션 AI 지시문)

이 handoff 를 Step B 로 집어가면:

1. 먼저 `screenshots/cmux-preview/multi.png` 를 Read 로 열어 G-overflow 의 실제 모습을 확인한다.
2. `src/interactive-os/ui/ViewerTabList.tsx` 를 읽고 tabbar overflow 처리 가능 지점을 찾는다 (현재는 flex-grow 로 균등 분배).
3. 처방은 옵션 3개: (a) 각 탭 `max-width` + `text-overflow: ellipsis`, (b) 탭바 `overflow-x: auto`, (c) "More" 드롭다운. 옵션 중 프로젝트 규약(`feedback_slot_existence_vs_intent` 기준 "의도 수행")에 가장 가까운 (a)+(b) 조합부터 시도.
4. 수정 후 `node scripts/quickShot.mjs "http://localhost:5173/cmux/preview?scenario=multi" screenshots/cmux-preview/multi.png 1440x900` 로 재촬영, + 버튼이 가시 + "Logs — ..." 라벨이 ellipsis 로 잘리는지 확인.
5. 회귀로 `default / single / split / empty` 4장도 재촬영하여 변경 없음 확인.
6. 통과 시 commit → 본 handoff 파일 frontmatter 에 `consumed_by` 기록 (Step B3 규약).

구체적 첫 행동: `Read screenshots/cmux-preview/multi.png`.
