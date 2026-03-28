# carousel

> 자동 회전 이미지/콘텐츠 슬라이드쇼

## APG Examples

### #7 Auto-Rotating Carousel with Prev/Next Buttons

```tsx render
<CarouselPrevNext />
```

### #8 Auto-Rotating Carousel with Tabs

```tsx render
<CarouselTabs />
```

## 설계 노트

Carousel은 multi-zone이 아니다:
- **#7 (Prev/Next)**: plain buttons + `aria-live` region. 패턴 불필요 — 순수 HTML.
- **#8 (Tabs)**: 기존 `tabs` 패턴 재사용 + auto-rotation 타이머.

두 variant 모두 기존 os primitives로 완전히 커버:
- `aria-roledescription="carousel"` / `"slide"` 로 스크린 리더 명칭 오버라이드
- `aria-live="polite"` ↔ `"off"` 토글로 회전 중 알림 제어
- focus/hover 시 자동 회전 일시정지
- `prefers-reduced-motion` 존중
