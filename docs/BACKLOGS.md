## Backlog

- [x] vitest pool/isolate 최적화 → happy-dom 전환으로 해결 — forks→threads 전환, isolate:false 검토로 총 실행 시간 추가 감소 (현재 66초, fork 오버헤드 ~30초) — 출처: docs/0-inbox/16-[retro]test-lightweight.md (2026-03-21)
- [ ] Slider.tsx 트랙 클릭 → setValue 핸들러 추가 — PRD 인터페이스에 명시됐으나 미구현. ariaRegistry로 dispatch 가능 — 출처: docs/0-inbox/17-[retro]value-axis.md (2026-03-21)
- [ ] axe-core 접근성 테스트 추가 (slider, spinbutton) — aria-valuenow/min/max 정합성 자동 검증 — 출처: docs/0-inbox/17-[retro]value-axis.md (2026-03-21)
