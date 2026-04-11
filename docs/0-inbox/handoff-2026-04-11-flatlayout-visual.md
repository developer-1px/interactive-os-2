# Handoff: FlatLayout 배치 엔진 + Visual UI 레이어 (진행 중)

> FlatLayout에 Z축(깊이) 배치 지원 추가. `surface: 'raised'` 신규 축 + LayoutBase에 surface 공통 속성 + 모든 렌더러 surface 적용. 배치 = XY + Z 개념 확립. MarkdownViewer/PageViewer에 적용 완료.

## 완료

| 커밋 | 내용 |
|------|------|
| `97c4fca8` | FlatLayout NavNode/TabNode/SectionNode + 카탈로그 Nav 기반 재구성 + 데모 카드 시각 개선 |
| `37cd51d3` | TocNavList NaN 수정 + 데모 카드 overflow hidden |
| `92915586` | 카탈로그 demo 안티패턴 3건 (FileTreeView/SpreadReader/VirtualCodeBlock) |
| `6db58526` | demo 안티패턴 5건 (Meter/Progress/Skeleton/Table/ButtonToggle) |
| `0f4967b7` | navContent padding lg→md — 3열 카드 폭 확보 |
| (미커밋) | surface: raised 축 + FlatLayout Z 배치 + MarkdownViewer/PageViewer 적용 |

### 구현된 것 (이전)
- **NavNode**: 사이드바(NavList) + 콘텐츠 split, NavLayoutContext로 위젯→레이아웃 통신
- **TabNode**: 탭 버튼 + 패널 전환 (useState 기반, TabList 이중 engine 회피)
- **SectionNode**: 제목+카운트+children 묶음 (기존 stack+header 패턴 대체)
- **카탈로그 Nav**: 6카테고리 사이드바
- **PRD**: `docs/2-areas/layout/prds/flatlayout-nav-catalog-prd.md` — 8단계 전부 🟢

### 구현된 것 (이번 세션 — Z축 배치)

#### 설계 결정: 배치 = XY + Z

- **배치(arrangement)**는 layout(XY)의 상위 개념이며, Z(깊이)도 포함한다
- FlatLayout은 "레이아웃 엔진"이 아니라 **"배치 엔진"** — XY와 Z를 모두 소유
- Z는 컴포넌트의 책임이 아니라 **배치의 책임** — LLM이 의도만 선언하면 시각 문법이 따라옴

#### 깊이 사다리 (surface)

```
sunken → base → raised → overlay
 -1       0       +1       +2
네비     바닥     그룹     떠있음
```

- `sunken`: 사이드바, blockquote — 바닥보다 어두움
- `base`: 페이지 배경 — 기본
- `raised`: 코드블록, 테이블, 그룹 카드 — 바닥보다 한 톤 밝음, **border 없음**
- `overlay`: floating pill, modal — shadow + 강한 bg

#### 변경 파일

| 파일 | 변경 |
|------|------|
| `src/styles/ax.ts` | Surface 타입에 `'raised'` 추가 |
| `src/styles/ax.css` | `.sf-raised` 클래스 추가 (bg만, border 없음) |
| `src/interactive-os/layout/flatLayout.ts` | `LayoutBase` 공통 interface 추가, `surface?: 'sunken'\|'base'\|'raised'\|'overlay'` |
| `src/interactive-os/ui/FlatLayout.tsx` | renderNode가 data에서 surface 읽어 context로 전달, 모든 렌더러가 ax()에 surface 적용 |
| `src/interactive-os/ui/MarkdownViewer.css` | code/pre → raised bg + border 제거, table → raised bg + radius + border 제거 |
| `src/pages/viewer/PageViewer.tsx` | 사이드바 Panel → `surface="sunken"`, SidePanel → `surface="raised"` |

#### LLM 사용법

```ts
definePage({
  entities: {
    root: { data: { type: 'split', direction: 'horizontal', sizes: [0.2, 'flex'] },
            children: ['sidebar', 'main'] },
    sidebar: { data: { type: 'stack', surface: 'sunken' }, children: ['nav'] },
    main: { data: { type: 'section', title: '파일', surface: 'raised' }, children: ['list'] },
    nav: { data: { type: 'widget', widget: 'NavList' } },
    list: { data: { type: 'widget', widget: 'FileList' } },
  },
})
```

## 남은 것

### 즉시 (다음 세션 첫 작업)
1. **나머지 라우트에 깊이 사다리 적용** — `/ui`, `/chat`, `/kanban`, `/` CMS에 sunken/base/raised 일관 적용
2. **디자인 토큰 수준 이슈 3건** — Skeleton contrast, Badge neutral tone, Meter/Progress 바 크기
3. **개별 ui/ 컴포넌트 시각 완성** — Button, ListBox 등 핵심 컴포넌트에 tone/surface 다양화

### 이후
- **그룹핑 문법 결정 트리 문서화** — "독립 컨테이너 → display(border), 그룹 → raised(톤), floating → overlay(shadow)"
- **theme/showcase 페이지 통합** — NavNode/TabNode으로 3페이지를 하나로
- **FlatLayout 추가 확장** — 실 사용 중 부족한 노드 타입 발견 시 추가

## 컨텍스트

- **PRD**: `docs/2-areas/layout/prds/flatlayout-nav-catalog-prd.md`
- **이전 handoff**: `docs/0-inbox/handoff-2026-04-11-pit-of-success.md`
- **주의**: NavLayoutContext는 `src/interactive-os/ui/NavLayoutContext.ts`에 별도 파일
- **주의**: TabLayoutWrapper는 TabList 미사용 (이중 engine 문제)
- **discuss 핵심 인사이트**: 배치 = XY + Z. surface는 layout도 컴포넌트도 아닌 배치의 책임. M3 tone-based surface + Apple Liquid Glass layer 참조하되 우리만의 체계.
- **토큰 이미 존재**: `--surface-raised`, `--depth-raised-*` 5단계 전부 tokens.css에 준비됨 (dark/light 모두)

## 다음 행동 제안

`/use /viewer`와 `/use /ui`로 깊이 사다리 일관성 확인 후, 나머지 라우트에 sunken/raised 적용.
