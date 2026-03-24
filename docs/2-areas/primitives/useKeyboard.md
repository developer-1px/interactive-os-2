# useKeyboard()

> 키보드 이벤트 파싱 유틸리티

## API

| 함수 | 시그니처 | 설명 |
|------|---------|------|
| parseKeyCombo | (combo: string) => KeyCombo | 문자열 키 조합을 파싱 (mod → 플랫폼별 Ctrl/Cmd) |
| matchKeyEvent | (event: KeyboardEvent, combo: KeyCombo) => boolean | 이벤트가 키 조합과 일치하는지 판정 |
| findMatchingKey | (event: KeyboardEvent, keyMap: KeyMap) => string \| undefined | keyMap에서 이벤트에 매칭되는 키 검색 |

## 반환값

| 타입 | 설명 |
|------|------|
| KeyCombo | `{ key, ctrl, shift, alt, meta }` 파싱된 키 조합 객체 |
| boolean | matchKeyEvent 일치 여부 |
| string \| undefined | findMatchingKey 매칭된 키 문자열 |

## 핵심 동작

- 플랫폼 인식 modifier 매핑: `mod` → macOS에서 Cmd, 그 외 Ctrl
- Space 키 정규화 (" " → "Space")
- 소문자 변환으로 대소문자 무관 매칭
- 순서 의존 매칭: keyMap 순회 시 먼저 매칭되는 항목 반환

## 관계

- useAria, useAriaZone 내부에서 키보드 이벤트 처리에 사용
