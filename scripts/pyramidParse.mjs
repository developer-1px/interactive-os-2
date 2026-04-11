/**
 * Pyramid Parser — Mermaid SSOT → 하단 섹션 자동 생성
 *
 * Usage: node scripts/pyramidParse.mjs <pyramid-file.md>
 *
 * Mermaid `graph TD` 블록을 파싱하여 산문 검증 + 통계 + 고아 + 갭 + 슬라이드를 자동 생성한다.
 */

import { readFileSync, writeFileSync } from 'fs';
import { generateLeveledProse, generateStatistics, generateOrphanNodes, generateGaps } from './pyramidProse.mjs';
import { generateSlidesHtml } from './pyramidSlides.mjs';

// ── Mermaid 파서 ──

/** @typedef {{ id: string, type: string, content: string, group: string | null, isGroup: boolean }} Node */
/** @typedef {{ from: string, to: string, label: string }} Edge */
/** @typedef {{ id: string, title: string, members: string[] }} Subgraph */

function parseMermaid(mermaidBlock) {
  /** @type {Map<string, Node>} */
  const nodes = new Map();
  /** @type {Edge[]} */
  const edges = [];
  /** @type {Subgraph[]} */
  const subgraphs = [];

  const lines = mermaidBlock.split('\n');
  let currentSubgraph = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith('%%') || line.startsWith('graph ') || line.startsWith('style ')) continue;

    const subgraphMatch = line.match(/^subgraph\s+(\w+)\["(.+?)"\]/);
    if (subgraphMatch) {
      currentSubgraph = { id: subgraphMatch[1], title: subgraphMatch[2], members: [] };
      subgraphs.push(currentSubgraph);
      continue;
    }

    if (line === 'end') {
      currentSubgraph = null;
      continue;
    }

    // 엣지: A -->|"label"| B 또는 A ==>|"label"| B["content"]
    const edgeMatch = line.match(
      /^(\w+)\s*(?:-->|==>)\|"(.+?)"\|\s*(\w+)(?:\["(.+?)"\])?/
    );
    if (edgeMatch) {
      const [, fromId, label, toId, toContent] = edgeMatch;
      edges.push({ from: fromId, to: toId, label });

      if (toContent && !nodes.has(toId)) {
        const { type, content, isGroup } = parseNodeLabel(toContent);
        nodes.set(toId, { id: toId, type, content, group: currentSubgraph?.id ?? null, isGroup });
        if (currentSubgraph) currentSubgraph.members.push(toId);
      }
      continue;
    }

    // 단독 노드: A["content"]
    const nodeMatch = line.match(/^(\w+)\["(.+?)"\]/);
    if (nodeMatch) {
      const [, id, rawContent] = nodeMatch;
      if (!nodes.has(id)) {
        const { type, content, isGroup } = parseNodeLabel(rawContent);
        nodes.set(id, { id, type, content, group: currentSubgraph?.id ?? null, isGroup });
      }
      if (currentSubgraph) {
        if (!currentSubgraph.members.includes(id)) {
          currentSubgraph.members.push(id);
        }
      }
      continue;
    }
  }

  for (const sg of subgraphs) {
    for (const memberId of sg.members) {
      const node = nodes.get(memberId);
      if (node) node.group = sg.id;
    }
  }

  const subgraphMap = new Map(subgraphs.map((sg) => [sg.id, sg]));

  return { nodes, edges, subgraphs, subgraphMap };
}

/** 노드 라벨에서 타입 접두사 분리 */
function parseNodeLabel(label) {
  const typeMap = {
    S: 'Situation',
    C: 'Complication',
    Q: 'Question',
    A: 'Answer',
    K: 'Takeaway',
    P: 'Proof',
    D: 'Detail',
  };

  // 그룹 접두사: GA:, GP:, GD: → 원래 타입 + isGroup: true
  const groupMatch = label.match(/^G([APD]):\s*(.+)$/);
  if (groupMatch) return { type: typeMap[groupMatch[1]] || groupMatch[1], content: groupMatch[2], isGroup: true };

  const r1Match = label.match(/^R1:\s*(.+)$/);
  if (r1Match) return { type: 'Undesired', content: r1Match[1], isGroup: false };

  const r2Match = label.match(/^R2:\s*(.+)$/);
  if (r2Match) return { type: 'Desired', content: r2Match[1], isGroup: false };

  const prefixMatch = label.match(/^([SCQAPDK]):\s*(.+)$/);
  if (prefixMatch) return { type: typeMap[prefixMatch[1]] || prefixMatch[1], content: prefixMatch[2], isGroup: false };

  return { type: '?', content: label, isGroup: false };
}

// ── 메인 ──

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/pyramidParse.mjs <pyramid-file.md>');
    process.exit(1);
  }

  const content = readFileSync(filePath, 'utf-8');

  const mermaidBlocks = [...content.matchAll(/```mermaid\n([\s\S]*?)```/g)];
  if (mermaidBlocks.length === 0) {
    console.error('No ```mermaid block found');
    process.exit(1);
  }

  const merged = mermaidBlocks.map((m) => m[1]).join('\n');
  const { nodes, edges, subgraphs, subgraphMap } = parseMermaid(merged);

  console.log(`Parsed: ${nodes.size} nodes, ${edges.length} edges, ${subgraphs.length} subgraphs`);

  // 마지막 mermaid 블록 끝까지 보존
  const lastBlock = mermaidBlocks[mermaidBlocks.length - 1];
  const lastBlockStart = lastBlock.index;
  const lastBlockEnd = content.indexOf('```', lastBlockStart + 10 + lastBlock[1].length) + 3;
  const preserved = content.slice(0, lastBlockEnd);

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

  // 슬라이드 HTML 생성
  const proseText = generateLeveledProse(nodes, edges, subgraphs, subgraphMap);
  const lv2Match = proseText.match(/### Lv\.2 전체 글\n\n([\s\S]+)$/);
  if (lv2Match) {
    const slidesHtml = generateSlidesHtml(lv2Match[1], content.match(/^#\s+(.+)/m)?.[1] || 'Pyramid');
    const htmlPath = filePath.replace(/\.md$/, '.slides.html');
    writeFileSync(htmlPath, slidesHtml);
    console.log(`Slides: ${htmlPath}`);
  }
}

main();
