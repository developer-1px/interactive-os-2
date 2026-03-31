# /improve 평가 — Birdseye

## Job: 이 서비스를 왜 쓰는가

Birdseye는 코드베이스의 아키텍처 레이어 구조를 칸반 보드 형태로 펼쳐 보여주는 뷰다. 좌측 TreeView로 폴더를 선택하면 우측 칸반에 하위 폴더가 컬럼으로, 파일이 카드로 표시된다. 카드 포커스 시 floating overlay로 코드 미리보기 + 의존성 정보를 보여준다.

### Jobs

| # | 사용 이유 | 상황 |
|---|----------|------|
| J1 | 코드베이스 구조 파악 | "새 프로젝트에 합류해서 어떤 레이어에 뭐가 있는지 전체 지형을 빠르게 파악할 때 이 도구를 연다" |
| J2 | 파일 간 의존 관계 추적 | "내가 수정하려는 파일이 누구에게 영향을 주고, 누구를 의존하는지 확인할 때 이 도구를 연다" |
| J3 | 아키텍처 건강도 진단 | "특정 레이어가 비정상적으로 비대해졌거나 의존성 규칙을 위반하는 파일이 있는지 점검할 때 이 도구를 연다" |
| J4 | 파일 탐색 및 빠른 코드 미리보기 | "특정 파일 내용을 에디터를 열지 않고 빠르게 훑어볼 때 이 도구를 연다" |

---

### J1 Job Map: 코드베이스 구조 파악

| 단계 | 이 서비스에서 | 현재 지원 |
|------|-------------|----------|
| Define | "어느 레이어/폴더의 구조를 볼까?" — 좌측 TreeView에서 폴더 선택 | ✅ |
| Locate | 원하는 폴더를 TreeView에서 찾거나 Cmd+P QuickOpen으로 탐색 | ✅ |
| Prepare | 폴더 선택 후 칸반이 로드되면서 하위 구조가 컬럼+카드로 펼쳐짐 | ✅ |
| Confirm | 컬럼 순서가 레이어 순서와 일치하는지, 내가 보려는 범위가 맞는지 확인 | 🟡 — breadcrumb은 있으나 컬럼이 레이어 순서인지 _meta.yaml 의존 |
| Execute | 컬럼별 파일 목록을 훑으며 "어떤 파일이 어디에 있는지" 파악 | 🟡 — 파일 목록은 보이나 역할 분류/그룹핑이 없어 flat list |
| Monitor | 레이어 간 크기 균형, 파일 분포를 시각적으로 평가 | 🟡 — LOC 막대와 300L+ 틴트가 있으나 정량 수치/파일 수 미표시 |
| Conclude | 전체 구조를 이해하고 다음 작업(코드 편집, 설계 결정)으로 전환 | ✅ — Enter로 viewer 이동 가능 |

### J2 Job Map: 파일 간 의존 관계 추적

| 단계 | 이 서비스에서 | 현재 지원 |
|------|-------------|----------|
| Define | "이 파일이 누구를 쓰고 누가 나를 쓰는지 알고 싶다" | ✅ — 카드 포커스로 시작 |
| Locate | 대상 파일 카드를 칸반에서 찾음 | 🟡 — 확장자 필터는 있으나 이름 검색은 QuickOpen뿐(칸반 내 검색 없음) |
| Execute | 카드 포커스 → overlay에 dep list 표시 + 칸반 카드 하이라이트(up/down) | ✅ |
| Monitor | dep 목록을 레이어별로 그룹핑해서 보여줌, 클릭하면 해당 파일로 점프 | ✅ |
| Modify | dep 항목 클릭 시 다른 폴더로 자동 이동하여 이어서 추적 | 🟡 — 폴더 전환은 되나 전환 후 대상 카드에 자동 포커스되지 않음 |
| Conclude | 의존 범위를 파악하고 영향도를 판단 | 🟡 — 의존 파일 수는 보이나 "이 의존이 정상인가(레이어 규칙 위반?)" 판단 보조 없음 |

### J3 Job Map: 아키텍처 건강도 진단

| 단계 | 이 서비스에서 | 현재 지원 |
|------|-------------|----------|
| Define | "이 레이어가 건강한가?" — 특정 레이어 폴더 선택 | ✅ |
| Locate | 문제 후보를 찾기: 비정상적으로 큰 파일, 의존도 높은 파일 | 🟡 — 300L+ 틴트와 depUp/depDown 숫자로 일부 탐지, 하지만 정렬/필터 없음 |
| Confirm | "이게 진짜 문제인가?" — 파일 내부 구조, 변경 빈도, 역사적 추이 확인 | ❌ — 내부 구조 분석 없음, 시간 추이 데이터 없음 |
| Execute | 문제 파일을 식별하고 원인을 진단 | 🟡 — overlay로 코드를 볼 수 있으나 구조 요약(함수 분포 등) 없음 |
| Conclude | 진단 결과를 바탕으로 리팩토링 결정 | ❌ — 판단 보조 정보(기준선, 추세, 권장 크기) 없음 |

### J4 Job Map: 파일 탐색 및 빠른 코드 미리보기

| 단계 | 이 서비스에서 | 현재 지원 |
|------|-------------|----------|
| Define | "이 파일 내용을 빠르게 보고 싶다" | ✅ |
| Locate | 칸반에서 카드를 키보드/마우스로 탐색, 또는 Cmd+P QuickOpen | ✅ |
| Execute | 카드 포커스 → 250ms 디바운스 후 floating overlay에 코드 표시 | ✅ |
| Conclude | 내용을 확인하고 필요하면 Enter로 viewer에서 전체 열기 | ✅ |

---

### J1 Desired Outcomes

| # | 단계 | Desired Outcome | Imp | Sat | Opp |
|---|------|----------------|-----|-----|-----|
| 1 | Confirm | Minimize the time to verify that columns represent the intended layer order when viewing an unfamiliar codebase | 7 | 4 | 10 |
| 2 | Execute | Minimize the time to identify which files serve which role (core logic vs types vs index/barrel vs test) when scanning a layer column | 9 | 3 | 15 |
| 3 | Execute | Minimize the time to assess the relative size and complexity of each sub-layer when comparing columns at a glance | 8 | 5 | 11 |
| 4 | Monitor | Minimize the time to detect an abnormally large column (LOC imbalance) when reviewing architecture health | 8 | 5 | 11 |
| 5 | Monitor | Minimize the time to read the exact file count and total LOC of a column when evaluating layer scope | 7 | 3 | 11 |

### J2 Desired Outcomes

| # | 단계 | Desired Outcome | Imp | Sat | Opp |
|---|------|----------------|-----|-----|-----|
| 6 | Locate | Minimize the time to find a specific file card in the kanban when the board has many columns | 8 | 4 | 12 |
| 7 | Modify | Minimize the likelihood of losing navigation context when jumping to a dependency in a different folder | 8 | 4 | 12 |
| 8 | Conclude | Minimize the time to determine whether a dependency crosses layer boundaries illegally when reviewing a file's imports | 9 | 2 | 16 |

### J3 Desired Outcomes

| # | 단계 | Desired Outcome | Imp | Sat | Opp |
|---|------|----------------|-----|-----|-----|
| 9 | Locate | Minimize the time to identify the most complex or highest-dependency files when starting a health review | 9 | 3 | 15 |
| 10 | Confirm | Minimize the time to determine whether a large file size is abnormal compared to its layer's baseline when triaging complexity | 8 | 2 | 14 |
| 11 | Confirm | Minimize the likelihood of missing a growing-complexity trend when checking architecture health periodically | 7 | 1 | 13 |
| 12 | Execute | Minimize the time to understand why a file is large (function distribution, mixed responsibilities) when diagnosing complexity | 7 | 2 | 12 |

---

## Top Opportunities (Opp 12+)

| 순위 | Outcome | Opp | Job | 단계 |
|------|---------|-----|-----|------|
| 1 | #8: Minimize the time to determine whether a dependency crosses layer boundaries illegally when reviewing a file's imports | 16 | J2 | Conclude |
| 2 | #2: Minimize the time to identify which files serve which role when scanning a layer column | 15 | J1 | Execute |
| 3 | #9: Minimize the time to identify the most complex or highest-dependency files when starting a health review | 15 | J3 | Locate |
| 4 | #10: Minimize the time to determine whether a large file size is abnormal compared to its layer's baseline when triaging complexity | 14 | J3 | Confirm |
| 5 | #11: Minimize the likelihood of missing a growing-complexity trend when checking architecture health periodically | 13 | J3 | Confirm |
| 6 | #6: Minimize the time to find a specific file card in the kanban when the board has many columns | 12 | J2 | Locate |
| 7 | #7: Minimize the likelihood of losing navigation context when jumping to a dependency in a different folder | 12 | J2 | Modify |
| 8 | #12: Minimize the time to understand why a file is large when diagnosing complexity | 12 | J3 | Execute |

---

## 개선안

### O1: 의존성 레이어 위반 시각화 (Opp 16 — #8)

- **현재**: overlay의 dep list에서 imports/importedBy를 레이어별로 그룹핑하여 보여주지만, "이 의존이 상위 레이어를 향하는 위반인지"는 사용자가 머릿속으로 레이어 순서를 떠올려 직접 판단해야 한다. 칸반 하이라이트(highlightUp/highlightDown)도 방향은 구분하되 위반 여부는 표시하지 않는다.
- **개선**: dep list의 레이어 그룹에 레이어 순서 정보를 반영한다. 현재 파일보다 상위 레이어(역방향 의존)에 해당하는 그룹에 경고 표시(빨간 dot 또는 "violation" 라벨)를 붙인다. 칸반 카드 하이라이트에도 위반 의존은 별도 색상(destructive tone)으로 구분한다. 이를 위해 birdseyeTransform에서 레이어 순서 맵을 유지하고, dep fetch 결과에 레이어 비교 로직을 추가한다.
- **변경**:
  - `src/pages/birdseye/birdseyeTransform.ts` — 레이어 순서 맵 export (store → engine → axis → pattern → primitives → ui → pages)
  - `src/pages/birdseye/BirdseyeLayout.tsx:196-208` — dep fetch 결과에서 violation 여부 계산, depHighlight에 violation set 추가
  - `src/interactive-os/ui/Kanban.tsx` — highlightViolation prop 추가, 위반 카드에 data-violation 속성
  - `src/interactive-os/ui/Kanban.module.css` — violation 카드 스타일 (destructive tone 배경)
- **검증**: interactive-os/axis/ 파일 포커스 시, 만약 pages/ 파일을 import하면 해당 dep이 경고로 표시되어야 한다. 정상 의존(하위 레이어 방향)은 기존 색상 유지.

### O2: 컬럼 내 파일 역할 그룹핑 (Opp 15 — #2)

- **현재**: 컬럼 내 파일이 flat list로 나열된다. sortCards가 폴더/types/index 순서를 적용하지만, 시각적으로 "core 로직", "types/타입 정의", "index/barrel", "__tests__" 같은 역할 구분이 없다. 사용자는 전체 목록을 훑어야 각 파일의 성격을 판단한다.
- **개선**: buildKanbanStore에서 카드에 `group` 필드를 추가한다. 파일명 패턴으로 자동 분류: `types.*` → "types", `index.*` → "barrel", `*.test.*`/`__tests__/` → "test", 나머지 → "core". Kanban 컴포넌트가 group별로 시각적 구분선 또는 미세한 간격을 렌더링한다. 그룹 헤더는 불필요 — 간격만으로 충분하다(Apple Finder 스타일).
- **변경**:
  - `src/pages/birdseye/birdseyeTransform.ts:170-185` — 카드 data에 `group` 필드 추가 (파일명 패턴 기반 분류)
  - `src/pages/birdseye/birdseyeTransform.ts:60-80` — sortCards에서 group 순서 반영 (types → core → barrel → test)
  - `src/interactive-os/ui/Kanban.tsx` — 연속된 같은 group 카드 사이에는 기본 gap, group 전환 시 더 큰 gap 적용
  - `src/interactive-os/ui/Kanban.module.css` — group 경계 gap 토큰
- **검증**: axis 컬럼에서 types.ts가 맨 위, navigate/select/expand 등 core가 중간, index.ts가 아래에 위치하며, 그룹 전환 지점에 시각적 간격이 보여야 한다.

### O3: 복잡도/의존도 기준 정렬로 문제 파일 즉시 식별 (Opp 15 — #9)

- **현재**: 파일은 sortCards 함수의 고정 순서(폴더 → types → 알파벳 → index)로만 표시된다. depUp/depDown 숫자가 카드에 있지만, "의존도 가장 높은 파일"을 찾으려면 모든 카드를 시각적으로 스캔해야 한다. 300L+ 틴트도 있지만 정렬되지 않아 눈에 들어오지 않을 수 있다.
- **개선**: boardHeader의 legend 영역에 정렬 토글을 추가한다. 기본="구조순"(현재 sortCards), 클릭 시 "크기순(LOC 내림차순)" → "의존도순(depUp+depDown 내림차순)" → "구조순" 순환. 정렬 상태를 BirdseyeLayout의 state로 관리하고, buildKanbanStore의 옵션으로 전달한다.
- **변경**:
  - `src/pages/birdseye/BirdseyeLayout.tsx:70-71` — `sortMode` state 추가 ('structure' | 'loc' | 'deps')
  - `src/pages/birdseye/BirdseyeLayout.tsx:148` — buildKanbanStore 호출 시 sortMode 옵션 전달
  - `src/pages/birdseye/BirdseyeLayout.tsx:343-354` — legend 영역에 정렬 토글 버튼 추가
  - `src/pages/birdseye/birdseyeTransform.ts:60-80` — sortCards에 sortMode 파라미터 추가, LOC/deps 기준 정렬 로직
  - `src/pages/birdseye/birdseyeTransform.ts:83-90` — KanbanBuildOptions에 sortMode 필드 추가
- **검증**: "크기순" 토글 시 각 컬럼 내에서 LOC가 큰 파일이 상단에 위치해야 한다. "의존도순" 토글 시 depUp+depDown 합이 큰 파일이 상단에 위치해야 한다.

### O4: 컬럼 헤더에 정량 수치(파일 수 + 총 LOC) 상시 표시 + 레이어 평균 대비 (Opp 14 — #10)

- **현재**: 컬럼 헤더에 넘버링 + 폴더 경로만 표시된다(예: "1. /axis"). LOC 비율 막대가 Kanban 컴포넌트에서 렌더링되지만 정확한 숫자는 호버해야 보인다. 파일 개수는 표시되지 않는다. 사용자가 "이 컬럼에 파일이 몇 개인지", "총 몇 줄인지"를 직관적으로 알 수 없다.
- **개선**: buildKanbanStore에서 컬럼 entity data에 `fileCount` 필드를 추가한다. Kanban 컴포넌트의 컬럼 헤더 렌더링에서 title 옆에 "10 files | 1158L" 형태의 부가 정보를 표시한다. 전체 평균 LOC per column을 계산하여, 평균 대비 150% 이상인 컬럼에 시각적 강조(warning tone)를 적용한다.
- **변경**:
  - `src/pages/birdseye/birdseyeTransform.ts:163-167` — 컬럼 entity data에 `fileCount: files.length` 추가
  - `src/interactive-os/ui/Kanban.tsx:78-80` — 컬럼 헤더에 fileCount + totalLoc 텍스트 렌더링
  - `src/interactive-os/ui/Kanban.module.css` — 컬럼 헤더 메타 텍스트 스타일 (muted, caption size)
- **검증**: 각 컬럼 헤더에 "10 files | 1158L" 형태의 수치가 상시 표시되어야 한다.

### O5: 시계열 변화 시그널 부재 (Opp 13 — #11)

- **현재**: Birdseye는 현재 시점의 스냅샷만 보여준다. "지난주 대비 이 레이어가 커졌는가", "최근 3개월 성장 추세"에 대한 정보가 전혀 없다. git history 기반 데이터를 활용하지 않는다.
- **개선**: 이 개선은 백엔드 API 의존도가 높다(git log 파싱 필요). 최소 구현으로, 컬럼 헤더 tooltip에 "최근 커밋에서의 LOC 변화량"을 표시한다. fsClient에 `fetchLocHistory(path)` API를 추가하고, 최근 5개 커밋에서의 파일별 LOC 변화를 집계한다. 컬럼 헤더에 "+45L this week" 같은 delta 텍스트를 표시한다.
- **변경**:
  - `src/pages/viewer/fsClient.ts` — `fetchLocHistory` API 추가
  - 서버 API 추가 필요 (git log --stat 기반)
  - `src/pages/birdseye/BirdseyeLayout.tsx` — locHistory 데이터 fetch + 컬럼 헤더에 delta 표시
- **검증**: 컬럼 헤더에 최근 변화량이 표시되어야 한다. 변화 없는 컬럼은 delta 미표시.

---

## 우선순위 요약

| 순위 | 개선안 | Opp | 구현 복잡도 | 비고 |
|------|--------|-----|------------|------|
| 1 | O1: 의존성 레이어 위반 시각화 | 16 | 중 | 핵심 keyline — 아키텍처 규칙 위반 자동 탐지 |
| 2 | O2: 컬럼 내 파일 역할 그룹핑 | 15 | 낮 | 정보 구조 개선, 기존 sortCards 확장 |
| 3 | O3: 복잡도/의존도 정렬 | 15 | 낮 | 의사결정 지원, state + sort 로직 추가 |
| 4 | O4: 컬럼 헤더 정량 수치 | 14 | 낮 | 빠른 승리, 데이터 이미 존재 |
| 5 | O5: 시계열 변화 시그널 | 13 | 높 | 서버 API 의존, 장기 과제 |

어떤 것을 진행할까요?
