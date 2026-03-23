# useControlledAria()

> 외부 상태 연동 (controlled component)

## API

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| behavior | AriaBehavior | ARIA 패턴 정의 |
| store | NormalizedData | 외부에서 주입하는 store (parent가 완전 제어) |
| plugins? | Plugin[] | 플러그인 배열 |
| onDispatch | (command: Command) => void | 커맨드 위임 콜백 (parent로 전달) |

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

- 내부 상태 없음: parent가 store를 완전 제어
- virtual engine: dispatch → onDispatch로 위임, getStore → store prop 직접 반환
- focusRecovery 없음: parent 책임 (parent가 CRUD를 관리하므로 복구도 parent 영역)

## 관계

- Combobox dropdown에서 사용 (parent가 목록 CRUD를 관리하는 시나리오)
