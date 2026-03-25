# showcaseRegistry 의존성 트리 — 2026-03-25

## 배경

MD SSOT 전환을 위해 `showcaseRegistry.tsx`의 각 필드가 어디서 소비되는지 파악하여, 어떤 필드를 제거할 수 있고 어떤 필드가 제약인지 확정한다.

## 소비자 4곳 + 테스트 1곳

| 소비자 | import 대상 | 사용하는 필드 |
|--------|-------------|--------------|
| **ShowcaseDemo.tsx** | `components` | `slug`, `render`, `makeData`, `testPath` |
| **PageLanding.tsx** | `components` | `slug`, `name`, `render`, `makeData`, `testPath` |
| **PageUiShowcase.tsx** | `components` | `slug`, `name` (사이드바 라벨) |
| **ApgKeyboardTable.tsx** | `components` | `slug`, `apg` |
| **ui-showcase-coverage.test** | `components` | `slug`, `render`, `makeData` |

## 필드별 의존성 분석

| 필드 | 소비자 수 | MD 대체 가능? | 비고 |
|------|-----------|--------------|------|
| `slug` | 5 | ❌ | 라우트 키. registry에 남아야 함 |
| `render` | 3 | ❌ | JSX 함수. MD로 갈 수 없음 |
| `makeData` | 3 | ❌ | 데이터 팩토리. 코드 영역 |
| `testPath` | 2 | ⚠️ | ShowcaseDemo + Landing. MD frontmatter로 이동 가능하나 ShowcaseDemo가 런타임에 필요 |
| `name` | 2 | ✅ | Landing 카드 + Sidebar 라벨. slug에서 파생 가능 (capitalize) 또는 MD에서 추출 |
| `description` | 1 | ✅ | showcaseRegistry에 있지만 **직접 소비자 0** (ApgKeyboardTable의 description은 apg.entries[].description) |
| `usage` | 0 | ✅ | **소비자 0.** MD에만 있으면 됨 |
| `apg` | 1 | ⚠️ | ApgKeyboardTable만 사용. MD `<ApgKeyboardTable slug="x" />`로 이미 간접 소비 |

## 결론: 제거 가능한 필드

### 즉시 제거 (소비자 0)
- **`usage`** — MD에만 존재하면 됨. registry의 usage 문자열은 사용되지 않음
- **`description`** — registry에서 직접 소비하는 곳 없음. PageUiShowcase에서도 안 씀

### 파생 가능 (소비자 있지만 대체 가능)
- **`name`** — `slug → capitalize` 또는 별도 매핑으로 대체. Landing과 Sidebar 2곳
- **`apg`** — ApgKeyboardTable이 slug 기반 lookup을 이미 지원. registry 대신 apg-data.ts에서 직접 slug 매핑하면 분리 가능

### 제거 불가 (코드 영역)
- `slug`, `render`, `makeData`, `testPath`

## 다음 행동

- registry를 `slug + render + makeData + testPath` 4필드로 축소
- name/description/usage는 MD에서만 관리
- apg는 별도 매핑(`apgBySlug`)으로 분리하면 registry 의존 끊김
- `slugToMdFile` 매핑은 convention(`slug → PascalCase`) 자동화 검토
