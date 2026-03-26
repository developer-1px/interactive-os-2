// ② 2026-03-26-component-inspector-drag-select-prd.md
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Fiber helpers (React internals, dev-only) ──

function findFiberKey(el: HTMLElement): string | undefined {
  for (const k in el) {
    if (k.startsWith("__reactFiber$")) return k;
  }
  return undefined;
}

function getFiber(el: HTMLElement): any | null {
  const key = findFiberKey(el);
  return key ? (el as any)[key] : null;
}

function getFiberComponentName(fiber: any): string {
  const type = fiber.type;
  if (typeof type === "function") {
    return type.displayName || type.name || "";
  }
  if (type && typeof type === "object" && type.$$typeof) {
    const wrappedType = type.type || type.render;
    if (wrappedType) {
      return wrappedType.displayName || wrappedType.name || "";
    }
  }
  return "";
}

// ── Public API ──

export function getDebugSource(el: HTMLElement | null): {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  loc?: number;
} | null {
  if (!el) return null;

  const inspectorLine = el.getAttribute("data-inspector-line");
  const locAttr = el.getAttribute("data-inspector-loc");

  if (inspectorLine) {
    const [fileName, line, col] = inspectorLine.split(":");
    return {
      fileName,
      lineNumber: parseInt(line, 10),
      columnNumber: parseInt(col, 10),
      loc: locAttr ? parseInt(locAttr, 10) : undefined,
    };
  }

  return null;
}

export function getComponentStack(el: HTMLElement | null): string[] {
  if (!el) return [];

  let fiber = getFiber(el);
  if (!fiber) return [];

  const stack: string[] = [];

  while (fiber) {
    const name = getFiberComponentName(fiber);

    if (name && name !== "Anonymous" && !stack.includes(name)) {
      stack.unshift(name);
    }

    fiber = fiber.return;
  }

  return stack;
}

const OS_COMPONENT_PATTERNS: Record<string, string> = {
  Zone: "Zone",
  FocusGroup: "Zone",
  Item: "Item",
  FocusItem: "Item",
  Field: "Field",
  Trigger: "Trigger",
};

export function getOSComponentType(el: HTMLElement | null): string | null {
  if (!el) return null;

  let fiber = getFiber(el);
  if (!fiber) return null;

  while (fiber) {
    const name = getFiberComponentName(fiber);

    for (const [pattern, osType] of Object.entries(OS_COMPONENT_PATTERNS)) {
      if (name === pattern || name.includes(pattern)) {
        return osType;
      }
    }

    fiber = fiber.return;
  }

  return null;
}

export interface OSComponentInfo {
  type: string;
  rect: DOMRect;
}

export function getAllOSComponents(): OSComponentInfo[] {
  const results: OSComponentInfo[] = [];
  const seen = new Set<HTMLElement>();

  const walkDOM = (node: HTMLElement) => {
    if (!node) return;

    if (
      node.id === "inspector-overlay-root" ||
      node.id === "component-inspector-root"
    )
      return;

    if (node !== document.body) {
      const fiber = getFiber(node);

      if (fiber) {
        const name = getFiberComponentName(fiber);

        for (const [pattern, osType] of Object.entries(OS_COMPONENT_PATTERNS)) {
          if (name === pattern && !seen.has(node)) {
            seen.add(node);
            const rect = getElementRect(node);
            if (rect.width > 0 && rect.height > 0) {
              results.push({ type: osType, rect });
            }
            break;
          }
        }
      }
    }

    for (const child of Array.from(node.children) as HTMLElement[]) {
      walkDOM(child);
    }
  };

  walkDOM(document.body);
  return results;
}

export function getElementRect(element: HTMLElement): DOMRect {
  const styles = window.getComputedStyle(element);
  let rect = element.getBoundingClientRect();

  if (styles.display === "contents") {
    const children = Array.from(element.children) as HTMLElement[];
    if (children.length > 0) {
      let minTop = Infinity,
        minLeft = Infinity,
        maxBottom = -Infinity,
        maxRight = -Infinity;
      children.forEach((child) => {
        const r = child.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        minTop = Math.min(minTop, r.top);
        minLeft = Math.min(minLeft, r.left);
        maxBottom = Math.max(maxBottom, r.bottom);
        maxRight = Math.max(maxRight, r.right);
      });

      if (minTop !== Infinity) {
        rect = new DOMRect(
          minLeft,
          minTop,
          maxRight - minLeft,
          maxBottom - minTop,
        );
      }
    }
  }

  return rect;
}

/** Collect all inspectable elements whose bounding rect intersects a given rectangle */
export function getElementsInRect(
  rect: { top: number; left: number; width: number; height: number },
): HTMLElement[] {
  const results: HTMLElement[] = [];
  const rectRight = rect.left + rect.width;
  const rectBottom = rect.top + rect.height;

  const walkDOM = (node: HTMLElement) => {
    if (!node) return;
    if (
      node.id === "inspector-overlay-root" ||
      node.id === "component-inspector-root"
    )
      return;

    if (node !== document.body) {
      const elRect = node.getBoundingClientRect();

      // Skip zero-size elements but still walk children for display:contents
      if (elRect.width === 0 && elRect.height === 0) {
        for (const child of Array.from(node.children) as HTMLElement[]) {
          walkDOM(child);
        }
        return;
      }

      // Intersection test (viewport coordinates)
      const intersects =
        elRect.left < rectRight &&
        elRect.right > rect.left &&
        elRect.top < rectBottom &&
        elRect.bottom > rect.top;

      if (intersects) {
        const hasPrimitive = node.hasAttribute("data-primitive");
        const hasInspectorLine = node.hasAttribute("data-inspector-line");
        const osType = getOSComponentType(node);

        if (hasPrimitive || hasInspectorLine || osType) {
          results.push(node);
        }
      }
    }

    for (const child of Array.from(node.children) as HTMLElement[]) {
      walkDOM(child);
    }
  };

  walkDOM(document.body);
  return results;
}

/** Generate a display label for an element in the candidate list */
export function getElementLabel(el: HTMLElement): string {
  const primitive = el.getAttribute("data-primitive");
  const osType = getOSComponentType(el);
  const source = getDebugSource(el);

  const parts: string[] = [];
  if (primitive) parts.push(primitive);
  if (osType && osType !== primitive) parts.push(`[${osType}]`);
  if (source) parts.push(`${source.fileName}:${source.lineNumber}`);

  if (parts.length === 0) {
    // Fallback: tag name + class
    const tag = el.tagName.toLowerCase();
    const cls = el.className && typeof el.className === 'string'
      ? `.${el.className.split(' ').filter(Boolean).slice(0, 2).join('.')}`
      : '';
    parts.push(`${tag}${cls}`);
  }

  return parts.join(' — ');
}
