# typeahead()

> APG 표준 type-a-character: 문자 입력 시 해당 항목으로 포커스 이동

```tsx render
<TypeaheadDemo />
```

## 커맨드

(없음 — typeahead는 커맨드를 추가하지 않고 `onUnhandledKey` 로 동작)

## 메커니즘

| 항목 | 설명 |
|------|------|
| `onUnhandledKey` | keyMap에 매칭되지 않은 printable 문자를 처리하는 fallback |
| 버퍼 | per-instance closure 내 문자 누적 (store에 저장하지 않음) |
| 타이머 | 500ms(기본값) 후 버퍼 리셋 |
| 검색 | visible nodes에서 case-insensitive prefix 매칭, 순환 검색 |

## Options

| option | 설명 |
|--------|------|
| `getLabel(entity) → string` | entity에서 검색 대상 텍스트 추출 |
| `timeout? = 500` | 버퍼 리셋 타이머 (ms) |

## 주요 export

| export | 설명 |
|--------|------|
| `typeahead(options)` | Plugin 팩토리 |
| `findTypeaheadMatch(nodes, buffer, focusId)` | 순수 검색 함수 |
| `isPrintableKey(event)` | printable 문자 판별 (modifier/IME 제외) |
| `resetTypeahead()` | 테스트용 버퍼 리셋 |

## 의존

- core (focusCommands, FOCUS_ID, EXPANDED_ID)

## 설계 결정

- **onUnhandledKey (not keyMap)**: 모든 printable 문자에 반응해야 하므로 keyMap 와일드카드 대신 별도 fallback 경로
- **per-instance buffer**: clipboard와 달리 typeahead 버퍼는 인스턴스별로 격리 (두 ListBox가 같은 페이지에 있을 때 간섭 방지)
- **store에 버퍼 저장 금지**: 500ms 수명의 일시적 상태를 store에 넣으면 undo/redo 히스토리 오염
