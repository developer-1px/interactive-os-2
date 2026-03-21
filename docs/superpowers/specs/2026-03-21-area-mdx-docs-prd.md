# Area MDX 문서 체계 — PRD

> Discussion: 설계·구현 도구로서의 Area 문서 체계. MDX 단일 소스로 문서+데모 공존. L2(레이어 주기율표) → L3(모듈 스펙+데모). ⬜=백로그. 최종적으로 공식 홈페이지로 전환 가능한 구조.

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| 1 | PRD 32개가 specs/에 날짜순 flat list로 쌓여있음 | `specs/2026-03-21-value-axis-prd.md` (날짜+이름, 레이어 정보 없음) | 새 축을 기획할 때 기존 축 전체를 파악하려 함 | 파일을 하나씩 열어봐야 하고 전체상 파악 불가 | — (변화 없음) | |
| 2 | 구현 완료 후 PRD는 소비됨 | PRD: `상태: 🟢` (완료) | 다음 feature 기획 시 지금까지 만든 것의 전체 목록·관계·갭을 보려 함 | 누적된 결과물 지도가 없어서 기억에 의존 | — (누적 안 됨) | |
| 3 | plugin-showcase.md가 Area 문서의 프로토타입으로 존재 | `docs/2-areas/plugin-showcase.md` (순수 md, 5개 페이지 표) | 다른 레이어(axes, patterns, plugins)도 같은 형태로 정리하려 함 | 포맷·체계가 정의되지 않아 확장 불가 | — | |
| 4 | 데모 페이지 41개가 tsx로 존재하지만 문서와 분리됨 | `src/pages/PageSlider.tsx` (데모만, 스펙·관계 정보 없음) | 스펙을 읽고 바로 검증하려 함 | 문서(md)와 데모(tsx)를 따로 열어야 함 | — | |

상태: 🟢

## 2. 인터페이스

> 이 PRD의 인터페이스는 키보드 UI가 아니라 **문서 작성·조회 워크플로우**.

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| 구현 완료 후 Area MDX 갱신 | Area MDX에 해당 모듈 행이 ⬜ | 모듈이 구현됨 | ⬜ → 🟢로 변경, 스펙·데모 import 추가 | 해당 행 상태=🟢, 데모 컴포넌트 참조 추가 | |
| Viewer에서 레이어 선택 | routeConfig의 Area 그룹 | — | L2 MDX 렌더링 (주기율표) | — | |
| L2에서 모듈 클릭 | L2 표의 모듈 행 | — | L3 MDX로 이동 (스펙+데모) | — | |
| 새 모듈 발견 시 빈칸 추가 | Area MDX에 해당 모듈 없음 | 구조적으로 있어야 할 모듈 발견 | ⬜ 행 추가 | 새 행: 이름+⬜ | |
| 의도적 부재 결정 | Area MDX에 ⬜ 행 존재 | 범위 밖으로 판단 | ⬜ → — 로 변경 | 해당 행 상태=—, 이유 기록 | |

| `/area` 스킬 실행 (retro 후) | git diff + Area MDX 현재 상태 | 구현 사이클 완료, retro 완료 | ①구현 결과에서 해당 레이어 Area MDX 갱신 ②⬜→🟢 전환 ③새 빈칸 발견→백로그 | Area MDX 갱신됨, 새 ⬜ 발견 시 BACKLOGS.md에 추가 | |

### 파이프라인 위치

```
Discussion → PRD → Plan → 실행 → retro(갭 감지) → /area(누적)
```

- **retro**: PRD vs 구현 결과 **비교** → 갭 감지 (PRD ← 구현)
- **/area**: 구현 결과를 Area MDX에 **누적** → 전체상 갱신 (구현 → Area)

### 인터페이스 체크리스트

이 PRD는 비-UI 작업이므로 키보드 체크리스트 대신 워크플로우 체크리스트:
- [x] 구현 완료 → Area 갱신 경로 (`/area` 스킬)
- [x] 새 빈칸(⬜) 추가 경로
- [x] 빈칸 → 의도적 부재(—) 전환 경로
- [x] Viewer에서 L2 → L3 탐색 경로
- [x] retro 후 `/area`로 Area 갱신 트리거

상태: 🟢

## 3. 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `docs/2-areas/overview.mdx` | L1: 시스템 전체. 레이어 목록 + 의존 방향 다이어그램 | |
| `docs/2-areas/{layer}.mdx` | L2: 레이어별 주기율표. 모듈 목록 + 관계 + 🟢/⬜/— 상태 | |
| `docs/2-areas/{layer}/{module}.mdx` | L3: 모듈 상세. 스펙 + 관계 + 데모 컴포넌트 import | |
| Vite MDX 설정 | `@mdx-js/rollup` 플러그인 추가 | |
| Viewer MDX 렌더링 라우트 | Area MDX를 Viewer 내에서 렌더링하는 경로 | |
| `/area` 스킬 | retro 후 실행. git diff → Area MDX 갱신 (⬜→🟢, 새 ⬜ 발견, L3 생성) | |

### 폴더 구조

```
docs/2-areas/
  overview.mdx              ← L1
  core.mdx                  ← L2
  axes.mdx                  ← L2
  axes/
    navigate.mdx             ← L3
    select.mdx
    activate.mdx
    expand.mdx
    trap.mdx
    value.mdx
    trigger-popup.mdx        ← ⬜ (빈칸)
  patterns.mdx               ← L2
  patterns/
    listbox.mdx              ← L3
    ...
  plugins.mdx                ← L2
  hooks.mdx                  ← L2
  ui.mdx                     ← L2
  pages.mdx                  ← L2
```

- L2 파일과 L3 폴더가 같은 레벨에 공존 (`axes.mdx` + `axes/`)
- index.mdx 방식 불가 — 에디터 탭에서 구분 안 됨. 파일명 = 식별자 원칙

### 데모 컴포넌트 분리

기존 Page 파일에서 **데모(인터랙션) 부분만 별도 컴포넌트로 export**한다.

```
Before: PageSlider.tsx = 텍스트(설명) + 데모(인터랙션) + 레이아웃
After:  axes/value.mdx  = 텍스트(설명) + 레이아웃 (MDX가 담당)
        SliderDemo.tsx   = 순수 인터랙션만 (컴포넌트)
```

MDX가 텍스트 컨텐츠를 대체하므로 데모 컴포넌트의 비용이 줄어든다.

### L2 Area MDX 구조 (레이어 주기율표)

```mdx
# Axes

> 키맵 원자. 6개 축이 behavior를 조합하는 빌딩블록.

| 축 | 점유 키 | 사용 패턴 | 상태 |
|---|---|---|---|
| navigate | ↑↓←→ Home End | listbox, tree, grid... | 🟢 |
| select | Space, Shift+↑↓ | listbox(multi) | 🟢 |
| activate | Enter, Space | listbox, menu, switch... | 🟢 |
| expand | ←→ | tree, accordion... | 🟢 |
| trap | Escape | dialog, alertdialog | 🟢 |
| value | ↑↓←→ min/max/step | slider, spinbutton | 🟢 |
| **trigger↔popup** | **?** | **combobox, tooltip** | **⬜** |

## 관계
...

## 데모
import { AxisOverview } from '../../src/pages/axis/AxisOverview'
<AxisOverview />
```

### L3 모듈 MDX 구조

```mdx
# navigate()

> 키보드 네비게이션 축. ↑↓←→ Home End.

## 스펙
| 키 | 동작 | 조건 |
|---|---|---|
| ↑ | focusPrev | — |
| ↓ | focusNext | — |
| ... | ... | ... |

## 관계
- select와 조합 → listbox multi-select
- expand와 조합 → tree navigation
- value와 키 충돌 → ←→ 겹침 (chain of responsibility로 해결)

## 데모
import { NavigateDemo } from '../../src/pages/axis/NavigateDemo'
<NavigateDemo />

## 관련 PRD
- [behavior-axis-decomposition-prd](../superpowers/specs/2026-03-20-behavior-axis-decomposition-prd.md)
```

### 3상태 시스템

| 상태 | 의미 | 표기 |
|------|------|------|
| 🟢 | 구현됨. 스펙+데모 있음 | 주기율표 셀 채움 |
| ⬜ | 빈칸. 구조적으로 있어야 하지만 미구현 = 백로그 | 셀 이름만, 내용 없음 |
| — | 의도적 부재. 범위 밖 | 이유 기록 |

### 레이어별 Area MDX 목록

| 파일 | 레이어 | 모듈 수 (예상) |
|------|--------|--------------|
| `overview.mdx` | L1 전체 | — |
| `core.mdx` | core | 2 (createStore, createCommandEngine) |
| `axes.mdx` | axes | 6+1⬜ |
| `patterns.mdx` | behaviors | 18 |
| `plugins.mdx` | plugins | 8 |
| `hooks.mdx` | hooks | 6 |
| `ui.mdx` | ui | 14 |
| `pages.mdx` | pages/showcase | 41 |

상태: 🟢

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| 🟢 모듈이지만 데모 컴포넌트가 아직 없을 때 | L3 MDX에 import 대상 없음 | 스펙+개념 소개만 표시, 데모 섹션 없음 | MDX 정상 렌더링 | |
| 🟢 모듈이지만 L3 MDX가 아직 없을 때 | L2 표에 🟢 행 존재, L3 파일 없음 | 최소 L3 MDX 생성: 제목 + 한 줄 개념 소개 + TODO 목록 | L3 파일 존재, 내용 최소 | |
| ⬜ 빈칸 모듈 | L2 표에 ⬜ 행 | L3 MDX 생성: 제목 + "미구현" + 개념만 소개 + 왜 필요한지 | L3 파일 존재, 개념+동기만 | |
| 기존 tsx 데모 페이지와 MDX의 공존 | routeConfig에 tsx 페이지 41개 | MDX 마이그레이션 전까지 tsx 페이지 유지. MDX 라우트는 별도 경로 | 두 시스템 공존 | |
| MDX import 경로 오류 | 데모 컴포넌트 경로 변경 | 빌드 에러 발생 | — (빌드 실패) | |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| 1 | 기존 tsx 데모 페이지를 한번에 MDX로 마이그레이션 | 41개 페이지 일괄 변환은 리스크 큼. 점진적 전환 | |
| 2 | Area MDX에 구현 코드(로직)를 직접 작성 | MDX는 배치와 서술만. 컴포넌트는 별도 tsx | |
| 3 | PRD(L4)를 MDX로 변환 | PRD는 LLM 전용 실행 명세. md 유지 | |
| 4 | 홈페이지 프레임워크(Docusaurus 등) 지금 도입 | 현재 목적은 설계·구현 도구. 홈페이지는 최종 형태 | |
| 5 | Area MDX에서 디자인(스타일링) 작업 | 지금은 구조와 내용에 집중. 디자인은 홈페이지 전환 시 | |
| 6 | L3 MDX를 빈 파일로 두기 | 최소한 제목 + 개념 소개는 있어야 함. 빈 파일은 "있지만 없는" 상태 | |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | axes.mdx를 Viewer에서 열기 | 6개 축 주기율표 + ⬜ trigger↔popup 빈칸이 렌더링됨 | |
| 2 | axes/navigate.mdx를 Viewer에서 열기 | 스펙 표 + 관계 섹션 + NavigateDemo 라이브 데모가 한 화면에 보임 | |
| 3 | Vite 빌드 시 MDX 파일 정상 컴파일 | 빌드 에러 없음 | |
| 4 | 새 축 구현 후 axes.mdx에 ⬜→🟢 갱신 | 주기율표에서 해당 축이 🟢로 변경되고 L3 링크 활성화 | |
| 5 | LLM이 Area MDX를 읽고 프로젝트 전체상 파악 | MDX를 md처럼 읽어서 레이어·모듈·관계·갭 파악 가능 | |
| 6 | ⬜ 빈칸 모듈의 L3 열기 | 개념 소개 + "미구현" + 왜 필요한지가 보임. 빈 페이지가 아님 | |

상태: 🟢

---

**전체 상태:** 🟢 6/6
