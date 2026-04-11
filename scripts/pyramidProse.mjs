/**
 * Pyramid Prose — 파싱 결과 → 산문 검증 + 통계 + 고아 + 갭
 */

// @FIXME(srp): generateGaps는 분석 로직으로 별도 파일 후보 — 갭 로직이 더 복잡해지면 분리

// ── 공용 상수 (pyramidParse에서 공유) ──

export const TYPE_LABELS = {
  Situation: 'S',
  Complication: 'C',
  Question: 'Q',
  Undesired: 'R1',
  Desired: 'R2',
  Answer: 'A',
  Takeaway: 'K',
  Proof: 'P',
  Detail: 'D',
};

export const SCQA_TYPES = new Set(['Situation', 'Complication', 'Question', 'Answer', 'Takeaway', 'Undesired', 'Desired']);

// ── 공용 유틸 ──

/** edges 배열에서 from→Edge[] 인덱스를 한 번에 생성 */
export function buildOutEdgesMap(edges) {
  /** @type {Map<string, import('./pyramidParse.mjs').Edge[]>} */
  const map = new Map();
  for (const edge of edges) {
    const list = map.get(edge.from);
    if (list) list.push(edge);
    else map.set(edge.from, [edge]);
  }
  return map;
}

/** 루트 노드 찾기: 엣지 대상이 아니고 subgraph 멤버도 아닌 노드 */
export function findRoots(nodes, edges, subgraphs) {
  const allTargets = new Set(edges.map((e) => e.to));
  const sgMembers = new Set(subgraphs.flatMap((s) => s.members));
  const roots = [...nodes.values()]
    .filter((n) => !allTargets.has(n.id) && !sgMembers.has(n.id));
  if (roots.length === 0) {
    roots.push(...[...nodes.values()].filter((n) => n.type === 'Situation'));
  }
  return roots;
}

// ── 산문 생성 ──

const LEVEL_NAMES = [
  '',
  '메시지 흐름',
  '전체 글',
];

export function generateLeveledProse(nodes, edges, subgraphs, subgraphMap) {
  const outEdgesMap = buildOutEdgesMap(edges);
  const roots = findRoots(nodes, edges, subgraphs);

  function nodeLevel(id) {
    const node = nodes.get(id);
    if (!node) return 1;
    if (SCQA_TYPES.has(node.type)) return 1;
    return 2;
  }

  function generateAtLevel(level) {
    const lines = [];
    const visited = new Set();

    function bullet(depth) {
      return '  '.repeat(depth) + '- ';
    }

    const introOrder = [];
    const introEdgeMap = new Map();
    const bfsQueue = roots.map((r) => r.id);
    const bfsVisited = new Set();

    while (bfsQueue.length > 0) {
      const nodeId = bfsQueue.shift();
      if (bfsVisited.has(nodeId)) continue;
      const node = nodes.get(nodeId);
      if (!node || !SCQA_TYPES.has(node.type)) continue;
      bfsVisited.add(nodeId);
      introOrder.push(nodeId);

      for (const edge of outEdgesMap.get(nodeId) || []) {
        const target = nodes.get(edge.to);
        if (target && SCQA_TYPES.has(target.type) && !bfsVisited.has(edge.to)) {
          if (!introEdgeMap.has(edge.to)) {
            introEdgeMap.set(edge.to, edge);
          }
          bfsQueue.push(edge.to);
        }
      }
    }

    function dfs(nodeId, depth) {
      for (const edge of outEdgesMap.get(nodeId) || []) {
        const targetNode = nodes.get(edge.to);
        const targetSg = subgraphMap.get(edge.to);

        if (targetNode && SCQA_TYPES.has(targetNode.type)) continue;

        if (targetSg) {
          lines.push(`${bullet(depth + 1)}**${edge.label}** [${targetSg.title}]`);
          if (level >= 2) {
            for (const memberId of targetSg.members) {
              if (visited.has(memberId)) continue;
              const member = nodes.get(memberId);
              if (!member) continue;
              visited.add(memberId);
              lines.push(`${bullet(depth + 2)}${member.content}`);
              dfs(memberId, depth + 2);
            }
          }
        } else if (targetNode) {
          const tLevel = nodeLevel(edge.to);
          if (tLevel <= level && !visited.has(edge.to)) {
            visited.add(edge.to);
            lines.push(`${bullet(depth + 1)}**${edge.label}** ${targetNode.content}`);
            dfs(edge.to, depth + 1);
          }
        }
      }
    }

    const HEADING_TYPES = new Set(['Question', 'Answer', 'Undesired', 'Desired']);

    for (const nodeId of introOrder) {
      if (nodeLevel(nodeId) > level) continue;
      visited.add(nodeId);
      const node = nodes.get(nodeId);
      const inEdge = introEdgeMap.get(nodeId);
      const prefix = inEdge ? `**${inEdge.label}** ` : '';

      if (level >= 2 && HEADING_TYPES.has(node.type)) {
        const headingLevel = node.type === 'Question' ? '##' : '###';
        lines.push('');
        lines.push(`${headingLevel} ${prefix}${node.content}`);
        lines.push('');
      } else {
        lines.push(`${bullet(0)}${prefix}${node.content}`);
      }
      dfs(nodeId, 0);
    }

    return lines;
  }

  const sections = [];
  for (let lv = 1; lv <= 2; lv++) {
    const proseLines = generateAtLevel(lv);
    sections.push(`### Lv.${lv} ${LEVEL_NAMES[lv]}\n\n${proseLines.join('\n')}`);
  }

  return `## 산문 검증\n\n${sections.join('\n\n')}`;
}

// ── 통계 ──

export function generateStatistics(nodes, edges) {
  const counts = {};
  for (const node of nodes.values()) {
    counts[node.type] = (counts[node.type] || 0) + 1;
  }

  const summary = Object.entries(TYPE_LABELS)
    .map(([type, label]) => `${label}${counts[type] || 0}`)
    .join(' ');

  return [
    '## 통계',
    '',
    `📐 피라미드 현황: ${summary}`,
    `📊 엣지: ${edges.length}개`,
  ].join('\n');
}

// ── 고아 노드 ──

export function generateOrphanNodes(nodes, edges, subgraphs, subgraphMap) {
  const connected = new Set();
  for (const edge of edges) {
    connected.add(edge.from);
    connected.add(edge.to);
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

// ── 갭 감지 ──

export function generateGaps(nodes, edges, subgraphs, subgraphMap) {
  const lines = ['## 갭', ''];
  const outEdgesMap = buildOutEdgesMap(edges);

  function resolveTargets(fromId) {
    return (outEdgesMap.get(fromId) || [])
      .flatMap((e) => {
        const sg = subgraphMap.get(e.to);
        if (sg) return sg.members.map((m) => nodes.get(m)).filter(Boolean);
        const node = nodes.get(e.to);
        return node ? [node] : [];
      });
  }

  const answers = [...nodes.values()].filter((n) => n.type === 'Answer');
  const proofs = [...nodes.values()].filter((n) => n.type === 'Proof');

  for (const a of answers) {
    const aProofs = resolveTargets(a.id).filter((n) => n.type === 'Proof');
    if (aProofs.length < 2) {
      lines.push(`- [ ] ${a.id}의 P 부족 (${aProofs.length}개) — MECE를 위해 2개 이상 필요`);
    }
  }

  for (const p of proofs) {
    const targets = resolveTargets(p.id);
    const hasDetails = targets.some((n) => n.type === 'Detail');
    const outEdges = outEdgesMap.get(p.id) || [];
    const hasSubgraph = outEdges.some((e) => subgraphs.some((s) => s.id === e.to));
    const hasProofChild = targets.some((n) => n.type === 'Proof');
    if (!hasDetails && !hasSubgraph && !hasProofChild) {
      lines.push(`- [ ] ${p.id}에 D 없음 — 구체적 예시/데이터 필요`);
    }
  }

  const presentTypes = new Set([...nodes.values()].map((n) => n.type));
  for (const [type, label] of [['Situation', 'S'], ['Complication', 'C'], ['Question', 'Q'], ['Answer', 'A']]) {
    if (!presentTypes.has(type)) {
      lines.push(`- [ ] ${label} 없음 — 피라미드 필수 요소`);
    }
  }

  // 비대 감지
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

  // 형제 깊이 불균형
  const depthCache = new Map();
  function subtreeDepth(nodeId, inProgress = new Set()) {
    if (depthCache.has(nodeId)) return depthCache.get(nodeId);
    if (inProgress.has(nodeId)) return 0;
    inProgress.add(nodeId);
    const children = (outEdgesMap.get(nodeId) || []).map((e) => e.to);
    if (children.length === 0) { depthCache.set(nodeId, 0); return 0; }
    const maxChild = Math.max(...children.map((c) => subtreeDepth(c, inProgress)));
    const depth = 1 + maxChild;
    depthCache.set(nodeId, depth);
    inProgress.delete(nodeId);
    return depth;
  }

  for (const [parentId] of childCount) {
    const children = (outEdgesMap.get(parentId) || []).map((e) => e.to);
    if (children.length < 2) continue;
    const structural = children.filter((c) => {
      const node = nodes.get(c);
      if (!node) return true;
      if (node.type === 'Detail' && !(outEdgesMap.get(c)?.length)) return false;
      return true;
    });
    if (structural.length < 2) continue;
    const siblingDepths = structural.map((c) => ({ id: c, depth: subtreeDepth(c) }));
    const maxDepth = Math.max(...siblingDepths.map((d) => d.depth));
    const minDepth = Math.min(...siblingDepths.map((d) => d.depth));
    const diff = maxDepth - minDepth;
    if (diff >= 3) {
      const parentNode = nodes.get(parentId);
      const label = parentNode ? `${parentId}(${parentNode.content.slice(0, 20)}…)` : parentId;
      const deepest = siblingDepths.filter((d) => d.depth === maxDepth).map((d) => d.id).join(',');
      const shallowest = siblingDepths.filter((d) => d.depth === minDepth).map((d) => d.id).join(',');
      lines.push(`- [ ] 📏 ${label} 자식 깊이 불균형 — ${deepest}(깊이${maxDepth}) vs ${shallowest}(깊이${minDepth}), 차이 ${diff}`);
    }
  }

  // 타입 위계 depth 검증
  const roots = findRoots(nodes, edges, subgraphs);
  const graphDepth = new Map();
  const bfsQ = roots.map((n) => ({ id: n.id, depth: 0 }));
  while (bfsQ.length > 0) {
    const { id, depth } = bfsQ.shift();
    if (graphDepth.has(id)) continue;
    graphDepth.set(id, depth);
    for (const edge of outEdgesMap.get(id) || []) {
      const targetSg = subgraphMap.get(edge.to);
      if (targetSg) {
        for (const memberId of targetSg.members) {
          if (!graphDepth.has(memberId)) {
            bfsQ.push({ id: memberId, depth: depth + 1 });
          }
        }
      } else if (!graphDepth.has(edge.to)) {
        bfsQ.push({ id: edge.to, depth: depth + 1 });
      }
    }
  }

  const typeDepths = new Map();
  for (const [id, node] of nodes) {
    const d = graphDepth.get(id);
    if (d === undefined) continue;
    const bucket = typeDepths.get(node.type) || [];
    bucket.push({ id, depth: d });
    typeDepths.set(node.type, bucket);
  }

  for (const [type, entries] of typeDepths) {
    if (entries.length < 2) continue;
    const depthValues = entries.map((e) => e.depth);
    const min = Math.min(...depthValues);
    const max = Math.max(...depthValues);
    if (max - min >= 3) {
      const label = TYPE_LABELS[type] || type;
      const shallow = entries.filter((e) => e.depth === min).map((e) => `${e.id}@${e.depth}`).join(',');
      const deep = entries.filter((e) => e.depth === max).map((e) => `${e.id}@${e.depth}`).join(',');
      lines.push(`- [ ] 🏗️ ${label} 타입 위계 불일치 — ${shallow} vs ${deep}, depth 차이 ${max - min}`);
    }
  }

  // 5. 슬라이드 밸런스 — A 노드별 자손 수 비교
  // DFS로 각 A 노드의 non-SCQA 자손 수를 센다
  function countDescendants(nodeId, visited = new Set()) {
    let count = 0;
    for (const edge of outEdgesMap.get(nodeId) || []) {
      const target = nodes.get(edge.to);
      const sg = subgraphMap.get(edge.to);
      if (sg) {
        for (const memberId of sg.members) {
          if (visited.has(memberId)) continue;
          visited.add(memberId);
          count++;
          count += countDescendants(memberId, visited);
        }
      } else if (target && !SCQA_TYPES.has(target.type) && !visited.has(edge.to)) {
        visited.add(edge.to);
        count++;
        count += countDescendants(edge.to, visited);
      }
    }
    return count;
  }

  // 같은 부모를 공유하는 A 노드끼리 비교
  const aNodes = [...nodes.values()].filter((n) => n.type === 'Answer');
  const aByParent = new Map();
  for (const edge of edges) {
    const target = nodes.get(edge.to);
    if (target && target.type === 'Answer') {
      const siblings = aByParent.get(edge.from) || [];
      siblings.push(target.id);
      aByParent.set(edge.from, siblings);
    }
  }

  for (const [parentId, siblingIds] of aByParent) {
    if (siblingIds.length < 2) continue;
    const counts = siblingIds.map((id) => ({ id, count: countDescendants(id) }));
    const maxCount = Math.max(...counts.map((c) => c.count));
    const minCount = Math.min(...counts.map((c) => c.count));
    if (minCount === 0) continue;
    const ratio = maxCount / minCount;
    if (ratio >= 3 && maxCount >= 10) {
      const heavy = counts.filter((c) => c.count === maxCount).map((c) => `${c.id}(${c.count}줄)`).join(',');
      const light = counts.filter((c) => c.count === minCount).map((c) => `${c.id}(${c.count}줄)`).join(',');
      lines.push(`- [ ] 📊 슬라이드 밸런스 — ${heavy} vs ${light}, ${ratio.toFixed(1)}배 차이. 무거운 쪽 서브 슬라이드 분할 검토`);
    }
  }

  // 단독 A 노드도 절대 크기로 검사 (자손 15개 이상이면 한 슬라이드에 안 들어감)
  for (const a of aNodes) {
    const count = countDescendants(a.id);
    if (count >= 15) {
      const label = `${a.id}(${a.content.slice(0, 25)}…)`;
      lines.push(`- [ ] 📊 ${label} 자손 ${count}개 — 서브 슬라이드 분할 검토`);
    }
  }

  // 역의존 + 도달 불가
  // S → C → R1/R2 → Q → A → P → D → K
  const typeRank = {
    Situation: 0, Complication: 1,
    Undesired: 2, Desired: 2,
    Question: 3, Answer: 4,
    Proof: 5, Detail: 6, Takeaway: 7,
  };

  for (const edge of edges) {
    const fromNode = nodes.get(edge.from);
    const toNode = nodes.get(edge.to);
    if (!fromNode || !toNode) continue;
    const fromRank = typeRank[fromNode.type];
    const toRank = typeRank[toNode.type];
    if (fromRank === undefined || toRank === undefined) continue;
    if (fromRank === toRank) continue;
    // R1/R2 → Q는 정상 (R1/R2가 Q 앞). Q → A도 정상.
    // Q → R1/R2는 역의존 (Q가 R1/R2 뒤이므로 Q에서 R1으로 가면 역행)
    if (fromRank > toRank) {
      lines.push(`- [ ] 🔄 역의존 — ${edge.from}(${TYPE_LABELS[fromNode.type]}) → ${edge.to}(${TYPE_LABELS[toNode.type]}), ${TYPE_LABELS[fromNode.type]}→${TYPE_LABELS[toNode.type]}는 위계 역행`);
    }
  }

  const questions = [...nodes.values()].filter((n) => n.type === 'Question');
  if (questions.length > 0 && answers.length > 0) {
    const reachable = new Set();
    const rQ = questions.map((q) => q.id);
    while (rQ.length > 0) {
      const id = rQ.shift();
      if (reachable.has(id)) continue;
      reachable.add(id);
      for (const edge of outEdgesMap.get(id) || []) {
        if (!reachable.has(edge.to)) rQ.push(edge.to);
        const sg = subgraphMap.get(edge.to);
        if (sg) sg.members.forEach((m) => { if (!reachable.has(m)) rQ.push(m); });
      }
    }
    for (const a of answers) {
      if (!reachable.has(a.id)) {
        lines.push(`- [ ] 🔗 ${a.id}(${a.content.slice(0, 25)}…)가 Q에서 도달 불가 — Q→A 연결 누락`);
      }
    }
  }

  if (lines.length === 2) {
    lines.push('없음');
  }

  return lines.join('\n');
}
