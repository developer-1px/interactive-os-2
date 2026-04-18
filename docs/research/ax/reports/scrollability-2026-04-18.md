# Scrollability — 2026-04-18

**기준:** content가 viewport보다 크면 window.scrollTo(0,500) 후 scrollY > 0
**Base URL:** http://localhost:4173/interactive-os-2   **Viewport:** 1280×800

**결과:** 5/5 pass

| route | overflows | scroll after | body.overflow | pass? |
|-------|:---------:|-------------:|---------------|:-----:|
| `/` | false | 0 | visible  | ✅ |
| `/ax-principles` | false | 0 | visible  | ✅ |
| `/ui` | false | 0 | visible  | ✅ |
| `/catalog` | false | 0 | visible  | ✅ |
| `/showcase/gmail` | false | 0 | visible  | ✅ |
