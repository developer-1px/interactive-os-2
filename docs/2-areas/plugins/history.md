# history()

> undo/redo 스택을 관리하는 히스토리 플러그인

```tsx render
<HistoryDemo />
```

## 커맨드

| 커맨드 | 설명 |
|--------|------|
| `undo` | 마지막 커맨드 되돌리기 |
| `redo` | 되돌린 커맨드 다시 실행 |

## 키맵

| 키 | 동작 |
|---|------|
| `Mod+Z` | undo |
| `Mod+Shift+Z` | redo |

## 주요 export

| export | 설명 |
|--------|------|
| `historyMiddleware` | 모든 커맨드를 인터셉트하여 past/future 스택 관리 |

## 의존

- 모든 플러그인 위에서 동작 (커맨드 래핑)
