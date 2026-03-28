# APG Conformance Matrix

APG(WAI-ARIA Authoring Practices Guide) 전체 example과 우리 pattern/examples/ 매핑.
CSS 제외, 콘텐츠 구조 + 키보드 인터랙션 + aria-* 속성 동일성 기준.

> Source: https://www.w3.org/WAI/ARIA/apg/example-index/

## 상태 범례

- ⬜ 미착수
- 🔨 진행 중
- 🟢 적합 (APG와 동일한 구조·동작·속성)
- 🟡 부분 적합 (일부 갭 존재)
- ⛔ os 갭으로 불가 (갭 기록 필요)
- 🚫 범위 제외 (deprecated / engine 밖 / example 없음)

## Pattern × Example Matrix

### Accordion

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 1 | Accordion | [example](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/) | `pattern/examples/accordion.ts` | 🟢 | — |

### Alert

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 2 | Alert | [example](https://www.w3.org/WAI/ARIA/apg/patterns/alert/examples/alert/) | — | ⬜ | — |

### Alert Dialog

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 3 | Alert Dialog | [example](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/examples/alertdialog/) | `pattern/examples/alertdialog.ts` | 🟢 | — |

### Breadcrumb

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 4 | Breadcrumb | [example](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/examples/breadcrumb/) | — | ⬜ | — |

### Button

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 5 | Button | [example](https://www.w3.org/WAI/ARIA/apg/patterns/button/examples/button/) | — | ⬜ | — |
| 6 | Button (IDL Version) | [example](https://www.w3.org/WAI/ARIA/apg/patterns/button/examples/button_idl/) | — | ⬜ | — |

### Carousel

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 7 | Auto-Rotating Image Carousel with Buttons for Slide Control | [example](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-1-prev-next/) | — | ⬜ | — |
| 8 | Auto-Rotating Image Carousel with Tabs for Slide Control | [example](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-2-tablist/) | — | ⬜ | — |

### Checkbox

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 9 | Checkbox (Two State) | [example](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox/) | — | ⬜ | — |
| 10 | Checkbox (Mixed-State) | [example](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox-mixed/) | — | ⬜ | — |

### Combobox

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 11 | Select-Only Combobox | [example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/) | `pattern/examples/combobox.ts` | ⬜ | — |
| 12 | Editable Combobox without Autocomplete | [example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-none/) | — | ⬜ | — |
| 13 | Editable Combobox With List Autocomplete | [example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/) | — | ⬜ | — |
| 14 | Editable Combobox With Both List and Inline Autocomplete | [example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-both/) | — | ⬜ | — |
| 15 | Editable Combobox with Grid Popup | [example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/grid-combo/) | — | ⬜ | — |
| 16 | Date Picker Combobox | [example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-datepicker/) | — | ⬜ | — |

### Dialog (Modal)

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 17 | Modal Dialog | [example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/) | `pattern/examples/dialog.ts` | 🟢 | — |
| 18 | Date Picker Dialog | [example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/) | — | ⬜ | — |

### Disclosure

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 19 | Disclosure (Show/Hide) Card | [example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-card/) | `pattern/examples/disclosure.ts` | 🟢 | — |
| 20 | Disclosure (Show/Hide) for FAQ | [example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-faq/) | — | ⬜ | — |
| 21 | Disclosure (Show/Hide) for Image Description | [example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-image-description/) | — | ⬜ | — |
| 22 | Disclosure Navigation Menu with Top-Level Links | [example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/) | — | ⬜ | — |
| 23 | Disclosure Navigation Menu | [example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/) | — | ⬜ | — |

### Feed

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 24 | Infinite Scrolling Feed | [example](https://www.w3.org/WAI/ARIA/apg/patterns/feed/examples/feed/) | — | ⬜ | — |

### Grid

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 25 | Data Grid | [example](https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/data-grids/) | `pattern/examples/grid.ts` | ⬜ | — |
| 26 | Layout Grid | [example](https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/layout-grids/) | — | ⬜ | — |

### Landmarks

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 27 | Banner Landmark | [example](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/banner.html) | — | 🚫 | 시맨틱 전용, engine 불필요 |
| 28 | Complementary Landmark | [example](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/complementary.html) | — | 🚫 | 시맨틱 전용, engine 불필요 |
| 29 | Contentinfo Landmark | [example](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/contentinfo.html) | — | 🚫 | 시맨틱 전용, engine 불필요 |
| 30 | Form Landmark | [example](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/form.html) | — | 🚫 | 시맨틱 전용, engine 불필요 |
| 31 | Main Landmark | [example](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/main.html) | — | 🚫 | 시맨틱 전용, engine 불필요 |
| 32 | Navigation Landmark | [example](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html) | — | 🚫 | 시맨틱 전용, engine 불필요 |
| 33 | Region Landmark | [example](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/region.html) | — | 🚫 | 시맨틱 전용, engine 불필요 |
| 34 | Search Landmark | [example](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/search.html) | — | 🚫 | 시맨틱 전용, engine 불필요 |

### Link

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 35 | Link | [example](https://www.w3.org/WAI/ARIA/apg/patterns/link/examples/link/) | — | ⬜ | — |

### Listbox

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 36 | Scrollable Listbox | [example](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-scrollable/) | `pattern/examples/listbox.ts` | 🟢 | — |
| 37 | Listboxes with Rearrangeable Options | [example](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/) | — | ⬜ | — |
| 38 | Listbox with Grouped Options | [example](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-grouped/) | — | ⬜ | — |

### Menu and Menubar

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 39 | Editor Menubar | [example](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/examples/menubar-editor/) | — | ⬜ | — |
| 40 | Navigation Menubar | [example](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/examples/menubar-navigation/) | — | ⬜ | — |

### Menu Button

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 41 | Actions Menu Button Using element.focus() | [example](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions/) | `pattern/examples/menu.ts` | ⬜ | — |
| 42 | Actions Menu Button Using aria-activedescendant | [example](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions-active-descendant/) | — | ⬜ | — |
| 43 | Navigation Menu Button | [example](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-links/) | — | ⬜ | — |

### Meter

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 44 | Meter | [example](https://www.w3.org/WAI/ARIA/apg/patterns/meter/examples/meter/) | — | ⬜ | — |

### Radio Group

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 45 | Radio Group Using Roving tabindex | [example](https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio/) | `pattern/examples/radiogroup.ts` | 🟡 | APG requires selection follows focus (ArrowKey auto-selects); impl requires explicit Space/click. Test documents gap. |
| 46 | Radio Group Using aria-activedescendant | [example](https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio-activedescendant/) | — | ⬜ | — |
| 47 | Rating Radio Group | [example](https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio-rating/) | — | ⬜ | — |

### Slider

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 48 | Color Viewer Slider | [example](https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-color-viewer/) | `pattern/examples/slider.ts` | 🟢 | — |
| 49 | Rating Slider | [example](https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-rating/) | — | ⬜ | — |
| 50 | Media Seek Slider | [example](https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-seek/) | — | ⬜ | — |
| 51 | Vertical Temperature Slider | [example](https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-temperature/) | — | ⬜ | — |

### Slider (Multi-Thumb)

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 52 | Horizontal Multi-Thumb Slider | [example](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/examples/slider-multithumb/) | — | ⬜ | — |

### Spinbutton

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 53 | Quantity Spin Button | [example](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/examples/quantity-spinbutton/) | `pattern/examples/spinbutton.ts` | 🟢 | — |

### Switch

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 54 | Switch | [example](https://www.w3.org/WAI/ARIA/apg/patterns/switch/examples/switch/) | `pattern/examples/switch.ts` | 🟢 | — |
| 55 | Switch Using HTML Button | [example](https://www.w3.org/WAI/ARIA/apg/patterns/switch/examples/switch-button/) | — | ⬜ | — |
| 56 | Switch Using HTML Checkbox Input | [example](https://www.w3.org/WAI/ARIA/apg/patterns/switch/examples/switch-checkbox/) | — | ⬜ | — |

### Table

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 57 | Table | [example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/table/) | — | ⬜ | — |
| 58 | Sortable Table | [example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/) | — | ⬜ | — |

### Tabs

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 59 | Tabs with Automatic Activation | [example](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-automatic/) | `pattern/examples/tabs.ts` | ⬜ | — |
| 60 | Tabs with Manual Activation | [example](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-manual/) | — | ⬜ | — |

### Toolbar

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 61 | Toolbar | [example](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/) | `pattern/examples/toolbar.ts` | 🟡 | `navigate()` 기본값이 wrap 없음 — APG는 ArrowRight/Left 끝에서 wrap 요구. `navigate({ wrap: true })`로 수정 가능 |

### Tooltip

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 62 | Tooltip | (APG example 없음, [pattern만](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)) | — | 🚫 | engine 밖 독립 (popover hint API) |

### Tree View

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 63 | File Directory Treeview Using Computed Properties | [example](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-1a/) | `pattern/examples/tree.ts` | ⬜ | — |
| 64 | File Directory Treeview Using Declared Properties | [example](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-1b/) | — | ⬜ | — |
| 65 | Navigation Treeview | [example](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-navigation/) | — | ⬜ | — |

### Treegrid

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 66 | Treegrid Email Inbox | [example](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/examples/treegrid-1/) | `pattern/examples/treegrid.ts` | ⬜ | — |

### Window Splitter

| # | APG Example | APG Link | 우리 파일 | 상태 | 갭 |
|---|-------------|----------|-----------|------|----|
| 67 | Window Splitter | (APG example 없음, [pattern만](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/)) | — | ⬜ | — |

### Deprecated (참고용)

| # | APG Example | APG Link | 상태 | 비고 |
|---|-------------|----------|------|------|
| D1 | Collapsible Dropdown Listbox | [example](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-collapsible/) | 🚫 | APG deprecated |
| D2 | Date Picker Spin Button | [example](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/examples/datepicker-spinbuttons/) | 🚫 | APG deprecated |

### Experimental

| # | APG Example | APG Link | 상태 | 비고 |
|---|-------------|----------|------|------|
| E1 | Tabs with Action Buttons | [example](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-actions/) | ⬜ | APG experimental |

---

## 요약

| 구분 | 수 |
|------|-----|
| 전체 APG example (크롤링) | 68 |
| 범위 제외 (Landmarks 8 + Tooltip 1 + Deprecated 2) | 11 |
| 대상 example | 57 + 1 experimental |
| 기존 pattern/examples/ 매핑 | 16 |
| 미착수 (매핑 없음) | 41 |
| 적합성 검증 완료 | 10 |

## os 갭 레지스트리

포팅 중 발견한 os 갭을 여기에 누적한다.

| # | 갭 | 관련 example | 영향 axis/plugin | 상태 |
|---|-----|-------------|------------------|------|
| 1 | `navigate()` 기본값 wrap=false — APG Toolbar는 끝에서 wrap 요구 | Toolbar (#61) | navigate axis `wrap` option | `navigate({ wrap: true })`로 해결 가능 |
