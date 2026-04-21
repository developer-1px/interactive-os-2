---
title: main = PR-only 정책
date: 2026-04-21
type: policy
status: active
tags: [worktree, git, hook, policy]
---

# main = PR-only

main은 **로컬에서 쓰기 불가**. 모든 쓰기 연산은 worktree에서 수행하고, main 갱신 경로는 **GitHub PR 머지 + `git pull --ff-only`** 하나뿐이다.

## Why

- main이 로컬 commit/merge/rebase를 받으면 origin/main과 발산하기 쉽고 (직전 세션: 34 ahead / 5 behind 사례), PR 리뷰·CI·baseline 게이트가 우회된다.
- 훅이 "상황에 따라 예외"를 허용하면 (이전 `ALLOW_MAIN` envOverride) 에이전트가 우회를 학습한다. 죽은 스위치가 되거나, 살아있으면 게이트를 뚫는다.
- 격리를 코드로 강제하면 "어디서 작업하지?"에 항상 답이 있다 — worktree.

## 허용/금지 매트릭스 (main worktree 기준)

### 허용
- `git fetch`, `git pull --ff-only` — PR 머지 후 동기화
- `git log`, `git diff`, `git status`, `git show`, `git branch`, `git worktree ...` — 읽기 전용
- `git checkout <branch>` — 다른 브랜치로 이동
- 파일 읽기

### 금지 (PreToolUse:Bash 훅이 차단)
- `git commit`
- `git push`
- `git merge`
- `git rebase`
- `git cherry-pick`
- 파일 쓰기(Edit/Write) — `requireWorktree.mjs`가 이미 차단

### 우회 수단: 없음
`ALLOW_MAIN` envOverride를 제거했다. 작업하려면 worktree를 만든다.

## 표준 워크플로우

### 신규 작업
```bash
git worktree add .claude/worktrees/<slug> -b feat/<slug>
cd .claude/worktrees/<slug>
# ... 작업, 커밋, push ...
gh pr create --base main
```

### 머지도 worktree에서
main에 다른 브랜치를 머지해야 하면, **머지 전용 worktree**를 만든 뒤 거기서 머지하고 PR로 올린다. main 로컬에서 `git merge`는 차단된다.

### main 갱신
```bash
# PR 머지 후
git checkout main
git pull --ff-only
```

## 훅 구성

- `.claude/hooks/guardBash.mjs` — 위 금지 명령을 패턴 매칭으로 차단
- `.claude/hooks/requireWorktree.mjs` — main worktree에서 Edit/Write 차단
- 둘 다 PreToolUse로 등록 (`.claude/settings.json`)
