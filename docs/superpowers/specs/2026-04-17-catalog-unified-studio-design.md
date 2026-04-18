---
id: superpowers/specs/2026-04-17-catalog-unified-studio-design
title: 'Catalog 통합뷰 설계 (Unified Studio)'
status: meta
kind: note
created: 2026-04-17
updated: 2026-04-17
summary: '- 작성일: 2026-04-17 - 라우트: `/catalog` 확장 - 목표: 컴포넌트 demo·커버리지·문서를 한 화면에서 보고 편집'
topics: [superpowers]
relates: []
supersedes: []
---
# Catalog 통합뷰 설계 (Unified Studio)

- 작성일: 2026-04-17
- 라우트: `/catalog` 확장
- 목표: 컴포넌트 demo·커버리지·문서를 한 화면에서 보고 편집

## 1. 요약 (SCQA)

- **Situation** — `/ui`(쇼케이스), `/catalog`(CATALOG.md), `/creator`가 각각 분산되어 있음. demo 누락·갭을 한눈에 볼 수단이 없음.
- **Complication** — 커버리지는 `/demo-coverage`, 디자인 축은 `/keyline-audit`, 카탈로그는 Markdown으로 흩어져 동기화가 깨짐.
- **Question** — 한 화면에서 전체 컴포넌트의 상태·demo·갭을 보고 바로 편집할 수 없나?
- **Answer** — `/catalog`를 MasterDetail로 재구성. 좌측 커버리지 매트릭스 + 우측 Storybook 상세. **SSOT = 컴포넌트 `.tsx`·`.demo.tsx` 파일** (스캐너가 파생).

## 2. 구조

- 라우트: `/catalog` (기존 확장, `/ui`·`/creator` 흡수)
- 레이아웃: `ui/composites/MasterDetail`
- 좌측: 커버리지 매트릭스 (`ui/Table`)
- 우측: Storybook 상세 (`ui/composites/TabList` — Preview/Source/Gaps/Docs)

## 3. SSOT & 스캐너

SSOT는 파일 그 자체. 별도 registry/메타 없음.

**`scripts/scanCatalog.mjs`** (Node + ts-morph, dev watch + prebuild)
- 입력: `src/interactive-os/ui/**/*.tsx`
- 출력: `src/pages/catalog/catalog.generated.ts` — `CatalogEntry[]`

```ts
type CatalogEntry = {
  name: string;
  path: string;                      // "ui/Button.tsx"
  demoPath: string | null;
  category: "ui" | "composites" | "items" | "panels" | "cells" | "indicators";
  propsSignature: Record<string, string[]>;  // variant: ["primary","ghost"], ...
  gaps: {
    demoFile: "ok" | "missing";
    branchCoverage: { covered: number; total: number; missing: string[] };
    axAxes: { declared: string[]; missing: string[] };
    aria: "ok" | "partial" | "missing";
    docs: "ok" | "missing";
  };
  jsDoc: string | null;
};
```

파싱 규칙:
- **props 시그니처**: 주 export의 props 타입 (`Props` 또는 `FooProps`)에서 union 리터럴 추출
- **ax 축**: 컴포넌트 내 `ax({...})` 호출의 키 집합
- **aria**: `useAria` / `AriaComponentProps` 임포트 여부
- **docs**: 주 export 바로 위 JSDoc 블록
- **branchCoverage**: `.demo.tsx`의 JSX에서 대상 컴포넌트 호출의 props 조합을 수집해 시그니처와 비교

## 4. 뷰

### 좌측 — 커버리지 매트릭스

- 행: 카테고리 그룹핑된 컴포넌트 (TreeGrid 가능, 기본은 Table + group header)
- 열 6개: Name · Demo · Coverage · ax · ARIA · Docs
- 갭 5열은 `indicators/` 아이콘 (ok/partial/missing) + 툴팁으로 세부 설명
- 상단 요약 바: 전체 갭 카운트, 필터 칩("갭 있는 것만", 카테고리 필터)
- 행 선택은 `useAria` select 축 사용

### 우측 — Storybook 상세

**탭 4개**:

1. **Preview** — `.demo.tsx` 실제 렌더. 없으면 "demo 없음 + 스캐폴드 생성" 버튼.
2. **Source** — `ui/CodeViewer`로 컴포넌트 + demo 소스 나란히 (preset split).
3. **Gaps** — 5축 상세. 누락 분기·축 목록 + 액션 버튼.
4. **Docs** — JSDoc + CATALOG.md 해당 섹션 + "문서 편집" 딥링크.

기존 부품 재사용: `MasterDetail`, `Table`, `TabList`, `CodeViewer`, `indicators/`. 신규 UI 컴포넌트 없음.

## 5. 편집·액션

파일이 SSOT이므로 "편집" = 파일 여는 동작 또는 파일에 쓰는 동작.

| 액션 | 동작 |
|---|---|
| Preview "demo 스캐폴드 생성" | `.demo.tsx` 템플릿 파일 쓰기 → VS Code 딥링크 오픈 |
| Gaps "이 분기 추가" | `.demo.tsx`에 JSX 블록 append (ts-morph) → 오픈 |
| Gaps "ax 축 누락" | 컴포넌트 파일 오픈만 (본체 자동수정은 위험) |
| Docs "편집" | CATALOG.md 앵커로 VS Code 딥링크 |

쓰기는 dev API 경유: `POST /api/catalog/scaffold-demo`, `POST /api/catalog/append-branch`. prod 번들에는 읽기만 노출.

Dev 모드: 스캐너 watch → 파일 저장 시 generated.ts 갱신 → HMR로 매트릭스 자동 재계산.

## 6. 파일 구조

```
src/pages/catalog/
  PageCatalog.tsx              # MasterDetail 진입점
  catalogMatrix.tsx            # 좌측 Table
  catalogDetail.tsx            # 우측 TabList
  catalogStore.ts              # 선택·필터 상태
  catalogTransform.ts          # generated → 뷰 모델
  catalog.generated.ts         # 스캐너 산출물

scripts/
  scanCatalog.mjs              # ts-morph 기반 스캐너

src/server/
  catalogApi.ts                # scaffold-demo / append-branch
```

`/ui`, `/creator`는 `/catalog`로 리다이렉트. CATALOG.md는 Docs 탭 소스로 유지.

## 7. 범위 제한 (YAGNI)

- prod 빌드에서 편집 API 노출 안 함
- ax 축 자동 삽입·컴포넌트 본체 코드 자동 수정 안 함 (리스크)
- 신규 UI 컴포넌트 도입 안 함 — 기존 재사용 실패 시 ui/에 먼저 추가 후 import (CLAUDE.md 제1원칙)

## 8. 테스트

- 스캐너 단위 테스트: 샘플 fixture 컴포넌트 → 예상 `CatalogEntry` 일치
- 통합 테스트: `/catalog` 라우트 행 선택 → 우측 탭 렌더 검증
- scaffold API는 임시 디렉토리에서 파일 쓰기 검증
