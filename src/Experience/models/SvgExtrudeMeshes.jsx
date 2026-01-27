import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { fetchSvgData } from "../components/konva/svgLoader";
import { applyTemplateTransforms } from "../components/konva/templateTransforms";
import { parsePath, getPathPoints } from "../components/konva/svgPathUtils";
import { getRuleForChild } from "./modelRules";
import { usePointer } from "../../stores/selectionStore";
import { useUploadTextureStore } from "../../stores/uploadTextureStore";

const MM_TO_SCENE = 0.01;
const BACKEND_ORIGIN = "http://127.0.0.1:5000";

const buildShapeFromPath = (d) => {
  const segments = parsePath(d);
  const pts = getPathPoints(segments);
  if (pts.length < 3) return null;
  const shape = new THREE.Shape();
  shape.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i += 1) {
    shape.lineTo(pts[i].x, pts[i].y);
  }
  shape.closePath();
  return shape;
};

const applyPlanarUvFromXY = (geom) => {
  geom.computeBoundingBox();
  const bb = geom.boundingBox;
  if (!bb) return;
  const size = new THREE.Vector3();
  bb.getSize(size);
  const minX = bb.min.x;
  const minY = bb.min.y;
  const w = Math.max(1e-6, size.x);
  const h = Math.max(1e-6, size.y);

  const pos = geom.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    uv[i * 2] = (x - minX) / w;
    uv[i * 2 + 1] = (y - minY) / h;
  }
  geom.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
};

export default function SvgExtrudeMeshes({ svgPath = "/box-sample/150010.svg" }) {
  const { boxWidth, boxLength, boxHeight, boxDepth, resizeRevision } = usePointer();
  const currentTexture = useUploadTextureStore((s) => s.currentTexture);
  const textureKey = useUploadTextureStore((s) => s.textureKey);
  const [svgGroups, setSvgGroups] = useState([]);
  const textureCacheRef = useRef(new Map());
  const materialCacheRef = useRef(new Map());
  const [, setTextureTick] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchSvgData(svgPath)
      .then(({ svgGroups: groups }) => {
        if (alive) setSvgGroups(groups);
      })
      .catch((err) => console.warn("svg load failed:", err));
    return () => {
      alive = false;
    };
  }, [svgPath]);

  const transformedGroups = useMemo(() => {
    if (!svgGroups.length) return [];
    return applyTemplateTransforms({
      svgGroups,
      boxWidth,
      boxLength,
      boxHeight,
      boxDepth,
      getRuleForChild,
    });
  }, [svgGroups, boxWidth, boxLength, boxHeight, boxDepth, resizeRevision]);

  useEffect(() => {
    // Backend files are overwritten; clear cached textures so they reload.
    textureCacheRef.current.forEach((tex) => tex.dispose?.());
    textureCacheRef.current.clear();
    setTextureTick((v) => v + 1);
  }, [textureKey]);

  useEffect(() => {
    if (!transformedGroups.length) return;
    const loader = new THREE.TextureLoader();
    transformedGroups.forEach((group) => {
      if (!group.id || textureCacheRef.current.has(group.id)) return;
      const bust = textureKey ? `?v=${textureKey}` : "";
      const url = `${BACKEND_ORIGIN}/output/${group.id}.png${bust}`;
      loader.load(
        url,
        (tex) => {
          tex.flipY = false;
          if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
          textureCacheRef.current.set(group.id, tex);
          setTextureTick((v) => v + 1);
        },
        undefined,
        () => {
          // Missing textures are expected early on.
        }
      );
    });
  }, [textureKey, transformedGroups]);

  const getMaterialForId = (id) => {
    const tex = textureCacheRef.current.get(id) || currentTexture || null;
    let mat = materialCacheRef.current.get(id);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        map: tex,
        transparent: true,
      });
      materialCacheRef.current.set(id, mat);
    }
    if (mat.map !== tex) {
      mat.map = tex;
      mat.needsUpdate = true;
    }
    return mat;
  };

  return (
    <group
      name="svg-extrudes"
      position={[0, -1, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={MM_TO_SCENE}
    >
      {transformedGroups.map((group) => {
        const depth = Math.max(0.001, boxDepth);
        const settings = { depth, bevelEnabled: false, curveSegments: 8 };
        const material = getMaterialForId(group.id);
        return (
          <group key={group.id || Math.random()} name={group.id || "piece"}>
            {group.paths.map((p, idx) => {
              const shape = buildShapeFromPath(p.d);
              if (!shape) return null;
              const geom = new THREE.ExtrudeGeometry(shape, settings);
              geom.computeVertexNormals();
              // Planar UVs like a 3ds Max planar/UVW map fit to bounds.
              applyPlanarUvFromXY(geom);
              return (
                <mesh
                  key={`${group.id || "piece"}-${idx}`}
                  name={`${group.id || "piece"}_${idx}`}
                  geometry={geom}
                  material={material}
                />
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
