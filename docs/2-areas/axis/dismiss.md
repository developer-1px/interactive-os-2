# dismiss()

> Escape dismiss 축. Escape로 닫기/해제.

## 스펙

| 키 | 동작 | 조건 |
|---|---|---|
| Escape | collapse | escape=true (기본) |

### 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| escape | `boolean` | `true` | Escape 키로 dismiss |

## 관계

- **expand**와 Escape 공유 가능 → dialog/alertdialog에서는 dismiss만 사용
- 최소 축 — 단독으로 dialog/alertdialog 패턴 구성

## 데모

```tsx render
<DismissDemo />
```

## 관련

- 사용 패턴: dialog, alertdialog
