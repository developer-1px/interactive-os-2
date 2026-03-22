# Overview Ideal Usage — PRD

> Discussion: L1(overview.mdx)에 ListBox end-to-end pseudo-real 코드를 추가하여 AI/자신이 전 레이어 조립 방식을 즉시 파악할 수 있게 한다.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| 1 | AI/자신이 이 프레임워크를 처음 접하거나 새 세션을 시작 | overview.mdx를 열어 프레임워크 구조를 파악하려 함 | 레이어 표와 의존 그래프만 보임. "어떻게 조립하는지"는 L3까지 내려가야 알 수 있음 | ✅ 일치 |
| 2 | overview.mdx에 ideal usage 코드가 있음 | AI가 overview.mdx를 읽음 | 7개 레이어가 하나의 ListBox로 관통되는 코드를 보고 즉시 멘탈 모델을 형성함 | ✅ 일치 |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `docs/2-areas/overview.mdx` — `## Ideal Usage` 섹션 추가 | 기존 "전체 빈칸" 섹션 뒤에 추가. 하나의 tsx 코드 블록으로 7개 레이어 관통 | ✅ 일치 |

**코드 구조 (pseudo-real, ~30줄):**

```tsx
// ❶ Core — 정규화된 데이터 구조
const data = createStore({
  entities: {
    a: { id: 'a', data: { label: 'Apple' } },
    b: { id: 'b', data: { label: 'Banana' } },
    c: { id: 'c', data: { label: 'Cherry' } },
  },
  relationships: { [ROOT_ID]: ['a', 'b', 'c'] },
})

// ❷ Axes — 키맵 원자 (navigate, select, activate)
// ❸ Patterns — 축 조합 → AriaBehavior
const listbox = composePattern(
  { role: 'listbox', childRole: 'option' },
  select({ mode: 'multiple', extended: true }),
  activate({ onClick: true }),
  navigate({ orientation: 'vertical' }),
)

// ❹ Plugins — Command 확장
const plugins = [core(), crud(), history()]

// ❺ Hooks — React 통합
function MyList() {
  const [items, setItems] = useState(data)
  const aria = useAria({
    behavior: listbox,
    data: items,
    plugins,
    onChange: setItems,
  })

  // ❻ UI — DOM 바인딩
  return (
    <div {...aria.containerProps}>
      {getChildren(items, ROOT_ID).map(id => (
        <div key={id} {...aria.getNodeProps(id)}>
          {getEntity(items, id)?.data?.label}
        </div>
      ))}
    </div>
  )
}
```

**설계 의도:**
- 번호(❶~❻)가 overview 레이어 표의 1~6에 대응
- 실제 함수명/타입명 사용, import 경로 생략
- 데이터 3개로 최소화하되 meaningful한 값(Apple, Banana, Cherry)
- Plugin은 `[core(), crud(), history()]`로 확장 가능성을 암시
- Pages(❼)는 쇼케이스이므로 코드에서 생략, 텍스트로 언급

완성도: 🟡

## ③ 인터페이스

> 비-UI 작업 (문서 변경). 키보드/마우스 인터랙션 해당 없음.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| AI가 overview.mdx 읽기 | 레이어 표 + 의존 그래프만 있음 | Ideal Usage 섹션의 코드를 위에서 아래로 읽음 | ❶~❻ 번호가 레이어 표와 1:1 대응하므로 구조와 코드가 즉시 연결됨 | 7개 레이어의 조립 방식을 이해한 상태 | ✅ 일치 |
| AI가 새 패턴 구현 시도 | overview의 ListBox 예제를 본 상태 | 같은 구조로 다른 behavior를 조합 | composePattern + useAria 패턴이 동일하므로 ListBox를 템플릿으로 복제 | 새 패턴 구현 가능 | ✅ 일치 |

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| API가 변경되어 코드와 실제가 불일치 | overview에 옛 시그니처가 남아있음 | stale 코드는 잘못된 멘탈 모델을 형성, 없는 것보다 해로움 | /area 갱신 시 L1 코드의 함수명을 grep으로 검증 | 불일치 발견 시 코드 갱신 | ✅ grep 검증 완료 |
| overview가 100줄을 초과 | Ideal Usage 섹션이 너무 길어짐 | L1은 "첫 인상"이므로 간결해야 함. 긴 문서는 AI 컨텍스트 낭비 | 코드 블록 30줄 + 설명 5줄 이내로 제한 | overview 총 80~90줄 | ✅ 92줄 |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | Area MDX는 영구 자산 (area 스킬) | ② 산출물 | ✅ 준수 | — | ✅ 일치 |
| 2 | walkthrough 필수 (feedback_walkthrough_in_area) | ② 코드 | ✅ 준수 — ideal usage 코드가 walkthrough 역할 | — | ✅ 일치 |
| 3 | 파일명 = 주 export (CLAUDE.md) | ② 산출물 | ✅ 해당 없음 — 기존 파일 수정 | — | ✅ 일치 |
| 4 | 최소 구현 수렴 (feedback_minimum_impl_is_good) | ② 코드 | ✅ 준수 — 30줄로 전 레이어 관통 | — | ✅ 일치 |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | overview.mdx (기존 44줄) | 분량 증가 (~80줄) | 낮 | 허용 — 100줄 이내 | |
| 2 | /area 스킬 | L1 코드 검증 단계가 없음 | 중 | /area 스킬에 "L1 코드 grep 검증" 단계 추가 검토 (별도 작업) | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | import 경로를 코드에 포함 | ⑤ 최소 구현 | 노이즈. 경로는 변경될 수 있고 멘탈 모델에 불필요 | |
| 2 | 코드 블록을 30줄 초과 | ⑥ 분량 | L1 간결함 유지 | |
| 3 | 실제 존재하지 않는 함수명 사용 | ④ drift | pseudo-real이지만 시그니처는 진짜여야 함 | |
| 4 | 주석 외에 코드 블록 밖 설명을 길게 쓰기 | ⑤ 최소 구현 | 코드가 스스로 설명해야 함 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| 1 | ①-2 | overview.mdx에 Ideal Usage 섹션이 존재 | `## Ideal Usage` 헤딩 + tsx 코드 블록 1개 | ✅ 존재 |
| 2 | ④-1 | 코드 내 함수명이 실제 export와 일치 | `createStore`, `composePattern`, `select`, `activate`, `navigate`, `useAria`, `core`, `crud`, `history`, `getChildren`, `getEntity`, `ROOT_ID` — 모두 src/에서 grep 가능 | ✅ 12개 전부 확인 |
| 3 | ④-2 | overview.mdx 총 줄 수 | 100줄 이내 | ✅ 92줄 |
| 4 | ①-2 | 코드의 ❶~❻ 번호가 레이어 표와 대응 | Core(1), Axes(2), Patterns(3), Plugins(4), Hooks(5), UI(6) | ✅ 대응 |

완성도: 🟡

---

**전체 완성도:** 🟢 8/8 (retro 완료, 일치율 8/8)
