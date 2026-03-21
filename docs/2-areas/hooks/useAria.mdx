# useAria()

> 완전한 ARIA 통합 훅

## API

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| behavior? | AriaBehavior | ARIA 패턴 정의 (생략 시 EMPTY_BEHAVIOR = keyMap-only 모드) |
| data | NormalizedData | 정규화된 트리 데이터 |
| plugins? | Plugin[] | 플러그인 배열 |
| keyMap? | KeyMap | keyMap 오버라이드 (last wins) |
| onChange? | (data: NormalizedData) => void | 데이터 변경 콜백 |
| onActivate? | (id: string) => void | 항목 활성화 콜백 |
| initialFocus? | string | 초기 포커스 대상 ID |

## 반환값

| 필드 | 타입 | 설명 |
|------|------|------|
| dispatch | (command: Command) => void | 커맨드 디스패치 |
| getNodeProps | (id: string) => object | 노드별 ARIA 속성 |
| getNodeState | (id: string) => NodeState | 노드 상태 조회 |
| focused | string \| null | 현재 포커스된 노드 ID |
| selected | Set\<string\> | 선택된 노드 ID 집합 |
| getStore | () => NormalizedData | 현재 store 스냅샷 |
| containerProps | object | 컨테이너 요소에 바인딩할 props |

## 핵심 동작

- behavior.keyMap + plugin.keyMap + keyMapOverrides 병합 (last wins 우선순위)
- 메타 엔티티 보존하며 외부 data sync
- 포커스 복구: stale focus 감지 시 first child로 이동
- DOM 포커스 동기화: 모델 포커스 변경 → DOM focus() 호출
- followFocus와 onActivate 분리 (포커스 이동 ≠ 활성화)
- behavior optional: 생략 시 EMPTY_BEHAVIOR 적용 (keyMap-only 모드)
- **Pointer Interaction**: selectOnClick (plain/Shift/Ctrl+Click), activateOnClick, onPointerDown ctx 캡처 (anchor 보존)

## 관계

- useEngine 위에 구축
- useAriaZone의 sugar 버전 (단일 zone 시나리오)
