import React, { useState } from "react";
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
  const { uploadImage, backgroundColor, setBackgroundColor } = useUploadTextureStore();
  const [foldProgress, setFoldProgress] = useState(20);
  const [isSizeOpen, setIsSizeOpen] = useState(true);
  const [is3dOpen, setIs3dOpen] = useState(true);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(true);
  const [isBgOpen, setIsBgOpen] = useState(false);
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

  return (
    <div className="workspace">
      <div className="workspace-left">
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
            <div className="right-viewport">
              <Experience foldProgress={Math.min(1, Math.max(0, foldProgress / 100))} />
            </div>
            <div className="right-fold">
              <h4>Fold</h4>
              <Slider
                defaultValue={0}
                value={foldProgress}
                onChange={(value) => setFoldProgress(value)}
                min={0}
                max={100}
                step={1}
                marks={{
                  0: "0 deg",
                  50: "45 deg",
                  100: "90 deg",
                }}
              />
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
          <label className="btn file-btn">
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
              }}
            />
          </label>
          <div
            className="btn"
            style={{ position: "relative", paddingRight: 10, overflow: "visible", zIndex: 20 }}
          >
            <button
              type="button"
              onClick={() => setIsBgOpen((v) => !v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "none",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <span>Background</span>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  border: "1px solid #999",
                  background: backgroundColor || "#ffffff",
                  display: "inline-block",
                }}
              />
            </button>
            {isBgOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "110%",
                  left: 0,
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 8,
                  display: "grid",
                  gridTemplateColumns: "repeat(10, 20px)",
                  gap: 6,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                  zIndex: 30,
                  maxWidth: 240,
                }}
              >
                {bgSwatches.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setBackgroundColor(c);
                      setIsBgOpen(false);
                    }}
                    title={c}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      border: c === backgroundColor ? "2px solid #111" : "1px solid #999",
                      background: c,
                      padding: 0,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            )}
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
