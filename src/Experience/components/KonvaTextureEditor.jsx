// KonvaTextureEditor.jsx - SVG vector overlay + smooth pan/zoom
import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { useUploadTextureStore } from "../../stores/uploadTextureStore";
import { usePointer } from "../../stores/selectionStore";
import { useSelection } from "../../stores/selectionStore";
import { getRuleForChild } from "../models/modelRules";
import { fetchSvgData } from "./konva/svgLoader";
import { applyTemplateTransforms } from "./konva/templateTransforms";
import { StageView } from "./konva/StageView";
import { computeGroupBounds, parsePath, getPathPoints } from "./konva/svgPathUtils";
import "./KonvaTextureEditor.css";

const KonvaTextureEditor = ({ svgPath = null, inline = false }) => {
  const {
    editorImage,
    showEditor,
    updateTextureFromCanvas,
    initDefaultImage,
    backgroundColor,
  } =
    useUploadTextureStore();
  const { setMessage } = useSelection();
  const { boxWidth, boxLength, boxHeight, boxDepth } = usePointer();
  const stageRef = useRef();
  const imageRef = useRef();
  const trRef = useRef();
  const containerRef = useRef();
  const retryCountRef = useRef(0);
  const lastPanRef = useRef({ x: 0, y: 0, active: false });
  const wheelSyncRef = useRef(0);
  const svgFitRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });
  const svgBoundsRef = useRef({ width: 0, height: 0, minX: 0, minY: 0 });
  const transformedGroupsRef = useRef([]);
  const stageSizeRef = useRef({ width: 512, height: 512 });
  const sendPiecesToBackendRef = useRef(null);
  const exportTimerRef = useRef(0);

  const [stageSize, setStageSize] = useState({ width: 512, height: 512 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [svgGroups, setSvgGroups] = useState([]);
  const [svgBounds, setSvgBounds] = useState({
    width: 512,
    height: 512,
    minX: 0,
    minY: 0,
  });

  const stagePosRef = useRef({ x: 0, y: 0 });
  const stageScaleRef = useRef(1);

  const handleTransformEnd = useCallback(() => {
    const stage = stageRef.current;
    const imageNode = imageRef.current;
    if (!stage || !imageNode) return;

    const bbox = imageNode.getClientRect();
    const x = Math.floor(bbox.x);
    const y = Math.floor(bbox.y);
    const w = Math.floor(bbox.width);
    const h = Math.floor(bbox.height);

    const stageCanvas = stage.toCanvas();
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = 512;
    croppedCanvas.height = 512;
    const ctx = croppedCanvas.getContext("2d");

    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, 512, 512);
    ctx.drawImage(stageCanvas, x, y, w, h, x, y, w, h);

    updateTextureFromCanvas(croppedCanvas);
    sendPiecesToBackendRef.current?.();
  }, [updateTextureFromCanvas]);

  const loadSvgFromPath = useCallback(async () => {
    if (!svgPath) return;
    try {
      const { svgGroups: groups, svgBounds: bounds } = await fetchSvgData(svgPath);
      setSvgBounds(bounds);
      setSvgGroups(groups);
    } catch (error) {
      if (retryCountRef.current < 5) {
        retryCountRef.current += 1;
        setTimeout(loadSvgFromPath, 200);
        return;
      }
      console.error("SVG load error:", error);
    }
  }, [svgPath]);

  useEffect(() => {
    if (svgPath) {
      loadSvgFromPath();
    } else {
      setSvgGroups([]);
      setSvgBounds({ width: 512, height: 512, minX: 0, minY: 0 });
    }
  }, [svgPath, loadSvgFromPath]);

  useEffect(() => {
    initDefaultImage();
  }, [initDefaultImage]);

  useEffect(() => {
    if (!editorImage || !imageRef.current) return;
    const img = editorImage;
    if (img.complete) {
      fitImageToCanvas();
    } else {
      img.onload = () => fitImageToCanvas();
    }
  }, [editorImage, stageSize, svgBounds]);

  useEffect(() => {
    // Ensure the Transformer is attached after both nodes mount.
    if (!editorImage || !imageRef.current || !trRef.current) return;
    trRef.current.nodes([imageRef.current]);
    trRef.current.getLayer()?.batchDraw();
  }, [editorImage, stageSize, svgBounds]);

  useEffect(() => {
    // Re-attach the transformer after scene/layout updates.
    if (!editorImage || !imageRef.current || !trRef.current) return;
    const raf = requestAnimationFrame(() => {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()?.batchDraw();
    });
    return () => cancelAnimationFrame(raf);
  }, [
    editorImage,
    svgGroups.length,
    boxWidth,
    boxLength,
    boxHeight,
    boxDepth,
    stageSize,
    svgBounds,
    stageScale,
    stagePos,
  ]);

  useEffect(() => {
    const stage = stageRef.current;
    const tr = trRef.current;
    if (!stage || !tr) return;
    const container = stage.container();
    if (!container) return;

    const setCursor = (value) => {
      container.style.cursor = value;
    };

    const anchors = [
      { name: ".top-left", cursor: "nwse-resize" },
      { name: ".bottom-right", cursor: "nwse-resize" },
      { name: ".top-right", cursor: "nesw-resize" },
      { name: ".bottom-left", cursor: "nesw-resize" },
      { name: ".rotater", cursor: "crosshair" },
    ];

    const handlers = [];
    anchors.forEach(({ name, cursor }) => {
      const node = tr.findOne(name);
      if (!node) return;
      const onEnter = () => setCursor(cursor);
      const onLeave = () => setCursor("default");
      node.on("mouseenter", onEnter);
      node.on("mouseleave", onLeave);
      handlers.push({ node, onEnter, onLeave });
    });

    const imageNode = imageRef.current;
    const onImageEnter = () => setCursor("move");
    const onImageLeave = () => setCursor("default");
    if (imageNode) {
      imageNode.on("mouseenter", onImageEnter);
      imageNode.on("mouseleave", onImageLeave);
    }

    return () => {
      handlers.forEach(({ node, onEnter, onLeave }) => {
        node.off("mouseenter", onEnter);
        node.off("mouseleave", onLeave);
      });
      if (imageNode) {
        imageNode.off("mouseenter", onImageEnter);
        imageNode.off("mouseleave", onImageLeave);
      }
    };
  }, [editorImage, stageSize]);

  const fitImageToCanvas = useCallback(() => {
    const imageNode = imageRef.current;
    if (!imageNode || !editorImage) return;

    const hasBounds = svgBounds.width > 0 && svgBounds.height > 0;
    const fitScale = hasBounds
      ? Math.min(stageSize.width / svgBounds.width, stageSize.height / svgBounds.height)
      : 1;
    const fitOffsetX = hasBounds ? (stageSize.width - svgBounds.width * fitScale) / 2 : 0;
    const fitOffsetY = hasBounds ? (stageSize.height - svgBounds.height * fitScale) / 2 : 0;
    const targetW = svgBounds.width * fitScale;
    const targetH = svgBounds.height * fitScale;
    const targetX = fitOffsetX;
    const targetY = fitOffsetY;

    const scale = Math.min(
      targetW / editorImage.naturalWidth,
      targetH / editorImage.naturalHeight
    );
    const width = editorImage.naturalWidth * scale;
    const height = editorImage.naturalHeight * scale;
    const x = targetX + (targetW - width) / 2;
    const y = targetY + (targetH - height) / 2;

    imageNode.setAttrs({
      x,
      y,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    });

    trRef.current?.nodes([imageNode]);
    stageRef.current?.container()?.focus();
  }, [editorImage, stageSize, svgBounds]);

  useEffect(() => {
    if (!inline) return;
    const updateSize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const next = {
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
      };
      setStageSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next
      );
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [inline]);

  useEffect(() => {
    stagePosRef.current = stagePos;
  }, [stagePos]);

  useEffect(() => {
    stageScaleRef.current = stageScale;
  }, [stageScale]);

  useEffect(() => {
    stageSizeRef.current = stageSize;
  }, [stageSize]);

  const applyStageTransform = useCallback((pos, scale) => {
    const stage = stageRef.current;
    if (!stage) return;
    if (pos) {
      stage.position(pos);
      stagePosRef.current = pos;
    }
    if (typeof scale === "number") {
      stage.scale({ x: scale, y: scale });
      stageScaleRef.current = scale;
    }
    stage.batchDraw();
  }, []);

  const syncStageState = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.position();
    const scale = stage.scaleX();
    setStagePos({ x: pos.x, y: pos.y });
    setStageScale(scale);
  }, []);

  const handleWheel = useCallback(
    (e) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      // Default wheel zooms; pan with shift or trackpad horizontal scroll.
      const isPan =
        e.evt.shiftKey || Math.abs(e.evt.deltaX) > Math.abs(e.evt.deltaY);

      if (isPan) {
        const next = {
          x: stagePosRef.current.x - e.evt.deltaX,
          y: stagePosRef.current.y - e.evt.deltaY,
        };
        applyStageTransform(next, null);
      } else {
        const scaleBy = 1.05;
        const oldScale = stageScaleRef.current;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
          x: (pointer.x - stagePosRef.current.x) / oldScale,
          y: (pointer.y - stagePosRef.current.y) / oldScale,
        };

        const newScale =
          e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };

        applyStageTransform(newPos, newScale);
      }

      clearTimeout(wheelSyncRef.current);
      wheelSyncRef.current = setTimeout(syncStageState, 120);
    },
    [applyStageTransform, syncStageState]
  );

  const handlePanStart = useCallback((stageX, stageY) => {
    lastPanRef.current = { x: stageX, y: stageY, active: true };
  }, []);

  const handlePanMove = useCallback(
    (stageX, stageY, dx, dy) => {
      if (!lastPanRef.current.active) return;
      lastPanRef.current = { x: stageX, y: stageY, active: true };

      const next = {
        x: stagePosRef.current.x + dx,
        y: stagePosRef.current.y + dy,
      };
      applyStageTransform(next, null);
    },
    [applyStageTransform]
  );

  const handlePanEnd = useCallback(() => {
    lastPanRef.current = { x: 0, y: 0, active: false };
    syncStageState();
  }, [syncStageState]);

  const gridCells = useMemo(() => {
    const cell = 16;
    const cols = Math.ceil(svgBounds.width / cell);
    const rows = Math.ceil(svgBounds.height / cell);
    const cells = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        cells.push({ x, y });
      }
    }
    return { cells, cell };
  }, [svgBounds]);

  const svgFit = useMemo(() => {
    if (!svgGroups.length) return { scale: 1, offsetX: 0, offsetY: 0 };
    const scale = Math.min(
      stageSize.width / svgBounds.width,
      stageSize.height / svgBounds.height
    );
    const offsetX = (stageSize.width - svgBounds.width * scale) / 2;
    const offsetY = (stageSize.height - svgBounds.height * scale) / 2;
    return { scale, offsetX, offsetY };
  }, [svgBounds, svgGroups.length, stageSize]);

  const transformedGroups = useMemo(
    () =>
      applyTemplateTransforms({
        svgGroups,
        boxWidth,
        boxLength,
        boxHeight,
        boxDepth,
        getRuleForChild,
      }),
    [svgGroups, boxWidth, boxLength, boxHeight, boxDepth]
  );

  const debugMarkers = useMemo(() => {
    return [];
  }, []);

  useEffect(() => {
    svgFitRef.current = svgFit;
  }, [svgFit]);

  useEffect(() => {
    svgBoundsRef.current = svgBounds;
  }, [svgBounds]);

  useEffect(() => {
    transformedGroupsRef.current = transformedGroups;
  }, [transformedGroups]);

  const drawImageToCanvas = useCallback(() => {
    const imageNode = imageRef.current;
    if (!imageNode || !editorImage) return null;
    const { width, height } = stageSizeRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // White background so transparent areas export as white.
    ctx.fillStyle = backgroundColor || "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Apply the node's absolute transform (includes stage pan/zoom + node transform)
    // and draw only the image to avoid exporting transformer outlines.
    const [a, b, c, d, e, f] = imageNode.getAbsoluteTransform().getMatrix();
    ctx.save();
    ctx.setTransform(a, b, c, d, e, f);
    ctx.drawImage(editorImage, 0, 0, imageNode.width(), imageNode.height());
    ctx.restore();
    return canvas;
  }, [editorImage, backgroundColor]);

  const svgToCanvasPoint = useCallback((x, y) => {
    const fit = svgFitRef.current;
    const bounds = svgBoundsRef.current;
    const stageScale = stageScaleRef.current || 1;
    const stagePos = stagePosRef.current || { x: 0, y: 0 };
    const localX = fit.offsetX + (x - bounds.minX) * fit.scale;
    const localY = fit.offsetY + (y - bounds.minY) * fit.scale;
    return {
      x: stagePos.x + localX * stageScale,
      y: stagePos.y + localY * stageScale,
    };
  }, []);

  const buildCanvasPathFromGroup = useCallback((ctx, group) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let hasPoints = false;

    group.paths.forEach((p) => {
      const segments = parsePath(p.d);
      const pts = getPathPoints(segments);
      if (pts.length < 2) return;
      const mapped = pts.map((pt) => svgToCanvasPoint(pt.x, pt.y));
      ctx.moveTo(mapped[0].x, mapped[0].y);
      for (let i = 1; i < mapped.length; i += 1) {
        ctx.lineTo(mapped[i].x, mapped[i].y);
      }
      ctx.closePath();
      mapped.forEach((pt) => {
        minX = Math.min(minX, pt.x);
        minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x);
        maxY = Math.max(maxY, pt.y);
      });
      hasPoints = true;
    });

    if (!hasPoints) return null;
    return { minX, minY, maxX, maxY };
  }, [svgToCanvasPoint]);

  const cropPiecesToDataUrls = useCallback(() => {
    const baseCanvas = drawImageToCanvas();
    if (!baseCanvas) return null;
    const { width, height } = stageSizeRef.current;
    const groups = transformedGroupsRef.current;
    const pieces = {};

    groups.forEach((group) => {
      if (!group.id) return;
      const pieceCanvas = document.createElement("canvas");
      pieceCanvas.width = width;
      pieceCanvas.height = height;
      const ctx = pieceCanvas.getContext("2d");
      if (!ctx) return;

      // White background so clipped transparency becomes white.
      ctx.fillStyle = backgroundColor || "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.beginPath();
      const bbox = buildCanvasPathFromGroup(ctx, group);
      if (!bbox) {
        ctx.restore();
        return;
      }
      ctx.clip();
      ctx.drawImage(baseCanvas, 0, 0);
      ctx.restore();

      const cropW = Math.max(1, Math.ceil(bbox.maxX - bbox.minX));
      const cropH = Math.max(1, Math.ceil(bbox.maxY - bbox.minY));
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      const cropCtx = cropCanvas.getContext("2d");
      if (!cropCtx) return;
      cropCtx.drawImage(
        pieceCanvas,
        bbox.minX,
        bbox.minY,
        cropW,
        cropH,
        0,
        0,
        cropW,
        cropH
      );
      pieces[group.id] = cropCanvas.toDataURL("image/png");
    });

    return pieces;
  }, [backgroundColor, buildCanvasPathFromGroup, drawImageToCanvas]);

  const sendPiecesToBackend = useCallback(async () => {
    try {
      const pieces = cropPiecesToDataUrls();
      if (!pieces) return;
      await fetch("http://127.0.0.1:5000/api/pieces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieces }),
      });
    } catch (err) {
      // Backend is optional during dev; avoid breaking interaction.
      console.warn("piece export failed:", err);
    }
  }, [cropPiecesToDataUrls]);

  useEffect(() => {
    sendPiecesToBackendRef.current = sendPiecesToBackend;
  }, [sendPiecesToBackend]);

  const scheduleBackendExport = useCallback(() => {
    clearTimeout(exportTimerRef.current);
    exportTimerRef.current = setTimeout(() => {
      sendPiecesToBackendRef.current?.();
    }, 120);
  }, []);

  useEffect(() => () => clearTimeout(exportTimerRef.current), []);

  useEffect(() => {
    // Background changes should also update exported pieces.
    if (!editorImage) return;
    sendPiecesToBackendRef.current?.();
  }, [backgroundColor, editorImage]);

  useEffect(() => {
    if (!transformedGroups.length) {
      setMessage("Advance debug: no transformed groups");
      return;
    }
    const withBounds = transformedGroups.map((g) => ({
      id: g.id || "",
      bounds: computeGroupBounds(g.paths),
    }));
    const fmt = (n) => (Number.isFinite(n) ? n.toFixed(3) : "NaN");
    const fmtBox = (label, b) =>
      `${label}: min=(${fmt(b.minX)}, ${fmt(b.minY)}) max=(${fmt(b.maxX)}, ${fmt(
        b.maxY
      )})`;
    const listByPrefix = (prefix) =>
      withBounds
        .filter((g) => g.id.startsWith(prefix))
        .sort((a, b) => a.bounds.minX - b.bounds.minX)
        .map((g, i) => fmtBox(`${prefix}[${i}]`, g.bounds));

    const sections = [
      ...["D1", "D2", "D3"].flatMap((p) => {
        const rows = listByPrefix(p);
        return rows.length ? rows : [`${p}: missing`];
      }),
      ...["E1", "E2", "E3"].flatMap((p) => {
        const rows = listByPrefix(p);
        return rows.length ? rows : [`${p}: missing`];
      }),
    ];

    setMessage(sections.join("\n"));
  }, [transformedGroups, setMessage]);

  if (!inline && (!showEditor || !editorImage)) return null;

  const wrapperClass = inline ? "konva-editor-inline" : "konva-editor-overlay";

  const isInteractive = true;

  return (
    <div className={wrapperClass} ref={containerRef}>
      <div className="konva-editor">
        <div className="konva-canvas">
          <StageView
            inline={inline}
            stageSize={stageSize}
            stageRef={stageRef}
            stageScale={stageScale}
            stagePos={stagePos}
            handleWheel={handleWheel}
            lastPanRef={lastPanRef}
            handlePanStart={handlePanStart}
            handlePanMove={handlePanMove}
            handlePanEnd={handlePanEnd}
            svgFit={svgFit}
            svgBounds={svgBounds}
            gridCells={gridCells}
            editorImage={editorImage}
            imageRef={imageRef}
            handleTransformEnd={handleTransformEnd}
            handleTransformLive={scheduleBackendExport}
            transformedGroups={transformedGroups}
            debugMarkers={debugMarkers}
            trRef={trRef}
          />
        </div>
      </div>
    </div>
  );
};

export default KonvaTextureEditor;
