---
id: samples/design-spec
title: 'Design Spec: CMS Toolbar'
created: 2026-04-09
updated: 2026-04-18
legacy:
  status: sample
  kind: note
  topics: [samples]
  relates: []
  supersedes: []
---
# Design Spec: CMS Toolbar

## 역할

CMS 편집 화면 상단의 액션 바. 노드 CRUD, undo/redo, 뷰 전환 등 주요 커맨드를 모아 놓은 컨트롤 그룹.

## 시각 명세

| 축 | 값 | 이유 |
|---|---|---|
| surface | `base` | 페이지 배경과 동일 레벨, 콘텐츠 위에 떠 보이지 않아야 함 |
| recipe | `control-sm` | 바 내부 버튼은 컴팩트 조작 요소 — height 28px 세트 |
| tone | `neutral` | 기본 상태에서 색상 주장 없음, 중립 |
| textStyle | `label` | 짧은 액션 라벨, 14px medium |
| text | `secondary` | 보조 텍스트 명도 — 콘텐츠 영역보다 시선 우선순위 낮음 |
| interactive | `button` | hover/focus/active 상태 시각 응답 |
| layout | `'row'` | 수평 1열 배치 |
| gap | `'sm'` | 버튼 간 8px 간격 |
| padding | `'xs'` | 바 자체는 최소 패딩 — 바 유형 레이아웃 |
| border | `'bottom'` | 콘텐츠 영역과의 경계선, 단면만 |
| content | `'text'` | 텍스트 버튼 위주, inline 2:1 비율 적용 |

## 상태별 시각

| 상태 | surface | tone | text | 비고 |
|---|---|---|---|---|
| default | `base` | `neutral` | `secondary` | 배경과 동화, 시선 비경쟁 |
| hover | — | — | `primary` | interactive=button이 bg 미세 변화 처리 |
| active (pressed) | — | `accent` | `bright` | 클릭 순간 accent 피드백 |
| disabled | — | `neutral-dim` | `muted` | opacity 축 불사용, tone-dim으로 약화 |
| focused | state=`focused` | — | — | accent outline, accent 1채널 규칙 준수 |

## 반응형 동작

| breakpoint | 동작 |
|---|---|
| >= 768px | 전체 라벨 + 아이콘 표시, layout=row 유지 |
| < 768px | 라벨 숨김, 아이콘만 표시. overflow 버튼(...)으로 접기 |
| < 480px | 필수 액션 3개만 노출, 나머지 overflow 메뉴 |

## 토큰 사용 규칙

1. **ax()만 사용** — `style={}` 금지. 위 표의 축-값 조합을 `ax()` 호출로 선언.
2. **last-mile만 module.css** — ax() 축에 없는 시각(예: 구분선 점선 패턴)만 `Toolbar.module.css`에 작성.
3. **surface 소유 속성 침범 금지** — border, shadow, cursor, bg는 surface/interactive 축이 소유. module.css에서 재선언하지 않는다.
4. **accent 1채널** — selected=neutral bg, activate=accent bg, focus=accent outline. 동시에 두 곳에 accent 사용 금지.
5. **recipe가 구조 잠금** — height, padding, font-size, border-radius는 recipe 프리셋이 결정. 개별 오버라이드 금지.
6. **tone-dim 패턴** — disabled 상태는 opacity 축이 아닌 `tone: 'neutral-dim'`으로 표현.

#kind/note
