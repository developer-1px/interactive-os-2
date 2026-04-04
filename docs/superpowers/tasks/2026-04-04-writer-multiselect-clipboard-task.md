# Writer Multi-Select Clipboard

## 목표
Writer에서 멀티 셀렉트 후 copy/cut/paste가 기존 clipboard plugin으로 동작하는지 검증하고, Mod+D(duplicate)도 multi-select 대응.

## 액션 플랜

1. **통합 테스트 작성** — `clipboard-multiselect.integration.test.tsx`
   - multi-select(Shift+Arrow) → copy → paste: 여러 노드가 복사되어 삽입
   - multi-select → cut → paste: 여러 노드가 이동
   - multi-select → cut → paste → undo: 원복
2. **Mod+D multi-select 대응** — `clipboard.ts` keyMap
   - `ctx.selected?.ids` 있으면 전체 복제
3. **Verify** — typecheck, lint, test 통과
