import ts from "typescript";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");

function splitIdentifier(rawName: string): string[] {
  const name = rawName.replace(/^_+|_+$/g, "");
  if (name.length === 0) return [];

  if (/^[A-Z][A-Z0-9_]*$/.test(name)) {
    return name
      .split("_")
      .map((s) => s.toLowerCase())
      .filter((s) => s.length > 0);
  }

  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1\0$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1\0$2")
    .split("\0")
    .map((s) => s.toLowerCase())
    .filter((s) => s.length > 0);
}

function splitPathSegment(segment: string): string[] {
  const name = segment.replace(/\.\w+$/, "");
  if (name.length === 0) return [];

  if (name.includes("-") || name.includes("_")) {
    return name
      .split(/[-_]/)
      .map((s) => s.toLowerCase())
      .filter((s) => s.length > 1);
  }

  return splitIdentifier(name);
}

// Collect ALL identifiers (export + local) from a source file
function collectAllIdentifiers(sourceFile: ts.SourceFile): string[] {
  const names: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isIdentifier(node)) {
      const parent = node.parent;
      if (!parent) return;

      const isDeclaration =
        ts.isVariableDeclaration(parent) ||
        ts.isFunctionDeclaration(parent) ||
        ts.isClassDeclaration(parent) ||
        ts.isInterfaceDeclaration(parent) ||
        ts.isTypeAliasDeclaration(parent) ||
        ts.isEnumDeclaration(parent) ||
        ts.isParameter(parent) ||
        ts.isPropertyDeclaration(parent) ||
        ts.isPropertySignature(parent) ||
        ts.isMethodDeclaration(parent) ||
        ts.isMethodSignature(parent) ||
        ts.isBindingElement(parent) ||
        ts.isEnumMember(parent);

      if (isDeclaration && parent.name === node && node.text.length > 1) {
        names.push(node.text);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return names;
}

function getChangedFiles(base: string): string[] {
  try {
    const output = execSync(`git diff --name-only ${base} -- '*.ts' '*.tsx'`, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
    });
    return output
      .trim()
      .split("\n")
      .filter((f) => f.length > 0)
      .filter((f) => !/__tests__|\.test\.|\.spec\./.test(f))
      .map((f) => path.join(PROJECT_ROOT, f))
      .filter((f) => fs.existsSync(f));
  } catch {
    return [];
  }
}

function main() {
  // Default: diff against HEAD (staged + unstaged changes)
  // Pass a base ref as argument: npx tsx scripts/collectDiffSymbols.ts main
  const base = process.argv[2] || "HEAD";
  const files = getChangedFiles(base);

  if (files.length === 0) {
    console.log("No changed .ts/.tsx files found.");
    process.exit(0);
  }

  const lines: string[] = [];
  lines.push(`# Diff Symbols (base: ${base})`);
  lines.push("");

  for (const filePath of files) {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    const sf = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const identifiers = [...new Set(collectAllIdentifiers(sf))].sort();

    // File/folder name fragments
    const segments = relativePath.split("/");
    const pathFragments: string[] = [];
    for (const seg of segments) {
      pathFragments.push(...splitPathSegment(seg));
    }
    const uniquePathFragments = [...new Set(pathFragments)].sort();

    lines.push(`## ${relativePath}`);
    lines.push("");

    if (uniquePathFragments.length > 0) {
      lines.push(
        `**path fragments**: ${uniquePathFragments.join(", ")}`
      );
    }

    // Group identifiers by fragment
    const groups = new Map<string, string[]>();
    for (const name of identifiers) {
      for (const fragment of splitIdentifier(name)) {
        if (fragment.length <= 1) continue;
        if (!groups.has(fragment)) groups.set(fragment, []);
        groups.get(fragment)!.push(name);
      }
    }

    const sorted = [...groups.entries()].sort(([a], [b]) =>
      a.localeCompare(b)
    );

    lines.push("");
    lines.push("| fragment | identifiers |");
    lines.push("|----------|-------------|");
    for (const [fragment, ids] of sorted) {
      lines.push(`| ${fragment} | ${ids.join(", ")} |`);
    }

    lines.push("");
  }

  console.log(lines.join("\n"));
}

main();
