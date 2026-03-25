# Store Inspector

> NormalizedData 구조의 라이브 탐색 도구. Editor에서 조작 → Inspector에서 raw store 확인 → Log에서 커맨드 추적.

```tsx render
<StoreInspectorDemo />
```

## 패널 구성

| 패널 | 역할 |
|------|------|
| Editor (좌) | TreeGrid + CRUD + DnD + History로 데이터 조작 |
| Inspector (우) | storeToTree 변환 결과 실시간 표시 |
| Log (하) | dispatch된 Command 로그 |

## 파일

| 파일 | 역할 |
|------|------|
| `src/devtools/inspector/PageStoreInspector.tsx` | 전체 페이지 |
| `src/devtools/inspector/StoreInspectorDemo.tsx` | MD 임베드용 데모 |
| `src/devtools/inspector/PageStoreInspector.module.css` | 스타일 |
