> ✅ 완료 — 2026-03-29

# listboxGrouped APG 구조 불일치 — 2026-03-28

## 배경

APG Listbox Grouped Example의 실제 HTML을 확인한 결과, 현재 구현과 구조가 다르다.

**APG 원본:**
```html
<div role="listbox">
  <ul role="group" aria-labelledby="cat1">
    <li role="presentation" id="cat1">Land</li>  ← 레이블은 presentation
    <li role="option">Cat</li>
    <li role="option">Dog</li>
  </ul>
  <ul role="group" aria-labelledby="cat2">
    <li role="presentation" id="cat2">Water</li>
    <li role="option">Dolphin</li>
  </ul>
</div>
```

**현재 구현:**
- 그룹 부모 노드에 `role="group"` (childRole 함수)
- 그룹 레이블이 navigate 대상에 포함됨 (ArrowDown으로 레이블에 도달)
- `ul[role="group"]` wrapper가 없음 — flat하게 렌더링

## 내용

1. **그룹 레이블을 navigate에서 제외** — role="presentation"이므로 포커스 불가, ArrowDown이 건너뛰어야 함
2. **ul[role="group"] wrapper 렌더링** — Aria.Item이 그룹 부모일 때 자식들을 `role="group"` 컨테이너로 감싸야 함
3. **aria-labelledby 연결** — group의 aria-labelledby가 presentation label의 id를 참조

이건 store의 getVisibleNodes에서 그룹 부모를 "구조적 컨테이너"로 인식하고 navigate에서 스킵하는 메커니즘이 필요. 또는 Aria.Item render 함수에서 group wrapper를 직접 렌더링하는 방식.

## 검증

- axe 접근성 검사 통과
- ArrowDown이 그룹 레이블을 건너뛰고 첫 option으로 이동
- role="group"에 aria-labelledby 설정 확인
- APG 원본과 동일한 DOM 구조

## 출처

2026-03-28 세션 — APG 원본 HTML 확인 결과
