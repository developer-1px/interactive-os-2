# form()

> Zod 기반 엔티티 값 검증. Entity = 폼 — 별도 폼 모델 없이, 정규화 엔티티의 data가 곧 폼 필드.

```tsx render
<FormDemo />
```

## 커맨드

| 커맨드 | 설명 |
|--------|------|
| `formCommands.submit(entityRules)` | 전체 엔티티 검증 + 전체 touched 마킹 |
| `formCommands.touch(nodeId, field?)` | 개별 노드/필드 touched 마킹 |
| `formCommands.reset()` | errors + touched 초기화 |

## 주요 export

| export | 설명 |
|--------|------|
| `ERRORS_ID = '__errors__'` | 검증 에러 메타 엔티티 키 |
| `TOUCHED_ID = '__touched__'` | touched 상태 메타 엔티티 키 |
| `formCommands` | 폼 커맨드 집합 |
| `getFormErrors(store)` | 전체 에러맵 조회 |
| `getFieldErrors(store, nodeId)` | 특정 노드의 필드별 에러 |
| `isTouched(store, nodeId, field?)` | touched 여부 확인 |
| `hasFormErrors(store)` | 에러 존재 여부 boolean |

## 미들웨어

`rename:confirm` / `updateEntityData` 커맨드 실행 후 자동으로 해당 엔티티를 Zod 검증하여 `__errors__` 갱신.

- validate는 항상 실행 (미들웨어)
- 에러 표시는 touched 이후 (뷰의 관심사)

## 사용법

```tsx
import { form } from 'interactive-os/plugins/form'
import { z } from 'zod'

const entityRules = {
  field: z.object({
    type: z.literal('field'),
    label: z.string(),
    value: z.string().min(1, 'Required'),
  }),
}

// Aria 플러그인으로 등록
<Aria plugins={[form({ entityRules })]} ... />
```

## 의존

- `zodSchema.ts` — `ZodSchema` 타입 import
- `createStore` — `getEntity` 조회

## 설계 원칙

- Entity = 폼: 정규화 모델이 상태관리를 흡수하듯, 폼 검증도 Command 체계 안에서 동작
- 검증 타이밍은 업계 수렴점: validate는 항상, 표시만 touched 이후
- 메타 엔티티 패턴: `__errors__`, `__touched__`는 `__focus__`, `__selection__`과 동일 패턴

## 갭

- submit-on-Enter: Aria dispatch 접근 경로 필요 (현재 onActivate에서 dispatch 불가)
