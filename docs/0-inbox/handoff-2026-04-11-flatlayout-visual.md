# Handoff: FlatLayout 페이지 구조 엔진 + Visual UI 레이어 (진행 중)

> 2026-04-11 세션에서 FlatLayout에 NavNode/TabNode/SectionNode 3개 노드 타입 추가, 카탈로그를 Nav 기반으로 재구성, 데모 카드 시각 개선 적용. Visual UI 레이어의 구조적 기반은 완성했으나 개별 컴포넌트 시각 개선은 미착수.

## 완료

| 커밋 | 내용 |
|------|------|
| `97c4fca8` | FlatLayout NavNode/TabNode/SectionNode + 카탈로그 Nav 기반 재구성 + 데모 카드 시각 개선 |
| `37cd51d3` | TocNavList NaN 수정 + 데모 카드 overflow hidden |
| `92915586` | 카탈로그 demo 안티패턴 3건 (FileTreeView/SpreadReader/VirtualCodeBlock) |

### 구현된 것
- **NavNode**: 사이드바(NavList) + 콘텐츠 split, NavLayoutContext로 위젯→레이아웃 통신
- **TabNode**: 탭 버튼 + 패널 전환 (useState 기반, TabList 이중 engine 회피)
- **SectionNode**: 제목+카운트+children 묶음 (기존 stack+header 패턴 대체)
- **카탈로그 Nav**: 6카테고리 사이드바 (Components 85, Composites 5, Panels 3, Items 14, Cells 10, Indicators 22)
- **데모 카드**: surface:display + border:default + shape:md
- **navContent padding**: var(--space-lg)
- **PRD**: `docs/2-areas/layout/prds/flatlayout-nav-catalog-prd.md` — 8단계 전부 🟢

## 남은 것

### 즉시 (다음 세션 첫 작업)
1. **improve-design 2라운드** — 남은 안티패턴 9건: Meter/Progress/Skeleton 시각 요소 미렌더링, Table 빈 카드, Badge Default variant, ButtonToggle 단일 상태 등. demo 데이터 보강 + 컴포넌트 시각 개선.
2. **ax() 축 확장 검토** — max-height가 ax()에 없어서 카드 높이 제한 불가. size 축 확장 또는 aspect:'card' 활용 검토.
3. **개별 ui/ 컴포넌트 시각 완성** — Button, ListBox 등 핵심 컴포넌트에 tone/surface 다양화

### 이후
- **theme/showcase 페이지 통합** — NavNode/TabNode으로 3페이지를 하나로. 라우트 통합은 별도
- **FlatLayout 추가 확장** — 실 사용 중 부족한 노드 타입 발견 시 추가
- **Skill Kanban 마무리** — active 세션 필터링 + verify 미완 (별도 handoff 참조)
- **TocNavList NaN 버그** — `/catalog`에서 확인됨

## 컨텍스트

- **PRD**: `docs/2-areas/layout/prds/flatlayout-nav-catalog-prd.md`
- **이전 handoff**: `docs/0-inbox/handoff-2026-04-11-pit-of-success.md` — Visual UI 레이어의 원래 출처
- **주의**: NavLayoutContext는 `src/interactive-os/ui/NavLayoutContext.ts`에 별도 파일 (react-refresh lint 규칙)
- **주의**: TabLayoutWrapper는 TabList 컴포넌트를 사용하지 않음 (이중 engine 문제). 장기적으로 TabList를 FlatLayout 안에서 쓸 수 있도록 engine-free 모드 검토 필요
- **discuss 12요소 End Goal**: ① ui/ 시각 완성 ② ax() 갭 보강 ③ theme+catalog+showcase 통합 ④ FlatLayout 범용 엔진. 이번 세션에서 ①③④ 기반 완성, ②는 ①과 함께 진행 필요

## 다음 행동 제안

`/use /catalog`로 시작하여 개별 컴포넌트의 시각 갭을 파악하고, ax() 스타일링을 시작. pit of success 불변량 덕분에 tone+surface 자유 조합 가능.
