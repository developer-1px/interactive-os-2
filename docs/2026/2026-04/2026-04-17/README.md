---
id: 1-projects/features/README
title: 'Features — PM Layer'
created: 2026-04-17
updated: 2026-04-17
summary: '1인 개발자용 feature 상태 DB. MEMORY(경험/원칙), PROGRESS(concept map), prds(스펙)과 별개로 **진행 상태·관계·수명주기**만 담는 얇은 레이어.'
legacy:
  status: active
  kind: readme
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Features — PM Layer

1인 개발자용 feature 상태 DB. MEMORY(경험/원칙), PROGRESS(concept map), prds(스펙)과 별개로 **진행 상태·관계·수명주기**만 담는 얇은 레이어.

## 파일 규약

- 위치: `docs/1-projects/features/{slug}.md` (하위 폴더 금지, `prds/` 제외)
- 파일명 = `{slug}.md`. 파일명과 frontmatter `slug` 일치 필수
- **frontmatter 필수**. 없으면 전체 뷰 파싱이 깨진다 (PRD N1)
- 본문 블록: `## Insights`, `## Decisions`, `## Gaps` (옵셔널)

## Frontmatter 스키마

```yaml
---
name: Visual CMS                    # 표시명
slug: visual-cms                    # 파일명과 일치
layer: service                      # service | engine | infra | process | design
status: operational                 # operational | prototype | concept | archived
maturity: 4                         # 1..5 (1=prototype, 5=polished)
parent: null                        # 또는 상위 feature slug (Initiative 계층)
deps: []                            # 의존 feature slug 배열
routes: [/]                         # 연결 라우트
prds: [docs/1-projects/cms/prds/...]
handoffs: [docs/0-inbox/handoff-...]
tags: [flatlayout, composite]
created: 2025-11
last_touched: 2026-04-15
---
```

`status` 값은 코드(`featuresSchema.ts`)의 enum에 맞춘 소문자 문자열만 사용. 이모지 매핑은 UI(`StatusIndicator`)가 담당한다 — 이모지/특수기호로 대체 금지 (PRD N2).

## 본문 블록

```markdown
## Insights
- 2026-03-15 · 피드백: preview 공간이 좁다 (출처: handoff-xxx.md)
- 2026-02-28 · 결정: FlatLayout 전환

## Decisions
- 2026-01-10 · resizer 미구현 유지 — 이유: 1차 범위 밖

## Gaps
- [ ] 모바일 대응
- [ ] 다국어
```

Insight 한 줄 문법: `{date} · {kind}: {text} (출처: {source})`. 날짜/종류/출처는 옵셔널, text만 필수.

## 운영

- `/features` 라우트 (TreeGrid + MasterDetail) — read-only
- `pnpm features` — PROGRESS.md의 `<!-- features:auto --> … <!-- /features:auto -->` 마커 구간을 현재 frontmatter 집계로 갱신. on-demand만, CI 금지 (PRD N6)
- 편집은 에디터에서 파일 직접 수정. 페이지 리로드 / HMR로 자동 반영

## 금지 (PRD ⑦ 요약)

- N1. frontmatter 없이 저장
- N2. status 이모지를 다른 기호(⚠️/★)로 대체
- N3. `pages/features`에서 `useAria`/`useAriaZone` 직접 사용 (UI 완성품만)
- N4. `addEventListener('keydown')` — KeyMap 선언만
- N5. TreeGrid `renderItem`에 `{}` 전달 (`getItemProps(id)` 필수)
- N6. `pnpm features`를 git hook/CI에 등록
- N7. MEMORY Features 32개 일괄 삭제 (점진 이관)
- N8. Score 가중치 하드코딩
- N9. InsightCard에 도메인 로직
- N10. SaaS write-back 동기화
- N11. frontmatter 편집 UI를 본 레이어에 포함 (1차 read-only)

## 용어

- **Feature** (대문자) — 이 레이어의 레코드
- **feature** (소문자) — 일반 "기능"

#kind/note #topic/features
