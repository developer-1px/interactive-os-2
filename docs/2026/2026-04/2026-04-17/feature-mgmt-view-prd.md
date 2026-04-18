---
id: 1-projects/features/prds/feature-mgmt-view-prd
type: prd
slug: featureMgmtView
title: 'Feature Management View — PRD'
tags: [n]
created: 2026-04-17
updated: 2026-04-17
summary: 'Discussion: MEMORY가 PM 도구로 오남용되는 문제를 해결하기 위해, feature의 status·lifecycle·관계를 전담하는 **PM 레이어**를 신설하고 Productboard Objectives 스타일의 조망 뷰를 제공한다.'
legacy:
  status: active
  kind: prd
  topics: [1-projects, n]
  relates: []
  supersedes: []
---
# Feature Management View — PRD

> Discussion: MEMORY가 PM 도구로 오남용되는 문제를 해결하기 위해, feature의 status·lifecycle·관계를 전담하는 **PM 레이어**를 신설하고 Productboard Objectives 스타일의 조망 뷰를 제공한다.

---

## ① 동기

### WHY

- **Impact**: 1인 개발자(본인)가 진척도 보고서를 쓸 때마다 MEMORY·PROGRESS·prds·inbox 4곳을 왕복하며 상태를 수집한다. 같은 feature의 단면이 분산돼 있어 "지금 뭐가 어디에 있나"가 즉답 불가. MEMORY Features 섹션이 32개로 비대해져 인덱스 기능이 무너졌다.
- **Forces**:
  - PM 전용 저장소·스키마·뷰가 부재 (원인)
  - 외부 SaaS(Linear/Notion) 기피, 로컬·git친화·마크다운-first 고수 (제약)
  - MEMORY의 본 역할(경험·원칙 DB)과 PM이 섞여 두 역할 모두 훼손 (원인)
  - 프로젝트 규약 `feedback_auto_derivation_is_system`(자동 파생이 본질) 위배 상태
- **Assets**:
  - 내부: `TreeGrid`·`MasterDetail` composite·`Feed`·`TabList`·`Breadcrumb`·`FilterBar`·`PanelHeader`·`Card`·`Badge`·`Avatar`·`cells/*`·`indicators/*` 전부 있음
  - 내부: `FlatLayout definePage` 엔진, `scanOsViolations`·`check:keyline`식 스캔 러너 패턴
  - 내부: `yaml` 패키지(v2.8.3, 브라우저-세이프) 이미 설치됨
  - 외부 레퍼런스: Productboard Objectives UI, Obsidian Bases(frontmatter DB), Linear Initiatives 3계층
- **Decision**: 파일-per-feature + frontmatter DB (`docs/1-projects/features/{slug}.md`) + FlatLayout `/features` 라우트 뷰. 기각 대안:
  - ❌ 단일 `features.md` 테이블 — 비대화 문제 재발
  - ❌ PROGRESS.md 확장 — 같은 문제 이전
  - ❌ JSON/YAML DB + 생성기 — 마크다운-first 워크플로 역행
- **Non-Goals**:
  - 외부 SaaS 연동 (Linear/Notion import/export)
  - OKR 트리·팀 워크로드·Feedback trace (조직 전제 기능, 1인에게 과잉)
  - Board/Roadmap 뷰 전환 UI (1차 범위 밖, frontmatter 스키마가 지원만 해두고 구현은 후속)
  - InsightCard "Linked by AI" 자동 링크 기능 (수동 링크만 1차)

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 32개 feature가 frontmatter로 존재 | `/features` 접속 | TreeGrid에 layer→feature 2-level 트리 + 각 행 status/maturity 표시 | |
| S2 | TreeGrid에서 "Visual CMS" 행 포커스 | Enter 또는 클릭 | Detail panel 열림, Insights 탭 기본 선택, 연결된 PRD/handoff 링크 표시 | |
| S3 | Detail 열린 상태 | Esc | Detail 닫힘, TreeGrid 포커스 복귀 | |
| S4 | 전체 feature 조망 중 | FilterBar에서 "status: 🟡 prototype" 선택 | 🟡만 필터링돼 표시, 카운트 갱신 | |
| S5 | 새 feature 아이디어 생김 | `docs/1-projects/features/{slug}.md` 파일 생성·frontmatter 작성 | 페이지 reload 시 자동으로 TreeGrid에 등장 | |
| S6 | `pnpm features` 실행 | 터미널 | PROGRESS.md의 Features 섹션이 frontmatter 집계로 자동 갱신 | |
| S7 | feature의 insights 블록 편집 | 파일 저장 | dev 서버 HMR로 Detail panel InsightFeed 즉시 갱신 | |

완성도: 🟢

---

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `docs/1-projects/features/README.md` | 이 레이어의 목적·스키마·운영 규약 설명 | |
| `docs/1-projects/features/{slug}.md` × N | feature 하나당 1 파일. frontmatter DB + 본문에 Insights/Decisions 블록 | |
| `src/pages/features/PageFeatures.tsx` | `/features` 라우트 진입점, FlatLayout definePage | |
| `src/pages/features/featuresContext.ts` | `FeatureProvider` + `useFeature` | |
| `src/pages/features/featuresStore.ts` | frontmatter 파싱 → NormalizedData 변환 + insights map | |
| `src/pages/features/featuresTransform.ts` | frontmatter → Entity 변환, Score 파생 계산 | |
| `src/pages/features/featuresWidgets.tsx` | 7개 widget (Breadcrumb/Toolbar/TreeGrid/DetailHeader/DetailTabs/InsightFeed/InsightCard) | |
| `src/pages/features/featuresSchema.ts` | Zod 스키마: Feature/Insight/Status/Layer/Maturity | |
| `scripts/features-dashboard.mjs` | frontmatter 전수 스캔 → PROGRESS.md Features 섹션 자동 갱신 | |
| `package.json` `features` script | `pnpm features` 등록 | |

### Frontmatter 스키마 (SSOT)

```yaml
---
name: Visual CMS                        # 표시명
slug: visual-cms                        # 파일명과 일치
layer: service | engine | infra | process | design
status: 🟢 operational | 🟡 prototype | ⬜ concept | ⚪ archived
maturity: 1 | 2 | 3 | 4 | 5              # 1=prototype, 5=polished
parent: null | <slug>                    # Initiative/Objective 계층 (self-ref)
deps: [<slug>, ...]                      # 의존 feature
routes: [/cms, ...]                      # 연결된 라우트
prds: [docs/1-projects/cms/prds/xxx-prd.md, ...]
handoffs: [docs/0-inbox/handoff-xxx.md, ...]
tags: [flatlayout, composite, ...]
created: 2025-11
last_touched: 2026-04-15
---
```

### 본문 블록 규약

```markdown
## Insights
- 2026-03-15 · 사용자 피드백: "preview 공간이 좁다" (출처: handoff-xxx.md)
- 2026-02-28 · 설계 결정: FlatLayout 전환 — <link>

## Decisions
- 2026-01-10 · resizer 미구현 유지 — reason: ...

## Gaps
- [ ] 모바일 대응
- [ ] 다국어
```

완성도: 🟢

---

## ③ 인터페이스

### 키보드 · 포인터 입력 → 상태 변환

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `ArrowDown`/`ArrowUp` (TreeGrid focus) | row N selected | navigate axis 이동 | APG TreeGrid 표준, row mode (initialColIndex=0) | row N±1 focused | |
| `ArrowRight`/`ArrowLeft` (TreeGrid focus) | row N collapsed | expand/collapse | expand 축은 history 아닌 view state | expanded/collapsed toggle | |
| `Enter` (TreeGrid row) | row N focused, detail hidden | activate axis | master-detail 패턴: activate = detail open | `selectedFeatureId=N`, `detail.hidden=false` | |
| Row click | 동일 | activate | 동일 | 동일 | |
| `Esc` (Detail focus) | detail visible | popup 축 dismiss | overlay=modal 원칙, detail은 가림막은 아니지만 modal-like escape | `detail.hidden=true`, TreeGrid row N focus 복귀 | |
| Tab click (Detail TabList) | `activeTab=insights` | tab 축 | TabList는 자동 activation, pane swap | `activeTab=<clicked>`, Feed/Details/Health swap | |
| FilterBar 선택 | `filter={}` | filter 축 (value) | 자동 파생: 필터 변경 → TreeGrid 재쿼리 | `filter={status:[🟡]}`, 행 N→M개 | |
| `Cmd+K` (전역) | search closed | popup 축 | QuickOpen 오픈, feature slug fuzzy match | search open | |
| Bulk: `Space` (row) + `Cmd+Space` 확장 | `multiSelect=[]` | select axis multi mode | APG 표준 multi-select | `multiSelect=[N]`, toolbar bulk UI 노출 | |
| Column toggle (Toolbar) | columns 전체 표시 | layout state set | 사용자 개인 설정, shared state 저장 | 해당 컬럼 hidden | |

**파일 소스 입력**:

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 |
|------|----------|------|-------------------|----------|
| `docs/.../features/{slug}.md` 생성·저장 | N files | Vite HMR + glob import | 자동 파생 원칙: 파일 = SSOT | N+1 files, TreeGrid 재렌더 |
| frontmatter status 필드 변경 | status=🟡 | 동일 | 동일 | status=🟢, StatusIndicator 갱신 |
| Insights 블록 항목 추가 | M insights | 동일 | 동일 | M+1 insights, Feed 재렌더, Score 재계산 |

완성도: 🟢

---

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| feature 0개 | empty state | 초기 상태·archive-all 상태 둘 다 가능 | `EmptyState` 컴포넌트 표시 ("아직 feature가 없습니다. `docs/.../features/{slug}.md` 생성") | TreeGrid 숨김, EmptyState 표시 | |
| frontmatter 파싱 실패 | 1개 파일 오류 | 하나의 bad file이 전체를 막으면 안 됨 | 해당 feature는 error 상태로 표시, 나머지는 정상 렌더 | error indicator + toast | |
| `parent` self-reference 순환 | A.parent=B, B.parent=A | 무한 루프 차단 | 파싱 단계에서 cycle 검출 → 해당 노드 root로 폴백 + 경고 | cycle 노드 root 배치 | |
| `parent` 존재하지 않는 slug 참조 | A.parent=ghost | dangling reference | root로 배치 + 경고 표시 | 동일 | |
| 동일 slug 중복 파일 | `a.md` + `sub/a.md` | 파일-per-slug 유일성 | 파싱 에러 + 첫 파일만 채택, 경고 | 첫 파일 채택 | |
| 500+ features | 성능 경계 | 1인 개발자 실질 상한 고려 | virtualization은 1차 범위 밖, "500+ 시 성능 이슈 가능" 문서화 | 그대로 렌더 (성능 허용) | |
| Insights 블록 없음 | `## Insights` 섹션 미존재 | 옵셔널 블록 | Feed는 EmptyState 표시 ("인사이트 없음") | Feed empty | |
| 너무 긴 insight 텍스트 | 500자+ | 레이아웃 붕괴 방지 | Card 내부 `long-text: linebreak`, 3줄 초과 시 "더보기" | clamped | |
| `routes` 배열에 존재하지 않는 라우트 | `/dead` | 링크는 유효성 검증 불필요 | 링크 클릭 시 404, 빨간 indicator만 표시 | 링크 dead 표시 | |
| filter 결과 0개 | 필터 적용 중 | 필터 결과 없음을 명확히 | TreeGrid 안에 EmptyState (필터 초기화 버튼 포함) | filtered empty | |
| TreeGrid focus 상태에서 filter 변경으로 현재 row 사라짐 | row N focused, filter로 N 제외됨 | 포커스 복구 원칙 (`feedback_focus_principles`) | 가장 가까운 보이는 노드로 이동, 없으면 컨테이너 포커스 | focus recovered | |
| Detail 열린 상태에서 해당 feature 파일 삭제 (HMR) | detail visible for N | dangling state 제거 | `selectedFeatureId=null`, detail hidden, 토스트 | detail closed | |

완성도: 🟢

---

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 |
|---|------------|----------|----------|------------|
| 1 | `feedback_ui_layer_rules` — UI만 노출, Composite=조합 | ② widget 조립 | ✅ 부합 (MasterDetail composite 재사용) | — |
| 2 | `feedback_treegrid_row_cell_mode` — initialColIndex=0(cell)/-1(row) | ③ TreeGrid 입력 | 🟡 점수 컬럼이 있으므로 cell mode(0). "행 네비=ArrowUp/Down, 셀 네비=필요 시" 명시 | 선택: row-first 사용성을 위해 -1 + 이후 cell drill-in 재검토 |
| 3 | `feedback_auto_derivation_is_system` — 손 매핑 금지, 자동 파생이 본질 | ② store, ⑥ PROGRESS.md 동기화 | ✅ 부합 (frontmatter → 파생 집계) | — |
| 4 | `feedback_render_function_is_slot` — render function이 slot, slotProps가 ARIA 가이드 | ② widget | ✅ 부합 (TreeGrid renderCell/renderItem 패턴) | — |
| 5 | `feedback_preserve_raw_entities` — 원본 엔티티 skip/누락 금지 | ② transform | ✅ 부합 (frontmatter 전수 로드) | — |
| 6 | `feedback_focus_principles` — 결과지향·가시성·복구불변 | ④ filter/delete 시 포커스 | ✅ 부합 (경계 테이블에 복구 규칙 명시) | — |
| 7 | `feedback_specs_not_inbox` — 계속 참조 → specs/, inbox는 일회성 | ② 저장 위치 | ✅ 부합 (`docs/1-projects/features/`는 specs) | — |
| 8 | `project_pipeline_dashboard` — 파일존재=상태 | ② 파일-per-feature | ✅ 부합 | — |
| 9 | `feedback_meta_is_core_only` — meta:true는 core:* commands만 | (관련 없음) | N/A | — |
| 10 | `feedback_dom_placement_is_component_reason` — 컴포넌트 분리 기준=DOM 배치 | ② widget 분할 | ✅ 부합 (breadcrumb/toolbar/master/detail 각기 다른 위치) | — |
| 11 | `feedback_aria_item_parent_prop` — 그룹 오컴 해법 | ③ TreeGrid parent | ✅ 부합 (frontmatter parent → Entity.parent) | — |
| 12 | `feedback_axis_pattern_principles` — 축 SSOT | ③ 입력 테이블 | ✅ 부합 (navigate/expand/activate/tab/value/popup/select 표준 조합) | — |
| 13 | `feedback_minimum_impl_is_good` — 최소 구현 수렴 | Non-Goals | ✅ 부합 (Board/Roadmap 뷰 1차 제외) | — |
| 14 | 제1원칙 "있는 걸로 만든다" (CLAUDE.md) | ② 산출물 | ✅ 부합 (신규=InsightCard 조립 1개, 부품은 모두 재사용) | — |
| 15 | pages 네이밍 `Page{Domain}.tsx` (CLAUDE.md) | ② PageFeatures.tsx | ✅ 부합 | — |
| 16 | ax()만 사용, style={} 금지 (CLAUDE.md) | ② widget 스타일 | ✅ 부합 (신규 CSS 없음, 기존 부품 ax() 사용) | — |
| 17 | `feedback_role_axis_design` — role축=크기 SSOT | ② InsightCard | ✅ 부합 (Card role 프리셋 사용) | — |

완성도: 🟢 (원칙 2 🟡 — 초기 구현 시 확정)

---

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 |
|---|------------------------|-----------|--------|------|
| B1 | `MEMORY.md` Features 섹션 32개 `project_*` | 이관 후 MEMORY 인덱스 절반 축소, 기존 참조(자기 자신) 끊김 | 中 | 이관 스크립트에 pointer 삽입 옵션 — `project_*` 원본 파일을 "→ docs/1-projects/features/{slug}.md 참조"로 축소 |
| B2 | `docs/PROGRESS.md` Features 섹션 | 수동 갱신 관행 폐기 → 스크립트 자동 갱신으로 전환 | 中 | `pnpm features`가 마커 구간(`<!-- features:auto -->`…`<!-- /features:auto -->`)만 갱신, 수동 영역은 보존 |
| B3 | `docs/1-projects/{cms,chat,...}` 기존 도메인 폴더 | `features/`와 도메인 폴더 역할 중첩 가능 | 小 | 역할 분리 규약: 도메인 폴더=PRD/handoff/research, `features/`=상태 DB. 도메인 폴더의 README에서 cross-link |
| B4 | `src/AppShell.tsx` 라우트 등록 | `/features` 추가 | 小 | 라우트 맵에 한 줄 추가 |
| B5 | `docs/` glob import 범위 | Vite `import.meta.glob` 패턴에 `features/*.md` 추가 필요 | 小 | features 전용 glob으로 분리, 기존 글로브 무영향 |
| B6 | 신규 scripts 러너 | `check:deps`, `check:keyline`와 동일 계열, CI에는 넣지 않음 | 小 | on-demand만, CI 부담 0 |
| B7 | `yaml` 패키지 브라우저 번들 | 이미 설치됨(v2.8.3), 번들 크기 미미 | 極小 | 확인만 |
| B8 | "feature"라는 용어의 중의성 | "기능"으로도 쓰이는 일반 단어, 검색 혼란 | 小 | 문서에서 **대문자 Feature(PM 레이어 레코드)** vs 소문자 feature(일반 기능) 구분 |
| B9 | Detail 열림 시 TreeGrid 폭 0.58로 좁아짐 | 기존 화면 폭 기대와 다름 | 小 | SplitPane resizer 제공, 개인 설정 저장은 후속 |

완성도: 🟢

---

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 |
|---|---------------|------|------|
| N1 | `docs/1-projects/features/*.md`에 frontmatter 없이 저장 | ⑤ 3 (자동 파생) | 파싱 실패 시 전체 뷰 불가. 스키마 검증 강제 |
| N2 | `status` 이모지를 다른 기호(⚠️/★)로 대체 | CLAUDE.md 제1원칙 + `indicators/` 규정 | `StatusIndicator` 사용 강제 |
| N3 | `src/pages/features/`에서 `useAria`/`useAriaZone` 직접 사용 | CLAUDE.md os 기반 개발 규칙 | UI 완성품(TreeGrid/MasterDetail) 사용만 허용 |
| N4 | `addEventListener('keydown')` 직접 바인딩 | CLAUDE.md os 기반 개발 | KeyMap 선언만 |
| N5 | TreeGrid에 `renderItem`을 `{}`로 호출 | CLAUDE.md renderItem ARIA props | `getItemProps(id)` 전달 필수 |
| N6 | `pnpm features`를 git hook/CI에 등록 | ⑥ B6 + 1인 개발자 부담 | on-demand만 |
| N7 | MEMORY Features 섹션 32개를 일괄 삭제 | ⑥ B1 + `feedback_atomic_restructure`의 반대 | 점진적 이관, pointer로 축소 |
| N8 | Score 가중치를 하드코딩 | ⑤ 3 (자동 파생) | frontmatter `tier_weights` 또는 feature별 `score_override` 필드로 노출 |
| N9 | InsightCard 안에 도메인 로직 (fetch·비즈니스 규칙) | ⑤ 1 (UI 레이어 규칙) | 순수 display. 데이터는 pull |
| N10 | 별도 SaaS로 동기화하는 write-back | Non-Goals | 양방향 동기 복잡도 회피 |
| N11 | frontmatter 수정 UI를 이 PRD 범위에 포함 | Non-Goals | 1차는 read-only. 편집은 에디터에서 |

완성도: 🟢

---

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | fixture로 3개 feature 파일 주입 → `/features` 접속 | TreeGrid 3행 렌더, 각 행 name/status/maturity/score 표시 | |
| V2 | S1 | parent 필드로 A→B 계층 구성 | TreeGrid 2-level 트리, expand 인디케이터 표시 | |
| V3 | S2 | row 클릭 | Detail 열림, TabList "Insights" active, InsightFeed 렌더 | |
| V4 | S2 | Enter 키 | 동일 (V3) | |
| V5 | S3 | Detail 열린 상태에서 Esc | Detail hidden, TreeGrid row focused | |
| V6 | S4 | FilterBar "🟡" 선택 | 🟡 feature만 남음, 카운트 배지 갱신 | |
| V7 | S5 | runtime에 파일 추가 (test환경 fs write) → 페이지 reload | 신규 feature가 TreeGrid 마지막 행에 등장 | |
| V8 | S6 | `pnpm features` 실행 | PROGRESS.md 마커 구간이 frontmatter 집계로 치환, 수동 구간 보존 | |
| V9 | S7 | Insights 블록에 항목 추가·저장 | HMR로 InsightFeed 즉시 반영 | |
| V10 | ④ feature 0 | features 파일 전부 삭제 | EmptyState 표시 | |
| V11 | ④ 파싱 실패 | 잘못된 frontmatter 1개 주입 | 해당 feature error indicator, 나머지 정상 | |
| V12 | ④ cycle | A.parent=B, B.parent=A | 두 노드 모두 root 배치 + 콘솔 경고 | |
| V13 | ④ dangling parent | `parent: ghost` | root 배치, indicator 경고 | |
| V14 | ④ 중복 slug | 같은 slug 2 파일 | 첫 파일 채택, 에러 토스트 | |
| V15 | ④ filter empty | 모든 필터 미매치 | filtered empty state + 초기화 버튼 | |
| V16 | ④ focus recovery | row N focused → filter로 N 제외 | 가장 가까운 보이는 row로 focus 이동 | |
| V17 | ④ detail dangling | detail 열림 상태에서 해당 파일 삭제 | detail hidden, 토스트 | |
| V18 | ④ long insight | 500자 insight | Card clamped + 더보기 | |
| V19 | ⑤ 2 | TreeGrid 키보드 네비 (APG row mode 준수) | ArrowDown=행이동, ArrowRight=expand/cell drill | |
| V20 | ⑥ B2 | `pnpm features` 실행 후 PROGRESS.md의 수동 영역 | 그대로 보존 | |
| V21 | ⑥ B8 | README/코드 주석 grep | "Feature"와 "feature" 표기 일관성 | |
| V22 | ⑦ N1 | frontmatter 없는 md 주입 | 파싱 실패, error + 가이드 메시지 | |
| V23 | ⑦ N2 | 부정 테스트: 커스텀 이모지 기호 PR | `StatusIndicator` 사용 강제 lint 또는 review rule | |

완성도: 🟢

---

## 교차 검증

1. **동기 ↔ 검증**: S1~S7 → V1~V9 1:1 이상 커버. ✅
2. **인터페이스 ↔ 산출물**: TreeGrid/MasterDetail/Feed/TabList가 ② widget 테이블에 전부 존재. ✅
3. **경계 ↔ 검증**: ④의 11행 → V10~V18로 커버. ✅
4. **금지 ↔ 출처**: N1~N11 모두 ⑤/⑥/CLAUDE.md 출처 명시. ✅
5. **원칙 대조 ↔ 전체**: 원칙 2(🟡)만 구현 초기 결정 유보, 나머지 ✅

---

**전체 완성도: 🟢 8/8**

#kind/prd #topic/features
