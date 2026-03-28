# TabGroup

> 탭 내비게이션 + 패널 렌더링. os의 tabs pattern 기반, 활성화/삭제/순서 변경 지원.

## Demo

```tsx render
<ShowcaseDemo slug="tabgroup" />
```

## Usage

```tsx
import { TabGroup } from 'interactive-os/ui/TabGroup'

<TabGroup
  data={workspaceData}
  tabgroupId="tg-1"
  onChange={setWorkspaceData}
  renderPanel={(tab) => <Content tab={tab} />}
/>
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | `NormalizedData` | 필수 | 전체 workspace store |
| tabgroupId | `string` | 필수 | 이 탭그룹의 entity ID |
| onChange | `(data: NormalizedData) => void` | — | store 변경 콜백 |
| renderPanel | `(tab: Entity) => React.ReactNode` | 필수 | 활성 탭의 패널 렌더러 |
| plugins | `Plugin[]` | — | 추가 플러그인 |
| keyMap | `Record<string, (ctx: PatternContext) => Command \| void>` | — | 추가 키맵 (내장 위에 merge) |
| aria-label | `string` | — | 탭리스트 레이블 |

## Keyboard

### 탭 내비게이션 (tabs pattern — useTabList)

| 키 | 동작 |
|----|------|
| `ArrowLeft` | 이전 탭으로 포커스 이동 |
| `ArrowRight` | 다음 탭으로 포커스 이동 |
| `Home` | 첫 번째 탭으로 이동 |
| `End` | 마지막 탭으로 이동 |
| `Tab` | 탭리스트 진입/탈출 (roving tabindex) |

### 탭 조작 (내장 keyMap)

| 키 | 동작 |
|----|------|
| `Delete` | 포커스된 탭 삭제 |
| `Meta+W` | 포커스된 탭 삭제 |

### 편집 모드 (enableEditing: true)

| 키 | 동작 |
|----|------|
| `F2` | 탭 이름 변경 시작 |
| `Alt+ArrowLeft` | 탭을 왼쪽으로 이동 |
| `Alt+ArrowRight` | 탭을 오른쪽으로 이동 |

### 탭 활성화

followFocus 방식 — 포커스 이동 시 자동 활성화 (tabs pattern의 `activate({ followFocus: true })`).

## Accessibility

- pattern: `tabs` (navigate + select + activate)
- role: `tablist` (컨테이너), 각 탭은 `aria-selected`
- childRole: `tabpanel`
- orientation: `horizontal`
- preview 탭: `font-style: italic`로 시각 구분

## Internals

### DOM 구조

```
div.tabGroup (flex-col)
  div.tabBar[role="tablist"] (flex-row)
    div.tab[aria-selected] (data-surface="action")
      span (label)
      button.tabClose (X 아이콘, tabIndex=-1)
  div.tabPanel[role="tabpanel"]
    {renderPanel(activeTab)}
```

- 내부 store를 tabs pattern용으로 변환: tabgroupId의 자식만 추출하여 flat store 생성
- close 버튼: `mouseDown.preventDefault()` + `click.stopPropagation()`으로 포커스 방해 방지

### CSS

- 방식: CSS Modules
- 파일: TabGroup.module.css
- JetBrains Islands 스타일: 둥근 탭, sunken 배경
- 선택 상태: `--surface-raised` 배경 + `--text-primary` 색상
- close 버튼: hover/selected 시 `opacity: 0.6`
- motion: `--motion-instant-*`
