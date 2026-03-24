---
name: design-implement
description: DESIGN.md 번들 체계 안에서 CSS를 작성한다. 컴포넌트 스타일링, UI 구현, CSS 수정 시 5개 번들(surface/shape/type/tone/motion) 준수를 강제한다. "컴포넌트 만들어줘", "CSS 작성", "스타일링", "UI 구현", "/design-implement" 등 디자인 시스템이 있는 프로젝트에서 CSS를 작성할 때 사용. 디자인 토큰을 개별 사용하는 것을 방지하고 번들 단위 사용을 보장한다.
---

# Design Implement — 번들 기반 CSS 작성

## 왜 이 스킬이 필요한가

디자인 토큰이 있어도, CSS 작성 시 번들을 무시하고 개별 토큰을 조합하면 레퍼런스와 불일치가 발생한다.
예: `border-radius: var(--radius-sm)`만 쓰고 `padding`은 다른 스케일 → shape 번들 위반.

이 스킬은 CSS 작성 시 **5개 번들을 반드시 세트로 사용**하도록 강제한다.

## 전제

- DESIGN.md가 프로젝트 루트에 존재해야 한다
- tokens.css에 번들 토큰이 정의되어 있어야 한다

## 번들 체크리스트

CSS를 작성하거나 수정하기 전에 DESIGN.md를 읽고, 아래 5개 번들을 하나씩 확인한다.

### 1. Surface — 이 요소의 시각적 계층은?

```
질문: 이 요소가 base/sunken/default/raised/overlay/outlined 중 어디에 있는가?
```

| 레벨 | 언제 | bg | border | shadow |
|---|---|---|---|---|
| base | 페이지/사이드바 배경 | surface-base | — | — |
| sunken | 움푹 들어간 영역 | surface-sunken | — | — |
| default | 콘텐츠 영역, Input bg | surface-default | — | — |
| raised | 카드, Composer | surface-raised | border-subtle | shadow-float |
| overlay | 드롭다운, 다이얼로그 | surface-overlay | border-default | shadow-lg |
| outlined | 부모 bg 상속 + 선 | transparent | border-default | — |

```css
/* ✅ 번들로 사용 */
[data-surface="raised"] { /* bg + border + shadow 자동 적용 */ }

/* ❌ 개별 조합 금지 */
background: var(--surface-raised);
border: 1px solid var(--border-subtle);
box-shadow: var(--shadow-float);
```

surface는 `data-surface` 속성으로 적용하는 것이 원칙. CSS에서 직접 조합하지 않는다.

### 2. Shape — 이 요소의 크기급은?

```
질문: 이 요소가 xs/sm/md/lg/xl 중 어디인가?
```

| 레벨 | radius | padding-y | padding-x | 용도 |
|---|---|---|---|---|
| xs | 6px | 6px | 12px | 뱃지, 태그 |
| sm | 6px | 6px | 16px | 사이드바, 네비 |
| md | 10px | 0 | 12px | Input, Select |
| lg | 12px | 20px | 20px | 카드 |
| xl | 20px | — | — | 대형 컨테이너 |

```css
/* ✅ 세트로 사용 */
border-radius: var(--shape-md-r);
padding: var(--shape-md-py) var(--shape-md-px);

/* ❌ radius와 padding을 다른 레벨에서 가져오지 않는다 */
border-radius: var(--shape-lg-r);  /* lg */
padding: var(--shape-sm-py) var(--shape-sm-px);  /* sm — 불일치! */
```

### 3. Type — 이 텍스트의 역할은?

```
질문: caption/body/section/page/hero 중 어디인가?
```

| 레벨 | size | weight | family | lh |
|---|---|---|---|---|
| caption | 12px | 430 | Sans | 1.33 |
| body | 14px | 430 | Sans | 1.4 |
| section | 16px | 600 | Sans | 1.4 |
| page | 24px | 500 | Serif | 1.3 |
| hero | 40px | 330 | Serif | 1.5 |

```css
/* ✅ 4축을 함께 적용 */
font-size: var(--type-section-size);
font-weight: var(--type-section-weight);
font-family: var(--type-section-family);
line-height: var(--type-section-lh);

/* ❌ size만 바꾸고 weight/family를 안 바꾸면 안 된다 */
font-size: var(--type-page-size);  /* 24px — page급 */
font-weight: var(--weight-semi);    /* 600 — section급 weight — 불일치! */
```

핵심 전환: **16px 이하 = Sans**, **24px 이상 = Serif + lighter weight**. 이 경계를 넘으면 family와 weight가 반드시 함께 전환된다.

### 4. Tone — 이 색상의 의미는?

```
질문: primary/destructive/success/warning/neutral 중 어디인가?
```

모든 tone은 동일한 4축 구조:

```css
/* ✅ 같은 tone 안에서 4축 사용 */
background: var(--tone-destructive);
color: var(--tone-destructive-foreground);

/* hover 상태 */
background: var(--tone-destructive-hover);

/* 약한 배경 (뱃지 등) */
background: var(--tone-destructive-dim);
color: var(--tone-destructive);

/* ❌ 다른 tone의 축을 섞지 않는다 */
background: var(--tone-primary-dim);
color: var(--tone-destructive);  /* 의미 충돌! */
```

**포인트 컬러 규칙:** 한 화면에서 채도 있는 tone은 최소화한다. neutral(무채색)이 기본.

### 5. Motion — 이 전환의 속도감은?

```
질문: instant/normal/enter 중 어디인가?
```

| 레벨 | duration | easing | 용도 |
|---|---|---|---|
| instant | 0.075s | cubic-bezier(0.165, 0.85, 0.45, 1) | 호버 피드백 |
| normal | 0.15s | cubic-bezier(0.4, 0, 0.2, 1) | 일반 전환 |
| enter | 0.15s | cubic-bezier(0, 0, 0.2, 1) | 진입 애니메이션 |

```css
/* ✅ duration + easing 세트 */
transition: background var(--motion-instant-duration) var(--motion-instant-easing);

/* ❌ duration과 easing을 다른 레벨에서 가져오지 않는다 */
transition: color var(--motion-instant-duration) var(--motion-normal-easing);
```

## Composition Rules

번들 외에, DESIGN.md의 조합 규칙도 반드시 확인한다:

1. **면으로 구분, 선으로 구분 안 함** — border는 입력필드/카드 윤곽에만
2. **화면당 주인공 1개** — hero 1개 + 나머지 후퇴
3. **위계 점프** — body 구간(12~16) 균일, hero(40) 급격 점프
4. **조연의 후퇴** — 네비/보조 요소는 본문보다 작고 연한 색
5. **입력은 넉넉하게** — Input height 44px, 충분한 padding
6. **포인트 컬러 1개** — 유일한 채도색 = accent
7. **설명문은 항상 있되, 후퇴** — 라벨과 경쟁하지 않는 연한 색
8. **카드형 선택** — 라디오보다 비주얼 카드
9. **액션은 오른쪽 끝** — 라벨 좌측, 버튼/스위치 우측
10. **Gap 기본값** — row 12px, column 24px

## CSS 작성 워크플로우

1. DESIGN.md 읽기
2. 대상 요소의 5개 번들 레벨 결정
3. tokens.css에서 해당 번들 토큰 확인
4. CSS 작성 (번들 토큰 사용)
5. Composition rules 확인
6. raw 값(px, hex 등) 사용 여부 점검 → 토큰으로 교체

## 위반 감지 패턴

작성한 CSS에서 다음을 발견하면 번들 위반이다:

| 패턴 | 위반 | 교정 |
|---|---|---|
| `font-size: 24px` + `font-weight: 600` | type 번들: 24px은 page급, weight는 500이어야 함 | `--type-page-*` 사용 |
| `border-radius: 20px` + `padding: 6px 12px` | shape 번들: xl radius + xs padding 불일치 | 같은 레벨 사용 |
| `background: var(--tone-primary)` + `color: var(--text-primary)` | tone: primary tone이면 foreground도 primary에서 | `--tone-primary-foreground` |
| `transition: 0.15s ease` | motion: ease가 아니라 specific cubic-bezier 사용 | `--motion-normal-*` |
| `background: #FAF9F5` | raw 색상값 | `var(--surface-base)` 또는 palette 토큰 |
