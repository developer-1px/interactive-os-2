# showcaseRegistry MD SSOT 전환 — PRD

> Discussion: 2-area/IA/홈페이지/UI 만들기가 혼재 → MD를 유일한 콘텐츠 소스로 통일

## ① 동기

### WHY

- **Impact**: Area MD를 쓰는 행위와 홈페이지 콘텐츠를 만드는 행위가 분리되어 있어, 같은 정보(name, description, usage)를 3곳(MD, registry, mapping)에 수동 동기화해야 한다. 동기화 누락 시 MD와 실제 페이지가 불일치.
- **Forces**: registry가 역사적으로 먼저 만들어졌고 MD가 나중에 합류. render/makeData/testPath는 코드 영역이라 MD로 이동 불가.
- **Decision**: registry를 렌더 전용 4필드(slug, render, makeData, testPath)로 축소. 기각: "MD frontmatter에 testPath 포함" → testPath는 런타임에 ShowcaseDemo가 필요하므로 코드에 있는 게 자연스러움.
- **Non-Goals**: registry 자체를 없애는 것 (render/makeData는 코드 영역), MD 구조 변경, UI 컴포넌트 자체의 수정.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 개발자가 새 UI 완성품을 추가 | registry에 slug+render+makeData+testPath만 등록하고 MD를 작성 | /ui/{slug} 페이지에 데모+테스트+텍스트가 모두 렌더됨 | |
| S2 | 개발자가 컴포넌트 설명을 수정 | MD 파일만 수정 | /ui 페이지와 Landing 카드 모두에 반영됨 | |
| S3 | 기존 registry의 usage/description이 삭제됨 | /ui/listbox 페이지 접근 | MD에서 텍스트를 렌더하므로 기존과 동일하게 보임 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `showcaseRegistry.tsx` 축소 | `ComponentEntry`에서 `name`, `description`, `usage` 필드 제거. 4필드만 남김: `slug`, `render`, `makeData`, `testPath` | |
| `PageLanding.tsx` 수정 | `entry.name` → slug에서 파생 (`slugToMdFile[slug]` 또는 capitalize 함수) | |
| `PageUiShowcase.tsx` 수정 | 사이드바 라벨에서 `entry?.name` → `slugToMdFile[slug]`로 대체 | |
| `apgBySlug` 매핑 생성 | `apg-data.ts`에 `slug → ApgPatternData` 매핑 추가. registry에서 `apg` 필드 제거 | |
| `ApgKeyboardTable.tsx` 수정 | slug lookup을 `apgBySlug`에서 직접 수행 (registry 의존 끊김) | |
| `slugToMdFile` 유지 | 이미 convention 기반(slug→PascalCase). 자동화는 별도 백로그 | |

완성도: 🟡 → 확인 필요

## ③ 인터페이스

> 비-UI 작업. 코드 리팩터링이므로 키보드/마우스 인터랙션 변경 없음.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `ShowcaseDemo slug="listbox"` | registry에서 entry 찾기 | entry.render() + entry.testPath로 데모+테스트 렌더 | ShowcaseDemo는 name/description/usage를 사용 안 함 — render+makeData+testPath만 소비 | 변경 없음 | |
| `ApgKeyboardTable slug="listbox"` | registry에서 entry.apg 찾기 | apgBySlug['listbox']에서 직접 찾기 | APG 데이터는 컴포넌트 렌더와 독립적 — slug만 공유하면 충분 | 동일한 키보드 표 렌더 | |
| Landing 카드 렌더 | `entry.name`으로 라벨 표시 | `slugToMdFile[slug]`로 라벨 파생 | slugToMdFile이 이미 slug→PascalCase 매핑 — name 필드와 동일 값 | 동일한 카드 라벨 | |
| 사이드바 라벨 렌더 | `entry?.name ?? slug`로 표시 | `slugToMdFile[slug] ?? slug`로 표시 | 같은 매핑 소스, 같은 결과 | 동일한 사이드바 | |
| ui-showcase-coverage.test | `entry.slug`, `entry.render`, `entry.makeData` 사용 | 변경 없음 | 테스트가 name/description/usage를 참조하지 않음 | 테스트 통과 유지 | |

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| slug에 대응하는 MD 파일이 없는 컴포넌트 (예: tooltip — MD 있지만 데모 없음) | Tooltip은 registry에 없음, MD만 존재 | engine 밖 독립 컴포넌트는 registry 없이 MD만으로 페이지 가능 | MdPage가 MD를 렌더하되 ShowcaseDemo 없으면 데모 섹션 비어있음 | 현행 유지 | |
| slugToMdFile에 없는 slug | `slugToMdFile[slug]`가 undefined | convention 밖의 매핑은 명시적이어야 안전 | fallback: slug 자체를 capitalize하여 표시 | 라벨이 깨지지 않음 | |
| apgBySlug에 없는 slug (kanban 등 APG 비표준) | entry.apg가 undefined | APG 표준이 아닌 컴포넌트는 키보드 표가 없는 것이 정확 | ApgKeyboardTable이 null 반환 | 현행 유지 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② apgBySlug | ✅ 준수 | — | |
| P2 | never barrel export (CLAUDE.md) | ② 전체 | ✅ 준수 — 새 barrel 없음 | — | |
| P3 | 테스트: 계산은 unit, 인터랙션은 통합 (CLAUDE.md) | ② 테스트 변경 없음 | ✅ 준수 | — | |
| P4 | 디자인은 기능 (feedback) | ② Landing 카드 라벨 | ✅ 준수 — 시각적 변경 없음 | — | |
| P5 | CSS 모든 수치는 토큰 (feedback) | 해당 없음 | ✅ | — | |
| P6 | 설계 원칙 > 사용자 요구 (feedback) | ② registry 축소 | ✅ MD SSOT 원칙에 부합 | — | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | `ComponentEntry` 타입 | 타입을 참조하는 외부 코드가 있으면 컴파일 에러 | 낮 | `typeof components[number]`로 참조하는 곳만 (Landing, test) — 필드 제거해도 참조 코드가 해당 필드를 안 씀 | |
| E2 | `showcaseRegistry.tsx` 크기 감소 | usage 문자열 ~200줄 제거 → 번들 축소 | 긍정적 | 허용 | |
| E3 | `ApgKeyboardTable.tsx` import 변경 | registry 대신 apg-data에서 import | 낮 | 단순 import 변경 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| F1 | MD 파일 구조/내용 변경 | Non-Goals | 이번 PRD는 registry 축소만 — MD 콘텐츠 개선은 별도 | |
| F2 | render/makeData를 MD로 이동 시도 | ⑤ Forces | JSX 함수는 코드 영역, MD에 넣으면 빌드 복잡도 폭증 | |
| F3 | slugToMdFile 자동화 | Non-Goals | convention 자동화는 별도 백로그. 이번엔 수동 매핑 유지 | |
| F4 | UI 컴포넌트 자체 수정 | Non-Goals | 리팩터링 범위를 registry+소비자로 한정 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | registry에 name/description/usage 필드가 없는 상태에서 타입 체크 통과 | `tsc --noEmit` 성공 | |
| V2 | S3 | /ui/listbox 페이지 접근 시 데모+테스트+텍스트 모두 렌더 | 기존과 동일한 렌더 결과 | |
| V3 | S2 | Landing 페이지의 컴포넌트 카드에 이름 표시 | slugToMdFile 기반 라벨이 기존 entry.name과 동일 | |
| V4 | ④경계2 | slugToMdFile에 없는 slug에서 라벨 fallback | slug capitalize로 표시, 에러 없음 | |
| V5 | S3 | 기존 테스트 전체 통과 | `pnpm test` 전체 pass | |
| V6 | E3 | ApgKeyboardTable slug="listbox" 렌더 | 기존과 동일한 키보드 표 | |

완성도: 🟡

---

**전체 완성도:** 🟡 7/8 (사용자 확인 대기)
