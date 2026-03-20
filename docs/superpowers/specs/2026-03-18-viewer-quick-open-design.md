# Viewer Quick Open — Design Spec

> IntelliJ Shift+Shift / VSCode Cmd+P 스타일 파일 검색을 Viewer에 추가

**Date:** 2026-03-18

---

## 동기

Viewer의 TreeGrid 파일 탐색기는 계층 탐색에는 좋지만, 파일명을 알고 있을 때 빠르게 점프할 수 없다. IDE 스타일의 fuzzy file search (Quick Open)를 추가하여 대규모 프로젝트에서도 빠른 파일 접근을 지원한다.

## 접근법

**Combobox behavior 재사용** — `combobox` behavior가 이미 `input + listbox + aria-activedescendant` 패턴을 구현하고 있으므로, Viewer에서 이를 직접 조합하여 Quick Open UI를 구성한다.

### 대안 검토

| 접근법 | 장점 | 단점 | 결정 |
|--------|------|------|------|
| A) Combobox behavior 직접 조합 | 기존 behavior 재사용, ARIA 패턴 정확 | — | **채택** |
| B) Listbox + 순수 HTML input | 단순 | activedescendant 수동 연결 | 기각 |
| C) 새 command-palette behavior | 의미론적 | 과도한 추상화, 표준 패턴 없음 | 기각 |

## 설계

### 트리거

- `Cmd+P` (macOS) / `Ctrl+P` (기타) — Viewer 전역 키바인딩
- Status bar에 검색 버튼 추가 (마우스 접근)

### UI 구조

```
[Backdrop — semi-transparent overlay, click to close]
  [Dialog container — 상단 중앙, max-width: 500px]
    [input role="combobox" — 자동 포커스, placeholder "파일 검색..."]
    [listbox — 최대 12개 결과]
      [option — 파일 아이콘 + 파일명 (bold match) + 상대 경로 (dimmed)]
```

### ARIA 구조

- Container: `<div role="dialog" aria-label="Quick Open">`
- Input: `<input role="combobox" aria-expanded aria-haspopup="listbox" aria-activedescendant>`
- Results: `<div role="listbox">` → `<div role="option">` per result
- `combobox` behavior의 keyMap 재사용 (ArrowDown/Up, Enter, Escape, Home, End)

### 데이터 흐름

1. Viewer 마운트 시 파일 트리 entities에서 `type === 'file'`인 것을 flat list로 추출
2. `useMemo`로 Fuse.js 인덱스 생성 (keys: `['data.name', 'data.path']`, threshold: 0.4)
3. 타이핑 → `fuse.search(query)` → 상위 12개 결과
4. 결과를 NormalizedData store로 변환 (combobox behavior 호환)
5. Enter → 선택된 파일의 path를 Viewer에 전달
6. Viewer가 해당 파일 로드 + 트리에서 해당 노드 포커스

### 키보드 인터랙션

| Key | Action |
|-----|--------|
| `Cmd+P` / `Ctrl+P` | Quick Open 열기 |
| 타이핑 | Fuzzy 검색 |
| `ArrowDown` | 다음 결과 |
| `ArrowUp` | 이전 결과 |
| `Enter` | 파일 선택 후 닫기 |
| `Escape` | 닫기 |
| `Home` | 첫 번째 결과 |
| `End` | 마지막 결과 |

### 스타일

Viewer의 기존 CSS 변수 시스템 사용:
- Backdrop: `background: rgba(0,0,0,0.3)`
- Dialog: `background: var(--bg-elevated)`, `border: 1px solid var(--border-mid)`, `border-radius: var(--radius)`, `box-shadow`
- Input: `font-family: var(--mono)`, `font-size: 10px`
- Results: 파일 아이콘 + 이름 + 경로, focused 항목에 `var(--bg-focus)` + accent border

### 의존성

- `fuse.js` — fuzzy search 라이브러리 추가

## 파일 변경 목록

| 파일 | 변경 |
|------|------|
| `package.json` | `fuse.js` 추가 |
| `src/pages/PageViewer.tsx` | Quick Open 상태 관리, Cmd+P 핸들러, QuickOpen 컴포넌트 |
| `src/pages/PageViewer.css` | 오버레이, 다이얼로그, 검색 결과 스타일 |

## OS Gap 발견

- **Combobox UI가 readOnly** — 현재 텍스트 입력을 지원하지 않음. 이번 구현에서는 Viewer 내부에서 직접 `<Aria behavior={combobox}>` + `<input>`을 조합하여 우회. 범용 Combobox editable 지원은 별도 이터레이션으로 분리.
- **Dialog UI 컴포넌트 부재** — behavior는 있지만 pre-built wrapper 없음. Quick Open에서는 직접 HTML + CSS로 구성.
