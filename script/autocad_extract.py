# -*- coding: utf-8 -*-
import re
import math

try:
    from .com_utils import com_call_retry, vt_to_xyz, safe_text
    from .svg_export import transform_point_local_to_world
except ImportError:
    from com_utils import com_call_retry, vt_to_xyz, safe_text
    from svg_export import transform_point_local_to_world


def sanitize_xml_id(s: str) -> str:
    s = (s or "").strip()
    if not s:
        return "UNNAMED"
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^A-Za-z0-9_\-:.]", "_", s)
    if re.match(r"^[0-9]", s):
        s = "_" + s
    return s


def point_in_bbox(pt, bbmin, bbmax, padding=0.0) -> bool:
    x, y, _ = pt
    return (bbmin[0] - padding <= x <= bbmax[0] + padding) and (
        bbmin[1] - padding <= y <= bbmax[1] + padding
    )


def get_bbox(obj):
    try:
        pmin, pmax = com_call_retry(lambda: obj.GetBoundingBox())
        return vt_to_xyz(pmin), vt_to_xyz(pmax)
    except Exception:
        return None


def lwpoly_vertices(ent):
    coords = list(com_call_retry(lambda: ent.Coordinates))  # [x1,y1,x2,y2,...]
    z = float(getattr(ent, "Elevation", 0.0))
    verts = []
    for i in range(0, len(coords), 2):
        verts.append((float(coords[i]), float(coords[i + 1]), z))
    return verts


def _arc_points(p1, p2, bulge, z, segments=8):
    if bulge == 0:
        return [p1, p2]
    x1, y1 = p1
    x2, y2 = p2
    dx = x2 - x1
    dy = y2 - y1
    chord = math.hypot(dx, dy)
    if chord == 0:
        return [p1, p2]

    theta = 4.0 * math.atan(bulge)
    sin_half = math.sin(theta / 2.0)
    if sin_half == 0:
        return [p1, p2]

    radius = chord / (2.0 * sin_half)
    midx = (x1 + x2) / 2.0
    midy = (y1 + y2) / 2.0
    perp_x = -dy / chord
    perp_y = dx / chord
    direction = 1.0 if bulge > 0 else -1.0
    offset = radius * math.cos(theta / 2.0)
    cx = midx + perp_x * direction * offset
    cy = midy + perp_y * direction * offset

    start_ang = math.atan2(y1 - cy, x1 - cx)
    step = theta / segments

    points = [(x1, y1, z)]
    for i in range(1, segments):
        ang = start_ang + step * i
        points.append((cx + math.cos(ang) * abs(radius), cy + math.sin(ang) * abs(radius), z))
    points.append((x2, y2, z))
    return points


def lwpoly_vertices_with_bulge(ent, segments=8):
    coords = list(com_call_retry(lambda: ent.Coordinates))
    z = float(getattr(ent, "Elevation", 0.0))
    base_verts = []
    for i in range(0, len(coords), 2):
        base_verts.append((float(coords[i]), float(coords[i + 1]), z))

    bulges = [0.0] * len(base_verts)
    try:
        for i in range(len(base_verts)):
            bulges[i] = float(com_call_retry(lambda i=i: ent.GetBulge(i)))
    except Exception:
        pass

    closed = bool(ent_closed(ent))
    out = []
    count = len(base_verts)
    seg_count = count if closed else count - 1
    for i in range(seg_count):
        p1 = base_verts[i]
        p2 = base_verts[(i + 1) % count]
        bulge = bulges[i] if i < len(bulges) else 0.0
        arc_pts = _arc_points((p1[0], p1[1]), (p2[0], p2[1]), bulge, z, segments=segments)
        if out:
            arc_pts = arc_pts[1:]
        out.extend(arc_pts)

    return out


def poly2d_vertices(ent):
    coords = list(com_call_retry(lambda: ent.Coordinates))
    verts = []
    step = 3 if (len(coords) % 3 == 0) else 2
    if step == 3:
        for i in range(0, len(coords), 3):
            verts.append((float(coords[i]), float(coords[i + 1]), float(coords[i + 2])))
    else:
        for i in range(0, len(coords), 2):
            verts.append((float(coords[i]), float(coords[i + 1]), 0.0))
    return verts


def poly3d_vertices(ent):
    coords = list(com_call_retry(lambda: ent.Coordinates))
    verts = []
    for i in range(0, len(coords), 3):
        verts.append((float(coords[i]), float(coords[i + 1]), float(coords[i + 2])))
    return verts


def ent_closed(ent):
    try:
        return bool(com_call_retry(lambda: ent.Closed))
    except Exception:
        return None


def collect_polylines_in_block_def(doc, block_def_name):
    out = []
    try:
        bdef = com_call_retry(lambda: doc.Blocks.Item(block_def_name))
    except Exception:
        return out

    try:
        n = int(com_call_retry(lambda: bdef.Count))
    except Exception:
        return out

    for i in range(n):
        try:
            ent = com_call_retry(lambda i=i: bdef.Item(i))
            ename = com_call_retry(lambda: ent.EntityName)
        except Exception:
            continue

        try:
            if ename == "AcDbPolyline":
                out.append(
                    {
                        "type": ename,
                        "closed": ent_closed(ent),
                        "verts": lwpoly_vertices_with_bulge(ent, segments=8),
                    }
                )
            elif ename == "AcDb2dPolyline":
                out.append({"type": ename, "closed": ent_closed(ent), "verts": poly2d_vertices(ent)})
            elif ename == "AcDb3dPolyline":
                out.append({"type": ename, "closed": ent_closed(ent), "verts": poly3d_vertices(ent)})
        except Exception:
            pass

    return out


def compute_group_center_local(polylines):
    minx = miny = None
    maxx = maxy = None

    def upd(x, y):
        nonlocal minx, miny, maxx, maxy
        minx = x if minx is None else min(minx, x)
        miny = y if miny is None else min(miny, y)
        maxx = x if maxx is None else max(maxx, x)
        maxy = y if maxy is None else max(maxy, y)

    for pl in polylines or []:
        for v in pl.get("verts", []):
            if len(v) >= 2:
                upd(v[0], v[1])

    if minx is None:
        return (0.0, 0.0)
    return ((minx + maxx) / 2.0, (miny + maxy) / 2.0)


def compute_block_world_bbox(block):
    minx = miny = None
    maxx = maxy = None

    def upd(x, y):
        nonlocal minx, miny, maxx, maxy
        minx = x if minx is None else min(minx, x)
        miny = y if miny is None else min(miny, y)
        maxx = x if maxx is None else max(maxx, x)
        maxy = y if maxy is None else max(maxy, y)

    bx, by = block["base_xy"]
    rot = block["rot"]
    sx, sy = block["scale"]
    for pl in block.get("polylines", []):
        for v in pl.get("verts", []):
            if len(v) >= 2:
                wx, wy = transform_point_local_to_world(v[0], v[1], bx, by, rot, sx, sy)
                upd(wx, wy)

    if minx is None:
        return None
    return ((minx, miny, 0.0), (maxx, maxy, 0.0))


def build_blocks_from_selection(doc, ss, text_bbox_padding=10.0):
    blocks = []
    texts_world = []
    selection_polylines = []
    defpoints_polylines = []

    count = int(com_call_retry(lambda: ss.Count))
    for i in range(count):
        try:
            obj = com_call_retry(lambda i=i: ss.Item(i))
            ename = com_call_retry(lambda: obj.EntityName)
        except Exception:
            continue

        if ename == "AcDbBlockReference":
            try:
                bname = getattr(obj, "EffectiveName", None) or com_call_retry(lambda: obj.Name)
                ins = vt_to_xyz(com_call_retry(lambda: obj.InsertionPoint))
                bx, by = ins[0], ins[1]

                rot = float(getattr(obj, "Rotation", 0.0))
                sx = float(getattr(obj, "XScaleFactor", 1.0))
                sy = float(getattr(obj, "YScaleFactor", 1.0))

                bbox = get_bbox(obj)
                blocks.append(
                    {
                        "obj": obj,
                        "name": bname,
                        "base_xy": (bx, by),
                        "rot": rot,
                        "scale": (sx, sy),
                        "bbox": bbox,
                    }
                )
            except Exception:
                pass

        elif ename in ("AcDbText", "AcDbMText"):
            try:
                content = safe_text(obj)
                pt = vt_to_xyz(com_call_retry(lambda: obj.InsertionPoint))
                texts_world.append({"content": content, "pt": pt})
            except Exception:
                pass
        elif ename == "AcDbPolyline":
            try:
                layer = str(getattr(obj, "Layer", "")) if obj is not None else ""
                item = {
                    "type": ename,
                    "closed": ent_closed(obj),
                    "verts": lwpoly_vertices_with_bulge(obj, segments=8),
                }
                selection_polylines.append(item)
                if layer.lower() == "defpoints":
                    defpoints_polylines.append(item)
            except Exception:
                pass
        elif ename == "AcDb2dPolyline":
            try:
                layer = str(getattr(obj, "Layer", "")) if obj is not None else ""
                item = {"type": ename, "closed": ent_closed(obj), "verts": poly2d_vertices(obj)}
                selection_polylines.append(item)
                if layer.lower() == "defpoints":
                    defpoints_polylines.append(item)
            except Exception:
                pass
        elif ename == "AcDb3dPolyline":
            try:
                layer = str(getattr(obj, "Layer", "")) if obj is not None else ""
                item = {"type": ename, "closed": ent_closed(obj), "verts": poly3d_vertices(obj)}
                selection_polylines.append(item)
                if layer.lower() == "defpoints":
                    defpoints_polylines.append(item)
            except Exception:
                pass

    for b in blocks:
        b["polylines"] = collect_polylines_in_block_def(doc, b["name"])
        b["center_local"] = compute_group_center_local(b["polylines"])
        b["bbox_world"] = compute_block_world_bbox(b)

        b["texts"] = []
        bbox = b["bbox_world"] or b["bbox"]
        if bbox:
            bbmin, bbmax = bbox
            for t in texts_world:
                if point_in_bbox(t["pt"], bbmin, bbmax, padding=text_bbox_padding):
                    b["texts"].append(t)

        if b["texts"]:
            bx, by = b["base_xy"]
            b["texts"].sort(
                key=lambda item: ((item["pt"][0] - bx) ** 2 + (item["pt"][1] - by) ** 2)
            )
            first_text = b["texts"][0]["content"]
        else:
            first_text = ""
        b["gid_raw"] = first_text
        b["gid"] = sanitize_xml_id(first_text)
        b["label"] = first_text

    return blocks, texts_world, selection_polylines, defpoints_polylines
