# edit()

> 편집 축. F2 rename, Enter rename, Delete 삭제, Alt+Arrow 이동, printable-key replace 모드를 소유한다.

## 스펙

| 키 | 동작 | 조건 |
|---|---|---|
| F2 | startRename(focused) | — |
| Enter | startRename(focused) | — |
| Delete | remove(focused) | — |
| Alt+↑ | moveUp(focused) | — |
| Alt+↓ | moveDown(focused) | — |
| Alt+← | moveOut(focused) | tree: true |
| Alt+→ | moveIn(focused) | tree: true |
| (printable key) | startRename(replace mode) | replaceEditPlugin 활성 시 |

### 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| tree | `boolean` | `false` | Alt+←→ indent/outdent 추가 |

### replaceEditPlugin()

별도 export. 포커스된 노드에서 인쇄 가능 키를 누르면 기존 값을 지우고 해당 키로 시작하는 replace-mode rename을 시작한다. UI 컴포넌트의 plugins 배열에 추가하여 사용.

## 관계

- **activate**와 Enter 충돌 → edit axis를 axes 배열 앞에 배치하면 edit의 Enter가 우선 (composePattern first-handler-wins)
- **navigate**와 독립 → ↑↓는 navigate, Alt+↑↓는 edit
- **clipboard**와 독립 → Mod+C/V는 clipboard (native event), edit는 관여 없음
- Grid의 **cell clipboard** (Mod+C/V with colIndex)는 component-level keyMap override로 별도 처리

## 데모

```tsx render
<EditDemo />
```

## 관련

- [edit-axis plan](/docs/superpowers/plans/2026-03-23-edit-axis.md)
- 사용 패턴: grid({ edit }), listbox({ edit }), treegrid({ edit })
