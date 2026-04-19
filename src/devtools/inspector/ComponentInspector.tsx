// ② 2026-03-26-component-inspector-drag-select-prd.md
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react"; // @useState-hatch — devtools
import {
  getAllOSComponents,
  getDebugSource,
  type OSComponentInfo,
} from "./inspectorUtils";
import { InspectorOverlay } from "./InspectorOverlay";
import { MarqueeSelect } from "./MarqueeSelect";
import { QuickLookModal } from "@os/ui/QuickLookModal";
import { useGlobalTrap, type GlobalTrapKeyMap } from "@os/primitives/useGlobalTrap";

const OS_COLORS: Record<string, string> = {
  Zone: "rgba(59, 130, 246, 0.6)",
  Item: "rgba(16, 185, 129, 0.6)",
  Field: "rgba(139, 92, 246, 0.6)",
  Trigger: "rgba(245, 158, 11, 0.6)",
};

const TOAST_STYLES: React.CSSProperties = {
  position: "fixed",
  bottom: 24,
  right: 24,
  background: "#1f2937",
  color: "white",
  padding: "12px 20px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: "11px",
  zIndex: 100004,
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

// Inject debug-mode-active cursor style once
const STYLE_ID = "component-inspector-style";
function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = "body.debug-mode-active { cursor: crosshair; }";
  document.head.appendChild(style);
}

export function ComponentInspector() {
  useEffect(ensureStyle, []);
  const [isActive, setIsActive] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [lockedElement, setLockedElement] = useState<HTMLElement | null>(null);
  const [traversalHistory, setTraversalHistory] = useState<HTMLElement[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [osComponents, setOsComponents] = useState<OSComponentInfo[]>([]);
  const [marqueePreview, setMarqueePreview] = useState<HTMLElement | null>(null);
  const [lockPoint, setLockPoint] = useState<{ x: number; y: number } | null>(null);
  const [sourceModalFile, setSourceModalFile] = useState<{ path: string; line: number } | null>(null);
  // Flag to suppress click after marquee drag — set by MarqueeSelect, consumed by click handler
  const suppressClickRef = useRef(false);
  // Flag to suppress hover tracking during marquee drag
  const isDraggingRef = useRef(false);

  const copyElementSource = useCallback((element: HTMLElement) => {
    let current = element;
    let source: { fileName: string; lineNumber: number; columnNumber: number } | null = null;

    while (current && current !== document.body) {
      source = getDebugSource(current);
      if (source) break;
      current = current.parentElement as HTMLElement;
    }

    if (source) {
      const { fileName, lineNumber, columnNumber } = source;
      const textToCopy = `${fileName}:${lineNumber}:${columnNumber}`;
      navigator.clipboard.writeText(textToCopy);
      setToastMessage(`Locked & Copied: ${fileName}:${lineNumber}:${columnNumber}`);
    } else {
      setToastMessage("Locked (No source found)");
    }
  }, []);

  // Track hovered element
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isActive) return;
      // Don't update hover target during marquee drag
      if (isDraggingRef.current) return;

      let target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (
        !target ||
        target === document.body ||
        target.closest("#inspector-overlay-root") ||
        target.closest("#marquee-candidate-list") ||
        target.closest("#component-inspector-toast")
      ) {
        setHoveredElement(null);
        return;
      }

      const svgRoot = target.closest("svg");
      if (svgRoot) {
        target = svgRoot as unknown as HTMLElement;
      }

      setHoveredElement(target);
    };

    if (isActive) {
      window.addEventListener("mousemove", handleMouseMove, true);
    }
    return () => window.removeEventListener("mousemove", handleMouseMove, true);
  }, [isActive]);

  // Key handling — useGlobalTrap: toggle (always) + inspector trap (when active)
  // Toggle keyMap: always active for Shift+Cmd+D
  const toggleKeyMap = useMemo<GlobalTrapKeyMap>(() => ({
    'Mod+Shift+d': () => {
      setIsActive((prev) => {
        if (!prev) {
          setToastMessage("Inspector Mode ON");
        } else {
          setLockedElement(null);
          setLockPoint(null);
          setTraversalHistory([]);
          setMarqueePreview(null);
        }
        return !prev;
      });
    },
  }), []);

  // Inspector keyMap: active only when inspector is on
  const inspectorKeyMap = useMemo((): GlobalTrapKeyMap => {
    // L2: source modal open — only ESC allowed
    if (sourceModalFile) {
      return {
        'Escape': () => setSourceModalFile(null),
      } satisfies GlobalTrapKeyMap;
    }

    // L1: inspector mode
    return {
      'Mod+o': () => {
        let current = (lockedElement || hoveredElement) as HTMLElement | null;
        while (current && current !== document.body) {
          const source = getDebugSource(current);
          if (source) {
            setSourceModalFile({ path: source.fileName, line: source.lineNumber });
            break;
          }
          current = current.parentElement;
        }
      },
      'Mod+ArrowUp': () => {
        const current = lockedElement || hoveredElement;
        if (current?.parentElement && current.parentElement !== document.body) {
          const parent = current.parentElement;
          setTraversalHistory((prev) => [...prev, current]);
          setLockedElement(parent);
          copyElementSource(parent);
        }
      },
      'Mod+ArrowDown': () => {
        if (traversalHistory.length > 0) {
          const nextStack = [...traversalHistory];
          const lastChild = nextStack.pop();
          const target = lastChild || null;
          setLockedElement(target);
          setTraversalHistory(nextStack);
          if (target) copyElementSource(target);
        }
      },
      'Escape': () => {
        if (lockedElement) {
          setLockedElement(null);
          setLockPoint(null);
          setTraversalHistory([]);
          setToastMessage("Unlocked");
        } else {
          setIsActive(false);
        }
      },
    };
  }, [sourceModalFile, lockedElement, hoveredElement, traversalHistory, copyElementSource]);

  // Toggle: always on, passthrough (only intercepts Mod+Shift+D)
  useGlobalTrap(true, toggleKeyMap, { trap: false });
  // Inspector trap: on when active (traps ALL keys, only mapped ones execute)
  useGlobalTrap(isActive, inspectorKeyMap);

  // Body class + click interception
  useEffect(() => {
    if (isActive) {
      document.body.classList.add("debug-mode-active");
    } else {
      document.body.classList.remove("debug-mode-active");
    }

    const handleClick = (e: MouseEvent) => {
      if (!isActive) return;

      // Don't intercept clicks on the candidate list
      const target = e.target as HTMLElement;
      if (target.closest("#marquee-candidate-list")) return;

      // Skip click if MarqueeSelect just handled a drag
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (hoveredElement) {
        if (lockedElement === hoveredElement) {
          setLockedElement(null);
          setLockPoint(null);
          setToastMessage("Unlocked");
        } else {
          setLockedElement(hoveredElement);
          setLockPoint({ x: e.clientX, y: e.clientY });
          setTraversalHistory([]);
          copyElementSource(hoveredElement);
        }
      } else {
        setLockedElement(null);
        setLockPoint(null);
        setToastMessage("Unlocked");
      }
    };

    if (isActive) {
      window.addEventListener("click", handleClick, true);
    }

    return () => {
      window.removeEventListener("click", handleClick, true);
    };
  }, [isActive, hoveredElement, lockedElement, copyElementSource]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Scan OS components
  useEffect(() => {
    if (!isActive) return;

    const update = () => setOsComponents(getAllOSComponents());
    const rafId = requestAnimationFrame(update);

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update, true);
    const interval = setInterval(update, 500);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update, true);
      clearInterval(interval);
      setOsComponents([]);
    };
  }, [isActive]);

  // Listen for marquee preview events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { element: HTMLElement | null };
      setMarqueePreview(detail?.element || null);
    };
    window.addEventListener("inspector:marquee-preview", handler);
    return () => window.removeEventListener("inspector:marquee-preview", handler);
  }, []);

  // Listen for highlight requests from InspectorWindow
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { element: HTMLElement | null };
      if (detail?.element) {
        setIsActive(true);
        setLockedElement(detail.element);
        setLockPoint(null);
        setTraversalHistory([]);
      } else {
        setLockedElement(null);
        setLockPoint(null);
      }
    };
    window.addEventListener("inspector:highlight-element", handler);
    return () => window.removeEventListener("inspector:highlight-element", handler);
  }, []);

  // Determine active element for overlay: marquee preview > locked > hovered
  const activeElement = marqueePreview || lockedElement || hoveredElement;

  // Bridge to Inspector Panel via CustomEvent
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("inspector:element-selected", {
        detail: { element: activeElement },
      }),
    );
  }, [activeElement]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("inspector:active-changed", {
        detail: { active: isActive },
      }),
    );
  }, [isActive]);

  // Marquee select handler
  const handleMarqueeSelect = useCallback((element: HTMLElement) => {
    setLockedElement(element);
    setTraversalHistory([]);
    setMarqueePreview(null);
    copyElementSource(element);
  }, [copyElementSource]);

  const handleMarqueeCancel = useCallback(() => {
    setMarqueePreview(null);
  }, []);

  return (
    <>
      {/* OS Component Outlines */}
      {isActive &&
        osComponents.map((comp, i) => (
          <div
            key={`os-outline-${i}`}
            style={{
              position: "fixed",
              top: comp.rect.top,
              left: comp.rect.left,
              width: comp.rect.width,
              height: comp.rect.height,
              border: `1px dashed ${OS_COLORS[comp.type] || "rgba(255,255,255,0.5)"}`,
              pointerEvents: "none",
              zIndex: 99998,
              boxSizing: "border-box",
            }}
          />
        ))}

      {/* Box model overlay */}
      {isActive && (
        <InspectorOverlay activeElement={activeElement} locked={!!lockedElement && !marqueePreview} lockPoint={lockPoint ?? undefined} />
      )}

      {/* Marquee selection */}
      <MarqueeSelect
        active={isActive && !lockedElement}
        onSelect={handleMarqueeSelect}
        onCancel={handleMarqueeCancel}
        onDragStart={() => { isDraggingRef.current = true; }}
        onDragEnd={() => { isDraggingRef.current = false; suppressClickRef.current = true; }}
      />

      {/* Toast */}
      {toastMessage && (
        <div id="component-inspector-toast" style={TOAST_STYLES}>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", backgroundColor: "#22c55e" }} />
          {toastMessage}
        </div>
      )}

      {/* Full source viewer */}
      <QuickLookModal
        filePath={sourceModalFile?.path ?? null}
        highlightLines={sourceModalFile ? new Set([sourceModalFile.line]) : undefined}
        onClose={() => setSourceModalFile(null)}
      />
    </>
  );
}
