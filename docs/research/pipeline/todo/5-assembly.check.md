# Pipeline Check — todo

- **Timestamp**: 2026-04-18T07:33:39.306Z
- **Declared (Stage 3)**: 9 parts
- **Source files (Stage 5)**: PagePipelineView.tsx, PageTodo.tsx, todoContext.ts, todoDefinePage.ts, todoStore.ts, todoWidgets.tsx
- **Verdict**: ❌ FAIL

## A. 선언 ↔ Import 일치

❌ 미import 4건:

  - **PanelHeader** (role: header) — Stage 3에서 선언했으나 import 없음
  - **ListBox** (role: list) — Stage 3에서 선언했으나 import 없음
  - **ListItem** (role: list-item) — Stage 3에서 선언했으나 import 없음
  - **Checkbox** (role: toggle) — Stage 3에서 선언했으나 import 없음

## B. 수동 ARIA role 선언

❌ 수동 role 2건:

  - `todoWidgets.tsx` → role="list"
  - `todoWidgets.tsx` → role="listitem"

→ 해당 role에 대응하는 ui/ 컴포넌트를 사용하세요 (ListBox, TreeView, TabList, Grid 등).

## C. NormalizedData 우회 패턴 (.map + manual role)

❌ 우회 패턴 1건:

  - `todoWidgets.tsx` — .map() 안에서 수동 role 선언 감지

→ NormalizedData를 Aria 컴포넌트의 `data` prop에 주입하고 renderItem slot을 사용하세요.

## 파이프라인 의미

이 게이트 실패는 **Stage 3 → Stage 5 전이에서 정보가 손실됐음**을 뜻합니다. 선언한 계획을 구현이 배신했고, 훅이 없던 영역을 정적 검증으로 메꿔야 합니다.
