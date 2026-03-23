# rename()

> 인라인 이름 편집 플러그인

## 커맨드

| 커맨드 | 설명 |
|--------|------|
| `startRename(nodeId)` | 지정 노드의 이름 편집 시작 |
| `confirmRename(nodeId, field, newValue)` | 편집 확정 |
| `cancelRename` | 편집 취소 |

## 주요 export

| export | 설명 |
|--------|------|
| `RENAME_ID = '__rename__'` | 리네임 상태 키 |
| `renameCommands` | 리네임 커맨드 집합 |

## 의존

- core store utils

## 설계 원칙

- Rich text 기각, plain text(rename) 편집만
