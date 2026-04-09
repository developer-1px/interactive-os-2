// ② 2026-03-26-component-inspector-drag-select-prd.md
import React, { useCallback, useEffect, useState } from "react"; // @useState-hatch — devtools inspector overlay
import { getComponentStack, getDebugSource, getOSComponentType } from "./inspectorUtils";
import { SourcePreview } from "./SourcePreview";
import { type BoxModel, measureBoxModel, formatSpacing } from "./inspectorBoxModel";

const COLORS = {
  margin: "rgba(245, 158, 11, 0.3)",
  padding: "rgba(16, 185, 129, 0.3)",
  content: "rgba(59, 130, 246, 0.3)",
  border: "rgba(250, 204, 21, 0.3)",
  gap: "rgba(139, 92, 246, 0.3)",
};

const Box = ({
  top,
  left,
  width,
  height,
  bg,
  border,
  borderRadius,
}: {
  top: number;
  left: number;
  width: number;
  height: number;
  bg?: string;
  border?: string;
  borderRadius?: string;
}) => (
  <div
    style={{
      position: "absolute",
      top,
      left,
      width,
      height,
      backgroundColor: bg,
      border: border,
      borderRadius:
        borderRadius && borderRadius !== "0px" ? borderRadius : undefined,
      pointerEvents: "none",
      boxSizing: "border-box",
      zIndex: 10000,
    }}
  />
);

export const InspectorOverlay: React.FC<{
  activeElement: HTMLElement | null;
  locked?: boolean;
  lockPoint?: { x: number; y: number };
}> = ({ activeElement, locked, lockPoint }) => {
  const [targetBox, setTargetBox] = useState<BoxModel | null>(null);
  const [targetName, setTargetName] = useState<string>("");
  const [fileInfo, setFileInfo] = useState<string | null>(null);
  const [componentStack, setComponentStack] = useState<string[]>([]);
  const [loc, setLoc] = useState<number | undefined>();
  const [isExpanded, setIsExpanded] = useState(false);

  const updateBox = useCallback(() => {
    if (
      !activeElement ||
      activeElement === document.body ||
      activeElement.closest("#inspector-overlay-root")
    ) {
      setTargetBox(null);
      return;
    }

    const element =
      (activeElement.closest("[data-primitive]") as HTMLElement) ||
      (activeElement.closest("svg") as unknown as HTMLElement) ||
      activeElement;

    setTargetBox(measureBoxModel(element));

    const name = element.getAttribute("data-primitive") || "";
    setTargetName(name);

    const source = getDebugSource(element);
    if (source) {
      setFileInfo(`${source.fileName}:${source.lineNumber}`);
      setLoc(source.loc);
    } else {
      setFileInfo(null);
      setLoc(undefined);
    }

    setComponentStack(getComponentStack(element));
    setIsExpanded(false);
  }, [activeElement]);

  useEffect(() => {
    const rafId = requestAnimationFrame(updateBox);
    window.addEventListener("scroll", updateBox, true);
    window.addEventListener("resize", updateBox, true);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", updateBox, true);
      window.removeEventListener("resize", updateBox, true);
    };
  }, [updateBox]);

  if (!targetBox) return null;

  const { top, left, width, height, gaps: gapsList } = targetBox;
  const marginTopH = targetBox.marginTop;
  const marginBottomH = targetBox.marginBottom;
  const marginLeftW = targetBox.marginLeft;
  const marginRightW = targetBox.marginRight;

  const borderTopW = targetBox.borderTop;
  const borderLeftW = targetBox.borderLeft;
  const borderRightW = targetBox.borderRight;
  const borderBottomW = targetBox.borderBottom;

  const paddingBoxTop = top + borderTopW;
  const paddingBoxLeft = left + borderLeftW;
  const paddingBoxWidth = width - borderLeftW - borderRightW;
  const paddingBoxHeight = height - borderTopW - borderBottomW;

  const paddingTopV = targetBox.paddingTop;
  const paddingLeftV = targetBox.paddingLeft;
  const paddingRightV = targetBox.paddingRight;
  const paddingBottomV = targetBox.paddingBottom;

  const contentBoxTop = paddingBoxTop + paddingTopV;
  const contentBoxLeft = paddingBoxLeft + paddingLeftV;
  const contentBoxWidth = paddingBoxWidth - paddingLeftV - paddingRightV;
  const contentBoxHeight = paddingBoxHeight - paddingTopV - paddingBottomV;

  const dims = `${Math.round(width)} × ${Math.round(height)}`;

  const spacing = formatSpacing(targetBox);
  const mInfo = spacing.margin;
  const padInfo = spacing.padding;
  const gapInfo = spacing.gap;

  return (
    <div
      id="inspector-overlay-root"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 99999,
      }}
    >
      {/* Margins */}
      {marginTopH > 0 && (
        <Box top={top - marginTopH} left={left} width={width} height={marginTopH} bg={COLORS.margin} />
      )}
      {marginBottomH > 0 && (
        <Box top={top + height} left={left} width={width} height={marginBottomH} bg={COLORS.margin} />
      )}
      {marginLeftW > 0 && (
        <Box top={top - marginTopH} left={left - marginLeftW} width={marginLeftW} height={height + marginTopH + marginBottomH} bg={COLORS.margin} />
      )}
      {marginRightW > 0 && (
        <Box top={top - marginTopH} left={left + width} width={marginRightW} height={height + marginTopH + marginBottomH} bg={COLORS.margin} />
      )}

      {/* Border Box */}
      <Box
        top={top} left={left} width={width} height={height}
        bg={COLORS.border} borderRadius={targetBox.borderRadius}
        border={locked ? "2px solid #EF4444" : undefined}
      />

      {/* Padding Box */}
      {paddingBoxWidth > 0 && paddingBoxHeight > 0 && (
        <Box top={paddingBoxTop} left={paddingBoxLeft} width={paddingBoxWidth} height={paddingBoxHeight} bg={COLORS.padding} />
      )}

      {/* Content Box */}
      {contentBoxWidth > 0 && contentBoxHeight > 0 && (
        <Box top={contentBoxTop} left={contentBoxLeft} width={contentBoxWidth} height={contentBoxHeight} bg={COLORS.content} />
      )}

      {/* Gaps */}
      {gapsList?.map((g, i) => (
        <div
          key={`gap-${i}`}
          style={{
            position: "absolute",
            top: g.top, left: g.left, width: g.width, height: g.height,
            backgroundColor: COLORS.gap,
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px)`,
            pointerEvents: "none",
            zIndex: 10005,
          }}
        />
      ))}

      {/* Tooltip */}
      <div
        style={{
          position: "absolute",
          top: top - (componentStack.length > 0 ? 76 : 58) > 0
            ? top - (componentStack.length > 0 ? 76 : 58)
            : top + height + 8,
          left: left,
          background: "rgba(23, 23, 23, 0.95)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: "8px",
          fontSize: "12px",
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 500,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          zIndex: 100001,
          backdropFilter: "blur(8px)",
          border: locked ? "1px solid #EF4444" : "1px solid rgba(255,255,255,0.1)",
          whiteSpace: "nowrap",
          pointerEvents: locked ? "auto" : "none",
        }}
      >
        {/* Header Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          {fileInfo && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#60A5FA", fontWeight: 600, fontSize: "11px", opacity: 0.9 }}>
              <span
                style={{ cursor: locked ? "pointer" : "default", textDecoration: locked ? "underline" : "none" }}
                onMouseDown={(e) => {
                  if (!locked || !fileInfo) return;
                  e.stopPropagation();
                  e.preventDefault();
                  const [fn, ln] = fileInfo.split(":");
                  window.dispatchEvent(
                    new CustomEvent("inspector:open-source", {
                      detail: { fileName: fn, lineNumber: parseInt(ln, 10) },
                    }),
                  );
                }}
              >{fileInfo}</span>
              {loc !== undefined && (
                <span
                  style={{
                    color: loc > 200 ? "#EF4444" : "#94A3B8",
                    fontSize: "10px",
                    fontWeight: loc > 200 ? 700 : 400,
                    background: loc > 200 ? "rgba(239, 68, 68, 0.1)" : "transparent",
                    padding: loc > 200 ? "1px 4px" : "0",
                    borderRadius: "4px",
                  }}
                >
                  ({loc} lines) {loc > 200 ? "⚠️" : ""}
                </span>
              )}
            </div>
          )}
          {locked && (
            <span
              style={{
                color: "#EF4444", fontWeight: 700, fontSize: "10px",
                background: "rgba(239, 68, 68, 0.15)", padding: "2px 6px",
                borderRadius: "4px", border: "1px solid rgba(239, 68, 68, 0.3)",
                display: "flex", alignItems: "center", gap: "4px",
              }}
            >
              LOCKED
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {targetName && (
            <>
              <span style={{ color: "#e5e5e5" }}>{targetName}</span>
              <span style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.2)" }} />
            </>
          )}
          {(() => {
            const osType = getOSComponentType(activeElement);
            if (!osType) return null;
            const colors: Record<string, string> = { Zone: "#3B82F6", Item: "#10B981", Field: "#8B5CF6", Trigger: "#F59E0B" };
            return (
              <>
                <span style={{ color: colors[osType], fontWeight: 700, fontSize: "10px", background: `${colors[osType]}20`, padding: "2px 6px", borderRadius: "4px" }}>
                  {osType}
                </span>
                <span style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.2)" }} />
              </>
            );
          })()}
          <span style={{ color: "#fbbf24", fontWeight: 600 }}>{targetBox.display}</span>
          <span style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.2)" }} />
          <span>{dims}</span>
          {mInfo && (
            <>
              <span style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.2)" }} />
              <span style={{ color: "#F59E0B" }}>{mInfo}</span>
            </>
          )}
          {padInfo && (
            <>
              <span style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.2)" }} />
              <span style={{ color: "#34D399" }}>{padInfo}</span>
            </>
          )}
          {gapInfo && (
            <>
              <span style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.2)" }} />
              <span style={{ color: "#A78BFA" }}>{gapInfo}</span>
            </>
          )}
          {targetBox.borderRadius && targetBox.borderRadius !== "0px" && (
            <>
              <span style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.2)" }} />
              <span style={{ color: "#F472B6" }}>r: {targetBox.borderRadius}</span>
            </>
          )}
        </div>

        {componentStack.length > 0 && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              fontSize: "10px", color: "#9ca3af",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: "4px", marginTop: "2px",
              pointerEvents: "auto",
            }}
          >
            {(!isExpanded && componentStack.length > 3
              ? ["...", ...componentStack.slice(-3)]
              : componentStack
            ).map((name, i, arr) => (
              <React.Fragment key={i}>
                <span
                  onClick={() => name === "..." && setIsExpanded(true)}
                  style={{
                    color: i === arr.length - 1 ? "#F472B6" : "inherit",
                    fontWeight: i === arr.length - 1 ? 600 : 400,
                    cursor: name === "..." ? "pointer" : "default",
                    textDecoration: name === "..." ? "underline" : "none",
                  }}
                >
                  {name}
                </span>
                {i < arr.length - 1 && <span style={{ opacity: 0.5 }}>›</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Source Preview */}
      {locked && fileInfo && lockPoint && (
        <SourcePreview
          filePath={fileInfo.split(":")[0]}
          lineNumber={parseInt(fileInfo.split(":")[1], 10)}
          anchor={lockPoint}
        />
      )}
    </div>
  );
};
