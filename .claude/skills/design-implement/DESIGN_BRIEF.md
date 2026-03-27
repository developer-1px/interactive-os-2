# Design Brief — 코드 전에 채우는 시각적 판단 빈칸

> CSS/JSX를 한 줄이라도 쓰기 전에, 아래 빈칸을 모두 채운다.
> 빈칸을 채우는 것 자체가 디자인이다. 코드는 이 판단의 번역일 뿐.

---

## 1. 화면 역할 (Screen Role)

```
이 화면의 한 줄 목적: _______________
사용자의 시선 순서:   ___ → ___ → ___ → ___
```

**판단:** 사용자가 이 화면에서 **가장 먼저 봐야 할 것**과 **가장 마지막에 볼 것**은?

---

## 2. 주인공 선언 (Hero Declaration)

```
주인공 요소: _______________
주인공 type: hero | display | page | section  (하나만)
나머지 최대 type: body | caption  (주인공보다 2단계+ 아래)
```

**규칙:** 화면에 주인공은 1개. 주인공이 없으면 모든 게 평평해진다.
**검증:** 주인공과 나머지의 font-size 비율이 **2× 이상**인가?

---

## 3. 깊이 지도 (Depth Map)

화면의 모든 영역을 surface 레벨에 배치한다.

```
┌─────────────────────────────────┐
│ surface: ___                     │  ← 가장 바깥 (base | sunken)
│  ┌──────────────────────────┐   │
│  │ surface: ___              │   │  ← 콘텐츠 영역 (default | raised)
│  │  ┌───────────────────┐   │   │
│  │  │ surface: ___       │   │   │  ← 카드/입력 (raised | outlined)
│  │  └───────────────────┘   │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │  ← 떠있는 요소 (overlay)
│  │ surface: ___              │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

**규칙:** 깊이는 안으로 갈수록 높아진다. base > default > raised > overlay.
**검증:** 자식이 부모보다 낮은 surface인 곳이 없는가?

---

## 4. 정보 위계 (Type Map)

화면의 모든 텍스트 요소를 나열하고 type 레벨을 배정한다.

```
| 요소          | type 레벨  | color 축      | 이유           |
|---------------|-----------|---------------|----------------|
| ___           | hero      | text-bright   | 주인공          |
| ___           | section   | text-primary  | 섹션 제목       |
| ___           | body      | text-primary  | 본문/라벨       |
| ___           | body      | text-secondary| 부가 정보       |
| ___           | caption   | text-muted    | 보조/힌트       |
```

**규칙:**
- type 레벨은 **최대 3종류**만 사용 (예: hero + body + caption)
- 4종류 이상이면 위계가 복잡해진다 — 하나를 제거하거나 합칠 수 있는지 검토
- color 축은 type과 독립: 같은 body라도 역할에 따라 primary/secondary/muted 달라짐

**검증:** 같은 레벨인데 다른 역할인 텍스트가 color로 구분되는가?

---

## 5. 밀도 선택 (Density)

```
이 화면의 밀도: compact | comfortable | spacious

근거: _______________
(예: "설정 목록이라 항목이 많으므로 compact"
     "온보딩이라 여백이 많아야 하므로 spacious")
```

밀도에 따른 gap 기본값:

| 밀도 | 섹션 간 (column) | 요소 간 (row) | 필드 내부 (label↔input) |
|------|-----------------|--------------|----------------------|
| compact | space-lg (16px) | space-sm (8px) | space-xs (4px) |
| comfortable | space-xl (24px) | space-md (12px) | space-sm (8px) |
| spacious | space-2xl (32px) | space-lg (16px) | space-md (12px) |

---

## 6. 레이아웃 스켈레톤 (Layout Skeleton)

코드가 아니라 **구조**를 먼저 그린다. atomic class 이름으로.

```
[전체: flex-row]
  [좌측: flex-col, w-___]
    [___: flex-col gap-___]
    [___: flex-col gap-___]
  [우측: flex-col flex-1]
    [헤더: flex-row justify-between items-center]
      [제목: ___]
      [액션: ___]
    [본문: flex-col gap-___]
      [섹션: flex-col gap-___]
        [행: flex-row justify-between items-center]
```

**규칙:**
- 부모의 gap > 자식의 gap (depth-inversion 금지)
- 같은 역할의 형제는 같은 gap
- row는 `justify-between items-center`가 기본 (Rule 9: 라벨 좌, 액션 우)

---

## 7. Shape 배정 (Shape Assignment)

각 "상자" 요소에 shape 레벨을 배정한다.

```
| 요소          | shape 레벨 | 이유                          |
|---------------|-----------|-------------------------------|
| ___           | xl        | 대형 컨테이너 (Composer급)      |
| ___           | lg        | 카드                           |
| ___           | md        | 입력 필드                      |
| ___           | sm        | 네비/사이드바 아이템            |
| ___           | xs        | 뱃지/태그                      |
```

**규칙:** 부모가 자식보다 shape 레벨이 높거나 같다. (xl 안에 lg, lg 안에 md)
**검증:** radius가 큰 요소 안에 더 큰 radius가 있지 않은가?

---

## 8. 색 예산 (Color Budget)

```
무채색 요소 수:    ___ / 전체 ___ = ___% (목표: 90%+)
accent 사용 위치:  ___ (최대 2곳: 주요 CTA + 활성 상태)
destructive 위치:  ___ (있다면)
```

**규칙:** (Rule 6) 화면의 90% 이상은 무채색. accent는 "여기를 봐라"는 신호.
**검증:** accent가 3곳 이상이면 → 하나를 neutral로 바꿀 수 있는가?

---

## 9. 인터랙션 맵 (Interaction Map)

인터랙션이 있는 요소마다, **무엇이 변하는지**를 미리 결정한다.

```
| 요소     | hover        | focus         | selected      | disabled     |
|----------|-------------|---------------|---------------|--------------|
| ___      | bg → ___    | ring ___      | —             | opacity 0.5  |
| ___      | bg → ___    | bg → ___      | bg ___ + ✓    | text-muted   |
| ___      | border → ___ | ring ___      | —             | bg-muted     |
```

**규칙:**
- hover: bg만 변한다 (color, border 변경 최소화)
- focus: collection item = bg highlight, standalone = outline ring
- selected: bg 변경 + indicator(체크, 볼드 등) — 둘 다 필요
- disabled: opacity 또는 color 후퇴, 절대 display:none 아님

**검증:** hover와 selected의 시각적 차이가 명확한가? (둘 다 bg만 바꾸면 구분 불가)

---

## 10. 리듬 체크 (Rhythm Check)

최종 검증. 위 판단들의 일관성을 확인한다.

```
□ 주인공이 1개인가? (Rule 2)
□ type 레벨이 3종류 이하인가?
□ surface 깊이가 안쪽으로 갈수록 높아지는가?
□ 부모 gap > 자식 gap인가?
□ 같은 역할의 형제가 같은 spacing인가?
□ accent가 2곳 이하인가? (Rule 6)
□ 모든 입력 필드가 44px+ 높이인가? (Rule 5)
□ 설명문이 라벨보다 연한 색인가? (Rule 7)
□ 액션이 오른쪽에 있는가? (Rule 9)
□ row gap < column gap인가? (Rule 10)
```

---

## 사용법

1. 새 컴포넌트/페이지를 만들기 전에 이 템플릿을 복사
2. 각 섹션의 빈칸(\_\_\_)을 채운다 — **토큰 이름으로**
3. 검증 질문에 모두 통과하면 코드 시작
4. 코드 작성 중 판단이 흔들리면 이 문서로 돌아온다

> 빈칸을 채울 수 없으면, 그것이 디자인이 안 된 부분이다.
> 코드로 넘어가지 말고, 빈칸을 먼저 채워라.
