// SVG path and geometry utilities for Konva SVG rendering

export const tokenizePath = (d) =>
  d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];

export const parsePath = (d) => {
  const tokens = tokenizePath(d);
  const segments = [];
  let i = 0;
  let cmd = null;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;

  const readNumber = () => Number(tokens[i++]);
  const isCommand = (t) => /^[a-zA-Z]$/.test(t);

  while (i < tokens.length) {
    const token = tokens[i];
    if (isCommand(token)) {
      cmd = token;
      i += 1;
    }
    if (!cmd) break;

    const upper = cmd.toUpperCase();
    const isRel = cmd !== upper;

    const pushSegment = (name, values) => {
      segments.push({ cmd: name, values });
    };

    if (upper === "Z") {
      pushSegment("Z", []);
      cx = sx;
      cy = sy;
      cmd = null;
      continue;
    }

    if (upper === "M") {
      let first = true;
      while (i < tokens.length && !isCommand(tokens[i])) {
        const x = readNumber();
        const y = readNumber();
        const nx = isRel ? cx + x : x;
        const ny = isRel ? cy + y : y;
        if (first) {
          pushSegment("M", [nx, ny]);
          sx = nx;
          sy = ny;
          first = false;
        } else {
          pushSegment("L", [nx, ny]);
        }
        cx = nx;
        cy = ny;
      }
      continue;
    }

    const readPairs = (pairCount, cmdName) => {
      while (i < tokens.length && !isCommand(tokens[i])) {
        const values = [];
        for (let p = 0; p < pairCount; p += 1) {
          const x = readNumber();
          const y = readNumber();
          const nx = isRel ? cx + x : x;
          const ny = isRel ? cy + y : y;
          values.push(nx, ny);
          if (p === pairCount - 1) {
            cx = nx;
            cy = ny;
          }
        }
        pushSegment(cmdName, values);
      }
    };

    switch (upper) {
      case "L":
        readPairs(1, "L");
        break;
      case "H":
        while (i < tokens.length && !isCommand(tokens[i])) {
          const x = readNumber();
          const nx = isRel ? cx + x : x;
          cx = nx;
          pushSegment("H", [nx]);
        }
        break;
      case "V":
        while (i < tokens.length && !isCommand(tokens[i])) {
          const y = readNumber();
          const ny = isRel ? cy + y : y;
          cy = ny;
          pushSegment("V", [ny]);
        }
        break;
      case "C":
        readPairs(3, "C");
        break;
      case "S":
        readPairs(2, "S");
        break;
      case "Q":
        readPairs(2, "Q");
        break;
      case "T":
        readPairs(1, "T");
        break;
      case "A": {
        while (i < tokens.length && !isCommand(tokens[i])) {
          const rx = readNumber();
          const ry = readNumber();
          const xAxisRotation = readNumber();
          const largeArc = readNumber();
          const sweep = readNumber();
          const x = readNumber();
          const y = readNumber();
          const nx = isRel ? cx + x : x;
          const ny = isRel ? cy + y : y;
          pushSegment("A", [
            rx,
            ry,
            xAxisRotation,
            largeArc,
            sweep,
            nx,
            ny,
          ]);
          cx = nx;
          cy = ny;
        }
        break;
      }
      default:
        i = tokens.length;
        break;
    }
  }

  return segments;
};

export const parsePointsAttr = (points) => {
  if (!points) return [];
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(",").map(Number))
    .filter((pair) => pair.length === 2 && Number.isFinite(pair[0]) && Number.isFinite(pair[1]))
    .map(([x, y]) => ({ x, y }));
};

export const pointsToPath = (points, close = true) => {
  if (!points.length) return "";
  const parts = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i += 1) {
    parts.push(`L ${points[i].x} ${points[i].y}`);
  }
  if (close) parts.push("Z");
  return parts.join(" ");
};

export const parseTransformOps = (transform) => {
  if (!transform) return [];
  const ops = [];
  const regex = /(translate|scale|rotate)\(([^)]*)\)/g;
  let match;
  while ((match = regex.exec(transform))) {
    const name = match[1];
    const values = match[2]
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    ops.push({ name, values });
  }
  return ops;
};

export const normalizeStroke = (stroke) => {
  if (!stroke) return "#444";
  const s = String(stroke).trim().toLowerCase();
  if (s === "#fff" || s === "#ffffff" || s === "white") return "#444";
  return stroke;
};

export const applyTransformOps = (pt, ops) => {
  let x = pt.x;
  let y = pt.y;
  for (let i = ops.length - 1; i >= 0; i -= 1) {
    const { name, values } = ops[i];
    if (name === "translate") {
      const tx = values[0] || 0;
      const ty = values[1] || 0;
      x += tx;
      y += ty;
    } else if (name === "scale") {
      const sx = values[0] ?? 1;
      const sy = values[1] ?? sx;
      x *= sx;
      y *= sy;
    } else if (name === "rotate") {
      const ang = (values[0] || 0) * (Math.PI / 180);
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      const xr = x * cosA - y * sinA;
      const yr = x * sinA + y * cosA;
      x = xr;
      y = yr;
    }
  }
  return { x, y };
};

export const getPathPoints = (segments) => {
  const points = [];
  segments.forEach((seg) => {
    const { cmd, values } = seg;
    switch (cmd) {
      case "M":
      case "L":
      case "T":
        points.push({ x: values[0], y: values[1] });
        break;
      case "H":
        points.push({ x: values[0], y: 0 });
        break;
      case "V":
        points.push({ x: 0, y: values[0] });
        break;
      case "C":
        points.push(
          { x: values[0], y: values[1] },
          { x: values[2], y: values[3] },
          { x: values[4], y: values[5] }
        );
        break;
      case "S":
      case "Q":
        points.push(
          { x: values[0], y: values[1] },
          { x: values[2], y: values[3] }
        );
        break;
      case "A":
        points.push({ x: values[5], y: values[6] });
        break;
      default:
        break;
    }
  });
  return points;
};

export const computePathBounds = (d, transformOps = []) => {
  const segments = parsePath(d);
  const points = getPathPoints(segments);
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  points.forEach((p) => {
    const pt = transformOps.length ? applyTransformOps(p, transformOps) : p;
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  });
  return { minX, minY, maxX, maxY };
};

export const formatNumber = (n) => {
  const rounded = Number.isFinite(n) ? Number(n.toFixed(4)) : 0;
  return `${rounded}`;
};

export const buildPath = (segments) =>
  segments
    .map(({ cmd, values }) =>
      values.length ? `${cmd} ${values.map(formatNumber).join(" ")}` : cmd
    )
    .join(" ");

export const applyResizePoint = (pt, centerX, centerY, deltaX, deltaY, ruleX, ruleZ, invertZ = false) => {
  let x = pt.x;
  let y = pt.y;
  if (ruleX?.type === "full") {
    const multiplier = ruleX.deltaMultiplier || 1;
    const v = deltaX * (ruleX.deltaMultiplier ? multiplier : 0);
    x = ruleX.direction === "left" ? x - v : x + v;
  } else {
    const deltaHalf = deltaX / 2;
    x = x > centerX ? x + deltaHalf : x - deltaHalf;
  }

  if (ruleZ?.type === "pivot") {
    const v =
      deltaY * (ruleZ.deltaMultiplier ? ruleZ.deltaMultiplier : 0) +
      (ruleZ.extent ? ruleZ.extent : 0);
    if (invertZ) {
      if (y <= centerY) y -= v;
    } else if (y >= centerY) {
      y += v;
    }
  }
  return { x, y };
};

export const transformPath = (
  d,
  { transformOps, centerX, centerY, deltaX, deltaY, ruleX, ruleZ, invertZ }
) => {
  const segments = parsePath(d);
  let current = { x: 0, y: 0 };

  const mapPoint = (x, y) => {
    const global = applyTransformOps({ x, y }, transformOps);
    return applyResizePoint(global, centerX, centerY, deltaX, deltaY, ruleX, ruleZ, invertZ);
  };

  const nextSegments = [];

  segments.forEach((seg) => {
    const { cmd, values } = seg;
    if (cmd === "M") {
      const p = mapPoint(values[0], values[1]);
      nextSegments.push({ cmd: "M", values: [p.x, p.y] });
      current = { x: values[0], y: values[1] };
      return;
    }
    if (cmd === "L") {
      const p = mapPoint(values[0], values[1]);
      nextSegments.push({ cmd: "L", values: [p.x, p.y] });
      current = { x: values[0], y: values[1] };
      return;
    }
    if (cmd === "H") {
      const p = mapPoint(values[0], current.y);
      nextSegments.push({ cmd: "L", values: [p.x, p.y] });
      current = { x: values[0], y: current.y };
      return;
    }
    if (cmd === "V") {
      const p = mapPoint(current.x, values[0]);
      nextSegments.push({ cmd: "L", values: [p.x, p.y] });
      current = { x: current.x, y: values[0] };
      return;
    }
    if (cmd === "C") {
      const p1 = mapPoint(values[0], values[1]);
      const p2 = mapPoint(values[2], values[3]);
      const p3 = mapPoint(values[4], values[5]);
      nextSegments.push({ cmd: "C", values: [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y] });
      current = { x: values[4], y: values[5] };
      return;
    }
    if (cmd === "S") {
      const p1 = mapPoint(values[0], values[1]);
      const p2 = mapPoint(values[2], values[3]);
      nextSegments.push({ cmd: "S", values: [p1.x, p1.y, p2.x, p2.y] });
      current = { x: values[2], y: values[3] };
      return;
    }
    if (cmd === "Q") {
      const p1 = mapPoint(values[0], values[1]);
      const p2 = mapPoint(values[2], values[3]);
      nextSegments.push({ cmd: "Q", values: [p1.x, p1.y, p2.x, p2.y] });
      current = { x: values[2], y: values[3] };
      return;
    }
    if (cmd === "T") {
      const p = mapPoint(values[0], values[1]);
      nextSegments.push({ cmd: "T", values: [p.x, p.y] });
      current = { x: values[0], y: values[1] };
      return;
    }
    if (cmd === "A") {
      const p = mapPoint(values[5], values[6]);
      nextSegments.push({
        cmd: "A",
        values: [values[0], values[1], values[2], values[3], values[4], p.x, p.y],
      });
      current = { x: values[5], y: values[6] };
      return;
    }
    nextSegments.push(seg);
  });

  return buildPath(nextSegments);
};

export const transformPathWithAdjust = (
  d,
  { transformOps, centerX, centerY, deltaX, deltaY, ruleX, ruleZ, invertZ },
  adjustPoint
) => {
  const segments = parsePath(d);
  let current = { x: 0, y: 0 };

  const mapPoint = (x, y) => {
    const global = applyTransformOps({ x, y }, transformOps);
    const resized = applyResizePoint(
      global,
      centerX,
      centerY,
      deltaX,
      deltaY,
      ruleX,
      ruleZ,
      invertZ
    );
    return adjustPoint ? adjustPoint(resized) : resized;
  };

  const nextSegments = [];

  segments.forEach((seg) => {
    const { cmd, values } = seg;
    if (cmd === "M") {
      const p = mapPoint(values[0], values[1]);
      nextSegments.push({ cmd: "M", values: [p.x, p.y] });
      current = { x: values[0], y: values[1] };
      return;
    }
    if (cmd === "L") {
      const p = mapPoint(values[0], values[1]);
      nextSegments.push({ cmd: "L", values: [p.x, p.y] });
      current = { x: values[0], y: values[1] };
      return;
    }
    if (cmd === "H") {
      const p = mapPoint(values[0], current.y);
      nextSegments.push({ cmd: "L", values: [p.x, p.y] });
      current = { x: values[0], y: current.y };
      return;
    }
    if (cmd === "V") {
      const p = mapPoint(current.x, values[0]);
      nextSegments.push({ cmd: "L", values: [p.x, p.y] });
      current = { x: current.x, y: values[0] };
      return;
    }
    if (cmd === "C") {
      const p1 = mapPoint(values[0], values[1]);
      const p2 = mapPoint(values[2], values[3]);
      const p3 = mapPoint(values[4], values[5]);
      nextSegments.push({ cmd: "C", values: [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y] });
      current = { x: values[4], y: values[5] };
      return;
    }
    if (cmd === "S") {
      const p1 = mapPoint(values[0], values[1]);
      const p2 = mapPoint(values[2], values[3]);
      nextSegments.push({ cmd: "S", values: [p1.x, p1.y, p2.x, p2.y] });
      current = { x: values[2], y: values[3] };
      return;
    }
    if (cmd === "Q") {
      const p1 = mapPoint(values[0], values[1]);
      const p2 = mapPoint(values[2], values[3]);
      nextSegments.push({ cmd: "Q", values: [p1.x, p1.y, p2.x, p2.y] });
      current = { x: values[2], y: values[3] };
      return;
    }
    if (cmd === "T") {
      const p = mapPoint(values[0], values[1]);
      nextSegments.push({ cmd: "T", values: [p.x, p.y] });
      current = { x: values[0], y: values[1] };
      return;
    }
    if (cmd === "A") {
      const p = mapPoint(values[5], values[6]);
      nextSegments.push({
        cmd: "A",
        values: [values[0], values[1], values[2], values[3], values[4], p.x, p.y],
      });
      current = { x: values[5], y: values[6] };
      return;
    }
    nextSegments.push(seg);
  });

  return buildPath(nextSegments);
};

export const translatePath = (d, dx, dy) => {
  const segments = parsePath(d);
  segments.forEach((seg) => {
    const { cmd, values } = seg;
    if (!values.length) return;
    if (cmd === "H") {
      values[0] += dx;
      return;
    }
    if (cmd === "V") {
      values[0] += dy;
      return;
    }
    if (cmd === "A") {
      values[5] += dx;
      values[6] += dy;
      return;
    }
    for (let i = 0; i < values.length; i += 2) {
      values[i] += dx;
      values[i + 1] += dy;
    }
  });
  return buildPath(segments);
};

export const scalePath = (d, sx, sy, pivotX, pivotY) => {
  const segments = parsePath(d);
  segments.forEach((seg) => {
    const { cmd, values } = seg;
    if (!values.length) return;
    if (cmd === "H") {
      values[0] = pivotX + (values[0] - pivotX) * sx;
      return;
    }
    if (cmd === "V") {
      values[0] = pivotY + (values[0] - pivotY) * sy;
      return;
    }
    if (cmd === "A") {
      values[5] = pivotX + (values[5] - pivotX) * sx;
      values[6] = pivotY + (values[6] - pivotY) * sy;
      return;
    }
    for (let i = 0; i < values.length; i += 2) {
      values[i] = pivotX + (values[i] - pivotX) * sx;
      values[i + 1] = pivotY + (values[i + 1] - pivotY) * sy;
    }
  });
  return buildPath(segments);
};

export const computeGroupBounds = (paths) =>
  paths.reduce(
    (acc, path) => {
      const b = computePathBounds(path.d);
      return {
        minX: Math.min(acc.minX, b.minX),
        minY: Math.min(acc.minY, b.minY),
        maxX: Math.max(acc.maxX, b.maxX),
        maxY: Math.max(acc.maxY, b.maxY),
      };
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );
