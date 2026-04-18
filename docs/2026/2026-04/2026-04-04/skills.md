---
id: 2-areas/harness/skills
type: note
slug: skills
title: 'Skills — 워크플로우 강제'
tags: [untagged]
created: 2026-04-04
updated: 2026-04-04
summary: '스킬은 강제력 ~80%. LLM의 행동 패턴을 구조화하지만, 텍스트 기반이라 100% 보장은 아님. 모든 스킬은 `.claude/skills/{name}/SKILL.md`.'
legacy:
  status: active
  kind: note
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Skills — 워크플로우 강제

> 스킬은 강제력 ~80%. LLM의 행동 패턴을 구조화하지만, 텍스트 기반이라 100% 보장은 아님.
> 모든 스킬은 `.claude/skills/{name}/SKILL.md`.

## 파이프라인 스킬 (순서)

개발 사이클의 순서를 형성하는 오케스트레이터 스킬들.

```
/discuss → /story → /prd → /go → /retro → /improve-skill → /close
```

| 스킬 | 역할 | 핵심 산출물 |
|------|------|-----------|
| `/discuss` | 문제 구조화 (TOC 11요소) | 이해도 테이블, 전환 판정 |
| `/story` | 유저스토리 맵 인터뷰 | 구현 단위 도출 |
| `/prd` | 구현 디테일 명세 | PRD 파일 (8단계) |
| `/go` | 자율 실행 오케스트레이터 | Plan → Execute → Verify |
| `/retrospect` | blind 역PRD + 갭 분류 + **판정** | 스킬 개선 판정 테이블 |
| `/improve-skill` | 스킬+훅 패치 전문 | 스킬/훅 수정 |
| `/close` | 마무리 (docs, commit, push) | 사이클 종료 |

## 품질 스킬

코드/디자인 품질을 높이는 스킬들.

| 스킬 | 트리거 | 역할 |
|------|--------|------|
| `/simplify` | 커밋 전 필수 | 코드 리뷰 — 재사용, 품질, 효율 |
| `/naming-audit` | /go verify | consistency + aptness 2축 감사 |
| `/design-implement` | CSS 작성 시 | ax() 12축 사용 강제 |
| `/screen-test` | 기능 완성 후 | 제품 수준 화면 검증 테스트 |
| `/demo-coverage` | 라우트별 | 분기 맵 → 데모 + 커버리지 |
| `/srp` | 300줄 초과 시 | 단일 책임 점검 + 분리 |
| `/fix` | 고장 시 | 자동 재현 → 디버깅 → 수정 |
| `/doubt` | 정리 단계 | 4단 필터로 불필요한 것 제거 |

## 문서/관리 스킬

| 스킬 | 역할 |
|------|------|
| `/explain` | 민토 피라미드 해설 문서 |
| `/publish` | Living Documentation 완전성 감사 |
| `/area` | Area MDX 갱신 |
| `/resource` | 외부 웹 검색 → docs/3-resources/ |
| `/inbox` | 요청을 docs/0-inbox/ 문서로 저장 |
| `/para` | inbox PARA 분류 |
| `/backlog` | "지금은 아닌 것" 저장/조회/꺼내기 |
| `/refactor-collect` | 프로젝트 전용 리팩토링 컨벤션 수집 |

## 기획 스킬

| 스킬 | 역할 |
|------|------|
| `/ideal` | 코드 usage, 저니맵 스케치 |
| `/conflict` | Evaporating Cloud — 트레이드오프 해소 |
| `/design-extract` | 레퍼런스 사이트 디자인 토큰 실측 추출 |
| `/improve` | 릴리즈 품질 루프 — Job 기준 평가 |

## 자가성장 루프

```
/retro 갭 발견
  ↓
판정: 🔧 스킬 패치 / ⚙️ 훅 추가 / ✅ 불필요
  ↓
/improve-skill 실행
  ↓
강제력 위계에 따라 수단 선택:
  기계적 감지 가능? → 훅 (100%)
  워크플로우 필요?  → 스킬 (~80%)
  배경 지식?       → memory (~50%)
```

#kind/note #topic/harness
