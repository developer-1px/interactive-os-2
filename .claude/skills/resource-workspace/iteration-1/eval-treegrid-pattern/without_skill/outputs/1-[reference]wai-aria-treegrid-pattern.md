# WAI-ARIA TreeGrid Pattern

> 작성일: 2026-03-22
> 출처: W3C WAI-ARIA APG, WAI-ARIA 1.2 Spec, MDN

## 개요

TreeGrid는 **tree와 grid를 결합한 복합 위젯**이다.
계층적(hierarchical) 데이터를 표 형태로 보여주며, 행을 확장/축소할 수 있다.
편집 가능하거나 인터랙티브한 표형 정보를 계층 구조로 제공한다.

핵심 특성:
- 부모 행이 자식 행을 확장/축소 가능
- 행(row)과 셀(cell) 모두 포커스 가능
- 스크린 리더가 application reading mode로 동작 — 포커스 불가 콘텐츠는 읽히지 않음
- 단일 선택 / 다중 선택 변형 존재

---

## 역할(Roles) 구조

| 요소 | Role | 설명 |
|------|------|------|
| 컨테이너 | `treegrid` | 전체 계층 그리드 |
| 행 | `row` | 셀을 포함, 확장 가능 |
| 행 그룹 | `rowgroup` | 행을 묶는 선택적 컨테이너 |
| 열 헤더 | `columnheader` | 열 제목 |
| 행 헤더 | `rowheader` | 행 제목 |
| 데이터 셀 | `gridcell` | 일반 데이터 셀 |

### Superclass

`treegrid`는 `grid`와 `tree` 모두의 특성을 상속한다.

### grid와의 차이

| | grid | treegrid |
|---|------|----------|
| 계층 구조 | 없음 | `aria-level`, `aria-posinset`, `aria-setsize` |
| 확장/축소 | 없음 | `aria-expanded` |
| 행 간 부모-자식 관계 | 없음 | 있음 |

---

## ARIA 상태 및 속성

### 계층 구조 (hierarchy)

| 속성 | 적용 대상 | 설명 |
|------|-----------|------|
| `aria-expanded` | 부모 `row` | `true`/`false` — 자식 행 가시 상태. 존재 자체가 확장 가능함을 의미 |
| `aria-level` | `row` | 계층 깊이 (1-based, 루트=1) |
| `aria-setsize` | `row` | 같은 레벨/브랜치의 형제 행 수 |
| `aria-posinset` | `row` | 형제 집합 내 위치 (1-based) |

### 레이블링 (labeling)

| 속성 | 설명 |
|------|------|
| `aria-labelledby` | 보이는 레이블 요소 참조 (권장) |
| `aria-label` | 보이는 레이블이 없을 때 직접 제공 |
| `aria-describedby` | 설명 요소 참조 |

### 선택 (selection)

| 속성 | 설명 |
|------|------|
| `aria-multiselectable` | `treegrid`에 설정. `true`면 다중 선택 가능 |
| `aria-selected` | `row`/`gridcell`에 설정. `true`=선택됨, `false`=선택 가능하지만 미선택, 생략=선택 불가 |

### 동적 콘텐츠 (dynamic/virtual)

| 속성 | 설명 |
|------|------|
| `aria-rowcount` | 전체 행 수 (DOM에 없는 가상 행 포함) |
| `aria-colcount` | 전체 열 수 |
| `aria-rowindex` | 전체 집합 내 행 위치 |
| `aria-colindex` | 전체 집합 내 열 위치 |
| `aria-rowspan` | 행 병합 (비-table 구현 시) |
| `aria-colspan` | 열 병합 (비-table 구현 시) |

### 기타

| 속성 | 설명 |
|------|------|
| `aria-readonly` | 편집 불가. 하위에 전파되지만 셀별 override 가능 |
| `aria-disabled` | 비활성화 |
| `aria-sort` | `columnheader`에 설정: `ascending`, `descending`, `none`, `other` |
| `aria-owns` | DOM 자손이 아닌 행/셀의 소유권 설정 |
| `aria-activedescendant` | 컨테이너가 포커스를 받을 때 실제 포커스 대상 참조 |

---

## 키보드 인터랙션

### 네비게이션

| 키 | 동작 |
|----|------|
| **Right Arrow** | 축소된 행이면 확장. 이미 확장이면 첫 번째 셀로 이동. 셀이면 오른쪽으로 이동. 맨 오른쪽이면 무동작 |
| **Left Arrow** | 확장된 행이면 축소. 셀이면 왼쪽으로 이동. 첫 번째 셀이면 행으로 이동(지원 시). 맨 왼쪽이면 무동작 |
| **Down Arrow** | 아래 행/셀로 이동. 마지막 행이면 무동작 |
| **Up Arrow** | 위 행/셀로 이동. 첫 번째 행이면 무동작 |
| **Page Down** | 뷰포트 높이만큼 아래로 이동 |
| **Page Up** | 뷰포트 높이만큼 위로 이동 |
| **Home** | 행의 첫 번째 셀 또는 첫 번째 행으로 이동 |
| **End** | 행의 마지막 셀 또는 마지막 행으로 이동 |
| **Ctrl + Home** | 첫 번째 행으로 이동 (셀 포커스 시 같은 열의 첫 행) |
| **Ctrl + End** | 마지막 행으로 이동 (셀 포커스 시 같은 열의 마지막 행) |
| **Enter** | 행/셀의 기본 액션 실행 또는 확장/축소 토글 |
| **Tab** | 행 내 다음 포커스 가능 요소로 이동. 마지막이면 위젯 밖으로 탈출 |

### 선택 (다중 선택 모드)

| 키 | 동작 |
|----|------|
| **Ctrl + Space** | 행 포커스 시 전체 셀 선택, 셀 포커스 시 열 전체 선택 |
| **Shift + Space** | 현재 행 전체 선택 |
| **Ctrl + A** | 전체 셀 선택 |
| **Shift + Arrow** | 해당 방향으로 선택 확장 |

---

## 세 가지 네비게이션 모델

APG 예제(E-mail Inbox)에서 제시하는 세 가지 모델:

### 1. Row-First (기본)

행이 우선 포커스를 받고, 셀에도 진입 가능.
- 화살표 위/아래로 행 탐색
- Right Arrow로 셀 진입, Left Arrow로 행 복귀
- 계층 탐색에 자연스러움

### 2. Cell-First

셀이 우선 포커스를 받고, 행에도 진입 가능.
- 그리드 동작이 주가 됨
- 화살표로 셀 간 이동
- 데이터 편집에 자연스러움

### 3. Cell-Only

셀만 포커스 가능, 행 자체에는 포커스 불가.
- 순수 그리드 동작
- 확장/축소는 첫 번째 셀의 `aria-expanded`로 처리

---

## 포커스 관리: Roving Tabindex

- 한 시점에 하나의 요소만 `tabindex="0"`
- 나머지는 모두 `tabindex="-1"`
- 포커스 이동 시 이전 요소를 `-1`로, 새 요소를 `0`으로 갱신
- `aria-activedescendant` 방식도 대안으로 가능

---

## HTML 구조 예시

### table 기반 구현

```html
<h2 id="treegrid-label">이메일 수신함</h2>
<table role="treegrid" aria-labelledby="treegrid-label">
  <thead>
    <tr>
      <th role="columnheader">제목</th>
      <th role="columnheader">요약</th>
      <th role="columnheader">보낸 사람</th>
    </tr>
  </thead>
  <tbody>
    <!-- 부모 행 (확장됨) -->
    <tr role="row"
        aria-level="1"
        aria-setsize="3"
        aria-posinset="1"
        aria-expanded="true"
        tabindex="0">
      <td role="gridcell">프로젝트 회의</td>
      <td role="gridcell">내일 오전 10시</td>
      <td role="gridcell">김철수</td>
    </tr>
    <!-- 자식 행 -->
    <tr role="row"
        aria-level="2"
        aria-setsize="2"
        aria-posinset="1"
        tabindex="-1">
      <td role="gridcell">Re: 프로젝트 회의</td>
      <td role="gridcell">확인했습니다</td>
      <td role="gridcell">이영희</td>
    </tr>
    <tr role="row"
        aria-level="2"
        aria-setsize="2"
        aria-posinset="2"
        tabindex="-1">
      <td role="gridcell">Re: 프로젝트 회의</td>
      <td role="gridcell">참석 가능합니다</td>
      <td role="gridcell">박민수</td>
    </tr>
    <!-- 부모 행 (축소됨) -->
    <tr role="row"
        aria-level="1"
        aria-setsize="3"
        aria-posinset="2"
        aria-expanded="false"
        tabindex="-1">
      <td role="gridcell">배포 일정</td>
      <td role="gridcell">다음 주 월요일</td>
      <td role="gridcell">정대리</td>
    </tr>
    <!-- 이 행의 자식들은 aria-expanded="false"이므로 숨김(display:none 등) -->
  </tbody>
</table>
```

### div 기반 구현

```html
<h2 id="org-label">조직도</h2>
<div role="treegrid" aria-labelledby="org-label">
  <div role="row" aria-level="1" aria-expanded="true" tabindex="0">
    <div role="rowheader">CEO</div>
    <div role="gridcell">홍길동</div>
  </div>
  <div role="row" aria-level="2" aria-expanded="false" tabindex="-1">
    <div role="rowheader">VP Engineering</div>
    <div role="gridcell">김개발</div>
  </div>
  <div role="row" aria-level="2" tabindex="-1">
    <div role="rowheader">VP Sales</div>
    <div role="gridcell">이영업</div>
  </div>
</div>
```

---

## 설계 주의사항

1. **모든 셀은 포커스 가능해야 한다** — 스크린 리더가 application mode에서 포커스 불가 콘텐츠를 건너뛴다
2. **`aria-expanded`는 부모 행에만** — 존재 자체가 "확장 가능함"을 의미하므로 리프 노드에는 사용 금지
3. **포커스와 선택의 시각적 구분** — 포커스(outline)와 선택(background)을 명확히 구분
4. **축소 시 자식 행 숨김** — `display: none` 또는 DOM 제거로 AT에서도 접근 불가하게
5. **`aria-readonly`는 AT 전용** — 실제 편집 방지는 `contenteditable` 또는 JS로 별도 구현 필요
6. **가상 스크롤 시** — `aria-rowcount`/`aria-rowindex`로 전체 크기와 현재 위치 전달

---

## 참고 링크

- [WAI-ARIA APG TreeGrid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/)
- [WAI-ARIA APG TreeGrid Example (Email Inbox)](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/examples/treegrid-1/)
- [WAI-ARIA 1.2 treegrid role](https://www.w3.org/TR/wai-aria-1.2/#treegrid)
- [MDN: ARIA treegrid role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/treegrid_role)
