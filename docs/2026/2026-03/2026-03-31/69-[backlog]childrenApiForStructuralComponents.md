---
id: '0-inbox/69-[backlog]childrenApiForStructuralComponents'
title: 'Children API for Structural Components — 2026-03-31'
status: inbox
kind: backlog
created: 2026-03-31
updated: 2026-03-31
topics: [0-inbox, backlog]
relates: []
supersedes: []
---
# Children API for Structural Components — 2026-03-31

## 배경

APG 전수 전환(33/36) 완료 후, SDK 소비자 관점에서 발견된 API 인체공학 갭.

ui/ 컴포넌트는 **map 렌더**(데이터 중심)와 **하드코딩 래핑**(구조 중심) 두 가지 사용 패턴이 있다. 현재 AriaComponentProps는 map 렌더 전제로 설계되어, 구조 중심 use case에서 불필요한 NormalizedData 생성 ceremony가 발생한다.

## 핵심 원칙 (불변)

- 내부는 NormalizedData 단일 모델. 하나의 데이터 → N개 뷰.
- Radix 재구현이 아님. 우리 가치 = 단일 데이터 모델 위에서 인터랙티브 + 비인터랙티브 전부 표현.

## 분류 기준

| | map 렌더 (데이터) | 하드코딩 래핑 (구조) |
|---|---|---|
| 데이터 소스 | 런타임 데이터 (API, store) | 빌드타임 JSX (개발자 직접 작성) |
| 항목 수 | N개, 가변 | 고정 (2~5개) |
| 콘텐츠 위치 | store 안 (entity.data) | store 밖 (JSX children) |
| renderItem | 하나의 템플릿 x N | ID별 분기 or 외부 매핑 |

## 대상 컴포넌트

| 컴포넌트 | 이유 |
|---|---|
| **Accordion** | 각 패널이 이질적 JSX |
| **DisclosureGroup** | 각 disclosure 콘텐츠가 이질적 JSX |
| **TabList** | 각 탭 패널이 이질적 JSX (하이브리드 — CMS에서는 data 기반) |
| **Dialog** | 내부 콘텐츠가 매번 다른 JSX |
| **AlertDialog** | 메시지 + 액션 조합이 매번 다름 |

## 해결 방향

children API가 내부에서 NormalizedData로 자동 변환. engine + pattern 그대로 동작.

```tsx
// 소비자:
<Accordion defaultExpanded="billing">
  <Accordion.Section id="personal" title="Personal Info">
    <PersonalInfoForm />
  </Accordion.Section>
</Accordion>

// 내부: children → createStore({ entities, relationships }) 자동 변환
```

## 열린 질문

- 변환 레이어 위치: 각 컴포넌트? 공통 유틸? Aria primitive?
- TabList 하이브리드: data prop과 children prop 동시 지원 방식
- children에서 id를 어떻게 부여할 것인가 (명시? 자동 생성?)

## 다음 행동

/discuss → /prd → /go 파이프라인으로 진행 시 이 문서를 입력으로 사용.
