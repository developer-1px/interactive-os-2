## Backlog

- [x] vitest pool/isolate 최적화 → happy-dom 전환으로 해결 — forks→threads 전환, isolate:false 검토로 총 실행 시간 추가 감소 (현재 66초, fork 오버헤드 ~30초) — 출처: docs/0-inbox/16-[retro]test-lightweight.md (2026-03-21)
- [x] Slider.tsx 트랙 클릭 → setValue 핸들러 추가 — PRD 인터페이스에 명시됐으나 미구현. ariaRegistry로 dispatch 가능 — 출처: docs/0-inbox/17-[retro]value-axis.md (2026-03-21)
- [x] axe-core 접근성 테스트 추가 (slider, spinbutton) — aria-valuenow/min/max 정합성 자동 검증 — 출처: docs/0-inbox/17-[retro]value-axis.md (2026-03-21)
- [x] Slider 데모 키힌트 확장 — 트랙 클릭, Ctrl+Z undo 안내 추가 (구현은 완료, 키힌트만 누락) — 출처: walkthrough 대조 (2026-03-21)
- [x] Spinbutton 데모 키힌트 확장 — 직접 입력(클릭→타이핑), ▲▼ 버튼, Escape 취소, Ctrl+Z undo 안내 추가 (구현은 완료, 키힌트만 누락) — 출처: walkthrough 대조 (2026-03-21)
