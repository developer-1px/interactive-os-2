# activate()

> 활성화 축. Enter/Space로 항목을 실행한다.

## 스펙

| 키 | 동작 | 조건 |
|---|---|---|
| Enter | activate | 항상 |
| Space | activate | select 축이 없을 때 (fallback) |

### 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| onClick | `boolean` | `false` | 클릭 시 활성화 |
| followFocus | `boolean` | `false` | 포커스 이동 시 자동 활성화 (tabs) |
| toggleExpand | `boolean` | `false` | 활성화 = expand/collapse 토글 (accordion, disclosure) |

## 관계

- **select**와 Space 키 공유 → select 없으면 activate로 fallback
- **expand**와 조합 → toggleExpand 옵션으로 activate가 expand/collapse 겸임
- followFocus: true → tabs 패턴에서 포커스 이동만으로 탭 전환

## 데모

```tsx render
<ActivateDemo />
```

## 관련

- 사용 패턴: listbox, menu, toolbar, tabs, radiogroup, accordion, disclosure, switch, spatial, kanban
