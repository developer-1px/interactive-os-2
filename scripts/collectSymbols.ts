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
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !shouldExclude(full)) {
      result.push(full);
    }
  }
  return result;
}

function splitIdentifier(rawName: string): string[] {
  // Strip leading/trailing underscores
  const name = rawName.replace(/^_+|_+$/g, "");
  if (name.length === 0) return [];

  // UPPER_SNAKE_CASE: split by _
  if (/^[A-Z][A-Z0-9_]*$/.test(name)) {
    return name
      .split("_")
      .map((s) => s.toLowerCase())
      .filter((s) => s.length > 0);
  }

  // camelCase / PascalCase: split at case boundaries
  const parts = name
    .replace(/([a-z0-9])([A-Z])/g, "$1\0$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1\0$2")
    .split("\0")
    .map((s) => s.toLowerCase())
    .filter((s) => s.length > 0);

  return parts;
}

interface IdentifierEntry {
  name: string;
  file: string;
}

type FragmentDictionary = Record<string, { identifiers: IdentifierEntry[] }>;

function collectIdentifiers(sourceFile: ts.SourceFile): string[] {
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

      if (isDeclaration && parent.name === node) {
        names.push(node.text);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return names;
}

function main() {
  const files = collectTsFiles(SRC_DIR);
  const dictionary: FragmentDictionary = {};

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") || filePath.endsWith(".jsx")
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS
    );

    const identifiers = collectIdentifiers(sourceFile);
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    for (const name of identifiers) {
      // Skip 1-char identifiers
      if (name.length <= 1) continue;

      const fragments = splitIdentifier(name);
      for (const fragment of fragments) {
        if (fragment.length <= 1) continue;

        if (!dictionary[fragment]) {
          dictionary[fragment] = { identifiers: [] };
        }

        // Avoid duplicate name+file entries within the same fragment
        const exists = dictionary[fragment].identifiers.some(
          (e) => e.name === name && e.file === relativePath
        );
        if (!exists) {
          dictionary[fragment].identifiers.push({
            name,
            file: relativePath,
          });
        }
      }
    }
  }

  // Sort fragments alphabetically
  const sorted = Object.fromEntries(
    Object.entries(dictionary).sort(([a], [b]) => a.localeCompare(b))
  );

  console.log(JSON.stringify(sorted, null, 2));
}

main();
