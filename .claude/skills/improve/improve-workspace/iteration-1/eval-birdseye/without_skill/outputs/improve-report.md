# Birdseye 개선 제안서

## 1. 현재 상태 요약

Birdseye는 프로젝트의 아키텍처 레이어를 칸반 보드 형태로 시각화하는 코드 탐색 도구다. 3개 파일로 구성되어 있다:

| 파일 | 역할 | LOC |
|------|------|-----|
| `BirdseyeLayout.tsx` | 페이지 컴포넌트 — SplitPane(TreeView + Kanban) + Floating overlay | ~436 |
| `birdseyeTransform.ts` | fs store → navStore/kanbanStore 변환 로직 | ~251 |
| `BirdseyeLayout.module.css` | 레이아웃 + overlay + dep list 스타일 | ~323 |

**주요 기능**: 폴더 트리 탐색(좌), 파일 칸반 보드(중), 포커스 시 코드 미리보기 floating overlay(우), 의존성 하이라이트, 확장자 필터, QuickOpen(Cmd+P), _meta.yaml 기반 컬럼 정렬.

**이전 개선 라운드(R1, R2)에서 남은 미해소 Pain**: 의존성 시각화(P1), 역할 분류(P3), 시간 추이(P4), Pages/OS 통합 뷰(P5).

---

## 2. 구조적 문제 분석

### 2-1. BirdseyeLayout.tsx 과적: 436줄 단일 컴포넌트

`BirdseyeLayout`은 하나의 컴포넌트가 다음을 모두 담당한다:

- **8개 상태** (fsStore, selectedFolderId, focusedCardId, viewerCode, viewerFilename, overlayPos, depHighlight, depList, kanbanOptions, depCounts, extFilter, quickOpenVisible) — 실제로는 12개
- **5개 useEffect** (QuickOpen keydown listener, fs tree 로드, _meta.yaml 로드, debounced focus -> fetch, overlay 위치 계산)
- **6개 useCallback** (selectFolder, handleNavActivate, handleKanbanActivate, handleQuickOpenSelect, handleFocusChange, handleDepJump)
- **3개 useMemo** (navStore, kanbanStore, selectedName, breadcrumbs) — 실제로는 4개
- **2개 헬퍼 함수** (groupByLayer, calcOverlayPos) + useDebounce hook

**문제**: 단일 책임 원칙 위반. 데이터 fetching, 상태 관리, UI 렌더링, overlay 위치 계산, 의존성 fetch가 한 파일에 혼재한다. 새 기능을 추가할 때마다 이 파일이 비대해진다.

**제안**: 관심사를 분리한다.

| 분리 대상 | 책임 | 예상 결과 |
|-----------|------|-----------|
| `useBirdseyeData` hook | fs tree/dep counts 로드, navStore/kanbanStore 빌드, _meta.yaml 파싱 | 데이터 레이어 격리 |
| `useBirdseyeFocus` hook | focusedCardId, debounce, viewerCode fetch, dep fetch, overlay 위치 | 포커스/프리뷰 로직 격리 |
| `BirdseyeOverlay` 컴포넌트 | floating overlay 전체 (header + dep list + code block) | 렌더링 분리 |

이렇게 하면 BirdseyeLayout은 ~100줄 이하의 조합 컴포넌트가 되고, 각 hook/컴포넌트를 독립적으로 테스트할 수 있다.

---

### 2-2. os 기반 개발 규칙 위반: window.addEventListener 직접 사용

```typescript
// BirdseyeLayout.tsx:98-106
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
      e.preventDefault()
      setQuickOpenVisible(true)
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [])
```

**문제**: CLAUDE.md 규칙 "키바인딩 -> KeyMap 선언. addEventListener('keydown'/'keyup') 금지"를 위반한다. Cmd+P 바인딩이 전역 listener로 등록되어 있어서 다른 zone과 충돌할 수 있고, 키 바인딩의 선언적 관리가 불가능하다.

**제안**: Kanban의 keyMap에 `'Meta+p'` (또는 별도 page-level keyMap)으로 선언하거나, QuickOpen을 zone 레벨에서 관리한다.

---

### 2-3. DOM 직접 조작: document.querySelector 패턴

두 군데에서 DOM을 직접 쿼리한다:

1. **Overlay 위치 계산** (169행): `document.querySelector(\`[data-source="${CSS.escape(sourceId)}"]\`)`
2. **Dep jump** (265행): 같은 패턴으로 카드를 찾아 `.focus()` 호출

**문제**: React의 선언적 모델을 우회한다. data-source 속성에 의존하는 명시적 결합이 생기고, 카드가 아직 렌더링되지 않았거나 가상화된 경우 실패한다. 또한 `.scrollIntoView()`와 `.focus()`를 직접 호출하는 것은 engine의 포커스 관리와 충돌할 수 있다.

**제안**:
- Overlay 위치: Kanban 컴포넌트에 `onFocusRect` 콜백을 추가하여 포커스된 카드의 rect를 상위에 전달하는 선언적 방식으로 전환한다.
- Dep jump: engine의 navigate/activate command를 통해 프로그래밍적으로 포커스를 이동한다.

---

### 2-4. Fetch 패턴 비일관성

데이터 fetching이 3가지 다른 패턴을 사용한다:

1. `fetchTree` / `fetchFile` / `fetchDepCounts` — `../viewer/fsClient` 유틸
2. `fetch(\`/api/fs/imports?...\`)` — 직접 fetch 호출 (194행)
3. `parseYaml(raw)` — fetchFile 후 YAML 파싱

**문제**: `/api/fs/imports` 호출만 raw fetch를 사용하고 나머지는 fsClient를 거친다. 에러 처리도 비일관적이다 (catch에서 조용히 실패 vs 무시).

**제안**: `fetchImports(path, root)` 함수를 fsClient에 추가하여 모든 API 호출을 한 곳에서 관리한다.

---

### 2-5. birdseyeTransform.ts: 카드 데이터 타입 안전성 부재

buildKanbanStore에서 카드 entity의 data를 `Record<string, unknown>`으로 구성한다:

```typescript
entities[cardId] = {
  id: cardId,
  data: {
    title: fileData.name, sourceId: fileId, sourceType: 'file',
    ext: ..., loc: ..., weight: ..., subtitle: ..., depUp: ..., depDown: ..., tooltip: ...,
  },
}
```

그리고 소비 측에서 매번 `getEntityData<{ sourceId: string; sourceType: string; title: string }>(...)`로 타입을 수동 캐스팅한다.

**문제**: 생산자와 소비자 사이의 타입 계약이 없다. 필드를 하나 빠뜨리거나 이름을 바꿔도 컴파일 에러가 발생하지 않는다.

**제안**: `BirdseyeCardData`, `BirdseyeColumnData` 인터페이스를 정의하고 buildKanbanStore의 반환 타입에 제네릭으로 명시한다. 소비 측도 동일 타입을 import하여 캐스팅 대신 타입 안전 접근을 사용한다.

---

## 3. UX/기능 개선 제안

### 3-1. Overlay 닫기 메커니즘 부재

현재 floating overlay는 다른 카드로 포커스를 옮기거나 빈 곳으로 이동해야만 닫힌다. Escape 키, 외부 클릭, 또는 명시적 닫기 버튼이 없다.

**제안**: overlay에 닫기 버튼 추가 + Escape 키로 overlay 해제 (Kanban 포커스는 유지).

---

### 3-2. Dep list의 groupByLayer가 BirdseyeLayout 내부에 있음

`groupByLayer` 함수는 순수 데이터 변환인데 컴포넌트 파일 안에 정의되어 있다. 테스트도 불가능하다.

**제안**: `birdseyeTransform.ts`로 이동하여 단위 테스트를 추가한다.

---

### 3-3. 확장자 필터가 하드코딩됨

```typescript
{['ts', 'tsx', 'css', 'md', 'yaml'].map((ext) => (...))}
```

**문제**: 프로젝트에 json, yml, mjs, test.ts 등 다른 확장자가 존재할 수 있지만 필터에 나타나지 않는다.

**제안**: kanbanStore를 빌드할 때 실제 존재하는 확장자 목록을 추출하여 동적으로 렌더링한다. 또는 buildKanbanStore가 확장자 통계를 함께 반환하게 한다.

---

### 3-4. 초기 로딩 시 URL 동기화 불완전

```typescript
// BirdseyeLayout.tsx:117-128
const folderFromUrl = searchParams.get('folder')
const resolvedFolder = folderFromUrl && store.entities[`${DEFAULT_ROOT}/${folderFromUrl}`]
  ? `${DEFAULT_ROOT}/${folderFromUrl}`
  : null
if (resolvedFolder) {
  setSelectedFolderId(resolvedFolder)
} else {
  const nav = buildNavStore(store)
  const firstId = findFirstNavItem(nav)
  if (firstId) setSelectedFolderId(firstId)
}
```

**문제**: URL에 `?folder=` 값이 없으면 첫 번째 폴더를 선택하지만 URL에 반영하지 않는다. 또한 존재하지 않는 폴더 경로가 URL에 있을 때 조용히 첫 번째 폴더로 fallback하므로, 사용자가 잘못된 URL임을 인지하지 못한다.

**제안**: fallback 시에도 URL을 동기화하고, 잘못된 경로는 콘솔 경고 또는 toast로 알린다.

---

### 3-5. TreeView와 Kanban 포커스 간 연결 부재

좌측 TreeView에서 폴더를 선택하면 칸반이 바뀌지만, 칸반에서 디렉토리 카드를 활성화하여 다른 폴더로 이동했을 때 TreeView의 포커스/확장 상태가 동기화되지 않는다.

**제안**: `selectedFolderId`가 변경될 때 TreeView에도 해당 노드를 포커스/확장하도록 연동한다. TreeView의 `initialFocus`는 초기값만 반영하므로, controlled focus prop이 필요할 수 있다.

---

## 4. CSS 개선 제안

### 4-1. Raw 수치 사용

```css
.legend > span::before {
  width: 3px;        /* raw 숫자 */
  height: 12px;      /* raw 숫자 */
  border-radius: 1px; /* raw 숫자 */
}
```

```css
.depDot {
  width: 3px;
  height: 10px;
  border-radius: 1px;
}
```

**문제**: CLAUDE.md 규칙 "CSS 모든 수치는 토큰 필수. raw 숫자 사용 금지"를 위반한다. 3px, 12px, 10px, 1px 등이 토큰 없이 사용되고 있다.

**제안**: `var(--space-*)`, `var(--shape-*-radius)` 등의 토큰으로 교체한다.

---

### 4-2. color-mix 인라인 사용

```css
.overlay {
  background: color-mix(in srgb, var(--surface-base) 85%, transparent);
}
```

```css
.board[data-compact] .card[data-weight="lg"] {
  background: color-mix(in srgb, var(--tone-warning-base) 12%, var(--surface-default));
}
```

**문제**: 투명도 혼합 값(85%, 12%)이 토큰화되지 않은 매직 넘버다. 디자인 시스템의 surface 토큰 체계와 분리되어 있다.

**제안**: overlay 배경은 surface 토큰으로 정의하거나, 반복 사용되는 color-mix 패턴을 tokens.css에 커스텀 프로퍼티로 등록한다.

---

### 4-3. margin 사용

```css
.depGroup {
  margin-left: var(--space-sm);
}
.depGroup + .depGroup {
  margin-top: var(--space-xs);
}
```

**문제**: CLAUDE.md memory에 "margin 금지, gap으로 간격 관리, 부모가 자식 간격 제어"가 있다.

**제안**: 부모 `.depGroups`에 `display: flex; flex-direction: column; gap: var(--space-xs); padding-left: var(--space-sm);`으로 교체한다.

---

## 5. 테스트 갭 분석

현재 테스트(`birdseyeTransform.test.ts`)는 `buildNavStore`와 `buildKanbanStore`의 기본 동작만 커버한다.

**누락된 테스트 영역**:

| 영역 | 설명 |
|------|------|
| `columnOrder` 옵션 | `_meta.yaml`의 order 배열이 컬럼 순서에 반영되는지 |
| `extFilter` 옵션 | 확장자 필터가 카드를 올바르게 걸러내는지 |
| `depCounts` 옵션 | dep 카운트가 카드 데이터에 반영되는지 |
| `sortCards` 로직 | types.ts 맨 위, index.ts 맨 아래, 폴더 우선 정렬 |
| `locWeight` 함수 | LOC 구간별 weight 반환값 |
| `groupByLayer` 함수 | 경로를 레이어별로 올바르게 그룹핑하는지 |
| 재귀 전개 | 3단 이상 깊이의 폴더가 올바르게 컬럼으로 풀어지는지 |
| 빈 폴더 | 파일 없는 하위 폴더가 빈 컬럼을 생성하지 않는지 |

---

## 6. 우선순위 정리

### 즉시 (구조 정비, 규칙 준수)

| # | 항목 | 근거 |
|---|------|------|
| 1 | addEventListener -> KeyMap 전환 | os 규칙 위반 |
| 2 | CSS raw 수치 -> 토큰 교체 | 디자인 규칙 위반 |
| 3 | margin -> gap 교체 | 디자인 규칙 위반 |
| 4 | 카드 데이터 타입 인터페이스 정의 | 타입 안전성 |

### 단기 (코드 품질)

| # | 항목 | 근거 |
|---|------|------|
| 5 | BirdseyeLayout 컴포넌트 분리 (hooks + overlay) | 단일 책임, 테스트 가능성 |
| 6 | groupByLayer를 birdseyeTransform.ts로 이동 | 순수 함수 격리 |
| 7 | fetch 패턴 통일 (fetchImports -> fsClient) | 일관성 |
| 8 | 확장자 필터 동적화 | 하드코딩 제거 |

### 중기 (UX 개선)

| # | 항목 | 근거 |
|---|------|------|
| 9 | Overlay 닫기 메커니즘 (Esc + 닫기 버튼) | 접근성 |
| 10 | TreeView <-> Kanban 포커스 동기화 | 동선 일관성 |
| 11 | DOM querySelector 제거 -> 선언적 방식 전환 | React 모델 준수 |
| 12 | 테스트 커버리지 확장 (옵션, 정렬, 재귀) | 안정성 |

### 장기 (R1/R2 미해소 Pain)

| # | 항목 | 근거 |
|---|------|------|
| 13 | 레이어 간 의존성 시각화 (P1) | 아키텍처 투명성 |
| 14 | 레이어 내 역할 분류 (P3) | 정보 밀도 |
| 15 | 시간 추이 차트 (P4) | 건강도 모니터링 |
| 16 | Pages + OS 통합 뷰 (P5) | 전체 맥락 |

---

## 7. 핵심 메시지

Birdseye는 기능적으로 잘 동작하지만, **단일 컴포넌트에 너무 많은 관심사가 집중**되어 있고, **프로젝트의 자체 규칙(os 기반 개발, 토큰 필수, margin 금지)을 여러 곳에서 위반**한다. 기능 추가(R1/R2의 미해소 Pain)보다 먼저 구조적 정비를 해야, 이후 의존성 시각화나 추이 차트 같은 복잡한 기능을 안정적으로 추가할 수 있다.

**한 줄 요약**: 기능 확장 전에 컴포넌트 분리 + 규칙 준수를 먼저 해결하라.
