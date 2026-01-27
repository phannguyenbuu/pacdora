import React from "react";
import { Stage, Layer, Image, Transformer, Rect, Group, Path, Circle, Line, Text } from "react-konva";
import { normalizeStroke, computeGroupBounds } from "./svgPathUtils";

export const StageView = ({
  inline,
  stageSize,
  stageRef,
  stageScale,
  stagePos,
  handleWheel,
  lastPanRef,
  handlePanStart,
  handlePanMove,
  handlePanEnd,
  svgFit,
  svgBounds,
  gridCells,
  editorImage,
  imageRef,
  handleTransformEnd,
  handleTransformLive,
  transformedGroups,
  debugMarkers = [],
  trRef,
}) => {
  return (
    <Stage
      width={stageSize.width}
      height={stageSize.height}
      ref={stageRef}
      scaleX={stageScale}
      scaleY={stageScale}
      x={stagePos.x}
      y={stagePos.y}
      onWheel={handleWheel}
      style={{ background: "#fff" }}
      onContextMenu={(e) => e.evt.preventDefault()}
      onMouseDown={(e) => {
        // Pan with middle or right mouse button (browser often blocks middle).
        if (e.evt.button !== 1 && e.evt.button !== 2) return;
        e.evt.preventDefault();
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) handlePanStart(pos.x, pos.y);
      }}
      onMouseMove={(e) => {
        if (!lastPanRef.current.active) return;
        const pos = e.target.getStage()?.getPointerPosition();
        if (!pos) return;
        const dx = e.evt.movementX || pos.x - lastPanRef.current.x;
        const dy = e.evt.movementY || pos.y - lastPanRef.current.y;
        handlePanMove(pos.x, pos.y, dx, dy);
      }}
      onMouseUp={handlePanEnd}
      onMouseLeave={handlePanEnd}
      onTouchStart={(e) => {
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) handlePanStart(pos.x, pos.y);
      }}
      onTouchMove={(e) => {
        const pos = e.target.getStage()?.getPointerPosition();
        if (!pos) return;
        const dx = pos.x - lastPanRef.current.x;
        const dy = pos.y - lastPanRef.current.y;
        handlePanMove(pos.x, pos.y, dx, dy);
      }}
      onTouchEnd={handlePanEnd}
    >
      <Layer>
        <Rect
          x={0}
          y={0}
          width={stageSize.width}
          height={stageSize.height}
          fill="#ffffff"
          listening={false}
        />
        <Group
          x={svgFit.offsetX - svgBounds.minX * svgFit.scale}
          y={svgFit.offsetY - svgBounds.minY * svgFit.scale}
          scaleX={svgFit.scale}
          scaleY={svgFit.scale}
          clipX={0}
          clipY={0}
          clipWidth={svgBounds.width}
          clipHeight={svgBounds.height}
          listening={false}
        >
          {gridCells.cells.map((cell, i) => (
            <Rect
              key={`${cell.x}-${cell.y}-${i}`}
              x={cell.x * gridCells.cell}
              y={cell.y * gridCells.cell}
              width={gridCells.cell}
              height={gridCells.cell}
              fill={(cell.x + cell.y) % 2 === 0 ? "#dcdcdc" : "#f2f2f2"}
              listening={false}
            />
          ))}
        </Group>

        {editorImage && (
          <Image
            ref={imageRef}
            image={editorImage}
            draggable
            rotation={0}
            scaleX={1}
            scaleY={1}
            dragBoundFunc={(pos) => pos}
            onDragMove={handleTransformLive}
            onDragEnd={handleTransformEnd}
            onTransform={handleTransformLive}
            onTransformEnd={handleTransformEnd}
          />
        )}

        {transformedGroups.length > 0 && (
          <Group
            x={svgFit.offsetX - svgBounds.minX * svgFit.scale}
            y={svgFit.offsetY - svgBounds.minY * svgFit.scale}
            scaleX={svgFit.scale}
            scaleY={svgFit.scale}
            listening={false}
          >
            {transformedGroups.map((group, groupIdx) => (
              <Group key={`${group.id || "group"}-${groupIdx}`} listening={false}>
                {group.paths.map((p, idx) => (
                  <Path
                    key={`${group.id || "path"}-${idx}`}
                    data={p.d}
                    stroke={normalizeStroke(p.stroke) || undefined}
                    strokeWidth={0.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeMiterLimit={1}
                    opacity={p.opacity}
                    fill={p.fill || undefined}
                    listening={false}
                  />
                ))}
                {group.id && (() => {
                  const b = computeGroupBounds(group.paths);
                  const cx = (b.minX + b.maxX) / 2;
                  const cy = (b.minY + b.maxY) / 2;
                  return (
                    <Text
                      text={group.id}
                      x={cx - 40}
                      y={cy - 8}
                      width={80}
                      align="center"
                      fontSize={12}
                      fill="#cc0000"
                      listening={false}
                    />
                  );
                })()}
              </Group>
            ))}
            {debugMarkers.map((m) =>
              m.kind === "vline" ? (
                <Line
                  key={m.key}
                  points={[
                    m.x,
                    Number.isFinite(m.y1) ? m.y1 : svgBounds.minY,
                    m.x,
                    Number.isFinite(m.y2) ? m.y2 : svgBounds.maxY,
                  ]}
                  stroke={m.color}
                  strokeWidth={1}
                  lineCap="round"
                  listening={false}
                />
              ) : (
                <Circle
                  key={m.key}
                  x={m.x}
                  y={m.y}
                  radius={Math.max(1, 4 / svgFit.scale)}
                  fill={m.color}
                  stroke="#000000"
                  strokeWidth={Math.max(0.5, 1 / svgFit.scale)}
                  listening={false}
                />
              )
            )}
          </Group>
        )}

        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => newBox}
          flipEnabled={true}
          rotateEnabled={true}
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
        />
      </Layer>
    </Stage>
  );
};
