import base64
import json
import os
from datetime import datetime

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS


BASE_DIR = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = Flask(__name__)
CORS(app)


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


@app.post("/api/pieces")
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


@app.get("/output/<path:filename>")
def serve_output_file(filename: str):
    # Serve saved piece textures directly for the frontend.
    return send_from_directory(OUTPUT_DIR, filename)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
