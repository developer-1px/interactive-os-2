---
id: 2-areas/harness/memory
title: 'Memory — 프로젝트 지식 영속화'
created: 2026-04-04
updated: 2026-04-04
summary: 'Memory는 강제력 ~50%. 매 세션 시작 시 MEMORY.md 인덱스가 로딩되지만, 개별 파일은 필요 시에만 읽힌다. **반복 3회 이상이면 feedback 승격, 기계적 감지 가능하면 훅 승격.**'
legacy:
  status: active
  kind: note
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Memory — 프로젝트 지식 영속화

> Memory는 강제력 ~50%. 매 세션 시작 시 MEMORY.md 인덱스가 로딩되지만, 개별 파일은 필요 시에만 읽힌다.
> **반복 3회 이상이면 feedback 승격, 기계적 감지 가능하면 훅 승격.**

## 위치

- 인덱스: `.claude/projects/-Users-user-Desktop-aria/memory/MEMORY.md`
- 파일: 같은 디렉토리에 `*.md`

## 타입

| 타입 | 용도 | 예시 |
|------|------|------|
| user | 사용자 프로필 | 역할, 선호, 전문성 |
| feedback | 행동 가이드 | 교정/확인된 접근법 |
| project | 프로젝트 사실 | 비전, 현재 상태, 결정 |
| reference | 외부 참조 | Linear, Grafana, Slack 위치 |

## 자가성장 경로

```
경험 DB (experience_db.md)
  ↓ 빈도 3회
feedback memory 승격
  ↓ 기계적 감지 가능
훅 승격 (/improve-skill이 판단)
```

## 현재 파일

| 파일 | 타입 | 내용 |
|------|------|------|
| experience_db.md | project | retro 경험 DB (도메인별, 빈도 추적) |
| feedback_progress_as_concept_map.md | feedback | PROGRESS.md = concept map |

## 원칙

- AI 추론만으로 저장 금지 — 사용자 확인 필수
- 코드에서 파악 가능한 것은 저장하지 않음
- 상대 날짜는 절대 날짜로 변환
- memory보다 훅/스킬이 우선

#kind/note #topic/harness
