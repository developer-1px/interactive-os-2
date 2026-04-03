# App Inspector

> engine.inspect()로 앱의 전체 capability를 한눈에 확인. commands, keyMap, plugins, state, plugin extras를 직렬화된 트리로 탐색.

```tsx render
<AppInspectorDemo />
```

## 트리 구조

| 그룹 | 내용 |
|------|------|
| commands | engine에 등록된 모든 command type (axis + plugin) |
| keyMap | 합성된 키바인딩 → 소유 plugin 이름 |
| plugins | 등록된 plugin 목록 |
| state | 현재 NormalizedData (entities + relationships) |
| extras | plugin별 inspect() 결과 (history: undo/redo, zodSchema: schemas/childRules) |

## 파일

| 파일 | 역할 |
|------|------|
| `src/interactive-os/engine/types.ts` | `InspectResult`, `CommandEngine.inspect()`, `Plugin.inspect?()` |
| `src/interactive-os/engine/createCommandEngine.ts` | inspect() 구현 — core + plugin extras 합성 |
| `src/interactive-os/engine/inspectToTree.ts` | InspectResult → NormalizedData 트리 변환 |
| `src/devtools/inspector/AppInspector.tsx` | TreeView UI 컴포넌트 |
| `src/devtools/inspector/AppInspectorDemo.tsx` | MD 임베드용 데모 |
