# -*- coding: utf-8 -*-
import time
import pythoncom
from pyautocad import Autocad

try:
    from .com_utils import com_call_retry
    from .autocad_extract import build_blocks_from_selection
    from .svg_export import build_svg_lines
except ImportError:
    from com_utils import com_call_retry
    from autocad_extract import build_blocks_from_selection
    from svg_export import build_svg_lines


def main():
    pythoncom.CoInitialize()
    acad = Autocad(create_if_not_exists=True)
    doc = acad.app.ActiveDocument

    ss_name = "PY_SEL"
    try:
        com_call_retry(lambda: doc.SelectionSets.Item(ss_name).Delete())
    except Exception:
        pass
    ss = com_call_retry(lambda: doc.SelectionSets.Add(ss_name))

    print("AutoCAD: chon objects (Block + Text/MText) roi Enter...")
    com_call_retry(lambda: ss.SelectOnScreen())
    time.sleep(0.15)

    blocks, texts_world, selection_polylines, defpoints_polylines = build_blocks_from_selection(
        doc, ss, text_bbox_padding=10.0
    )
    if texts_world:
        print("\nSelection texts (content @ position):")
        for t in texts_world:
            x, y, z = t["pt"]
            print(f'- "{t["content"]}" @ ({x:.3f}, {y:.3f}, {z:.3f})')
    svg_lines = build_svg_lines(
        blocks, selection_polylines, defpoints_polylines=defpoints_polylines, padding=20.0
    )

    out_path = "export_blocks.svg"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(svg_lines))

    print(f"\nDone. Saved: {out_path}")
    print(f"Blocks exported: {len(blocks)}")

    try:
        com_call_retry(lambda: ss.Delete())
    except Exception:
        pass


if __name__ == "__main__":
    main()
