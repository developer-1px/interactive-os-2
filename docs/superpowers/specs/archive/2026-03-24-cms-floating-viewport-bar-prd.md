# CMS Floating Viewport Bar — PRD

> Discussion: 상단 40px CmsTopToolbar 제거, viewport+present를 floating bar(상단 중앙)로, 햄버거/locale/sheet을 사이드바 상단으로 이동. 캔버스(홈페이지)가 더 잘 보이게.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | CMS에서 홈페이지를 편집 중 | 상단 40px toolbar가 항상 보임 | 캔버스 세로 공간이 40px 줄어들고, toolbar가 시선을 분산시킴 | ✅ TopToolbar 제거, padding-top으로 전체 높이 확보 |
| M2 | viewport 크기를 전환하려 할 때 | viewport 버튼이 toolbar 우측 끝에 있음 | 좌우 비대칭 레이아웃에서 버튼 위치가 부자연스러움 | ✅ floating bar 상단 중앙 배치 |
| M3 | 햄버거/locale/sheet 버튼 | 상단 toolbar에 viewport 버튼과 혼재 | 성격이 다른 도구(뷰 설정 vs 콘텐츠 설정)가 같은 bar에 있어 인지 부하 | ✅ sidebar header로 분리 |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `CmsViewportBar.tsx` | floating viewport bar 컴포넌트 (viewport×3 + present). 상단 중앙 fixed 배치. 기존 CmsFloatingToolbar와 동일한 pill 스타일 | ✅ `CmsViewportBar.tsx::CmsViewportBar` |
| `CmsTopToolbar.tsx` 삭제 | 기존 상단 toolbar 컴포넌트 제거 | ✅ git rm 완료 |
| `CmsLayout.tsx` 수정 | TopToolbar 제거, ViewportBar 추가, 햄버거/locale/sheet props를 CmsSidebar로 이동 | ✅ `CmsLayout.tsx::CmsLayout` |
| `CmsSidebar.tsx` 수정 | 상단 헤더 영역 추가: 햄버거 + locale select + sheet 토글 | ✅ `CmsSidebar.tsx::CmsSidebar` |
| `cms.css` 수정 | `.cms-top-toolbar` 삭제, `.cms-viewport-bar` 추가 (floating), `.cms-sidebar__header` 추가 | ✅ `cms.css` |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| viewport bar에서 모바일/태블릿/데스크톱 클릭 | 현재 viewport 크기 | 해당 크기로 전환 | viewport 프리뷰 기능 유지 — 기존 동작과 동일 | `.cms-viewport`에 max-width 적용 | ✅ 일치 |
| Present 버튼 클릭 | 편집 모드 | 프레젠트 모드 진입 | 전체화면 프리뷰 — 기존 동작과 동일 | CmsPresentMode 오버레이 렌더링 | ✅ 일치 |
| 사이드바 헤더의 햄버거 클릭 | 드로어 닫힘 | 드로어 열림 | ActivityBar 접근 — 기존 동작과 동일 | CmsHamburgerDrawer 렌더링 | ✅ 일치 |
| 사이드바 헤더의 locale select 변경 | 현재 locale | 선택한 locale로 전환 | 다국어 편집 — 기존 동작과 동일 | 캔버스+사이드바 locale 반영 | ✅ 일치 |
| 사이드바 헤더의 sheet 토글 클릭 | sheet 열림/닫힘 | 토글 | i18n 일괄 편집 — 기존 동작과 동일 | CmsI18nSheet 토글 | ✅ 일치 |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 프레젠트 모드에서 viewport bar | presenting=true | 프레젠트 모드는 chrome-free, 모든 도구 숨김 | viewport bar 숨김 (hidden prop) | CRUD bar와 동일하게 hidden | ✅ `if (hidden) return null` |
| 좁은 화면에서 viewport bar + CRUD bar 겹침 | 화면 높이 < ~200px | 상단 bar와 하단 bar 사이 공간 부족 | 겹침 허용 (극단적 화면이므로 별도 대응 불필요) | z-index로 viewport bar가 위 | ✅ z-index: 200 |
| 사이드바 너비 최소(80px)일 때 헤더 버튼 3개 | sidebar width=80px | 버튼이 좁은 공간에 들어가야 함 | 아이콘만 표시 (텍스트 없음), locale select는 짧은 코드(ko, en) | 레이아웃 깨지지 않음 | ✅ flex-shrink:0 + flex:1 locale |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② CmsViewportBar.tsx | ✅ 준수 | — | ✅ 일치 |
| P2 | 하나의 앱 = 하나의 store (memory) | ③ 사이드바에 locale/sheet 이동 | ✅ 준수 — state는 CmsLayout에서 prop으로 전달, store 분리 아님 | — | ✅ 일치 |
| P3 | 디자인 변경 불가 = CMS 핵심 가치 (memory) | 전체 | ✅ 준수 — UI 크롬 변경이지 편집 기능 변경 아님 | — | ✅ 일치 |
| P4 | 인터랙션은 behavior+plugin에서 도출 (memory) | ② viewport bar | ✅ 준수 — viewport bar는 React 상태 전환, behavior 불필요 (CRUD가 아님) | — | ✅ 일치 |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | CmsTopToolbar.tsx 삭제 | 이 파일을 import하는 곳(CmsLayout만) 수정 필요 | 낮 | CmsLayout에서 import 제거 | ✅ 대응됨 |
| S2 | CmsSidebar에 props 추가 | 기존 sidebar 인터페이스 변경 | 낮 | 새 props 추가만, 기존 props 변경 없음 | ✅ 대응됨 |
| S3 | css `.cms-top-toolbar` 제거 | 다른 곳에서 이 클래스 참조 시 깨짐 | 낮 | CmsTopToolbar에서만 사용, 영향 없음 | ✅ 대응됨 |
| S4 | floating bar가 캔버스 콘텐츠 위에 겹침 | 상단 콘텐츠가 bar 뒤에 가려질 수 있음 | 중 | 캔버스에 `padding-top: ~44px` 추가하여 여백 확보 | ✅ padding-top: 48px 적용 |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| N1 | viewport bar에 behavior/useAria 적용 | ⑤ P4 | viewport 전환은 React 상태 토글, interactive-os behavior가 아님. CRUD toolbar과 성격 다름 | ✅ 준수 |
| N2 | locale/sheet state를 sidebar 내부 state로 이동 | ⑤ P2 | 하나의 앱 = 하나의 store. state는 CmsLayout에서 관리, sidebar는 prop만 받음 | ✅ 준수 |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | CMS 페이지 로드 | 상단 40px bar 없음, 캔버스가 전체 높이 사용 | ✅ 시각 확인 (UI chrome 리팩토링, 자동 테스트 불필요) |
| V2 | ①M2 | viewport bar가 상단 중앙에 floating | pill 형태로 화면 상단 중앙에 위치 | ✅ css: fixed, top:12px, left:50%, translateX(-50%) |
| V3 | ③ viewport 전환 | 모바일 버튼 클릭 | viewport가 375px로 전환 | ✅ 기존 로직 유지 |
| V4 | ③ present | present 버튼 클릭 | 프레젠트 모드 진입 | ✅ 기존 로직 유지 |
| V5 | ③ 사이드바 햄버거 | 사이드바 헤더의 햄버거 클릭 | 드로어 열림 | ✅ 기존 로직 유지 |
| V6 | ③ 사이드바 locale | locale select 변경 | 캔버스 locale 반영 | ✅ 기존 로직 유지 |
| V7 | ④ 프레젠트 모드 | presenting=true일 때 | viewport bar 숨김 | ✅ hidden prop → return null |
| V8 | ④ 좁은 사이드바 | sidebar width=80px | 헤더 버튼 깨지지 않음 | ✅ CSS flex-shrink/flex 대응 |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
