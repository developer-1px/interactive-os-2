/* eslint-disable @typescript-eslint/no-explicit-any */
import path from "node:path";

export default function babelInspector({ types: t }: any) {
  return {
    visitor: {
      JSXOpeningElement(jsxPath: any, state: any) {
        if (
          !state.filename ||
          state.filename.includes("node_modules") ||
          !jsxPath.node.loc
        )
          return;

        const hasInspectorAttr = jsxPath.node.attributes.some(
          (attr: any) =>
            t.isJSXAttribute(attr) &&
            (attr.name.name === "data-inspector-line" ||
              attr.name.name === "data-inspector-loc"),
        );
        if (hasInspectorAttr) return;

        const { line, column } = jsxPath.node.loc.start;
        const relativePath = path.relative(process.cwd(), state.filename);
        const fileVal = `${relativePath}:${line}:${column + 1}`;

        jsxPath.pushContainer(
          "attributes",
          t.jsxAttribute(
            t.jsxIdentifier("data-inspector-line"),
            t.stringLiteral(fileVal),
          ),
        );

        if (state.file.ast.loc) {
          const fileLocCount = state.file.ast.loc.end.line;
          jsxPath.pushContainer(
            "attributes",
            t.jsxAttribute(
              t.jsxIdentifier("data-inspector-loc"),
              t.stringLiteral(fileLocCount.toString()),
            ),
          );
        }
      },
    },
  };
}
