---
id: 2-areas/design/prds/ax-recipe-system-task
title: 'ax() Recipe System — shadcn 자유도 원리 적용'
status: active
kind: plan
created: 2026-04-07
updated: 2026-04-08
summary: '핵심: 구조 축(height/padding/font/gap)을 잠그고, 색 축만 열어서 어떤 조합이든 완성품 느낌 보장'
topics: [2-areas]
relates: []
supersedes: []
---
# ax() Recipe System — shadcn 자유도 원리 적용

> 핵심: 구조 축(height/padding/font/gap)을 잠그고, 색 축만 열어서 어떤 조합이든 완성품 느낌 보장

## 설계

### shadcn 패턴 요약
- variant = 색만 바꿈 (bg, text, hover)
- size = 구조 세트 (height + padding + font + gap + radius) — 개별 조절 불가
- 총 자유도: ~48가지 (4 sizes × 6 variants × ~2 추가)

### ax() 적용

**개방 축 (색칠 — 테마가 바꿔도 OK):**
surface, tone, text, border, interactive, shape

**잠금 축 (구조 — 컴포넌트가 소유):**
controlSize, padding, gap, textStyle, weight → **recipe로 압축**

### Recipe 구조

```ts
type Recipe = 'control' | 'control-sm' | 'control-lg'
            | 'item' | 'item-sm'
            | 'container' | 'container-sm'
            | 'badge'
```

각 recipe가 해소하는 값:

| recipe | height | padding | font | weight | gap | radius |
|--------|--------|---------|------|--------|-----|--------|
| control | 36px | 8px 16px | 14px | 500 | 8px | 6px |
| control-sm | 32px | 6px 12px | 13px | 500 | 6px | 6px |
| control-lg | 40px | 10px 24px | 14px | 500 | 8px | 6px |
| item | 36px | 6px 8px | 14px | 450 | 8px | 4px |
| item-sm | 32px | 4px 8px | 13px | 450 | 6px | 4px |
| container | auto | 24px | — | — | 24px | 12px |
| container-sm | auto | 16px | — | — | 16px | 8px |
| badge | auto | 2px 8px | 12px | 500 | 4px | pill |

## 액션 플랜

1. ax.ts — `recipe` 축 추가, 타입 정의
2. ax.css — 각 recipe의 CSS 클래스 작성
3. 기존 구조 축(controlSize, padding, gap 등) 유지 — 하위호환
4. ui/ 컴포넌트에서 recipe 적용 시작 (Button, ListBox, Input부터)
5. 시각 비교 (브라우저)
