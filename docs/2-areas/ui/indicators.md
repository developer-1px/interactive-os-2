# Indicators

> UI 완성품 내부에서 상태를 시각화하는 비-인터랙티브 요소 모음.
> 단독 사용 불가 — 항상 완성품(TreeView, Checkbox, Grid 등)이 소비한다.

## 상태 범례

- ⬜ 미착수
- 🔨 진행 중
- 🟢 완료 (추출/신규 구현 + 기존 사용처 교체)
- 🟡 부분 (구현됨, 사용처 교체 미완)

## 위치

`src/interactive-os/ui/indicators/` — 완성품 내부 파트이므로 ui/ 하위.

## Indicator Matrix

### State — 상태 시각화

| # | Indicator | 역할 | 현재 상태 | 사용처 | 진척 |
|---|-----------|------|-----------|--------|------|
| 1 | ExpandIndicator | 확장/축소 chevron 회전 | 추출 완료 | TreeView, TreeGrid, DisclosureGroup, Accordion, MenuList | 🟢 |
| 2 | CheckIndicator | 체크 마크 | 추출 완료 | Checkbox | 🟢 |
| 3 | RadioIndicator | 라디오 dot filled/empty | 추출 완료 | RadioGroup | 🟢 |
| 4 | SwitchIndicator | track + thumb 토글 | 추출 완료 | SwitchGroup | 🟢 |
| 5 | IndeterminateIndicator | 부분 선택 (−) | 미구현 | Checkbox (group) | ⬜ |
| 6 | SortIndicator | 정렬 방향 ↑↓ | 미구현 | Grid, Table 헤더 | ⬜ |

### Feedback — 피드백/진행

| # | Indicator | 역할 | 현재 상태 | 사용처 | 진척 |
|---|-----------|------|-----------|--------|------|
| 7 | SpinnerIndicator | 회전 로딩 | 미구현 | 범용 | ⬜ |
| 8 | ProgressIndicator | determinate 진행 bar | 미구현 | 범용 | ⬜ |
| 9 | SkeletonIndicator | shimmer placeholder | 미구현 | 범용 | ⬜ |
| 10 | StatusIndicator | success/error/warning dot | 미구현 | 범용 | ⬜ |

### Navigation — 탐색 보조

| # | Indicator | 역할 | 현재 상태 | 사용처 | 진척 |
|---|-----------|------|-----------|--------|------|
| 11 | PageIndicator | 페이지네이션 dot/번호 | 미구현 | Pagination, Carousel | ⬜ |
| 12 | DirectionIndicator | prev/next 방향 화살표 | 미구현 | Carousel, Pagination | ⬜ |
| 13 | StepIndicator | 스텝 번호 원 + 완료 체크 | 미구현 | Stepper | ⬜ |
| 14 | SeparatorIndicator | 구분선/구분 기호 | 추출 완료 | Breadcrumb, Menu, Toolbar | 🟢 |

### Annotation — 부가 정보

| # | Indicator | 역할 | 현재 상태 | 사용처 | 진척 |
|---|-----------|------|-----------|--------|------|
| 15 | BadgeIndicator | 숫자 카운트 원 | 미구현 | Tab, NavItem | ⬜ |
| 16 | OverflowIndicator | "... +N" 잘림 표시 | 미구현 | TabList, Breadcrumb | ⬜ |
| 17 | GripIndicator | ⋮⋮ 드래그 핸들 | 미구현 | Kanban, sortable list | ⬜ |
| 18 | TreeConnector | 수직/수평 계층 연결선 | 미구현 | TreeView, TreeGrid | ⬜ |

## 현황 요약

```
추출 대상 (기존 중복):  5/6  완료   (Toggle은 Phase 2)
신규 구현:              0/12 완료
총:                     5/18 완료 (28%)
```

## 설계 원칙

- **비-인터랙티브**: 포커스 불가, 키보드 불필요, engine/pattern 밖
- **상태 → 시각**: props(expanded, checked, value 등) → SVG/CSS 출력
- **토큰 전용**: 모든 수치는 디자인 토큰, raw 값 금지
- **ARIA 표준 이름**: indicator 이름은 ARIA attribute/role에서 파생

## 갭 레지스트리

| # | 갭 | 영향 | 상태 |
|---|-----|------|------|
| — | — | — | — |
