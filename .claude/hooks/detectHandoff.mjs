/**
 * SessionStart hook: 미소비 handoff 파일 탐지
 * consumed_by frontmatter가 없는 handoff-*.md를 찾아 목록 출력
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const inboxDir = join(process.env.CLAUDE_PROJECT_DIR, "docs/0-inbox");

try {
  const files = readdirSync(inboxDir).filter(f => f.startsWith("handoff-") && f.endsWith(".md"));
  const unconsumed = [];

  for (const file of files) {
    const content = readFileSync(join(inboxDir, file), "utf-8");
    if (!content.includes("consumed_by:")) {
      // 날짜 추출 (handoff-YYYY-MM-DD-slug.md)
      const match = file.match(/^handoff-(\d{4}-\d{2}-\d{2})/);
      const date = match ? match[1] : "unknown";
      // 제목 추출 (첫 번째 # 라인)
      const titleMatch = content.match(/^#\s+(.+)/m);
      const title = titleMatch ? titleMatch[1].replace(/^Handoff:\s*/, "") : file;
      unconsumed.push({ file, date, title });
    }
  }

  if (unconsumed.length > 0) {
    const list = unconsumed
      .map(h => `  - ${h.file} (${h.date}) — ${h.title}`)
      .join("\n");
    console.log(`미소비 handoff ${unconsumed.length}건:\n${list}\n사용자에게 이어할지 물어보세요. 선택하면 frontmatter에 consumed_by를 표기하세요.`);
  }
} catch {
  // docs/0-inbox 없으면 무시
}
