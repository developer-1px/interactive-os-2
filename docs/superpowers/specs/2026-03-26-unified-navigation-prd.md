# 통합 네비게이션 — PRD

> Discussion: 홈페이지(routeConfig)와 area viewer의 의미 과적 해소. ActivityBar 상단=Apps, 하단=Internals(contents/_meta.yaml 자동). 중복 라우트 제거.

## ① 동기

### WHY

- **Impact**: 같은 콘텐츠에 두 경로 존재 (`/internals/axis/navigate` ≠ `/internals/area/axis/navigate`). ActivityBar가 수동 관리. contents/ tree가 깊어 조망 어려움.
- **Forces**: contents/_meta.yaml이 이미 레이어 순서/매핑을 선언 vs routeConfig가 동일 정보를 수동 중복. 앱 페이지는 contents/ 외부.
- **Decision**: routeConfig의 레이어 그룹 제거. ActivityBar 하단(Internals)을 _meta.yaml에서 자동 생성. AreaSidebar는 선택된 레이어 내부만 표시. 기각: ActivityBar 제거(앱 전환 수단 없어짐), 역할만 변경(트리 깊이 미해소).
- **Non-Goals**: 앱 페이지 구조 변경. SSG 전환. contents/ 내용 수정.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 사용자가 홈페이지 접속 | ActivityBar 확인 | 상단에 Apps(CMS, UI, Viewer 등), 하단에 Internals(Store, Engine, Axis 등) 분리 표시 | |
| S2 | ActivityBar에서 "Axis" 클릭 | 네비게이션 | `/internals/axis`로 이동, 사이드바에 axis 내 항목(navigate, select...) 표시 | |
| S3 | 사이드바에서 "navigate" 클릭 | 네비게이션 | `/internals/axis/navigate`로 이동, navigate.md 렌더링 | |
| S4 | contents/에 새 레이어 추가 + _meta.yaml 갱신 | 앱 재시작 | ActivityBar에 새 레이어 자동 표시 | |
| S5 | `/internals/area/axis/navigate` 접속 시도 | 라우트 매칭 | 존재하지 않음 (제거됨). `/internals/axis/navigate`가 유일한 경로 | |
| S6 | ActivityBar에서 "Overview" 클릭 | 네비게이션 | `/internals/overview`로 이동, overview.md 렌더링. 사이드바 없음 (L3 없으므로) | |

완성도: 🟡

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/AppShell.tsx` 수정 | internalNavItems를 routeConfig 대신 contents/_meta.yaml에서 자동 생성 | |
| `src/routeConfig.ts` 제거 또는 apps 전용으로 축소 | 레이어 그룹 전부 제거. apps만 남기거나 AppShell로 인라인 | |
| `src/router.tsx` 수정 | `/internals/area/*` 제거. `/internals/*` catch-all로 PageAreaViewer 연결 | |
| `src/SidebarLayout.tsx` 수정 | routeConfig 의존 제거. URL에서 레이어 추출 → _meta.yaml 기반 사이드바 | |
| `src/pages/PageAreaViewer.tsx` 수정 | `/internals/area/` prefix strip → `/internals/` prefix strip | |
| `src/pages/AreaSidebar.tsx` 수정 | 전체 트리 → 선택된 레이어의 L3 항목만 표시 | |

### 라우트 구조 변경

**Before:**
```
/internals/store/inspector        ← routeConfig
/internals/axis/navigate          ← routeConfig
/internals/area/axis/navigate     ← Area viewer (중복)
/internals/area/overview          ← Area viewer
```

**After:**
```
/internals/overview               ← contents/overview.md
/internals/axis                   ← contents/axis.md (L2)
/internals/axis/navigate          ← contents/axis/navigate.md (L3)
/internals/store                  ← contents/store.md (L2)
/internals/store/createStore      ← contents/store/createStore.md (L3)
```

### ActivityBar 아이콘 매핑

contents/_meta.yaml의 레이어에 아이콘을 매핑해야 한다. 두 가지 방안:

A) _meta.yaml에 icon 필드 추가 → YAML에 코드 의존성 생김
B) AppShell에 레이어→아이콘 매핑 객체 유지 → 새 레이어 추가 시 코드 수정 필요하지만 빈도 낮음

**선택: B** — 아이콘은 UI 관심사이므로 코드에 남긴다. 레이어 추가는 드물다.

```ts
const LAYER_ICONS: Record<string, LucideIcon> = {
  overview: BookOpen,
  vision: Lightbulb,
  store: Database,
  engine: Cog,
  primitives: Box,
  axis: Axe,
  pattern: Layers,
  plugins: Puzzle,
  ui: Component,
  devtools: Wrench,
}
```

완성도: 🟡

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ActivityBar "Axis" 클릭 | 다른 페이지 활성 | `/internals/axis`로 navigate | ActivityBar 항목의 path가 `/internals/{layer}`이므로 | axis L2 문서 + axis 사이드바 표시 | |
| 사이드바 "navigate" 클릭 | axis L2 표시 | `/internals/axis/navigate`로 navigate | 사이드바 항목 클릭이 `/{layer}/{name}` 경로를 생성하므로 | navigate L3 문서 렌더링 | |
| URL `/internals/axis` 직접 접속 | — | PageAreaViewer가 `axis`를 추출 | URL에서 `/internals/` 제거 → `axis` = L2 MD 경로 | axis.md 렌더링 + axis 사이드바 | |
| URL `/internals/axis/navigate` 직접 접속 | — | PageAreaViewer가 `axis/navigate`를 추출 | `/internals/` 제거 → `axis/navigate` = L3 MD 경로 | navigate.md 렌더링 + axis 사이드바 | |
| _meta.yaml에 없는 레이어 URL 접속 | — | 매칭 실패 | `/internals/*` catch-all이지만 MD 없음 | "Not found" 표시 | |

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| overview, vision 같은 L3 없는 항목 | L2 MD만 존재 | 하위 항목이 없으면 사이드바가 불필요 | 사이드바 없이 전체 폭으로 L2 문서 렌더링 | 정상 | |
| LAYER_ICONS에 없는 레이어가 _meta.yaml에 추가 | 아이콘 미매핑 | 아이콘 없어도 네비게이션은 동작해야 함 | 기본 아이콘(FileText 등) fallback | 정상 + 콘솔 경고 | |
| `/internals/theme`는 앱 페이지 | 현재 internals prefix 사용 중 | theme는 contents가 아닌 앱 페이지 | apps 섹션에서 처리. `/internals/*` catch-all 앞에 명시 라우트 | 정상 | |
| devtools가 `/devtools/*`인데 다른 레이어는 `/internals/*` | prefix 불일치 | 모든 contents 레이어를 `/internals/*` 아래로 통일 | devtools도 `/internals/devtools/*`로 | 일관성 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 레이어 = 라우트 그룹 (feedback) | ② 라우트 구조 | 준수 — `/internals/{layer}/*` | — | |
| P2 | 원자적 restructure (feedback) | 전체 실행 | 준수 — 한 세션 | — | |
| P3 | 선언적 OCP (feedback) | ② _meta.yaml 자동 생성 | 준수 — 새 레이어 = _meta.yaml에 추가만 | — | |
| P4 | 같은 역할 = 같은 디자인 (feedback) | ② ActivityBar | 준수 — 모든 internals 항목 동일 렌더링 | — | |
| P5 | SSOT (contents/ = 유일한 진실) | ② routeConfig 축소 | 준수 — 레이어 목록이 _meta.yaml 단일 소스 | — | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | `/internals/area/*` 라우트 제거 | 기존 URL 깨짐 | 중 | 내부 앱이라 외부 링크 없음. `/internals/area/*` → `/internals/*` redirect 추가 가능 | |
| E2 | `/devtools/*` → `/internals/devtools/*` | devtools URL 변경 | 중 | 일관성을 위해 변경. 기존 경로 redirect | |
| E3 | routeConfig 축소/제거 | routeConfig import하는 코드 깨짐 | 높 | AppShell, SidebarLayout 동시 수정 | |
| E4 | AreaSidebar 전체 트리 → 레이어별 | 전체 조망 뷰 사라짐 | 낮 | Overview 페이지가 전체 조망 역할 (L2 문서들이 이미 이 역할) | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| F1 | _meta.yaml에 아이콘/컴포넌트 참조 삽입 | P3 선언적 OCP | YAML은 순수 데이터만. UI 매핑은 코드에서 | |
| F2 | 앱 페이지를 contents/로 이동 | discuss 합의 | 앱 페이지는 수동 관리 유지 | |
| F3 | `/internals/area/*` 라우트 유지 | 과적 해소가 목적 | 제거해야 중복 해소 | |
| F4 | contents/ MD 파일 내용 수정 | PRD 범위 | 구조 변경만, 내용 변경 없음 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | ActivityBar에 Apps/Internals 분리 확인 | separator로 구분, 상단 apps 하단 internals | |
| V2 | S2 | ActivityBar "Axis" 클릭 | `/internals/axis`로 이동, axis.md 렌더링 | |
| V3 | S3 | 사이드바 "navigate" 클릭 | `/internals/axis/navigate`로 이동, navigate.md 렌더링 | |
| V4 | S5 | `/internals/area/axis/navigate` 접속 | 404 또는 redirect | |
| V5 | S6 | "Overview" 클릭 | `/internals/overview`, 사이드바 없거나 빈 사이드바 | |
| V6 | E2 | `/internals/devtools/rec` 접속 | rec.md 렌더링 | |
| V7 | 전체 | `pnpm dev` 빌드 | 에러 없음 | |
| V8 | 전체 | `pnpm typecheck` | 에러 없음 | |
| V9 | 전체 | `pnpm test` | 전체 통과 | |

완성도: 🟡

---

**전체 완성도:** 🟡 8/8 (AI 초안)
