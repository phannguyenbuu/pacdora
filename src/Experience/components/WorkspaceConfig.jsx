import React, { useEffect, useRef, useState } from "react";
import { Slider } from "antd";
import { useSelection } from "../../stores/selectionStore";
import { useUploadTextureStore } from "../../stores/uploadTextureStore";
import BoxDepthSlider from "./BoxDepthSlider";
import BoxSizeSliders from "./BoxSizeSliders";
import KonvaTextureEditor from "./KonvaTextureEditor";
import Experience from "../Experience";
import "./WorkspaceConfig.css";

const WorkspaceConfig = () => {
  const { message } = useSelection();
  const {
    uploadImage,
    backgroundColor,
    setBackgroundColor,
    insideMode,
    setInsideMode,
    is3dBusy,
    editorActions,
  } = useUploadTextureStore();
  const [foldProgress, setFoldProgress] = useState(20);
  const foldMax = 150;
  const [isFoldPlaying, setIsFoldPlaying] = useState(false);
  const foldDirRef = useRef(1);
  const lastTickRef = useRef(0);
  const [isSizeOpen, setIsSizeOpen] = useState(true);
  const [is3dOpen, setIs3dOpen] = useState(true);
  const [is3dExpanded, setIs3dExpanded] = useState(false);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(true);
  const [isBgOpen, setIsBgOpen] = useState(false);
  const [isInsideOpen, setIsInsideOpen] = useState(false);
  const bgSwatches = [
    "#ffffff",
    "#f8f9fa",
    "#f1f3f5",
    "#e9ecef",
    "#dee2e6",
    "#ced4da",
    "#adb5bd",
    "#6c757d",
    "#343a40",
    "#111111",
    "#000000",
    "#fff3bf",
    "#ffe8a1",
    "#ffd43b",
    "#fcc419",
    "#fab005",
    "#f08c00",
    "#e8590c",
    "#d9480f",
    "#c92a2a",
    "#fa5252",
    "#ff6b6b",
    "#ff8787",
    "#ffa8a8",
    "#ffc9c9",
    "#ffe3e3",
    "#f06595",
    "#e64980",
    "#d6336c",
    "#a61e4d",
    "#7048e8",
    "#5f3dc4",
    "#4c6ef5",
    "#364fc7",
    "#228be6",
    "#1c7ed6",
    "#15aabf",
    "#0c8599",
    "#12b886",
    "#0ca678",
    "#40c057",
    "#2f9e44",
    "#82c91e",
    "#74b816",
    "#94d82d",
    "#d8f5a2",
  ];
  const insideOptions = [
    { label: "White", value: "White", color: "#ffffff" },
    { label: "Cardboard", value: "Cardboard", color: "#c79a63" },
  ];

  useEffect(() => {
    if (!isFoldPlaying) return;
    let raf = 0;
    const tick = (t) => {
      if (!lastTickRef.current) lastTickRef.current = t;
      const dt = (t - lastTickRef.current) / 1000;
      lastTickRef.current = t;
      const speed = 35; // units per second
      setFoldProgress((prev) => {
        let next = prev + foldDirRef.current * speed * dt;
        if (next >= foldMax) {
          next = foldMax;
          foldDirRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          foldDirRef.current = 1;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lastTickRef.current = 0;
    };
  }, [isFoldPlaying, foldMax]);

  return (
    <div className="workspace">
      <div className={`workspace-left ${is3dExpanded ? "is-expanded" : ""}`}>
        <div className={`left-section size ${isSizeOpen ? "is-open" : ""}`}>
          <button
            type="button"
            className="section-toggle"
            onClick={() => setIsSizeOpen((v) => !v)}
          >
            <span>Size</span>
            <svg className="chevron" viewBox="0 0 10 6" aria-hidden="true">
              <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <div className="section-body">
            <BoxSizeSliders />
            <BoxDepthSlider />
          </div>
        </div>

        <div className={`left-section three-d ${is3dOpen ? "is-open" : ""}`}>
          <button
            type="button"
            className="section-toggle"
            onClick={() => setIs3dOpen((v) => !v)}
          >
            <span>3D View</span>
            <svg className="chevron" viewBox="0 0 10 6" aria-hidden="true">
              <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <div className="section-body">
            <div className={`right-viewport ${is3dExpanded ? "is-expanded" : ""}`}>
              <button
                type="button"
                className="viewport-toggle"
                onClick={() => setIs3dExpanded((v) => !v)}
                aria-label={is3dExpanded ? "Collapse 3D view" : "Expand 3D view"}
                title={is3dExpanded ? "Collapse" : "Expand"}
              >
                {is3dExpanded ? "↩" : "↗"}
              </button>
              <div className={`right-viewport-shell ${is3dBusy ? "is-busy" : ""}`}>
                <Experience foldProgress={Math.min(1.5, Math.max(0, foldProgress / 100))} />
              </div>
            </div>
            <div className="right-fold">
              <h4>Fold</h4>
              <div className="fold-row">
                <Slider
                  defaultValue={0}
                  value={foldProgress}
                  onChange={(value) => setFoldProgress(value)}
                  min={0}
                  max={foldMax}
                  step={1}
                />
                <div className="fold-controls">
                  <button
                    type="button"
                    className="fold-btn"
                    onClick={() => setIsFoldPlaying((v) => !v)}
                    aria-label={isFoldPlaying ? "Pause" : "Play"}
                    title={isFoldPlaying ? "Pause" : "Play"}
                  >
                    {isFoldPlaying ? "❚❚" : "▶"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`left-section advance ${isAdvanceOpen ? "is-open" : ""}`}>
          <button
            type="button"
            className="section-toggle"
            onClick={() => setIsAdvanceOpen((v) => !v)}
          >
            <span>Advance</span>
            <svg className="chevron" viewBox="0 0 10 6" aria-hidden="true">
              <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <div className="section-body">
            <textarea
              className="advance-message"
              value={message}
              onDoubleClick={async (e) => {
                await navigator.clipboard.writeText(e.target.value);
              }}
              readOnly
            />
          </div>
        </div>
      </div>

      <div className="workspace-center">
        <div className="center-toolbar">
          <div className="toolbar-surface">
            <label className="toolbar-btn toolbar-upload">
              Upload
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                }}
              />
            </label>

            <div className="toolbar-btn toolbar-pop" style={{ overflow: "visible" }}>
              <button type="button" className="toolbar-trigger" onClick={() => setIsBgOpen((v) => !v)}>
                <span>Background</span>
                <span className="toolbar-swatch" style={{ background: backgroundColor || "#ffffff" }} />
              </button>
              {isBgOpen && (
                <div className="toolbar-popover">
                  {bgSwatches.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setBackgroundColor(c);
                        setIsBgOpen(false);
                      }}
                      title={c}
                      className={`toolbar-swatch-btn ${c === backgroundColor ? "is-active" : ""}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="toolbar-btn toolbar-pop" style={{ overflow: "visible" }}>
              <button
                type="button"
                className="toolbar-trigger"
                onClick={() => setIsInsideOpen((v) => !v)}
              >
                <span>Inside</span>
                <span
                  className="toolbar-swatch"
                  style={{
                    background:
                      insideOptions.find((o) => o.value === insideMode)?.color || "#ffffff",
                  }}
                />
              </button>
              {isInsideOpen && (
                <div className="toolbar-popover" style={{ gridTemplateColumns: "repeat(2, auto)" }}>
                  {insideOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setInsideMode(opt.value);
                        setIsInsideOpen(false);
                      }}
                      className={`toolbar-chip ${opt.value === insideMode ? "is-active" : ""}`}
                    >
                      <span className="toolbar-swatch" style={{ background: opt.color }} />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" className="toolbar-btn" onClick={() => editorActions?.resetImage?.()}>
              Reset
            </button>
            <button type="button" className="toolbar-btn" onClick={() => editorActions?.exportCanvasSvg?.()}>
              Export SVG
            </button>
            <button type="button" className="toolbar-btn" onClick={() => editorActions?.saveTemplate?.()}>
              Save
            </button>
            <button type="button" className="toolbar-btn" onClick={() => editorActions?.loadTemplate?.()}>
              Load
            </button>
          </div>
        </div>
        <div className="center-canvas">
          <KonvaTextureEditor inline svgPath="/box-sample/150010.svg" />
        </div>
      </div>

    </div>
  );
};

export default WorkspaceConfig;
