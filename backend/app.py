import base64
import json
import os
import shutil
from datetime import datetime

from flask import Flask, Blueprint, jsonify, request, send_from_directory
from flask_cors import CORS


BASE_DIR = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)
TEMPLATE_PATH = os.path.join(OUTPUT_DIR, "template.json")
SVG_EXPORT_PATH = os.path.join(OUTPUT_DIR, "canvas.svg")
PROJECT_DIR = os.path.abspath(os.path.join(BASE_DIR, os.pardir))
PROJECT_STATIC_DIR = os.path.join(PROJECT_DIR, "static")
PROJECT_PUBLIC_DIR = os.path.join(PROJECT_DIR, "public")
ENV_STATIC_DIR = os.environ.get("PACDORA_STATIC_DIR")
ENV_PUBLIC_DIR = os.environ.get("PACDORA_PUBLIC_DIR")
BACKEND_STATIC_DIR = os.path.join(BASE_DIR, "static")
BOX_SAMPLE_DIR = os.path.join(BACKEND_STATIC_DIR, "box-sample")


def _resolve_source_dir() -> str | None:
    if ENV_STATIC_DIR and os.path.isdir(ENV_STATIC_DIR):
        return ENV_STATIC_DIR
    if ENV_PUBLIC_DIR and os.path.isdir(ENV_PUBLIC_DIR):
        return ENV_PUBLIC_DIR
    if os.path.isdir(PROJECT_STATIC_DIR):
        return PROJECT_STATIC_DIR
    if os.path.isdir(PROJECT_PUBLIC_DIR):
        return PROJECT_PUBLIC_DIR
    return None


def _ensure_static_assets() -> None:
    source_dir = _resolve_source_dir()
    if not os.path.isdir(source_dir):
        return
    if not os.path.isdir(BACKEND_STATIC_DIR):
        shutil.copytree(source_dir, BACKEND_STATIC_DIR)
        return
    if not os.path.isdir(BOX_SAMPLE_DIR):
        src_box_sample = os.path.join(source_dir, "box-sample")
        if os.path.isdir(src_box_sample):
            shutil.copytree(src_box_sample, BOX_SAMPLE_DIR)
        return
    src_svg = os.path.join(source_dir, "box-sample", "150010.svg")
    if os.path.isfile(src_svg):
        dst_svg = os.path.join(BOX_SAMPLE_DIR, "150010.svg")
        if not os.path.isfile(dst_svg):
            shutil.copy2(src_svg, dst_svg)


_ensure_static_assets()

API_PREFIX = "/pac-api"

app = Flask(__name__)
CORS(app)
api = Blueprint("api", __name__, url_prefix=API_PREFIX)


def _log(msg: str) -> None:
    timestamp = datetime.utcnow().isoformat(timespec="seconds")
    print(f"[box-sample] {timestamp}Z {msg}")


def _save_data_url(data_url: str, out_path: str) -> None:
    if not data_url or "," not in data_url:
        raise ValueError("invalid data url")
    header, encoded = data_url.split(",", 1)
    # Only accept base64 image payloads.
    if ";base64" not in header:
        raise ValueError("data url is not base64")
    raw = base64.b64decode(encoded)
    with open(out_path, "wb") as f:
        f.write(raw)


@api.post("/api/pieces")
def save_pieces():
    payload = request.get_json(silent=True) or {}
    pieces = payload.get("pieces") or {}
    if not isinstance(pieces, dict) or not pieces:
        return jsonify({"ok": False, "error": "missing pieces"}), 400

    # Overwrite into the root output directory (no per-batch folders).
    batch_dir = OUTPUT_DIR

    saved = []
    for key, data_url in pieces.items():
        safe_key = "".join(c for c in str(key) if c.isalnum() or c in ("-", "_"))
        if not safe_key:
            continue
        out_path = os.path.join(batch_dir, f"{safe_key}.png")
        try:
            _save_data_url(data_url, out_path)
            saved.append({"id": key, "path": out_path})
        except Exception as exc:  # noqa: BLE001 - return error detail to client
            return (
                jsonify({"ok": False, "error": f"failed to save {key}", "detail": str(exc)}),
                400,
            )

    meta_path = os.path.join(batch_dir, "meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({"saved": saved, "count": len(saved)}, f, indent=2)

    return jsonify({"ok": True, "count": len(saved), "dir": batch_dir})


@api.get("/output/<path:filename>")
def serve_output_file(filename: str):
    # Serve saved piece textures directly for the frontend.
    return send_from_directory(OUTPUT_DIR, filename)


def _serve_box_sample(filename: str):
    # Serve SVG/GLB samples from the frontend static directory.
    candidate_dirs = [BOX_SAMPLE_DIR]
    source_dir = _resolve_source_dir()
    if source_dir:
        candidate_dirs.append(os.path.join(source_dir, "box-sample"))
    _log(f"request={filename} resolved_source={source_dir} candidates={candidate_dirs}")
    for directory in candidate_dirs:
        path = os.path.join(directory, filename)
        _log(f"check path={path} exists={os.path.isfile(path)}")
        if os.path.isfile(path):
            return send_from_directory(directory, filename)
    _ensure_static_assets()
    fallback_path = os.path.join(BOX_SAMPLE_DIR, filename)
    _log(f"post-sync check path={fallback_path} exists={os.path.isfile(fallback_path)}")
    if os.path.isfile(fallback_path):
        return send_from_directory(BOX_SAMPLE_DIR, filename)
    return jsonify({"ok": False, "error": "file not found"}), 404


@api.get("/api/box-sample/<path:filename>")
def serve_box_sample(filename: str):
    return _serve_box_sample(filename)


@app.get("/api/box-sample/<path:filename>")
def serve_box_sample_root(filename: str):
    return _serve_box_sample(filename)


@api.post("/api/template/save")
def save_template():
    payload = request.get_json(silent=True) or {}
    with open(TEMPLATE_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    return jsonify({"ok": True, "path": TEMPLATE_PATH})


@api.get("/api/template/load")
def load_template():
    if not os.path.exists(TEMPLATE_PATH):
        return jsonify({"ok": False, "error": "template not found"}), 404
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return jsonify({"ok": True, "template": data})


@api.post("/api/export/svg")
def export_svg():
    payload = request.get_json(silent=True) or {}
    svg_text = payload.get("svg")
    if not svg_text:
        return jsonify({"ok": False, "error": "missing svg"}), 400
    with open(SVG_EXPORT_PATH, "w", encoding="utf-8") as f:
        f.write(svg_text)
    return jsonify({"ok": True, "path": SVG_EXPORT_PATH})


app.register_blueprint(api)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5030, debug=True)
