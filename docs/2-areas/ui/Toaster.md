# Toaster

> Ephemeral notifications with auto-dismiss, queue management, and aria-live.

## Demo

```tsx render
<ShowcaseDemo slug="toaster" />
```

## Usage

```tsx
import { Toaster } from 'interactive-os/ui/Toaster'
import { createToaster } from 'interactive-os/ui/createToaster'

const toaster = createToaster({ duration: 5000, maxToasts: 5 })

// trigger from anywhere
toaster.toast({ title: 'Saved', variant: 'success' })
toaster.toast({ title: 'Error', description: 'Network failed', variant: 'error' })

// mount once at app root
<Toaster toaster={toaster} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| toaster | ToasterInstance | — | createToaster()로 생성한 토스터 인스턴스 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="toaster" />
```

## Accessibility

- pattern 미사용 (useAria/engine 밖 독립 컴포넌트)
- aria-live="polite" + aria-atomic="false": 스크린리더에 새 토스트 알림
- dismiss 버튼: aria-label="Dismiss"

## Internals

### DOM 구조

```
div[aria-live=polite] container
  └─ div[data-variant] toast
       ├─ div  content
       │   ├─ div  title
       │   └─ div  description (optional)
       └─ button  dismiss (×)
```

### 상태 관리

- useSyncExternalStore로 외부 toaster 구독
- createToaster(): 자동 dismiss 타이머, maxToasts 큐 관리

### CSS

- 방식: CSS Modules
- 파일: Toaster.module.css
