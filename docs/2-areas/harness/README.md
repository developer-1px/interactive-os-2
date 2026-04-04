# Claude Harness — Area Overview

> AI 협업의 품질을 **기계적으로 강제**하는 하네스 시스템.
> CLAUDE.md/Memory는 참고 수준(~50%), 스킬은 워크플로우 강제(~80%), 훅은 기계적 차단(100%).

## 강제력 위계

```
훅 (100%) > 스킬 (~80%) > CLAUDE.md/Memory (~50%)
```

## 구성 요소

| 구성 | 파일 위치 | 수량 | 역할 |
|------|----------|------|------|
| [Hooks](./hooks.md) | `.claude/hooks/` | 11개 | 기계적 차단/피드백 |
| [Skills](./skills.md) | `.claude/skills/` | 29개 | 워크플로우 오케스트레이션 |
| [Settings](./settings.md) | `.claude/settings.json` | 1개 | 훅 등록, 플러그인 설정 |
| [CLAUDE.md](./claude-md.md) | `.claude/CLAUDE.md` | 1개 | 규칙/아키텍처 레퍼런스 |
| [Memory](./memory.md) | `.claude/projects/*/memory/` | 2+개 | 프로젝트 지식 영속화 |

## 3계층 방어선

```
Pre (차단)  ──→  Post (피드백)  ──→  Stop (최종 게이트)
  5개 훅           5개 훅              1개 훅
  코드 작성 시     작성 직후           작업 완료 시
  위반 → block    경고 → stderr       테스트 미실행 → block
```

## 자가성장 파이프라인

```
/go(구현) → /retro(갭 분석 + 판정) → /improve-skill(스킬+훅 패치) → /close(마무리)
```

retro가 갭을 발견하면, improve-skill이 강제력 위계에 따라 훅(기계적) 또는 스킬(워크플로우)을 패치한다.
