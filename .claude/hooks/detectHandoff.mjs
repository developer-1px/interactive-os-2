/**
 * SessionStart hook: 미소비 handoff 파일 탐지
 * docs/0-inbox/에 handoff-*.md가 존재하면 미소비. 소비 시 파일 삭제.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const inboxDir = join(process.env.CLAUDE_PROJECT_DIR, "docs/0-inbox");

try {
  const files = readdirSync(inboxDir).filter(f => f.startsWith("handoff-") && f.endsWith(".md"));

  if (files.length === 0) process.exit(0);

  const items = files.map(file => {
    const content = readFileSync(join(inboxDir, file), "utf-8");
    const match = file.match(/^handoff-(\d{4}-\d{2}-\d{2})/);
    const date = match ? match[1] : "unknown";
    const titleMatch = content.match(/^#\s+(.+)/m);
    const title = titleMatch ? titleMatch[1].replace(/^Handoff:\s*/, "") : file;
    return { file, date, title };
  });

  const list = items
    .map(h => `  - ${h.file} (${h.date}) — ${h.title}`)
    .join("\n");
  console.log(`미소비 handoff ${items.length}건:\n${list}\n사용자에게 이어할지 물어보세요. 소비 완료 시 파일을 삭제하세요.`);
} catch {
  // docs/0-inbox 없으면 무시
}
