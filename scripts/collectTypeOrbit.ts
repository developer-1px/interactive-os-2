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

// Step 1: Collect all exported type names across the project
function collectExportedTypes(sourceFile: ts.SourceFile): string[] {
  const types: string[] = [];

  function hasExport(node: ts.Node): boolean {
    return (
      ts.canHaveModifiers(node) &&
      ts.getModifiers(node)?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword
      ) === true
    );
  }

  for (const stmt of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(stmt) && hasExport(stmt)) {
      types.push(stmt.name.text);
    }
    if (ts.isTypeAliasDeclaration(stmt) && hasExport(stmt)) {
      types.push(stmt.name.text);
    }
    if (ts.isEnumDeclaration(stmt) && hasExport(stmt)) {
      types.push(stmt.name.text);
    }
    if (ts.isClassDeclaration(stmt) && hasExport(stmt) && stmt.name) {
      types.push(stmt.name.text);
    }
  }

  return types;
}

// Step 2: Find local variables with type annotations referencing known types
interface TypeUsage {
  varName: string;
  file: string;
}

function collectTypeReferences(
  sourceFile: ts.SourceFile,
  knownTypes: Set<string>
): Map<string, TypeUsage[]> {
  const usages = new Map<string, TypeUsage[]>();

  function getTypeReferenceName(typeNode: ts.TypeNode): string | null {
    // Direct reference: `: State`
    if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
      return typeNode.typeName.text;
    }
    // Array: `: State[]`
    if (ts.isArrayTypeNode(typeNode)) {
      return getTypeReferenceName(typeNode.elementType);
    }
    return null;
  }

  function visit(node: ts.Node) {
    // const foo: State = ...
    // let bar: Entity = ...
    // function params: (state: NodeState) => ...
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
        if (!usages.has(typeName)) usages.set(typeName, []);
        usages.get(typeName)!.push({
          varName: node.name.text,
          file: "",
        });
      }
    }

    // function return type: function foo(): State
    if (
      (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) &&
      node.type &&
      node.name &&
      ts.isIdentifier(node.name)
    ) {
      const typeName = getTypeReferenceName(node.type);
      if (typeName && knownTypes.has(typeName) && node.name.text.length > 1) {
        if (!usages.has(typeName)) usages.set(typeName, []);
        usages.get(typeName)!.push({
          varName: `${node.name.text}() → ${typeName}`,
          file: "",
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return usages;
}

function main() {
  const files = collectTsFiles(SRC_DIR);

  // Pass 1: collect all exported type names
  const allExportedTypes = new Set<string>();
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

    for (const t of collectExportedTypes(sf)) {
      allExportedTypes.add(t);
    }
  }

  // Pass 2: find all references to those types
  const orbit = new Map<string, Set<string>>();

  for (const { file, sf } of sourceFiles) {
    const relativePath = path.relative(PROJECT_ROOT, file);
    const refs = collectTypeReferences(sf, allExportedTypes);

    for (const [typeName, usages] of refs) {
      if (!orbit.has(typeName)) orbit.set(typeName, new Set());
      for (const u of usages) {
        orbit.get(typeName)!.add(u.varName);
      }
    }
  }

  // Output: sorted by type name, only types with 2+ usages
  const sorted = [...orbit.entries()]
    .filter(([, vars]) => vars.size >= 2)
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [typeName, vars] of sorted) {
    console.log(`${typeName}: ${[...vars].sort().join(", ")}`);
  }
}

main();
