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
  const name = rawName.replace(/^_+|_+$/g, "");
  if (name.length === 0) return [];

  // UPPER_SNAKE_CASE
  if (/^[A-Z][A-Z0-9_]*$/.test(name)) {
    return name
      .split("_")
      .map((s) => s.toLowerCase())
      .filter((s) => s.length > 0);
  }

  // camelCase / PascalCase
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1\0$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1\0$2")
    .split("\0")
    .map((s) => s.toLowerCase())
    .filter((s) => s.length > 0);
}

interface ExportedSymbol {
  name: string;
  kind: string;
  file: string;
}

function hasExportModifier(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some(
      (m) => m.kind === ts.SyntaxKind.ExportKeyword
    ) === true
  );
}

function collectExports(sourceFile: ts.SourceFile): ExportedSymbol[] {
  const symbols: ExportedSymbol[] = [];

  function addSymbol(name: string, kind: string) {
    if (name.length <= 1) return;
    symbols.push({ name, kind, file: "" });
  }

  for (const stmt of sourceFile.statements) {
    // export function foo() {}
    if (ts.isFunctionDeclaration(stmt) && hasExportModifier(stmt)) {
      if (stmt.name) addSymbol(stmt.name.text, "function");
    }

    // export class Foo {}
    if (ts.isClassDeclaration(stmt) && hasExportModifier(stmt)) {
      if (stmt.name) addSymbol(stmt.name.text, "class");
    }

    // export interface Foo {}
    if (ts.isInterfaceDeclaration(stmt) && hasExportModifier(stmt)) {
      addSymbol(stmt.name.text, "interface");
    }

    // export type Foo = ...
    if (ts.isTypeAliasDeclaration(stmt) && hasExportModifier(stmt)) {
      addSymbol(stmt.name.text, "type");
    }

    // export enum Foo {}
    if (ts.isEnumDeclaration(stmt) && hasExportModifier(stmt)) {
      addSymbol(stmt.name.text, "enum");
    }

    // export const/let/var foo = ...
    if (ts.isVariableStatement(stmt) && hasExportModifier(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          addSymbol(decl.name.text, "variable");
        }
        // destructuring: export const { a, b } = ...
        if (ts.isObjectBindingPattern(decl.name)) {
          for (const el of decl.name.elements) {
            if (ts.isIdentifier(el.name)) {
              addSymbol(el.name.text, "variable");
            }
          }
        }
      }
    }

    // export default (named)
    if (ts.isExportAssignment(stmt) && !stmt.isExportEquals) {
      if (ts.isIdentifier(stmt.expression)) {
        addSymbol(stmt.expression.text, "default");
      }
    }
  }

  return symbols;
}

function main() {
  const files = collectTsFiles(SRC_DIR);
  const allSymbols: ExportedSymbol[] = [];

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

    const exports = collectExports(sourceFile);
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    for (const sym of exports) {
      sym.file = relativePath;
    }
    allSymbols.push(...exports);
  }

  // Deduplicate names
  const names = [...new Set(allSymbols.map((s) => s.name))];

  // Group by fragment
  const groups = new Map<string, Set<string>>();
  for (const name of names) {
    for (const fragment of splitIdentifier(name)) {
      if (fragment.length <= 1) continue;
      if (!groups.has(fragment)) groups.set(fragment, new Set());
      groups.get(fragment)!.add(name);
    }
  }

  // Sort by fragment name
  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [fragment, ids] of sorted) {
    console.log(`${fragment}: ${[...ids].sort().join(", ")}`);
  }
}

main();
