// ② 2026-03-26-component-inspector-drag-select-prd.md
import React, { useEffect, useRef, useState } from "react";
import { getElementLabel, getElementsInRect } from "./inspectorUtils";

const DRAG_THRESHOLD = 5;

interface Candidate {
  element: HTMLElement;
  label: string;
}

/** Outer wrapper — unmounts inner when inactive, naturally resetting all state */
export const MarqueeSelect: React.FC<{
  active: boolean;
  onSelect: (element: HTMLElement) => void;
  onCancel: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}> = ({ active, onSelect, onCancel, onDragStart, onDragEnd }) => {
  if (!active) return null;
  return <MarqueeSelectInner onSelect={onSelect} onCancel={onCancel} onDragStart={onDragStart} onDragEnd={onDragEnd} />;
};

/** Inner component — uses refs for mouse tracking to avoid stale closures */
const MarqueeSelectInner: React.FC<{
  onSelect: (element: HTMLElement) => void;
  onCancel: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}> = ({ onSelect, onCancel, onDragStart, onDragEnd }) => {
  // Refs for mouse tracking — immune to stale closure issues
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const rectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // State for rendering only
  const [renderRect, setRenderRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Stable callback refs — updated via effect to satisfy lint
  const onSelectRef = useRef(onSelect);
  const onCancelRef = useRef(onCancel);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);
  const candidatesRef = useRef(candidates);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onCancelRef.current = onCancel;
    onDragStartRef.current = onDragStart;
    onDragEndRef.current = onDragEnd;
  });
  useEffect(() => {
    candidatesRef.current = candidates;
  }, [candidates]);

  // Single effect for all mouse events — no stale closures
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (candidatesRef.current.length > 0) return;
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("#inspector-overlay-root") || target.closest("#marquee-candidate-list")) return;
      startRef.current = { x: e.clientX, y: e.clientY };
      draggingRef.current = false;
      rectRef.current = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!startRef.current) return;

      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      const pastThreshold = Math.abs(dx) >= DRAG_THRESHOLD || Math.abs(dy) >= DRAG_THRESHOLD;

      if (!draggingRef.current && pastThreshold) {
        draggingRef.current = true;
        onDragStartRef.current?.();
      }

      if (pastThreshold) {
        const newRect = {
          x: Math.min(startRef.current.x, e.clientX),
          y: Math.min(startRef.current.y, e.clientY),
          w: Math.abs(dx),
          h: Math.abs(dy),
        };
        rectRef.current = newRect;
        setRenderRect(newRect);
      }
    };

    const handleMouseUp = () => {
      if (!startRef.current) return;

      if (draggingRef.current && rectRef.current) {
        onDragEndRef.current?.();

        const r = rectRef.current;
        const elements = getElementsInRect({
          top: r.y,
          left: r.x,
          width: r.w,
          height: r.h,
        });

        if (elements.length === 0) {
          // No candidates — dismiss
        } else if (elements.length === 1) {
          // Single candidate — select directly (PRD ④ boundary)
          onSelectRef.current(elements[0]);
        } else {
          // Multiple candidates — show list
          setCandidates(elements.map((el) => ({ element: el, label: getElementLabel(el) })));
          setFocusedIndex(0);
        }
      }

      startRef.current = null;
      draggingRef.current = false;
      rectRef.current = null;
      setRenderRect(null);
    };

    window.addEventListener("mousedown", handleMouseDown, true);
    window.addEventListener("mousemove", handleMouseMove, true);
    window.addEventListener("mouseup", handleMouseUp, true);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown, true);
      window.removeEventListener("mousemove", handleMouseMove, true);
      window.removeEventListener("mouseup", handleMouseUp, true);
    };
  }, []); // No dependencies — all state accessed via refs

  // Keyboard navigation for candidate list
  useEffect(() => {
    if (candidates.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          e.stopPropagation();
          setFocusedIndex((prev) => Math.min(prev + 1, candidates.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          e.stopPropagation();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Home":
          e.preventDefault();
          e.stopPropagation();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          e.stopPropagation();
          setFocusedIndex(candidates.length - 1);
          break;
        case "Enter":
          e.preventDefault();
          e.stopPropagation();
          onSelectRef.current(candidates[focusedIndex].element);
          setCandidates([]);
          setFocusedIndex(0);
          break;
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          setCandidates([]);
          setFocusedIndex(0);
          onCancelRef.current();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [candidates, focusedIndex]);

  // Dismiss candidate list on outside click
  useEffect(() => {
    if (candidates.length === 0) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#marquee-candidate-list")) {
        setCandidates([]);
        setFocusedIndex(0);
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener("click", handleOutsideClick, true);
    }, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleOutsideClick, true);
    };
  }, [candidates.length]);

  // Dispatch highlight preview for focused candidate
  useEffect(() => {
    if (candidates.length > 0 && candidates[focusedIndex]) {
      window.dispatchEvent(
        new CustomEvent("inspector:marquee-preview", {
          detail: { element: candidates[focusedIndex].element },
        }),
      );
    }
  }, [candidates, focusedIndex]);

  // Scroll focused item into view
  useEffect(() => {
    if (listRef.current && candidates.length > 0) {
      const items = listRef.current.children;
      // +1 to skip the header div
      if (items[focusedIndex + 1]) {
        (items[focusedIndex + 1] as HTMLElement).scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex, candidates.length]);

  return (
    <>
      {/* Marquee rectangle */}
      {renderRect && (
        <div
          style={{
            position: "fixed",
            top: renderRect.y,
            left: renderRect.x,
            width: renderRect.w,
            height: renderRect.h,
            border: "2px dashed rgba(59, 130, 246, 0.8)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            pointerEvents: "none",
            zIndex: 100002,
            boxSizing: "border-box",
          }}
        />
      )}

      {/* Candidate list */}
      {candidates.length > 0 && (
        <div
          id="marquee-candidate-list"
          ref={listRef}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(23, 23, 23, 0.98)",
            color: "#fff",
            borderRadius: "12px",
            padding: "8px 0",
            fontSize: "12px",
            fontFamily: "Inter, system-ui, sans-serif",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(12px)",
            zIndex: 100003,
            maxHeight: "320px",
            overflowY: "auto",
            minWidth: "280px",
            maxWidth: "480px",
            pointerEvents: "auto",
          }}
        >
          <div style={{ padding: "4px 12px 8px", fontSize: "10px", color: "#6b7280", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {candidates.length} elements found — ↑↓ navigate, Enter select, Esc cancel
          </div>
          {candidates.map((c, i) => (
            <div
              key={i}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectRef.current(c.element);
                setCandidates([]);
                setFocusedIndex(0);
              }}
              onMouseEnter={() => setFocusedIndex(i)}
              style={{
                padding: "6px 12px",
                cursor: "pointer",
                backgroundColor: i === focusedIndex ? "rgba(59, 130, 246, 0.2)" : "transparent",
                borderLeft: i === focusedIndex ? "2px solid #3B82F6" : "2px solid transparent",
                fontSize: "11px",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                transition: "background-color 0.05s",
              }}
            >
              {c.label}
            </div>
          ))}
        </div>
      )}
    </>
  );
};
