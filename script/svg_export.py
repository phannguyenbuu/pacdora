# -*- coding: utf-8 -*-
import math


STROKE = "#ffffff"
STROKE_W = "0.5"


def r5(x: float) -> str:
    return f"{float(x):.3f}"


def r0(x: float) -> str:
    return f"{float(x):.0f}"


def svg_polygon(points_xy, stroke=None, stroke_width=None):
    pts = " ".join([f"{r5(x)},{r5(y)}" for x, y in points_xy])
    use_stroke = stroke if stroke is not None else STROKE
    use_width = stroke_width if stroke_width is not None else STROKE_W
    return (
        f'<polygon points="{pts}" fill="none" '
        f'stroke="{use_stroke}" stroke-width="{use_width}" '
        f'stroke-linejoin="round" stroke-linecap="round" />'
    )


def svg_polyline(points_xy, stroke=None, stroke_width=None):
    pts = " ".join([f"{r5(x)},{r5(y)}" for x, y in points_xy])
    use_stroke = stroke if stroke is not None else STROKE
    use_width = stroke_width if stroke_width is not None else STROKE_W
    return (
        f'<polyline points="{pts}" fill="none" '
        f'stroke="{use_stroke}" stroke-width="{use_width}" '
        f'stroke-linejoin="round" stroke-linecap="round" />'
    )


def svg_label(text, x, y):
    esc = (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return (
        f'<text x="{r5(x)}" y="{r5(y)}" fill="{STROKE}" '
        f'font-size="24" text-anchor="middle" dominant-baseline="middle">'
        f"{esc}</text>"
    )


def transform_point_local_to_world(x, y, bx, by, rot_rad, sx, sy):
    x *= sx
    y *= sy
    cr = math.cos(rot_rad)
    sr = math.sin(rot_rad)
    xr = x * cr - y * sr
    yr = x * sr + y * cr
    return (xr + bx, yr + by)


def compute_world_bbox_from_export(blocks, padding=10.0):
    minx = miny = None
    maxx = maxy = None

    def upd(x, y):
        nonlocal minx, miny, maxx, maxy
        minx = x if minx is None else min(minx, x)
        miny = y if miny is None else min(miny, y)
        maxx = x if maxx is None else max(maxx, x)
        maxy = y if maxy is None else max(maxy, y)

    for b in blocks:
        bx, by = b["base_xy"]
        rot = b["rot"]
        sx, sy = b["scale"]
        upd(bx, by)

        for pl in b.get("polylines", []):
            for vx, vy, _ in pl.get("verts", []):
                wx, wy = transform_point_local_to_world(vx, vy, bx, by, rot, sx, sy)
                upd(wx, wy)

    if minx is None:
        return (0.0, 0.0, 100.0, 100.0)

    return (minx - padding, miny - padding, maxx + padding, maxy + padding)


def find_base_rect_from_selection(selection_polylines):
    best = None
    best_area = -1.0
    best_points = None

    for pl in selection_polylines or []:
        if not pl.get("closed"):
            continue
        verts = pl.get("verts", [])
        if len(verts) < 4:
            continue
        xs = [v[0] for v in verts if len(v) >= 2]
        ys = [v[1] for v in verts if len(v) >= 2]
        if not xs or not ys:
            continue
        minx = min(xs)
        maxx = max(xs)
        miny = min(ys)
        maxy = max(ys)
        area = (maxx - minx) * (maxy - miny)
        if area > best_area:
            best_area = area
            best = (minx, miny, maxx, maxy)
            best_points = [(v[0], v[1]) for v in verts if len(v) >= 2]

    return best, best_points


def find_base_rect(blocks):
    best = None
    best_area = -1.0
    best_points = None

    for b in blocks:
        bx, by = b["base_xy"]
        rot = b["rot"]
        sx, sy = b["scale"]
        for pl in b.get("polylines", []):
            if not pl.get("closed"):
                continue
            verts = pl.get("verts", [])
            if len(verts) < 4:
                continue
            world_pts = []
            for v in verts:
                if len(v) >= 2:
                    world_pts.append(
                        transform_point_local_to_world(v[0], v[1], bx, by, rot, sx, sy)
                    )
            xs = [p[0] for p in world_pts]
            ys = [p[1] for p in world_pts]
            minx = min(xs)
            maxx = max(xs)
            miny = min(ys)
            maxy = max(ys)
            area = (maxx - minx) * (maxy - miny)
            if area > best_area:
                best_area = area
                best = (minx, miny, maxx, maxy)
                best_points = world_pts

    return best, best_points


def build_svg_lines(blocks, selection_polylines=None, defpoints_polylines=None, padding=20.0):
    base_rect, base_points = find_base_rect_from_selection(selection_polylines or [])
    if not base_rect:
        base_rect, base_points = find_base_rect(blocks)
    if base_rect:
        minx, miny, maxx, maxy = base_rect
    else:
        minx, miny, maxx, maxy = compute_world_bbox_from_export(blocks, padding=padding)
    width = maxx - minx
    height = maxy - miny
    if width <= 0:
        width = 100.0
    if height <= 0:
        height = 100.0

    svg_lines = []
    svg_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    svg_lines.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {r5(width)} {r5(height)}" version="1.1">'
    )

    def to_svg_world(wx, wy):
        # Bake the old outer flip (translate(0,height) scale(1,-1)) into points.
        sx = wx - minx
        sy = height - (wy - miny)
        return (sx, sy)

    # baseRect omitted by request

    for b in blocks:
        bx, by = b["base_xy"]
        rot = b["rot"]
        sx, sy = b["scale"]
        gid = b["gid"]

        svg_lines.append(f'<g id="{gid}">')

        for pl in b["polylines"]:
            world_pts = []
            for v in pl["verts"]:
                if len(v) < 2:
                    continue
                wx, wy = transform_point_local_to_world(v[0], v[1], bx, by, rot, sx, sy)
                world_pts.append(to_svg_world(wx, wy))
            closed = bool(pl["closed"]) if pl.get("closed") is not None else False
            if closed:
                svg_lines.append(svg_polygon(world_pts))
            else:
                svg_lines.append(svg_polyline(world_pts))

        cx, cy = b["center_local"]
        wx, wy = transform_point_local_to_world(cx, cy, bx, by, rot, sx, sy)
        lx, ly = to_svg_world(wx, wy)
        label_text = b.get("label", b.get("gid_raw", ""))
        svg_lines.append(svg_label(label_text, lx, ly))

        svg_lines.append("</g>")

    if defpoints_polylines:
        svg_lines.append('<g id="defpoints">')
        for pl in defpoints_polylines:
            pts_xy = []
            for v in pl.get("verts", []):
                if len(v) < 2:
                    continue
                pts_xy.append(to_svg_world(v[0], v[1]))
            closed = bool(pl.get("closed")) if pl.get("closed") is not None else False
            if closed:
                svg_lines.append(svg_polygon(pts_xy, stroke="#ff0000", stroke_width="1"))
            else:
                svg_lines.append(svg_polyline(pts_xy, stroke="#ff0000", stroke_width="1"))
        svg_lines.append("</g>")

    svg_lines.append("</svg>")
    return svg_lines
