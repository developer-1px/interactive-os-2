---
id: 1-projects/cms/prds/pipeline-dashboard-prd
title: 'Pipeline Dashboard — PRD'
created: 2026-04-09
updated: 2026-04-09
summary: 'Discussion: 스킬 파이프라인 산출물을 트리×단계 매트릭스로 가시화하여 누락/다음 행동을 한눈에 파악. 작업 순서는 자유, 구조는 자동.'
legacy:
  status: active
  kind: prd
  topics: [1-projects, project]
  relates: []
  supersedes: []
---
# Pipeline Dashboard — PRD

> Discussion: 스킬 파이프라인 산출물을 트리×단계 매트릭스로 가시화하여 누락/다음 행동을 한눈에 파악. 작업 순서는 자유, 구조는 자동.

## ① 동기

### WHY

- **Impact**: 스킬(discuss→story→ia→wireframe→prd→do)이 산출물을 생산하지만, "어떤 기능의 어떤 단계가 완료/미완료인지" 전체 현황이 안 보인다. 매번 폴더를 탐색해야 하고, 누락을 놓친다.
- **Forces**: 작업은 비순차적(그때그때 생각날 때)이지만 산출물은 구조적이어야 한다. 이 두 힘이 충돌한다.
- **Decision**: pipeline.yaml을 SSOT로, 파일 존재 여부로 상태를 자동 판정하는 매트릭스 뷰어. Story Mapping(트리 행) × Traceability Matrix(단계 열) × Docs-as-Code(파일=상태) 조합. 기각: Linear 등 외부 도구(파일 기반 자동화에 불리), 순차 파이프라인 강제(작업 자유도 제약).
- **Non-Goals**: 스킬 실행 자동화(스킬이 알아서 타겟팅하는 것은 스킬 PRD 범위), 프로젝트 간 의존성 추적, 실시간 파일 워칭.

### 폴더 컨벤션: 시멘틱 슬러그

ID 기반 폴더(N1, S1, F1)를 **의미 있는 슬러그**로 교체한다. 폴더명만으로 내용을 파악할 수 있어야 한다.

```
현재 (불투명):
  docs/1-projects/cms/F1/prd.md          ← F1이 뭔지 모름

변경 (시멘틱):
  docs/1-projects/cms/
    content-editing/                       ← Need: 폴더명 = 슬러그
      meta.yaml                            ← title, tier, what
      discuss.md
      ia.md
      page-selection/                      ← Story
        meta.yaml
        wireframe.md
        prd.md
        page-list/                         ← Feature
          meta.yaml
          sources.yaml
        page-load/
          meta.yaml
          sources.yaml
      text-replace/                        ← Story
        meta.yaml
        prd.md
```

**규칙:**
- 폴더명 = kebab-case 슬러그 (영문, 2~4단어)
- tier는 폴더 깊이가 아닌 `meta.yaml`의 `tier` 필드로 판별
- 트리 구조 = 파일시스템 중첩 (→ `_tree.yaml` 불필요, 폴더 구조가 곧 트리)
- pipeline.yaml의 id 필드 = 폴더 슬러그

**_tree.yaml 폐지:** 폴더 중첩이 트리를 표현하므로 별도 관계 파일 불필요. `import.meta.glob`의 `/**/meta.yaml` 패턴으로 트리를 자동 복원.

```yaml
# pipeline.yaml (슬러그 기반)
needs:
  - id: content-editing
    title: 콘텐츠를 편집하기 원한다
    stories:
      - id: page-selection
        title: 편집할 페이지를 선택할 수 있다
        features:
          - id: page-list
            title: 페이지 목록 표시
```

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | /pipeline 페이지에 진입 | cms 프로젝트 선택 | N→S→F 트리가 행으로, 워크플로우 단계가 열로 표시. 각 셀에 파일 존재 여부 상태(🟢/🔴/—) | |
| M2 | 매트릭스가 표시된 상태 | S1 행의 prd 셀에 포커스 | 우측 프리뷰에 prd.md 내용 표시 | |
| M3 | F1에 sources.yaml이 있고 F2에 없음 | S1 행의 impl 열 확인 | ◐ (부분 완료) 표시 | |
| M4 | N1/에 ia.md가 있음 | S1, S2, S3 행의 ia 열 확인 | ↑ (상위 커버) 표시 | |
| M5 | Feature tier 노드 | story/ia 열 확인 | — (해당없음) 표시 | |
| M6 | 좌측 프로젝트 목록 | 다른 프로젝트 클릭 | 해당 프로젝트의 pipeline.yaml 로드 → 매트릭스 갱신 | |

완성도: 🟢

## ② 산출물

> pipeline.yaml SSOT에서 컬럼을 동적 생성하고, 파일 존재로 상태를 판정하는 뷰어

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `pipelineStore.ts` 리팩토링 | `buildFromFolders()` → pipeline.yaml 기반 `buildFromPipeline()`. 컬럼을 stages 정의에서 동적 생성. 셀 = PhaseCell 상태값 | |
| `pipeline stages 정의` | pipeline.yaml에 stages 섹션 추가. 각 stage: key, label, artifact(파일명), scope(적용 tier) | |
| `상태 판정 로직` | 4종 상태: 🟢(파일 존재) / 🔴(scope 내인데 없음) / ↑(상위 커버) / —(scope 밖) + ◐(하위 부분 완료) | |
| `PipelineGrid` 셀 라우터 수정 | stage 컬럼 → PhaseCell 라우팅. feature 컬럼(TierCell)은 첫 번째 고정 | |
| `PreviewPanel` 연동 | stage 셀 클릭 시 해당 산출물 파일 프리뷰 (markdown/empty) | |
| `폴더 마이그레이션` | N1~F24 → 시멘틱 슬러그 폴더로 rename. 중첩 구조로 트리 표현. _tree.yaml 폐지 | |
| `트리 자동 복원` | `/**/meta.yaml` glob → 경로 depth로 tier 추론 + 부모-자식 관계 복원. _tree.yaml 불필요 | |

완성도: 🟢

## ③ 인터페이스

### pipeline.yaml stages 스키마

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| pipeline.yaml에 stages 섹션 | stages 미정의 | YAML 파싱 → 컬럼 배열 생성 | stages 배열 순서 = 컬럼 순서. SSOT에서 파생 | PIPELINE_COLUMNS 동적 생성 | |

```yaml
# pipeline.yaml에 추가할 stages 섹션
stages:
  - key: discuss
    label: 논의
    artifact: discuss.md
    scope: [need, story, feature]
  - key: story
    label: 스토리
    artifact: stories.md
    scope: [project]           # 프로젝트 루트에 하나
  - key: ia
    label: IA
    artifact: ia.md
    scope: [need]
  - key: wireframe
    label: 와이어프레임
    artifact: wireframe.md
    scope: [need, story]
  - key: prd
    label: PRD
    artifact: prd.md
    scope: [story, feature]
  - key: impl
    label: 구현
    artifact: sources.yaml
    scope: [feature]
```

### 셀 상태 판정

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 노드 tier + stage scope | — | tier가 scope에 포함? | scope 밖이면 해당 없음 | scope 밖 → `null` (—) | |
| 노드 폴더에 artifact 파일 존재 | scope 내 | 파일 존재 확인 | glob으로 `{slug}/{artifact}` 매칭 (중첩 경로: `content-editing/page-selection/prd.md`) | 🟢 (done) | |
| 파일 없음 + 상위 노드에 존재 | scope 내 | 상위 탐색 | 상위에서 작성 = 하위 전체 커버 (ia.md가 N1에 있으면 S1~S3 커버) | ↑ (propagated) | |
| 파일 없음 + 상위도 없음 | scope 내 | — | scope 내인데 아무도 커버 안 함 | 🔴 (missing) | |
| 하위 노드 집계 | 부모 노드 | 자식들의 상태 집계 | 전부 🟢 → 🟢, 일부만 → ◐, 전부 🔴 → 🔴 | ◐ (partial) | |

### 키보드 인터랙션

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Arrow Up/Down | 행 포커스 | 행 이동 | TreeGrid navigate 축 | 다른 행 포커스 + 프리뷰 갱신 | |
| Arrow Left/Right | 셀 포커스 | 셀 이동 | Grid navigate 축 (GRID_COL_ID) | 다른 컬럼 포커스 + 프리뷰 갱신 | |
| Enter | 셀 포커스 | activate | 산출물 파일이 있으면 전체 내용 로드 | 프리뷰 패널에 마크다운 렌더링 | |
| Arrow Right on collapsed | 행 포커스 | expand | TreeGrid expand 축 | 자식 노드 표시 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 프로젝트에 pipeline.yaml 없음 | 프로젝트 선택 | _tree.yaml만으로는 stage 정보가 없음 | 빈 매트릭스 + "pipeline.yaml 없음" 메시지 | 에러 아닌 빈 상태 | |
| stages가 빈 배열 | pipeline.yaml 파싱 | 컬럼 0개는 그리드 렌더링 불가 | feature 컬럼(이름)만 표시 | 최소 1컬럼 보장 | |
| scope: [project] (story stage) | 노드별 판정 | stories.md는 프로젝트 루트에 하나만 존재 | 프로젝트 루트 파일 존재 → 모든 need 노드에 ↑ 전파 | 특수 전파 로직 | |
| 깊은 트리 (N→S→F 3단계) | 상위 전파 | N1/ia.md가 있을 때 F1까지 전파되는가? | ↑ 전파는 직계 자손 전부에 재귀 적용 | F1도 ↑ | |
| 폴더는 있지만 meta.yaml 없음 | store 빌드 | 폴더는 있는데 메타가 없는 불완전 상태 | 슬러그를 id로 사용, tier = unknown → 모든 stage가 — | 그레이스풀 | |
| 폴더 깊이와 tier 불일치 | meta.yaml에 tier: need이지만 depth 3 | 폴더 깊이는 힌트일 뿐, meta.yaml tier가 SSOT | tier 필드 우선 적용 | meta.yaml 신뢰 | |
| 산출물이 상위에도 하위에도 있음 | N1/prd.md + F1/prd.md | 상위 커버와 자체 보유가 동시 | 자체 보유 우선 → 🟢 (↑ 아님) | 자체 파일 우선 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 모든 상태 = NormalizedData + Command (CLAUDE.md, feedback_all_state_normalized_command) | ② store | ✅ 준수 | 파일 존재 판정은 빌드타임 데이터 초기화. 런타임 상태(포커스/확장)는 engine command | |
| 2 | UI = os/ui/ 완성품만 (CLAUDE.md L72) | ② PipelineGrid | ✅ 준수 | TreeGrid + Grid + 기존 셀 컴포넌트 활용 | |
| 3 | classifyFile() → OCP 위반 (feedback_declarative_ocp) | ② store | ⚠️ 현재 위반 | pipeline.yaml stages에서 artifact 패턴을 읽어 매칭. classifyFile() 제거 → 선언적 매핑 | |
| 8 | 폴더명 = 시멘틱 (파일명 규칙 확장) | ① 폴더 컨벤션 | ✅ 준수 | kebab-case 슬러그, 폴더명만으로 내용 파악 가능 | |
| 9 | _tree.yaml 폐지 → 폴더 중첩이 트리 (Docs-as-Code) | ② 트리 복원 | ✅ 준수 | 파일시스템 = 진실의 원천. 별도 관계 파일 중복 제거 | |
| 4 | ax()만, style={} 금지 (CLAUDE.md L56) | ② 셀 컴포넌트 | ✅ 준수 | PhaseCell이 이미 ax() 사용 | |
| 5 | renderItem에 ARIA props 필수 (CLAUDE.md L80) | ③ 키보드 | ✅ 준수 | PipelineGrid가 Grid를 래핑, Grid가 ARIA props 전달 | |
| 6 | 원본 데이터 보존 (feedback_preserve_raw_entities) | ② store | ✅ 준수 | pipeline.yaml 구조를 그대로 NormalizedData로 변환 | |
| 7 | 파일명 = export 식별자 (CLAUDE.md L61) | ② 파일 구조 | ✅ 준수 | pipelineStore.ts → export pipelineStore 유지 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | pipelineStore.ts 전면 교체 | 기존 4컬럼(Visual/Feature/Docs/Source) 구조 제거 | 중 | 기존 프리뷰 로직(ImagePreview, FileListPreview 등)은 stage 프리뷰로 재활용 | |
| 6 | 폴더 rename (N1→content-editing 등) | _tree.yaml 기반 코드 깨짐. pipeline.yaml의 id 필드 변경 | 중 | pipeline.yaml을 슬러그 기반으로 동시 갱신. _tree.yaml 폐지 | |
| 7 | _tree.yaml 폐지 | 현재 buildFromFolders()가 _tree.yaml을 파싱 | 중 | buildFromPipeline()으로 교체 시 자연스럽게 제거 | |
| 2 | PipelineGrid 셀 라우터 | pipelineCellRouter 분기 변경 | 저 | 첫 컬럼 = TierCell 고정, 나머지 = PhaseCell | |
| 3 | import.meta.glob 패턴 | 현재 cms 하드코딩 → 프로젝트별 동적 glob 필요 | 중 | Vite의 glob은 정적 문자열 필요. 모든 프로젝트의 파일을 한 번에 glob하고 런타임 필터 | |
| 4 | PagePipeline의 프로젝트 전환 | activeProject 변경 시 store 재빌드 필요 | 저 | 프로젝트별 store를 빌드타임에 전부 생성, Map으로 보관 | |
| 5 | PreviewPanel 타입 | stage 셀 클릭 시 프리뷰 내용 변경 | 저 | PreviewContent 타입 유지, markdown/empty 타입으로 충분 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | 컬럼 정의 하드코딩 | ⑤#3 OCP | pipeline.yaml stages가 SSOT. 코드에 stage 목록을 중복하면 추가 시 2곳 수정 | |
| 2 | classifyFile() 패턴 매칭 유지 | ⑤#3 OCP | stage.artifact 필드가 파일명을 결정. 정규식 분류 제거 | |
| 3 | import.meta.glob에 프로젝트명 하드코딩 | ⑥#3 | `/docs/1-projects/cms/*` → `/docs/1-projects/**/*` 재귀 와일드카드 사용 | |
| 4 | 런타임 파일 시스템 접근 | Non-Goals | 빌드타임 glob으로만 파일 존재 판정. fs.existsSync 등 금지 | |
| 5 | stage 순서를 코드에서 결정 | ⑤#3 OCP | pipeline.yaml stages 배열 순서가 컬럼 순서 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | M1 | cms 프로젝트 로드 → 행 수 확인 | 6 Need + 11 Story + 24 Feature = 41행 (시멘틱 슬러그 트리) | |
| V2 | M1 | 컬럼 확인 | feature(고정) + stages 수만큼 동적 컬럼 | |
| V3 | M2 | page-list 행의 prd 셀에 포커스 | 프리뷰에 content-editing/page-selection/page-list/prd.md 표시 | |
| V4 | M3 | page-selection 행의 impl 열 확인 | page-list(🟢) + page-load(🟢) 이므로 ◐ 또는 🟢 (sources.yaml 보유 여부에 따라) | |
| V5 | M4 | content-editing/ia.md 존재 시 → page-selection ia 열 | ↑ 표시 | |
| V6 | M5 | page-list 행의 story 열 | — (scope: [project]이므로 feature에 해당 없음) | |
| V7 | M6 | viewer 프로젝트 선택 (pipeline.yaml 없음) | 빈 매트릭스 + 안내 메시지 | |
| V8 | ④ 경계 | 자체 파일 + 상위 파일 동시 존재 | 자체 파일 우선 → 🟢 | |
| V9 | ③ 키보드 | Arrow Down → Arrow Right → Enter | 행 이동 → 셀 이동 → 프리뷰 로드 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

#kind/prd #topic/cms
