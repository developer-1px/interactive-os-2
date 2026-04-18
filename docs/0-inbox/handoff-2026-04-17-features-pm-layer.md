---
id: features-pm-layer
title: 'Handoff: Feature Management 뷰 + PM 레이어 신설'
status: inbox
kind: handoff
created: 2026-04-17
updated: 2026-04-18
summary: 'MEMORY가 PM 도구로 오남용되던 문제를 frontmatter DB + `/features` 뷰로 해결. PRD 🟢 8/8, UI 6버그 수정 후 브라우저 실사용 검증 완료.'
topics: [0-inbox]
relates: []
supersedes: []
legacy:
  created_at: 2026-04-17
  slug: features-pm-layer
---
# Handoff: Feature Management 뷰 + PM 레이어 신설

> MEMORY가 PM 도구로 오남용되던 문제를 frontmatter DB + `/features` 뷰로 해결. PRD 🟢 8/8, UI 6버그 수정 후 브라우저 실사용 검증 완료.

## 완료

| 커밋 | 내용 |
|------|------|
| `9e1fce6d` | Feature Management 뷰 + PM 레이어 신설 (18 files, +1437) |

**주요 산출물:**
- `src/pages/features/` — 7 파일 (Schema/Transform/Context/Store/DefinePage/Widgets/Page)
- `docs/1-projects/features/` — README + seed 3개 + PRD
- `scripts/features-dashboard.mjs` + `pnpm features` script
- `/features` 라우트 등록 (AppShell, router, ActivityBar)

**검증:** PRD 🟢 8/8, typecheck 0 신규 에러, 브라우저에서 row 선택/Detail/Tab 전환/Esc 닫기/Portal 탭 모두 동작 확인.

## 남은 것

### 즉시 (다음 세션 첫 작업)

1. **push 미실행** — 현재 main 브랜치라 사용자 확인 후 push 필요. 세션 종료 시 push 보류됨.
2. **MEMORY 32개 `project_*` 점진 이관** — feature(운영 상태)인 항목을 `docs/1-projects/features/{slug}.md`로 옮기고 MEMORY 원본은 pointer로 축소. PRD ⑥ B1 부작용 대응. 일괄이 아닌 항목별 분류 판단(feature / architecture / archive) 필요.
3. **screen-test 자동화** — PRD ⑧의 V1~V23 시나리오를 `/screen-test`로 route-level 통합 테스트화.

### 이후 (후속 — 우선순위 낮음)

- **Detail header의 layer badge 시각** — "ENGINE" 텍스트가 우측 정렬 + 폰트 작음 + 역할 불명확. 디자인 개선 필요 (`/improve-design` 대상)
- **Score 가중치** — 현재 `computeScore = insights.length` (seed 3개 다 동일). frontmatter에 `tier_weights` 또는 insights별 weight 필드 도입 → 실질 우선순위 파생
- **Board/Roadmap 뷰 전환** — Non-Goals였던 view toggle UI (Tree/Board/Roadmap). `Kanban`·`Timeline` 부품은 이미 있음. featuresDefinePage에서 `hidden` 스왑으로 확장 가능
- **Filter 칩 UI** — B4에서 toolbar 노드 제거했으나, filter 활성화 시 재도입 경로 필요. body 위에 stack으로 감싸 FilterBar 복귀
- **frontmatter 편집 UI** — 현재 read-only. Non-Goals였으나 장기적으로 feature CRUD를 뷰에서

## 컨텍스트

- **PRD**: `docs/1-projects/features/prds/feature-mgmt-view-prd.md` (8/8 🟢)
- **진척도 보고서**: `docs/0-inbox/progress-report-2026-04-17.md` (이 feature 레이어 도입 동기)
- **Blueprint 레퍼런스**: Productboard Objectives UI, Obsidian Bases (frontmatter DB)
- **주요 memory**:
  - `feedback_auto_derivation_is_system` — 손 매핑 금지, frontmatter → 집계 파생이 본질
  - `feedback_specs_not_inbox` — 계속 참조는 specs/에
  - `project_pipeline_dashboard` — 파일존재=상태
  - `feedback_ui_layer_rules`, `feedback_treegrid_row_cell_mode`, `feedback_render_function_is_slot` — 구현 규약

## 주의

- **Esc 닫기 구현 방식**: `useGlobalTrap` capture phase 사용. `trap: false`로 Escape만 가로채고 TreeGrid 자체 키는 통과. 다른 pages에서 같은 패턴 채택 시 참고.
- **toolbar 노드 제거**: FlatLayout split에서 `hidden:true` 자식이 sizes 배열 길이 불변을 깨뜨리는 regression 관찰됨. toolbar를 완전 제거하는 쪽으로 해결. split 안에서 hidden 자식 토글은 현재 FlatLayout에 미지원 (LAYOUT.md 한계 #3~#4 영역).
- **`querySelector` 기반 포커스 강제 이동 제거**: 초기 구현에 있었으나 Page 레벨 Esc로 교체하며 제거. 같은 패턴 반복하지 말 것.
- **pre-existing uncommitted 파일 미처리**: 세션 시작 시 replay/cms/ui 쪽 광범위 WIP가 있었고 이 세션은 건드리지 않음. 별도 세션/작업으로 정리 필요.

## 이어받는 법

다음 세션에서 `/handoff`를 치면 이 파일을 자동으로 찾아 읽는다.
구체적 첫 행동: 사용자에게 `git push` 승인받기 → 그다음 MEMORY 이관 스크립트 설계.
