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

| prop | type | default | description |
|------|------|---------|-------------|

## Keyboard

```tsx render
<ApgKeyboardTable slug="toaster" />
```

## Accessibility

<!-- TODO -->

## Internals

<!-- TODO -->
