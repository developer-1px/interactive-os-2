# Spatial Navigation 구현 조사

작성일: 2026-03-22

## 1. 개요

Spatial navigation은 화살표 키(또는 TV 리모컨 방향 버튼)로 화면 내 포커스 가능한 요소 사이를 **시각적 위치 기반**으로 이동하는 메커니즘이다. 전통적인 Tab 순서(DOM 순서)가 아닌, 요소의 화면상 좌표를 기준으로 "위/아래/왼쪽/오른쪽"에 있는 가장 가까운 요소로 포커스를 옮긴다.

주요 사용처:
- Smart TV / Set-top box (리모컨 4방향 키)
- 게임 콘솔 UI
- 차량 IVI (인포테인먼트) 조그 다이얼
- 웹 접근성 (키보드 전용 사용자)
- Figma류 캔버스 에디터

---

## 2. W3C CSS Spatial Navigation 명세

### 2.1 명세 상태

- **CSS Spatial Navigation Level 1** — W3C Working Draft
- 원래 WICG에서 시작, TPAC 2018에서 CSS WG로 이관
- 2026년 기준 아직 브라우저 네이티브 구현 없음 (폴리필만 존재)
- 명세: https://www.w3.org/TR/css-nav-1/
- WICG 저장소: https://github.com/WICG/spatial-navigation

### 2.2 핵심 개념

**Navigation Container:** `spatial-navigation-contain` CSS 속성으로 정의. 포커스 이동 범위를 제한하는 경계 역할.

**CSS 속성 3가지:**
| 속성 | 역할 |
|------|------|
| `spatial-navigation-contain` | 컨테이너 경계 설정 |
| `spatial-navigation-action` | 스크롤 가능 요소의 동작 제어 |
| `spatial-navigation-function` | 탐색 알고리즘 선택 (`normal` / `grid`) |

**JavaScript API:**
- `navigate(direction)` — 프로그래밍 방식으로 방향 이동
- `spatialNavigationSearch(direction)` — 다음 포커스 대상 탐색 (이동 없이)
- `focusableAreas()` — 포커스 가능한 요소 목록
- `getSpatialNavigationContainer()` — 부모 컨테이너 조회

### 2.3 W3C 폴리필 거리 공식

W3C 폴리필은 **복합 가중 거리 공식**을 사용한다:

```
Score = A + B + C - D
```

| 항목 | 의미 | 계산 |
|------|------|------|
| **A** | 유클리드 거리 | `sqrt(dx^2 + dy^2)` — 진입점/이탈점 사이 |
| **B** | 직교 거리 (방향 수직축) | 직교 오프셋 x 가중치 |
| **C** | 정렬 보너스 | 축 정렬도 x 5.0 |
| **D** | 교차 면적 | 후보와 검색 원점의 겹침 영역 |

**직교 가중치 (핵심 상수):**
- 좌/우 이동 시: `kOrthogonalWeightForLeftRight = 30`
- 상/하 이동 시: `kOrthogonalWeightForUpDown = 2`

수직 이동보다 수평 이동에서 직교 편차를 훨씬 크게 페널티한다. 이는 전형적인 UI에서 가로로 나열된 요소가 세로보다 정렬이 중요하기 때문이다.

**grid 모드:** `spatial-navigation-function: grid` 설정 시, 축 정렬된 후보만 필터링한 뒤 거리 계산한다.

---

## 3. 주요 오픈소스 라이브러리

### 3.1 접근법 분류

Spatial navigation 구현은 크게 두 가지 접근법으로 나뉜다:

| 접근법 | 원리 | 장점 | 단점 |
|--------|------|------|------|
| **Pixel-based** | `getBoundingClientRect()`로 좌표 계산 | 자동, 레이아웃 변경에 강건 | DOM 의존, 성능 비용 |
| **Declaration-based** | 트리 구조로 관계 선언 | 크로스 플랫폼, 예측 가능 | 수동 관리 부담 |

### 3.2 Norigin Spatial Navigation

- 저장소: https://github.com/NoriginMedia/Norigin-Spatial-Navigation
- 접근법: **Pixel-based** (자동 `getBoundingClientRect`)
- 플랫폼: React (Tizen, webOS, Hisense, Vizio 등 Smart TV 실전 배포)
- API: `useFocusable()` 훅 + `FocusContext` 컨테이너
- 특징: 수동 wiring 불필요 — 방향만 지정하면 라이브러리가 다음 포커스 자동 결정

### 3.3 BBC LRUD

- 저장소: https://github.com/bbc/lrud
- 접근법: **Declaration-based** (트리 구조 선언)
- 핵심: 노드를 등록할 때 orientation(`vertical` / `horizontal`)을 지정
- 시각 컴포넌트 없음 — 순수 데이터 모델로 공간 관계 표현
- `lrud-spatial` (별도 패키지): pixel-based 보완판

**LRUD-Spatial 거리 알고리즘:**
- 현재 포커스 요소의 이동 방향 **이탈 edge** 좌표 획득
- 후보 요소의 반대쪽 **진입 edge** 좌표 획득
- 이탈-진입 사이 최단 거리 계산
- **overlap threshold** (기본 30%): 직교축 겹침 비율로 후보 필터링 (`data-lrud-overlap-threshold`로 0.0~1.0 조절 가능)

### 3.4 react-tv-space-navigation (BAM)

- 저장소: https://github.com/bamlab/react-tv-space-navigation
- 접근법: Declaration-based (내부적으로 LRUD 사용)
- React Native용, 100% 크로스 플랫폼
- 선언적 React API로 LRUD를 래핑

### 3.5 Spotify TV Navigation

- 참고: https://engineering.atspotify.com/2023/05/tv-spatial-navigation
- 1세대: 수동 선언 (`nextRight`, `nextLeft` 등) — 유지보수 문제
- 2세대: pixel-based 자동 탐색 (`getBoundingClientRect`)
- 아키텍처 3모듈: **NavEngine** (트리 관리) / **FindFocusIn** (포커스 추적) / **Navigate** (방향 결정)
- LCA(Lowest Common Ancestor) 알고리즘: 순환 탐색, 컨테이너 레벨 로직에 활용
- 교훈: React Hooks로 API 단순화, 비대칭 레이아웃에서 알고리즘이 수동 설정보다 일관적

### 3.6 Android TV FocusFinder

- Android 프레임워크 내장 spatial navigation
- `FocusFinder.findNextFocus()` — 방향별 다음 포커스 요소 자동 탐색
- Rect 기반 거리 계산, 뷰 계층 구조 순회
- `android:nextFocusUp/Down/Left/Right`로 수동 오버라이드 가능

---

## 4. 거리 계산 알고리즘 비교

### 4.1 공통 패턴

모든 구현이 공유하는 기본 흐름:

```
1. 현재 포커스 요소의 rect 획득
2. 방향 필터링: 이동 방향에 있는 후보만 남김
3. 거리 점수 계산
4. 최저 점수 후보 선택
```

### 4.2 방향 필터링

가장 단순한 형태 (center-to-center):

```typescript
// 중심점 비교
const inDirection =
  dir === 'ArrowRight' ? candidate.cx > current.cx :
  dir === 'ArrowLeft'  ? candidate.cx < current.cx :
  dir === 'ArrowDown'  ? candidate.cy > current.cy :
  /* ArrowUp */          candidate.cy < current.cy
```

W3C 명세는 edge-to-edge 비교를 사용하여 더 정밀하다.

### 4.3 거리 점수 계산 방식 비교

| 구현 | 주축 거리 | 직교축 페널티 | 추가 보정 |
|------|-----------|---------------|-----------|
| **W3C 폴리필** | 유클리드 (edge 기준) | x30 (좌우) / x2 (상하) | 정렬 보너스, 교차 면적 |
| **LRUD-Spatial** | 최단 edge 거리 | overlap threshold 30% | 없음 |
| **aria (이 프로젝트)** | 맨해튼 (center 기준) | x2 (직교축) | 없음 |
| **Norigin** | getBoundingClientRect 기반 | 자동 | 내부 구현 비공개 |

### 4.4 aria 프로젝트의 현재 공식

`useSpatialNav.ts`의 `findBestInDirection`:

```typescript
const dx = Math.abs(c.x - from.x)  // center-to-center
const dy = Math.abs(c.y - from.y)

// 직교축 x2 페널티 — 정렬된 대상 선호
const score =
  (dir === 'ArrowLeft' || dir === 'ArrowRight')
    ? dx + dy * 2    // 좌우 이동: 수직 오프셋 2배 페널티
    : dy + dx * 2    // 상하 이동: 수평 오프셋 2배 페널티
```

W3C 대비 단순하지만 실용적. center 기준이라 edge 케이스(큰 요소와 작은 요소 혼재)에서 차이 발생 가능.

---

## 5. 컨테이너/그룹 경계 처리

### 5.1 접근법별 비교

| 방식 | W3C | LRUD | aria (이 프로젝트) |
|------|-----|------|-----|
| **컨테이너 정의** | CSS 속성 | 트리 노드 orientation | `__spatial_parent__` 엔티티 |
| **경계 넘기** | overflow 시 스크롤 우선 | 부모 노드로 이벤트 전파 | cross-boundary (인접 그룹 탐색) |
| **포커스 복원** | 없음 | 없음 | sticky cursor (`Map<parentId, childId>`) |

### 5.2 aria 프로젝트의 cross-boundary 알고리즘

```
1. 현재 그룹 내 findNearest → 결과 있으면 이동 (종료)
2. 결과 없으면 → 인접 sibling 그룹 탐색 (findAdjacentGroup)
3. 인접 그룹 발견 시:
   a. sticky cursor 있으면 → 저장된 위치로 복원
   b. 없으면 → 인접 그룹 자식 중 findNearest
   c. nearest도 없으면 → 첫 자식 fallback
4. spatial parent를 인접 그룹으로 전환 (enterChild)
```

이 방식의 차별점: **sticky cursor**로 가역적 동선 보장 (A그룹→B그룹→A그룹 시 원래 위치 복원).

---

## 6. 깊이 탐색 (Depth Navigation)

TV 리모컨 모델에서 "포커스 링만 이동, 렌더링 변화 없음"을 유지하면서 중첩 구조를 탐색하는 패턴.

| 키 | 동작 |
|----|------|
| **Enter** | 컨테이너 → 자식 레벨 진입 / 리프 → 인라인 편집 |
| **Escape** | 부모 레벨로 복귀 |
| **F2** | 강제 편집 모드 진입 |
| **Home/End** | 현재 깊이의 첫/마지막 형제로 이동 |

이 모델은 Figma의 레이어 탐색 (클릭으로 깊이 진입, Escape로 복귀)과 동일한 사용자 멘탈 모델이다.

---

## 7. 설계 결정 시 고려사항

### 7.1 Pixel-based vs Declaration-based

- **Pixel-based 선택 시기:** 레이아웃이 동적이고, DOM이 유일한 진실 소스일 때 (웹 CMS, Figma류)
- **Declaration-based 선택 시기:** 크로스 플랫폼(RN, 네이티브)이 필요하거나, DOM 없는 환경일 때

### 7.2 직교축 가중치 튜닝

- W3C의 `30` (좌우) / `2` (상하) — 일반적 UI에 최적화
- aria 프로젝트의 `2` (양방향 동일) — 그리드 레이아웃에 적합
- 가중치가 클수록 정렬된 요소를 강하게 선호

### 7.3 Edge-based vs Center-based 거리

- **Center-based:** 구현 단순, 균일 크기 요소에 적합
- **Edge-based:** 크기가 다양한 요소 혼재 시 더 직관적 (큰 요소의 가장자리가 더 가까움)
- W3C 명세는 edge-based를 표준으로 채택

### 7.4 Sticky Cursor 패턴

그룹 간 이동 시 이전 위치를 기억하는 패턴. 가역적 동선(reversible traversal)의 핵심.
- 리셋 조건: 명시적 의도(클릭, Enter, Escape)만
- 유지 조건: 방향키 이동, CRUD, Home/End

---

## 8. 참고 링크

- [W3C CSS Spatial Navigation Level 1](https://www.w3.org/TR/css-nav-1/)
- [WICG Spatial Navigation Spec + Polyfill](https://github.com/WICG/spatial-navigation)
- [WICG Spatial Navigation 문서](https://wicg.github.io/spatial-navigation/)
- [Norigin Spatial Navigation (React)](https://github.com/NoriginMedia/Norigin-Spatial-Navigation)
- [BBC LRUD](https://github.com/bbc/lrud)
- [BBC LRUD-Spatial](https://github.com/bbc/lrud-spatial)
- [react-tv-space-navigation (BAM)](https://github.com/bamlab/react-tv-space-navigation)
- [Spotify TV Spatial Navigation](https://engineering.atspotify.com/2023/05/tv-spatial-navigation)
- [Norigin 블로그: Smart TV Navigation with React](https://medium.com/norigintech/smart-tv-navigation-with-react-86bd5f3037b7)
