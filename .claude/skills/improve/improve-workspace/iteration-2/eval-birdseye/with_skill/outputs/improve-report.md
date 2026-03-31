# /improve 평가 — Birdseye

## Step 0: 대상 파악

**대상**: `src/pages/birdseye/` — BirdseyeLayout.tsx, birdseyeTransform.ts, BirdseyeLayout.module.css

**이 제품이 하는 일**: 코드베이스의 폴더 구조를 칸반 보드 형태로 시각화한다. 좌측 TreeView로 폴더를 선택하면, 중앙 Kanban에 해당 폴더의 하위 디렉토리를 컬럼으로, 파일을 카드로 펼쳐 보여준다. 카드에 포커스하면 우측 floating overlay에 코드 미리보기와 의존성 목록이 뜬다. 확장자 필터, QuickOpen(Cmd+P), 의존성 하이라이트, dep walking(의존 파일로 점프) 기능이 있다.

---

## Step 1: Jobs

| # | 사용 이유 | 상황 |
|---|----------|------|
| J1 | 코드베이스의 구조적 전체상을 파악한다 | "새 프로젝트에 합류했거나 오랜만에 돌아왔을 때, 어떤 레이어에 뭐가 있는지 한눈에 보려고 이 도구를 연다" |
| J2 | 특정 파일의 위치와 맥락을 빠르게 찾는다 | "이 파일이 어느 레이어에 속하고, 무엇에 의존하고, 누가 쓰는지 알고 싶을 때 이 도구를 연다" |
| J3 | 아키텍처 건강도를 점검한다 | "레이어별 크기 균형, 비정상적으로 큰 파일, 의존 방향 위반이 있는지 확인하려고 이 도구를 연다" |
| J4 | 코드 탐색 없이 파일 내용을 훑어본다 | "에디터를 열지 않고 파일 코드를 빠르게 미리보고 싶을 때 이 도구를 연다" |

---

## Step 2: Job Maps

### J1: 코드베이스의 구조적 전체상을 파악한다

| 단계 | 이 서비스에서 | 현재 지원 |
|------|-------------|----------|
| Define | "어떤 범위를 볼까?" — 좌측 TreeView에서 최상위 폴더 선택 | ✅ |
| Locate | "이 폴더 안에 뭐가 있지?" — Kanban에 하위 디렉토리가 컬럼으로 펼쳐짐 | ✅ |
| Execute | "각 레이어가 어떤 파일들로 구성되었는지 훑는다" — 카드 목록을 스크롤하며 파악 | 🟡 파일 목록은 보이나, 레이어 간 관계/순서가 구조적으로 드러나지 않음 |
| Monitor | "레이어 간 크기 균형이 맞는지 확인한다" — 컬럼 헤더의 LOC 비율 바로 상대 비교 | 🟡 상대 비교는 가능하나 절대값/추이 없음 |
| Conclude | "전체상을 머릿속에 그렸다, 다음 작업으로 간다" — 특정 파일 Enter → viewer로 이동 | ✅ |

### J2: 특정 파일의 위치와 맥락을 빠르게 찾는다

| 단계 | 이 서비스에서 | 현재 지원 |
|------|-------------|----------|
| Locate | "이 파일이 어디 있지?" — Cmd+P QuickOpen 또는 TreeView 탐색 | ✅ |
| Execute | "이 파일의 의존 관계를 본다" — 카드 포커스 시 overlay에 importedBy/imports 목록 | ✅ |
| Modify | "의존 파일로 이동한다" — dep list의 파일 클릭 시 해당 카드로 점프 또는 폴더 이동 | 🟡 같은 폴더면 작동, 다른 폴더면 폴더만 이동하고 파일 포커스 안 됨 |
| Conclude | "맥락 파악 완료, 에디터에서 작업" — Enter로 viewer 이동 | ✅ |

### J3: 아키텍처 건강도를 점검한다

| 단계 | 이 서비스에서 | 현재 지원 |
|------|-------------|----------|
| Define | "오늘 점검할 기준은?" — 크기 이상치, 의존 방향 위반, 파일 수 균형 | ❌ 기준이 서비스에 내장되어 있지 않음 |
| Execute | "이상치를 찾는다" — 300L+ 파일은 배경색으로 표시, dep count는 카드 subtitle | 🟡 크기 이상치는 보이나 의존 방향 위반은 안 보임 |
| Monitor | "지난번 대비 나빠졌나?" — 시간 추이 데이터 없음 | ❌ |
| Conclude | "건강하다/문제 있다 판단" — 정량적 판단 기준이 없어 주관적 | ❌ |

### J4: 코드 탐색 없이 파일 내용을 훑어본다

| 단계 | 이 서비스에서 | 현재 지원 |
|------|-------------|----------|
| Locate | "볼 파일을 찾는다" — Kanban 카드 탐색 또는 QuickOpen | ✅ |
| Execute | "코드를 읽는다" — 카드 포커스 250ms 후 floating overlay에 코드 표시 | ✅ |
| Modify | "다른 파일도 본다" — 방향키로 카드 이동, overlay가 따라옴 | ✅ |
| Conclude | "충분히 봤다" — overlay 자연 소멸 (포커스 해제 시) | ✅ |

---

## Step 3: Desired Outcomes

### J1 Desired Outcomes

| # | 단계 | Desired Outcome | Imp | Sat | Opp |
|---|------|----------------|-----|-----|-----|
| 1 | Execute | Minimize the time to **understand the dependency order between layers** when reviewing the codebase structure for the first time | 9 | 3 | 15 |
| 2 | Execute | Minimize the likelihood of **overlooking a layer's existence** when scanning the kanban columns for a selected folder | 7 | 7 | 7 |
| 3 | Monitor | Minimize the time to **identify which layer is disproportionately large** when comparing column sizes | 8 | 5 | 11 |
| 4 | Execute | Minimize the time to **distinguish file roles within a layer** (types, core logic, barrel exports, tests) when scanning a column's card list | 8 | 2 | 14 |

### J2 Desired Outcomes

| # | 단계 | Desired Outcome | Imp | Sat | Opp |
|---|------|----------------|-----|-----|-----|
| 5 | Modify | Minimize the time to **navigate to a dependent file in a different folder** when tracing an import chain across layers | 8 | 4 | 12 |
| 6 | Execute | Minimize the likelihood of **missing an indirect dependency** when assessing a file's impact radius | 6 | 5 | 7 |

### J3 Desired Outcomes

| # | 단계 | Desired Outcome | Imp | Sat | Opp |
|---|------|----------------|-----|-----|-----|
| 7 | Define | Minimize the time to **know what "healthy" looks like** when opening birdseye to check architecture | 9 | 1 | 17 |
| 8 | Execute | Minimize the time to **spot a dependency direction violation** when reviewing layer relationships | 9 | 2 | 16 |
| 9 | Monitor | Minimize the time to **detect abnormal growth in a layer** when checking architecture periodically | 7 | 1 | 13 |
| 10 | Conclude | Minimize the likelihood of **leaving with a false sense of health** when no quantitative thresholds are shown | 8 | 2 | 14 |

### J4 Desired Outcomes

| # | 단계 | Desired Outcome | Imp | Sat | Opp |
|---|------|----------------|-----|-----|-----|
| 11 | Execute | Minimize the time to **understand a file's internal structure** when previewing a large file in the overlay | 7 | 3 | 11 |
| 12 | Modify | Minimize the time to **compare two files side by side** when deciding which approach to follow | 5 | 1 | 9 |

---

## Step 4: Top Opportunities (Opp 12+)

| 순위 | # | Outcome | Opp | Job | 단계 |
|------|---|---------|-----|-----|------|
| 1 | 7 | Minimize the time to know what "healthy" looks like when opening birdseye | 17 | J3 | Define |
| 2 | 8 | Minimize the time to spot a dependency direction violation | 16 | J3 | Execute |
| 3 | 1 | Minimize the time to understand the dependency order between layers | 15 | J1 | Execute |
| 4 | 4 | Minimize the time to distinguish file roles within a layer | 14 | J1 | Execute |
| 5 | 10 | Minimize the likelihood of leaving with a false sense of health | 14 | J3 | Conclude |
| 6 | 9 | Minimize the time to detect abnormal growth in a layer | 13 | J3 | Monitor |
| 7 | 5 | Minimize the time to navigate to a dependent file in a different folder | 12 | J2 | Modify |

---

## Step 5: 깊이 강제 질문 체인

| Outcome | ① 서비스가 대신 해줄 수 있나? | ② 구조로 해결할 수 있나? | ③ 표시로 해결할 수 있나? |
|---------|-------------------------------|------------------------|------------------------|
| #7: "healthy" 기준 인지 | ✅ 아키텍처 레이어 의존 순서(store→engine→axis→pattern→primitives→ui→pages)를 컬럼 배치 순서로 강제하면, "올바른 순서"가 화면 자체에 내장된다. 사용자가 기준을 알 필요 없이 "왼쪽→오른쪽이 의존 순서"라는 사실만으로 건강/위반을 판단할 수 있다. | — | — |
| #8: 의존 방향 위반 감지 | ✅ 컬럼이 의존 순서대로 배치되면, "오른쪽 컬럼이 왼쪽을 import"는 정상이고 "왼쪽이 오른쪽을 import"는 위반이다. 의존성 하이라이트에서 highlight-up이 자기보다 왼쪽을 가리키면 정상, 오른쪽을 가리키면 위반 — 배치 자체가 위반을 시각적으로 "역방향"으로 드러낸다. 사용자가 위반 규칙을 외울 필요 없다. | — | — |
| #1: 레이어 간 의존 순서 이해 | ✅ 위 #7과 동일 해법. 컬럼 배치 순서 = 의존 순서이면, 새 참여자가 "왼쪽이 기반, 오른쪽이 소비자"를 레이아웃만으로 학습한다. _meta.yaml의 order 필드에 아키텍처 순서를 선언하면 된다. | — | — |
| #4: 레이어 내 파일 역할 구분 | ① 불가능 — 파일 역할은 이름/확장자만으로 완전히 자동 판별 불가 | ✅ 카드 정렬 순서를 역할 기반으로 바꾼다: types.ts → core 로직 → barrel(index.ts) 순서는 이미 sortCards에 구현됨. 추가로 __tests__/ 폴더 파일, .css 파일을 그룹 후방에 배치하면, 시각적 "위=타입, 중=로직, 아래=부가" 계층이 정렬만으로 생긴다. 별도 그룹 헤더나 구분선 없이 순서가 역할을 암시한다. | — |
| #10: 정량 기준 없이 건강 오판 | ✅ 서비스가 위반 개수를 자동 집계하면 된다. 현재 depCounts 데이터가 있으므로, 선택 폴더 내에서 "역방향 의존(아키텍처 순서 위반) N건"을 컬럼 순서에서 계산하여 boardHeader에 자동 표시할 수 있다. 사용자가 세지 않아도 "violations: 0"이면 건강, 숫자가 있으면 문제. | — | — |
| #9: 레이어 비정상 성장 감지 | ① 불가능 — 시간 추이 데이터는 현재 서버에 없고, git history 연동이 필요. 이 개선은 백엔드 의존이 크다. | ② 불가능 — 배치/순서로 "시간 변화"를 표현할 수 없다. | ③ 가능하지만 데이터 소스 부재. sparkline이나 변화량 텍스트 모두 git history API가 전제. 현재 구현 범위 밖. → **보류** |
| #5: 다른 폴더 파일로 점프 | ✅ 현재 handleDepJump에서 다른 폴더면 selectFolder만 호출하고 끝난다. 폴더 전환 후 해당 파일 카드에 자동 포커스를 주면 된다. "서비스가 대신 해주는 것" = 폴더 이동 + 카드 포커스를 하나의 동작으로 연결. 사용자가 폴더 이동 후 수동으로 카드를 찾을 필요 없다. | — | — |

---

## Step 6: 개선안

### O1: 컬럼을 아키텍처 의존 순서로 배치 (Outcome #7, #8, #1 통합 — Opp 17+16+15)

- **깊이**: ① 서비스 대행
- **현재**: 컬럼은 _meta.yaml order가 없으면 알파벳순. 사용자는 레이어 의존 순서를 머릿속에 기억하고 컬럼을 눈으로 매핑해야 한다. 의존 방향 위반은 어떤 시각적 단서도 없다.
- **개선**: `src/interactive-os/` 폴더의 `_meta.yaml`에 `order: [store, engine, axis, pattern, primitives, ui]`를 선언한다. buildKanbanStore의 sortDirs가 이미 columnOrder를 지원하므로, 컬럼이 자동으로 의존 순서대로 배치된다. "왼쪽 = 기반 레이어, 오른쪽 = 소비 레이어"가 레이아웃에 내장되어, 의존 방향 위반이 "역방향 하이라이트"로 자동 드러난다. 사용자는 규칙을 외우지 않아도 구조를 읽는다.
- **변경**:
  - `src/interactive-os/pattern/_meta.yaml` (신규): `order: [store, engine, axis, pattern, primitives, ui]` (이미 _meta.yaml 파싱 로직이 BirdseyeLayout.tsx L136-143에 존재)
  - 추가 코드 변경 없음 — 기존 columnOrder 메커니즘이 그대로 작동
- **검증**: interactive-os 폴더 선택 시 컬럼 순서가 store → engine → axis → pattern → primitives → ui 순으로 나오는지 확인. 의존 하이라이트에서 "왼쪽→오른쪽" import가 정상 방향임을 시각적으로 확인.

---

### O2: 역방향 의존 위반 자동 집계 (Outcome #10 — Opp 14)

- **깊이**: ① 서비스 대행
- **현재**: 사용자가 의존 하이라이트를 하나하나 확인하며 위반을 수동으로 판단. 전체 건강도에 대한 정량적 결론이 없다.
- **개선**: boardHeader에 "violations: N"을 자동 표시. 컬럼 순서(= 아키텍처 순서) 기준으로, depCounts의 imports 중 자기보다 오른쪽 컬럼에 속하는 파일을 import하는 경우를 "위반"으로 집계. 숫자가 0이면 건강, N>0이면 해당 카드를 별도 표시(data-violation 속성).
- **변경**:
  - `src/pages/birdseye/birdseyeTransform.ts`: buildKanbanStore에서 columnOrder 인덱스를 기반으로 각 카드의 imports가 역방향인지 판별하는 로직 추가
  - `src/pages/birdseye/BirdseyeLayout.tsx`: boardHeader에 violation count 표시
  - `src/interactive-os/ui/Kanban.tsx`: data-violation 속성 지원 (카드 수준)
  - `src/interactive-os/ui/Kanban.module.css`: violation 카드 시각 처리
- **검증**: store 레이어 파일이 ui 레이어를 import하면 violation으로 카운트되는지 확인. violation 0인 폴더에서 숫자가 0으로 표시되는지 확인.

---

### O3: 카드 정렬 순서로 파일 역할 암시 (Outcome #4 — Opp 14)

- **깊이**: ② 구조(순서) 변경
- **현재**: sortCards는 "폴더 먼저 → types.ts 맨 위 → index.ts 맨 아래 → 나머지 알파벳순"으로 정렬. .css 파일, __tests__ 파일, 설정 파일(*.config.*) 등이 core 로직과 섞여 있어 역할 구분이 어렵다.
- **개선**: sortCards의 파일 정렬 기준을 확장한다: types → core 로직(.ts/.tsx, 비-index, 비-types) → CSS(.css/.module.css) → 설정(*.config.*, *.yaml, *.json) → barrel(index.ts) 순서. 이렇게 하면 컬럼 내에서 위에서 아래로 읽을 때 "타입 정의 → 핵심 구현 → 스타일 → 설정 → 진입점" 흐름이 자연스럽게 생긴다. 그룹 헤더나 구분선 같은 새 UI 요소 없이, 순서만으로 역할이 암시된다.
- **변경**:
  - `src/pages/birdseye/birdseyeTransform.ts`: sortCards 함수에 파일 분류 우선순위 추가 (types=0, core=1, css=2, config=3, index=4)
- **검증**: axis 컬럼에서 types.ts가 최상단, navigate.ts/select.ts 등 core 파일이 중간, index.ts가 최하단에 오는지 확인.

---

### O4: dep jump 시 자동 포커스 (Outcome #5 — Opp 12)

- **깊이**: ① 서비스 대행
- **현재**: overlay의 dep list에서 다른 폴더 파일을 클릭하면 해당 폴더로 이동하지만, 카드에 포커스가 가지 않는다. 사용자가 카드를 직접 찾아야 한다.
- **개선**: handleDepJump에서 selectFolder 호출 후, 대상 파일 경로를 상태에 저장한다. Kanban이 새 데이터로 렌더링된 후 해당 파일의 카드 DOM 요소를 찾아 자동 포커스 + scrollIntoView를 실행한다. 사용자는 dep 클릭 한 번으로 "폴더 이동 + 파일 포커스 + overlay 갱신"이 모두 일어난다.
- **변경**:
  - `src/pages/birdseye/BirdseyeLayout.tsx`: pendingFocusTarget 상태 추가, selectFolder 후 useEffect에서 DOM 탐색 + 포커스
- **검증**: overlay에서 다른 폴더 파일 클릭 시 폴더 전환 + 해당 카드에 포커스가 자동으로 이동하는지 확인.

---

### 보류 항목

| Outcome | 보류 이유 |
|---------|----------|
| #9: 레이어 비정상 성장 감지 (Opp 13) | git history API가 전제. 백엔드 의존이 커서 현재 범위 밖. 별도 PRD 필요. |

---

## 우선순위 요약

| 순위 | 개선안 | Opp (합산) | 복잡도 |
|------|--------|-----------|--------|
| 1 | O1: 컬럼을 아키텍처 의존 순서로 배치 | 48 (17+16+15) | 낮음 — _meta.yaml 파일 추가만 |
| 2 | O2: 역방향 의존 위반 자동 집계 | 14 | 중간 — transform + UI 수정 |
| 3 | O3: 카드 정렬 순서로 파일 역할 암시 | 14 | 낮음 — sortCards 수정만 |
| 4 | O4: dep jump 시 자동 포커스 | 12 | 낮음 — 상태 + useEffect 추가 |

---

어떤 것을 진행할까요?

---

```
=== /improve 평가 완료 ===
평가: 4 jobs, 12 outcomes 평가
Top Opportunities: 7개 (Opp 12+)
개선안: 4개 도출 (O1~O4)
보류: 1개 (#9 — git history API 의존)
```
