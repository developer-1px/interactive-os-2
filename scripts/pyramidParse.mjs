/**
 * Pyramid Parser — Mermaid SSOT → 하단 섹션 자동 생성
 *
 * Usage: node scripts/pyramidParse.mjs <pyramid-file.md>
 *
 * Mermaid `graph TD` 블록을 파싱하여:
 * - 노드 목록 테이블
 * - 산문 검증 테이블
 * - 통계
 * - 고아 노드
 * - 갭
 * 을 자동 생성하고 파일에 덮어쓴다.
 */

import { readFileSync, writeFileSync } from 'fs';

// ── 타입 ──

/** @typedef {{ id: string, type: string, content: string, group: string | null }} Node */
/** @typedef {{ from: string, to: string, label: string }} Edge */
/** @typedef {{ id: string, title: string, members: string[] }} Subgraph */

// ── Mermaid 파서 ──

function parseMermaid(mermaidBlock) {
  /** @type {Map<string, Node>} */
  const nodes = new Map();
  /** @type {Edge[]} */
  const edges = [];
  /** @type {Subgraph[]} */
  const subgraphs = [];

  const lines = mermaidBlock.split('\n');

  // subgraph 스택
  let currentSubgraph = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // 빈 줄, 주석, graph TD, style, end 스킵
    if (!line || line.startsWith('%%') || line.startsWith('graph ') || line.startsWith('style ')) continue;

    // subgraph 시작
    const subgraphMatch = line.match(/^subgraph\s+(\w+)\["(.+?)"\]/);
    if (subgraphMatch) {
      currentSubgraph = { id: subgraphMatch[1], title: subgraphMatch[2], members: [] };
      subgraphs.push(currentSubgraph);
      continue;
    }

    // subgraph 끝
    if (line === 'end') {
      currentSubgraph = null;
      continue;
    }

    // 엣지: A -->|"label"| B  또는  A -->|"label"| B["content"]
    const edgeMatch = line.match(
      /^(\w+)\s*-->\|"(.+?)"\|\s*(\w+)(?:\["(.+?)"\])?/
    );
    if (edgeMatch) {
      const [, fromId, label, toId, toContent] = edgeMatch;
      edges.push({ from: fromId, to: toId, label });

      // 엣지에서 인라인 노드 선언이 있으면 등록
      if (toContent && !nodes.has(toId)) {
        const { type, content } = parseNodeLabel(toContent);
        nodes.set(toId, { id: toId, type, content, group: currentSubgraph?.id ?? null });
        if (currentSubgraph) currentSubgraph.members.push(toId);
      }
      continue;
    }

    // 단독 노드 선언: A["content"]
    const nodeMatch = line.match(/^(\w+)\["(.+?)"\]/);
    if (nodeMatch) {
      const [, id, rawContent] = nodeMatch;
      if (!nodes.has(id)) {
        const { type, content } = parseNodeLabel(rawContent);
        nodes.set(id, { id, type, content, group: currentSubgraph?.id ?? null });
      }
      if (currentSubgraph) {
        if (!currentSubgraph.members.includes(id)) {
          currentSubgraph.members.push(id);
        }
      }
      continue;
    }
  }

  // subgraph 멤버십 보정: 노드의 group을 subgraph 기준으로 설정
  for (const sg of subgraphs) {
    for (const memberId of sg.members) {
      const node = nodes.get(memberId);
      if (node) node.group = sg.id;
    }
  }

  // subgraph Map for O(1) lookup
  const subgraphMap = new Map(subgraphs.map((sg) => [sg.id, sg]));

  return { nodes, edges, subgraphs, subgraphMap };
}

/** 노드 라벨에서 타입 접두사 분리: "S: 내용" → { type: "Situation", content: "내용" } */
function parseNodeLabel(label) {
  const typeMap = {
    S: 'Situation',
    C: 'Complication',
    Q: 'Question',
    A: 'Answer',
    P: 'Proof',
    D: 'Detail',
  };

  // R1/R2 타입
  const r1Match = label.match(/^R1:\s*(.+)$/);
  if (r1Match) {
    return { type: 'Undesired', content: r1Match[1] };
  }
  const r2Match = label.match(/^R2:\s*(.+)$/);
  if (r2Match) {
    return { type: 'Desired', content: r2Match[1] };
  }

  const prefixMatch = label.match(/^([SCQAPD]):\s*(.+)$/);
  if (prefixMatch) {
    return { type: typeMap[prefixMatch[1]] || prefixMatch[1], content: prefixMatch[2] };
  }
  return { type: '?', content: label };
}

// ── 생성기 ──

/**
 * 레벨별 노출 규칙 (타입 기준):
 *   1: S, C, Q, A — 엘리베이터 피치
 *   2: + subgraph 헤더 — 논거 뼈대
 *   3: + P (그룹 멤버) — 근거 전개
 *   4: + D (P 직속 1차) — 증거
 *   5: 전부 — 풀 트리
 */
const LEVEL_NAMES = [
  '',
  '핵심 주장',
  '논거 뼈대',
  '근거 전개',
  '증거',
  '풀 트리',
];

const SCQA_TYPES = new Set(['Situation', 'Complication', 'Question', 'Answer', 'Undesired', 'Desired']);

function generateLeveledProse(nodes, edges, subgraphs, subgraphMap) {
  // 루트 찾기 (공용)
  const allTargets = new Set(edges.map((e) => e.to));
  const sgMembers = new Set(subgraphs.flatMap((s) => s.members));
  const roots = [...nodes.values()]
    .filter((n) => !allTargets.has(n.id) && !sgMembers.has(n.id));
  if (roots.length === 0) {
    roots.push(...[...nodes.values()].filter((n) => n.type === 'Situation'));
  }

  function resolveLabel(id) {
    const node = nodes.get(id);
    if (node) return node.content;
    const sg = subgraphMap.get(id);
    if (sg) return `[${sg.title}]`;
    return id;
  }

  /** 노드 타입의 깊이 레벨 (Detail은 부모로부터의 D 깊이로 판정) */
  function nodeLevel(id, detailDepth) {
    const node = nodes.get(id);
    if (!node) return 2; // subgraph 헤더
    if (SCQA_TYPES.has(node.type)) return 1;
    if (node.type === 'Proof') return 3;
    if (node.type === 'Detail') return detailDepth <= 1 ? 4 : 5;
    return 5;
  }

  function generateAtLevel(level) {
    const lines = [];
    const visited = new Set();

    /** depth 기반 md 불릿 들여쓰기: depth 0 = "- ", depth 1 = "  - ", ... */
    function bullet(depth) {
      return '  '.repeat(depth) + '- ';
    }

    const SCQ_TYPES = new Set(['Situation', 'Complication', 'Question', 'Undesired', 'Desired']);

    function dfs(nodeId, depth, detailDepth) {
      const outEdges = edges.filter((e) => e.from === nodeId);
      const fromNode = nodes.get(nodeId);
      const fromIsSCQ = fromNode && SCQ_TYPES.has(fromNode.type);

      for (const edge of outEdges) {
        const targetNode = nodes.get(edge.to);
        const targetSg = subgraphMap.get(edge.to);

        // R1: S/C/Q 간 연결은 같은 depth (들여쓰지 않음)
        const targetIsSCQ = targetNode && SCQ_TYPES.has(targetNode.type);
        const childDepth = (fromIsSCQ && targetIsSCQ) ? depth : depth + 1;

        if (targetSg) {
          if (level >= 2) {
            lines.push(`${bullet(depth)}**${edge.label}** [${targetSg.title}]`);
          }
          if (level >= 3) {
            for (const memberId of targetSg.members) {
              const member = nodes.get(memberId);
              if (member && member.type === 'Proof') {
                lines.push(`${bullet(depth + 1)}${member.content}`);
              }
            }
            for (const memberId of targetSg.members) {
              if (!visited.has(memberId)) {
                visited.add(memberId);
                dfs(memberId, depth + 1, 0);
              }
            }
          }
        } else if (targetNode) {
          const nextDD = targetNode.type === 'Detail' ? detailDepth + 1 : 0;
          const tLevel = nodeLevel(edge.to, nextDD);
          if (tLevel <= level) {
            lines.push(`${bullet(depth)}**${edge.label}** ${targetNode.content}`);
            if (!visited.has(edge.to)) {
              visited.add(edge.to);
              dfs(edge.to, targetIsSCQ ? depth : depth + 1, nextDD);
            }
          }
        }
      }
    }

    for (const root of roots) {
      if (nodeLevel(root.id, 0) <= level) {
        lines.push(`- ${resolveLabel(root.id)}`);
        visited.add(root.id);
        dfs(root.id, 0, 0);
      }
    }

    return lines;
  }

  // 5단계 모두 생성
  const sections = [];
  for (let lv = 1; lv <= 5; lv++) {
    const proseLines = generateAtLevel(lv);
    sections.push(`### Lv.${lv} ${LEVEL_NAMES[lv]}\n\n${proseLines.join('\n')}`);
  }

  return `## 산문 검증\n\n${sections.join('\n\n')}`;
}

function generateStatistics(nodes, edges) {
  const counts = {};
  for (const node of nodes.values()) {
    counts[node.type] = (counts[node.type] || 0) + 1;
  }

  const typeLabels = {
    Situation: 'S',
    Complication: 'C',
    Question: 'Q',
    Undesired: 'R1',
    Desired: 'R2',
    Answer: 'A',
    Proof: 'P',
    Detail: 'D',
  };

  const summary = Object.entries(typeLabels)
    .map(([type, label]) => `${label}${counts[type] || 0}`)
    .join(' ');

  const lines = [
    '## 통계',
    '',
    `📐 피라미드 현황: ${summary}`,
    `📊 엣지: ${edges.length}개`,
  ];

  return lines.join('\n');
}

function generateOrphanNodes(nodes, edges, subgraphs, subgraphMap) {
  // 엣지에 한 번도 등장하지 않는 노드 = 고아
  // 단, subgraph 멤버는 부모→subgraph 엣지로 간접 연결된 것이므로 제외
  const connected = new Set();
  for (const edge of edges) {
    connected.add(edge.from);
    connected.add(edge.to);
    // subgraph 대상 엣지면 멤버도 연결된 것으로 처리
    const sg = subgraphMap.get(edge.to);
    if (sg) sg.members.forEach((m) => connected.add(m));
    const sgFrom = subgraphMap.get(edge.from);
    if (sgFrom) sgFrom.members.forEach((m) => connected.add(m));
  }

  const orphans = [...nodes.values()].filter((n) => !connected.has(n.id));

  const lines = ['## 고아 노드', ''];

  if (orphans.length === 0) {
    lines.push('없음');
  } else {
    lines.push('| ID | 타입 | 내용 |');
    lines.push('|----|------|------|');
    for (const node of orphans) {
      lines.push(`| ${node.id} | ${node.type} | ${node.content} |`);
    }
  }

  return lines.join('\n');
}

function generateGaps(nodes, edges, subgraphs, subgraphMap) {
  const lines = ['## 갭', ''];

  /** 엣지 대상이 subgraph이면 멤버 노드로 확장 */
  function resolveTargets(fromId) {
    return edges
      .filter((e) => e.from === fromId)
      .flatMap((e) => {
        const sg = subgraphMap.get(e.to);
        if (sg) return sg.members.map((m) => nodes.get(m)).filter(Boolean);
        const node = nodes.get(e.to);
        return node ? [node] : [];
      });
  }

  // A가 있는데 P가 부족한 경우
  const answers = [...nodes.values()].filter((n) => n.type === 'Answer');
  const proofs = [...nodes.values()].filter((n) => n.type === 'Proof');

  for (const a of answers) {
    const aProofs = resolveTargets(a.id).filter((n) => n.type === 'Proof');
    if (aProofs.length < 2) {
      lines.push(`- [ ] ${a.id}의 P 부족 (${aProofs.length}개) — MECE를 위해 2개 이상 필요`);
    }
  }

  // P가 있는데 D가 없는 경우
  for (const p of proofs) {
    const targets = resolveTargets(p.id);
    const hasDetails = targets.some((n) => n.type === 'Detail');
    const hasSubgraph = edges.some((e) => e.from === p.id && subgraphs.some((s) => s.id === e.to));
    const hasProofChild = targets.some((n) => n.type === 'Proof'); // P→P 연역 체인
    if (!hasDetails && !hasSubgraph && !hasProofChild) {
      lines.push(`- [ ] ${p.id}에 D 없음 — 구체적 예시/데이터 필요`);
    }
  }

  // S, C, Q, A 최소 1개씩
  const typeChecks = [
    ['Situation', 'S'],
    ['Complication', 'C'],
    ['Question', 'Q'],
    ['Answer', 'A'],
  ];
  for (const [type, label] of typeChecks) {
    if (![...nodes.values()].some((n) => n.type === type)) {
      lines.push(`- [ ] ${label} 없음 — 피라미드 필수 요소`);
    }
  }

  // ── 비대 감지 ──

  // 1. 한 부모 아래 직속 자식 5개 이상
  const childCount = new Map();
  for (const edge of edges) {
    childCount.set(edge.from, (childCount.get(edge.from) || 0) + 1);
  }
  for (const [parentId, count] of childCount) {
    if (count >= 5) {
      const parentNode = nodes.get(parentId);
      const label = parentNode ? `${parentId}(${parentNode.content.slice(0, 20)}…)` : parentId;
      lines.push(`- [ ] ⚖️ ${label} 아래 자식 ${count}개 — 재배치 검토`);
    }
  }

  // 깊이(drilldown)는 정상, 팬아웃(직속 자식)만 감지

  if (lines.length === 2) {
    lines.push('없음');
  }

  return lines.join('\n');
}

// ── 메인 ──

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/pyramidParse.mjs <pyramid-file.md>');
    process.exit(1);
  }

  const content = readFileSync(filePath, 'utf-8');

  // mermaid 블록 추출
  const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/);
  if (!mermaidMatch) {
    console.error('No ```mermaid block found');
    process.exit(1);
  }

  const mermaidBlock = mermaidMatch[1];
  const { nodes, edges, subgraphs, subgraphMap } = parseMermaid(mermaidBlock);

  console.log(`Parsed: ${nodes.size} nodes, ${edges.length} edges, ${subgraphs.length} subgraphs`);

  // frontmatter + 제목 + mermaid 블록까지 보존
  const mermaidEnd = content.indexOf('```', content.indexOf('```mermaid') + 10) + 3;
  const preserved = content.slice(0, mermaidEnd);

  // 하단 생성
  const generated = [
    '',
    '<!-- 이하 자동 생성 — 직접 수정 금지 -->',
    '',
    generateLeveledProse(nodes, edges, subgraphs, subgraphMap),
    '',
    generateStatistics(nodes, edges),
    '',
    generateOrphanNodes(nodes, edges, subgraphs, subgraphMap),
    '',
    generateGaps(nodes, edges, subgraphs, subgraphMap),
    '',
  ].join('\n');

  writeFileSync(filePath, preserved + generated);
  console.log(`Written: ${filePath}`);
}

main();
