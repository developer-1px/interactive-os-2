import ts from "typescript";
import path from "path";
import fs from "fs";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(PROJECT_ROOT, "src");

const EXCLUDE_PATTERNS = [
  /__tests__/,
  /\.test\./,
  /\.spec\./,
  /node_modules/,
  /dist\//,
];

function shouldExclude(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some((p) => p.test(filePath));
}

function collectTsFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectTsFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !shouldExclude(full)) {
      result.push(full);
    }
  }
  return result;
}

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

function hasExportModifier(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some(
      (m) => m.kind === ts.SyntaxKind.ExportKeyword
    ) === true
  );
}

function parseSourceFiles() {
  const files = collectTsFiles(SRC_DIR);
  const sourceFiles: { file: string; sf: ts.SourceFile }[] = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    const sf = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    sourceFiles.push({ file: filePath, sf });
  }

  return sourceFiles;
}

// --- Part 1: Export fragment dictionary ---

function collectExportNames(sourceFile: ts.SourceFile): string[] {
  const names: string[] = [];

  function add(name: string) {
    if (name.length > 1) names.push(name);
  }

  for (const stmt of sourceFile.statements) {
    if (ts.isFunctionDeclaration(stmt) && hasExportModifier(stmt) && stmt.name)
      add(stmt.name.text);
    if (ts.isClassDeclaration(stmt) && hasExportModifier(stmt) && stmt.name)
      add(stmt.name.text);
    if (ts.isInterfaceDeclaration(stmt) && hasExportModifier(stmt))
      add(stmt.name.text);
    if (ts.isTypeAliasDeclaration(stmt) && hasExportModifier(stmt))
      add(stmt.name.text);
    if (ts.isEnumDeclaration(stmt) && hasExportModifier(stmt))
      add(stmt.name.text);
    if (ts.isVariableStatement(stmt) && hasExportModifier(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) add(decl.name.text);
        if (ts.isObjectBindingPattern(decl.name)) {
          for (const el of decl.name.elements) {
            if (ts.isIdentifier(el.name)) add(el.name.text);
          }
        }
      }
    }
    if (ts.isExportAssignment(stmt) && !stmt.isExportEquals) {
      if (ts.isIdentifier(stmt.expression)) add(stmt.expression.text);
    }
  }

  return names;
}

interface NameWithFile {
  name: string;
  file: string;
}

function splitPathSegment(segment: string): string[] {
  // Remove extension
  const name = segment.replace(/\.\w+$/, "");
  if (name.length === 0) return [];

  // kebab-case or snake_case: split by - or _
  if (name.includes("-") || name.includes("_")) {
    return name
      .split(/[-_]/)
      .map((s) => s.toLowerCase())
      .filter((s) => s.length > 1);
  }

  return splitIdentifier(name);
}

function buildFragmentDictionary(
  sourceFiles: { file: string; sf: ts.SourceFile }[]
): Map<string, NameWithFile[]> {
  const seen = new Set<string>();
  const groups = new Map<string, NameWithFile[]>();

  function addToGroup(fragment: string, name: string, file: string) {
    if (fragment.length <= 1) return;
    if (!groups.has(fragment)) groups.set(fragment, []);
    const list = groups.get(fragment)!;
    if (!list.some((e) => e.name === name && e.file === file)) {
      list.push({ name, file });
    }
  }

  for (const { file, sf } of sourceFiles) {
    const relativePath = path.relative(PROJECT_ROOT, file);

    // Collect export names
    for (const name of collectExportNames(sf)) {
      const key = `${name}@${relativePath}`;
      if (seen.has(key)) continue;
      seen.add(key);

      for (const fragment of splitIdentifier(name)) {
        addToGroup(fragment, name, relativePath);
      }
    }

    // Collect file name and folder names as vocabulary
    const segments = relativePath.split("/");
    for (const segment of segments) {
      const isFile = segment.includes(".");
      const label = isFile ? `📄 ${segment}` : `📁 ${segment}/`;
      const key = `${label}@path`;
      if (seen.has(key)) continue;
      seen.add(key);

      for (const fragment of splitPathSegment(segment)) {
        addToGroup(fragment, label, "path");
      }
    }
  }

  return groups;
}

// --- Part 2: Type orbit ---

function collectExportedTypeNames(sourceFile: ts.SourceFile): string[] {
  const types: string[] = [];

  for (const stmt of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(stmt) && hasExportModifier(stmt))
      types.push(stmt.name.text);
    if (ts.isTypeAliasDeclaration(stmt) && hasExportModifier(stmt))
      types.push(stmt.name.text);
    if (ts.isEnumDeclaration(stmt) && hasExportModifier(stmt))
      types.push(stmt.name.text);
    if (ts.isClassDeclaration(stmt) && hasExportModifier(stmt) && stmt.name)
      types.push(stmt.name.text);
  }

  return types;
}

function getTypeReferenceName(typeNode: ts.TypeNode): string | null {
  if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName))
    return typeNode.typeName.text;
  if (ts.isArrayTypeNode(typeNode))
    return getTypeReferenceName(typeNode.elementType);
  return null;
}

function buildTypeOrbit(
  sourceFiles: { file: string; sf: ts.SourceFile }[]
): Map<string, Set<string>> {
  const knownTypes = new Set<string>();
  for (const { sf } of sourceFiles) {
    for (const t of collectExportedTypeNames(sf)) {
      knownTypes.add(t);
    }
  }

  const orbit = new Map<string, Set<string>>();

  for (const { sf } of sourceFiles) {
    function visit(node: ts.Node) {
      if (
        (ts.isVariableDeclaration(node) ||
          ts.isParameter(node) ||
          ts.isPropertyDeclaration(node) ||
          ts.isPropertySignature(node)) &&
        node.type &&
        node.name &&
        ts.isIdentifier(node.name)
      ) {
        const typeName = getTypeReferenceName(node.type);
        if (typeName && knownTypes.has(typeName) && node.name.text.length > 1) {
          if (!orbit.has(typeName)) orbit.set(typeName, new Set());
          orbit.get(typeName)!.add(node.name.text);
        }
      }

      if (
        (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) &&
        node.type &&
        node.name &&
        ts.isIdentifier(node.name)
      ) {
        const typeName = getTypeReferenceName(node.type);
        if (typeName && knownTypes.has(typeName) && node.name.text.length > 1) {
          if (!orbit.has(typeName)) orbit.set(typeName, new Set());
          orbit.get(typeName)!.add(`${node.name.text}()`);
        }
      }

      ts.forEachChild(node, visit);
    }
    visit(sf);
  }

  return orbit;
}

// --- Output ---

function main() {
  const sourceFiles = parseSourceFiles();
  const fragments = buildFragmentDictionary(sourceFiles);
  const orbit = buildTypeOrbit(sourceFiles);

  const lines: string[] = [];

  lines.push("# Naming Report");
  lines.push("");
  lines.push(`> Generated: ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");

  // Part 1: Fragment dictionary
  lines.push("## Export Fragments");
  lines.push("");
  lines.push("| fragment | count | identifiers |");
  lines.push("|----------|-------|-------------|");

  const sortedFragments = [...fragments.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );
  for (const [fragment, entries] of sortedFragments) {
    const sorted = entries
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((e) => `${e.name} (${e.file})`);
    lines.push(`| ${fragment} | ${sorted.length} | ${sorted.join(", ")} |`);
  }

  lines.push("");

  // Part 2: Type orbit
  lines.push("## Type Orbit");
  lines.push("");
  lines.push("| type | usages | variable names |");
  lines.push("|------|--------|----------------|");

  const sortedOrbit = [...orbit.entries()]
    .filter(([, vars]) => vars.size >= 2)
    .sort(([a], [b]) => a.localeCompare(b));
  for (const [typeName, vars] of sortedOrbit) {
    const sorted = [...vars].sort();
    lines.push(`| ${typeName} | ${sorted.length} | ${sorted.join(", ")} |`);
  }

  console.log(lines.join("\n"));
}

main();
