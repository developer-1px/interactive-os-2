# useAriaZone()

> multi-view ARIA 지원

## API

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| engine | CommandEngine | useEngine에서 생성한 공유 엔진 |
| store | NormalizedData | 공유 store |
| behavior | AriaBehavior | ARIA 패턴 정의 |
| scope | string | zone 네임스페이스 식별자 |
| plugins? | Plugin[] | 플러그인 배열 |
| keyMap? | KeyMap | keyMap 오버라이드 |
| onActivate? | (id: string) => void | 항목 활성화 콜백 |
| initialFocus? | string | 초기 포커스 대상 ID |
| isReachable? | (id: string) => boolean | 포커스 복구 시 도달 가능 여부 판정 |

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

- zone-local viewState: focus, selection, expanded 상태가 zone별로 독립
- virtual engine adapter: zone 메타 커맨드는 zone 내부 분리, 데이터 커맨드는 공유 engine으로 위임
- `data-$scope-id` 속성으로 DOM 네임스페이스 격리 (scope는 파라미터 값)
- focusRecovery가 zone 레벨에서 동작 (isReachable 주입으로 모델별 커스터마이징)

## 관계

- useEngine에서 생성한 engine을 공유
- 같은 engine 위에 여러 zone을 마운트하여 multi-view 구현
