# Story Map Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CMS 유저스토리 맵(stories.md)을 Jeff Patton 스타일 2D 시각화 페이지로 렌더링한다.

**Architecture:** YAML 데이터 파일(계층 중첩) → Zod 스키마로 파싱/검증 → React 페이지에서 2D 그리드 렌더링. 가로축=Needs(여정 순서), 세로축=Stories→Features(상세도). 읽기 전용. 카드에 links 필드로 PRD/코드 연결 구조 준비.

**Tech Stack:** React, Zod, yaml (npm), CSS Modules, Vite `?raw` import

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `docs/2-areas/apps/cms/stories.yaml` | YAML SSOT — 계층 중첩 데이터 |
| Create | `src/pages/storymap/storyMapSchema.ts` | Zod 스키마 + YAML 파싱 함수 |
| Create | `src/pages/storymap/PageStoryMap.tsx` | 2D 스토리 맵 페이지 컴포넌트 |
| Create | `src/pages/storymap/PageStoryMap.module.css` | 스타일 (토큰 기반) |
| Modify | `src/router.tsx` | `/storymap` 라우트 추가 |

---

### Task 1: yaml 패키지 설치

**Files:**
- Modify: `package.json`

- [ ] **Step 1: yaml 패키지 추가**

```bash
pnpm add yaml
```

- [ ] **Step 2: 설치 확인**

```bash
pnpm ls yaml
```

Expected: `yaml 2.x.x` 출력

- [ ] **Step 3: 커밋**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add yaml parser dependency"
```

---

### Task 2: stories.yaml 데이터 파일 생성

**Files:**
- Create: `docs/2-areas/apps/cms/stories.yaml`

기존 `stories.md`의 데이터를 계층 중첩 YAML로 변환한다. `stories.md`는 그대로 유지.

- [ ] **Step 1: YAML 파일 작성**

```yaml
# Visual CMS — User Story Map
# SSOT for story map visualization. stories.md is kept for human reading.

personas:
  - id: admin
    name: 관리자
    description: 개발자 없이 콘텐츠를 관리하는 사람
  - id: designer
    name: 디자이너
    description: 섹션 템플릿을 만들고 등록하는 사람

needs:
  - id: N1
    persona: admin
    need: 콘텐츠를 편집하기 원한다
    description: 개발자 없이 텍스트/이미지 교체
    stories:
      - id: S1
        story: 편집할 페이지를 선택할 수 있다
        acceptance: 페이지 목록이 보이고, 선택하면 섹션 구성이 표시된다
        status: pending
        links: []
        features:
          - id: F1
            feature: 페이지 목록 표시 (썸네일 포함)
            screens: [W1]
          - id: F2
            feature: 페이지 선택 시 섹션 구성 로드
            screens: [W1, W2]
      - id: S2
        story: 섹션의 텍스트를 교체할 수 있다
        acceptance: 텍스트 필드를 선택하고 내용 변경. plain text만, 서식 불가
        status: pending
        links: []
        features:
          - id: F3
            feature: 텍스트 필드 선택 (클릭/키보드 네비게이션)
            screens: [W2]
          - id: F4
            feature: 캔버스에서 인라인 텍스트 편집 (Enter/F2로 진입)
            screens: [W2]
          - id: F5
            feature: 상세 패널에서 텍스트 편집 (폼 방식)
            screens: [W3]
      - id: S3
        story: 섹션의 이미지를 교체할 수 있다
        acceptance: 이미지 필드를 선택하고 다른 이미지로 교체
        status: pending
        links: []
        features:
          - id: F6
            feature: 아이콘 필드 선택
            screens: [W2]
          - id: F7
            feature: 아이콘 선택 그리드에서 교체
            screens: [W3]
      - id: S12
        story: 페이지의 메타 정보(SEO, URL, OG)를 편집할 수 있다
        acceptance: 메타 필드를 수정하면 프리뷰/배포에 반영
        status: pending
        links: []
        features:
          - id: F25
            feature: 페이지 메타 필드 편집 (SEO, URL, OG)
            screens: [W3]
      - id: S14
        story: 편집 작업을 되돌리거나 다시 실행할 수 있다
        acceptance: 실행취소/다시실행으로 실수 복구
        status: pending
        links: []
        features:
          - id: F30
            feature: 실행취소 (Cmd+Z)
            screens: [W2]
          - id: F31
            feature: 다시실행 (Cmd+Shift+Z)
            screens: [W2]
      - id: S15
        story: 노드를 복사하여 붙여넣을 수 있다
        acceptance: 같은 타입끼리만 붙여넣기 가능
        status: pending
        links: []
        features:
          - id: F32
            feature: 복사 (Cmd+C) / 잘라내기 (Cmd+X)
            screens: [W2]
          - id: F33
            feature: 붙여넣기 (Cmd+V) — 호환 타입만 허용
            screens: [W2]

  - id: N2
    persona: admin
    need: 페이지 구조를 변경하기 원한다
    description: 개발자 없이 섹션 추가/삭제/순서변경
    stories:
      - id: S4
        story: 템플릿에서 새 섹션을 골라 추가할 수 있다
        acceptance: 템플릿 목록에서 선택, 원하는 위치에 삽입
        status: pending
        links: []
        features:
          - id: F8
            feature: 섹션 추가 버튼 ([+])
            screens: [W1]
          - id: F9
            feature: 템플릿 목록에서 유형 선택
            screens: [W7]
          - id: F10
            feature: 선택한 위치에 새 섹션 삽입
            screens: [W1, W2]
      - id: S5
        story: 섹션을 삭제할 수 있다
        acceptance: 선택한 섹션 제거, 실수 방지 확인
        status: pending
        links: []
        features:
          - id: F11
            feature: 섹션 삭제 (Delete 키 또는 툴바)
            screens: [W2, W5]
          - id: F12
            feature: 최소 1개 섹션 유지 (삭제 차단)
            screens: [W2]
      - id: S6
        story: 섹션 순서를 변경할 수 있다
        acceptance: 드래그 또는 키보드로 섹션 위치 이동
        status: pending
        links: []
        features:
          - id: F13
            feature: 키보드로 섹션 순서 변경 (Cmd+↑↓)
            screens: [W1, W2]
          - id: F14
            feature: 플로팅 툴바에서 순서 변경 (↑↓ 버튼)
            screens: [W5]
      - id: S13
        story: 섹션 내 아이템(카드, 항목 등)을 추가/삭제/순서변경할 수 있다
        acceptance: 컬렉션 아이템 CRUD. 슬롯(고정 구조)은 변경 불가
        status: pending
        links: []
        features:
          - id: F26
            feature: 컬렉션 아이템 추가 ([+ 추가] 버튼)
            screens: [W5]
          - id: F27
            feature: 컬렉션 아이템 삭제 (Delete 키 또는 툴바)
            screens: [W2, W5]
          - id: F28
            feature: 컬렉션 아이템 순서 변경 (Cmd+↑↓)
            screens: [W2, W5]
          - id: F29
            feature: 아이템 복제 (Cmd+D)
            screens: [W2, W5]

  - id: N3
    persona: admin
    need: 변경 결과를 확인하고 배포하기 원한다
    description: 개발자 없이 프리뷰 + 라이브 반영
    stories:
      - id: S7
        story: 변경 결과를 프리뷰로 확인할 수 있다
        acceptance: 데스크톱/모바일 뷰포트 전환 가능
        status: pending
        links: []
        features:
          - id: F15
            feature: 뷰포트 전환 (모바일 375px / 태블릿 768px / 데스크톱 100%)
            screens: [W4]
          - id: F16
            feature: 프레젠트 모드 (크롬 숨기고 풀스크린 프리뷰)
            screens: [W4, W8]
      - id: S8
        story: 변경사항을 라이브에 배포할 수 있다
        acceptance: 변경 전/후 diff 확인 후 원클릭 배포
        status: pending
        links: []
        features:
          - id: F17
            feature: 변경 전/후 diff 확인
            screens: []
          - id: F18
            feature: 원클릭 배포
            screens: []

  - id: N4
    persona: admin
    need: 다국어 콘텐츠를 관리하기 원한다
    description: 개발자 없이 언어별 콘텐츠 전환
    stories:
      - id: S9
        story: 언어를 전환하여 해당 언어의 콘텐츠를 편집할 수 있다
        acceptance: 언어 드롭다운 선택 → 해당 언어 콘텐츠 표시 및 편집
        status: pending
        links: []
        features:
          - id: F19
            feature: 언어 드롭다운 전환
            screens: [W4, W3]
          - id: F20
            feature: 전환된 언어로 콘텐츠 즉시 반영
            screens: [W2, W3]
          - id: F21
            feature: 번역 시트 (모든 필드의 다국어 값 표로 관리)
            screens: [W6]

  - id: N5
    persona: designer
    need: 섹션 템플릿을 등록하기 원한다
    description: 만든 디자인을 관리자가 쓸 수 있게 등록
    stories:
      - id: S10
        story: 완성된 섹션 디자인을 템플릿으로 등록할 수 있다
        acceptance: 등록된 템플릿이 관리자의 템플릿 목록에 나타남
        status: pending
        links: []
        features:
          - id: F22
            feature: 섹션 템플릿 정의 및 등록
            screens: []

  - id: N6
    persona: designer
    need: 등록한 템플릿이 그대로 유지되기 원한다
    description: 관리자가 디자인을 깨뜨리지 못하는 보장
    stories:
      - id: S11
        story: 관리자가 편집할 때 디자인(레이아웃/색상/폰트)은 변경되지 않는다
        acceptance: 편집 가능 영역이 콘텐츠 필드로만 제한됨
        status: pending
        links: []
        features:
          - id: F23
            feature: 편집 가능 영역을 콘텐츠 필드로만 제한
            screens: [W2]
          - id: F24
            feature: 슬롯 구조 보호 (고정 자식의 삭제/추가/재배치 차단)
            screens: [W2]

screens:
  - id: W1
    name: 섹션 사이드바
  - id: W2
    name: 캔버스
  - id: W3
    name: 상세 패널
  - id: W4
    name: 상단 툴바
  - id: W5
    name: 플로팅 툴바
  - id: W6
    name: 번역 시트
  - id: W7
    name: 템플릿 선택
  - id: W8
    name: 프레젠트 모드

releases:
  - id: R1
    name: MVP
    description: 콘텐츠 편집 + 구조 변경 기본
    stories: [S1, S2, S3, S4, S5, S6, S11, S14, S15]
  - id: R2
    name: 프리뷰 & 배포
    stories: [S7, S8, S12, S13]
  - id: R3
    name: 다국어 & 템플릿
    stories: [S9, S10]
```

- [ ] **Step 2: 커밋**

```bash
git add docs/2-areas/apps/cms/stories.yaml
git commit -m "feat: add stories.yaml — story map SSOT in nested YAML"
```

---

### Task 3: Zod 스키마 + YAML 파서

**Files:**
- Create: `src/pages/storymap/storyMapSchema.ts`

- [ ] **Step 1: 스키마 + 파서 작성**

```ts
import { z } from 'zod'
import { parse as parseYaml } from 'yaml'

// ── Schema ──

const featureSchema = z.object({
  id: z.string(),
  feature: z.string(),
  screens: z.array(z.string()),
})

const linkSchema = z.object({
  label: z.string(),
  url: z.string(),
})

const storySchema = z.object({
  id: z.string(),
  story: z.string(),
  acceptance: z.string(),
  status: z.enum(['pending', 'done']),
  links: z.array(linkSchema).default([]),
  features: z.array(featureSchema),
})

const needSchema = z.object({
  id: z.string(),
  persona: z.string(),
  need: z.string(),
  description: z.string(),
  stories: z.array(storySchema),
})

const personaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})

const screenSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const releaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  stories: z.array(z.string()),
})

export const storyMapSchema = z.object({
  personas: z.array(personaSchema),
  needs: z.array(needSchema),
  screens: z.array(screenSchema),
  releases: z.array(releaseSchema),
})

export type StoryMap = z.infer<typeof storyMapSchema>
export type Need = z.infer<typeof needSchema>
export type Story = z.infer<typeof storySchema>
export type Feature = z.infer<typeof featureSchema>
export type Screen = z.infer<typeof screenSchema>
export type Release = z.infer<typeof releaseSchema>

// ── Parser ──

export function parseStoryMap(raw: string): StoryMap {
  const data = parseYaml(raw)
  return storyMapSchema.parse(data)
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/pages/storymap/storyMapSchema.ts
git commit -m "feat: add story map Zod schema and YAML parser"
```

---

### Task 4: 스토리 맵 페이지 컴포넌트

**Files:**
- Create: `src/pages/storymap/PageStoryMap.tsx`
- Create: `src/pages/storymap/PageStoryMap.module.css`

이 태스크는 메인 페이지 컴포넌트와 CSS를 함께 만든다. Jeff Patton 2D 레이아웃:
- 가로축: Need 컬럼 (여정 순서 = YAML 배열 순서)
- 세로축: 행 1 = Persona 라벨, 행 2 = Need 헤더, 행 3~N = Story 카드, 그 아래 Feature 카드
- 릴리즈 슬라이싱: 릴리즈 구분선

- [ ] **Step 1: CSS 모듈 작성**

```css
/* ═══════════════════════════════════════════
   StoryMap — Jeff Patton 2D layout
   ═══════════════════════════════════════════ */

/* --- base --- */

.sm {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--surface-base);
}

.sm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 var(--space-lg);
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
}

.sm-header__title {
  font-size: var(--type-caption-size);
  font-weight: var(--weight-semi);
  letter-spacing: 0.02em;
  color: var(--text-muted);
}

.sm-body {
  flex: 1;
  overflow: auto;
  padding: var(--space-xl);
}

.sm-grid {
  display: grid;
  gap: var(--space-lg);
  grid-auto-columns: minmax(200px, 280px);
  grid-auto-flow: column;
}

/* --- persona row --- */

.sm-persona {
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);

  font-size: var(--type-caption-size);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.sm-persona__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--tone-primary-dim);
  color: var(--tone-primary-base);

  font-size: var(--type-caption-size);
  font-weight: var(--weight-semi);
}

/* --- need header --- */

.sm-need {
  grid-row: 2;
  padding: var(--space-sm) var(--space-md);
  background: var(--tone-primary-dim);
  border-radius: var(--shape-sm-radius);

  font-size: var(--type-body-size);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.sm-need__id {
  font-size: var(--type-caption-size);
  color: var(--text-muted);
  margin-bottom: var(--space-xs);
}

/* --- story card --- */

.sm-story {
  padding: var(--space-sm) var(--space-md);
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--shape-sm-radius);
  cursor: default;
  transition: border-color var(--motion-normal-duration) var(--motion-normal-easing);
}

.sm-story:hover {
  border-color: var(--border-default);
}

.sm-story__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.sm-story__id {
  font-size: var(--type-caption-size);
  color: var(--text-muted);
}

.sm-story__status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sm-story__status--pending {
  background: var(--border-default);
}

.sm-story__status--done {
  background: var(--tone-success-base);
}

.sm-story__text {
  font-size: var(--type-body-size);
  color: var(--text-primary);
  line-height: var(--leading-snug);
}

/* --- feature card --- */

.sm-feature {
  padding: var(--space-xs) var(--space-sm);
  background: var(--surface-default);
  border: 1px solid var(--border-subtle);
  border-radius: var(--shape-xs-radius);

  font-size: var(--type-caption-size);
  color: var(--text-secondary);
  line-height: var(--leading-snug);
}

.sm-feature__id {
  color: var(--text-muted);
  margin-right: var(--space-xs);
}

.sm-feature__screens {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.sm-feature__screen-tag {
  padding: 1px var(--space-xs);
  background: var(--tone-neutral-dim);
  border-radius: var(--shape-xs-radius);

  font-size: 10px;
  font-weight: var(--weight-medium);
  color: var(--text-muted);
}

/* --- story column (groups story + its features vertically) --- */

.sm-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

/* --- release divider --- */

.sm-release {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
}

.sm-release__label {
  flex-shrink: 0;
  padding: var(--space-xs) var(--space-md);
  background: var(--tone-warning-dim);
  border-radius: var(--shape-xs-radius);

  font-size: var(--type-caption-size);
  font-weight: var(--weight-semi);
  color: var(--text-primary);
}

.sm-release__line {
  flex: 1;
  height: 1px;
  background: var(--border-default);
  border-style: dashed;
}

/* --- links (on card click) --- */

.sm-links {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
  flex-wrap: wrap;
}

.sm-links__item {
  padding: 1px var(--space-sm);
  background: var(--tone-primary-dim);
  border-radius: var(--shape-xs-radius);

  font-size: 10px;
  color: var(--tone-primary-base);
  text-decoration: none;
}

.sm-links__item:hover {
  background: var(--tone-primary-mid);
}

/* --- legend --- */

.sm-legend {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.sm-legend__item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);

  font-size: var(--type-caption-size);
  color: var(--text-muted);
}
```

- [ ] **Step 2: 페이지 컴포넌트 작성**

```tsx
import { useMemo } from 'react'
import { parseStoryMap } from './storyMapSchema'
import type { Need, Story, Feature, Release } from './storyMapSchema'
import css from './PageStoryMap.module.css'

import storiesRaw from '../../../docs/2-areas/apps/cms/stories.yaml?raw'

function StoryCard({ story }: { story: Story }) {
  return (
    <div className={css['sm-story']}>
      <div className={css['sm-story__header']}>
        <span className={css['sm-story__id']}>{story.id}</span>
        <span
          className={`${css['sm-story__status']} ${css[`sm-story__status--${story.status}`]}`}
        />
      </div>
      <div className={css['sm-story__text']}>{story.story}</div>
      {story.links.length > 0 && (
        <div className={css['sm-links']}>
          {story.links.map(link => (
            <a
              key={link.url}
              href={link.url}
              className={css['sm-links__item']}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className={css['sm-feature']}>
      <span className={css['sm-feature__id']}>{feature.id}</span>
      {feature.feature}
      {feature.screens.length > 0 && (
        <div className={css['sm-feature__screens']}>
          {feature.screens.map(s => (
            <span key={s} className={css['sm-feature__screen-tag']}>{s}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function NeedColumn({ need, releaseStories }: { need: Need; releaseStories: Set<string> }) {
  const persona = need.persona === 'admin' ? '관' : '디'

  // Split stories into current release vs rest
  const inRelease = need.stories.filter(s => releaseStories.has(s.id))
  const rest = need.stories.filter(s => !releaseStories.has(s.id))

  return (
    <div className={css['sm-column']}>
      {/* Persona badge */}
      <div className={css['sm-persona']}>
        <span className={css['sm-persona__badge']}>{persona}</span>
        {need.persona}
      </div>

      {/* Need header */}
      <div className={css['sm-need']}>
        <div className={css['sm-need__id']}>{need.id}</div>
        {need.need}
      </div>

      {/* Stories + nested features */}
      {inRelease.map(story => (
        <div key={story.id} className={css['sm-column']}>
          <StoryCard story={story} />
          {story.features.map(f => (
            <FeatureCard key={f.id} feature={f} />
          ))}
        </div>
      ))}

      {/* Stories outside first release (dimmed or separate section) */}
      {rest.map(story => (
        <div key={story.id} className={css['sm-column']}>
          <StoryCard story={story} />
          {story.features.map(f => (
            <FeatureCard key={f.id} feature={f} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function PageStoryMap() {
  const data = useMemo(() => parseStoryMap(storiesRaw), [])

  const firstRelease = data.releases[0]
  const releaseStories = useMemo(
    () => new Set(firstRelease?.stories ?? []),
    [firstRelease],
  )

  // Screen lookup for legend
  const screenMap = useMemo(
    () => new Map(data.screens.map(s => [s.id, s.name])),
    [data.screens],
  )

  return (
    <div className={css.sm}>
      <div className={css['sm-header']}>
        <span className={css['sm-header__title']}>USER STORY MAP</span>
        <div className={css['sm-legend']}>
          <div className={css['sm-legend__item']}>
            <span
              className={`${css['sm-story__status']} ${css['sm-story__status--pending']}`}
            />
            pending
          </div>
          <div className={css['sm-legend__item']}>
            <span
              className={`${css['sm-story__status']} ${css['sm-story__status--done']}`}
            />
            done
          </div>
          {data.screens.map(s => (
            <div key={s.id} className={css['sm-legend__item']}>
              <span className={css['sm-feature__screen-tag']}>{s.id}</span>
              {s.name}
            </div>
          ))}
        </div>
      </div>
      <div className={css['sm-body']}>
        <div className={css['sm-grid']}>
          {data.needs.map((need, i) => (
            <NeedColumn
              key={need.id}
              need={need}
              releaseStories={releaseStories}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/pages/storymap/
git commit -m "feat: add story map page — Jeff Patton 2D visualization"
```

---

### Task 5: 라우트 등록

**Files:**
- Modify: `src/router.tsx:15` (기존 라우트 목록에 추가)

- [ ] **Step 1: /storymap 라우트 추가**

`/chat` 라인 뒤에 추가:

```tsx
{ path: '/storymap', lazy: () => import('./pages/storymap/PageStoryMap').then(m => ({ Component: m.default })) },
```

- [ ] **Step 2: 커밋**

```bash
git add src/router.tsx
git commit -m "feat: register /storymap route"
```

---

### Task 6: 통합 검증

- [ ] **Step 1: TypeScript 검증**

```bash
pnpm typecheck
```

Expected: 에러 0

- [ ] **Step 2: Lint 검증**

```bash
pnpm lint
```

Expected: 에러 0

- [ ] **Step 3: 브라우저에서 /storymap 접속하여 시각 확인**

`pnpm dev` 후 `http://localhost:5173/storymap` 접속.

확인 사항:
- 6개 Need 컬럼이 가로로 배치되는가
- 각 컬럼 아래 Stories → Features 가 세로로 쌓이는가
- 카드에 ID, 텍스트, 상태 표시기가 보이는가
- Feature 카드에 screen 태그가 붙어있는가
- 헤더에 legend가 표시되는가

- [ ] **Step 4: 최종 커밋 (lint 수정 등)**

```bash
git add -A
git commit -m "fix: story map lint/type fixes"
```
