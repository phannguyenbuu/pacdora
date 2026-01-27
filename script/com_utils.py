# -*- coding: utf-8 -*-
import time
import comtypes

RPC_REJECTED = -2147418111  # Call was rejected by callee.


def com_call_retry(fn, retries=80, delay=0.08):
    last = None
    for _ in range(retries):
        try:
            return fn()
        except comtypes.COMError as e:
            last = e
            if e.args and e.args[0] == RPC_REJECTED:
                time.sleep(delay)
                continue
            raise
    raise RuntimeError(
        "AutoCAD is busy too long (RPC_E_CALL_REJECTED). "
        "Press ESC in AutoCAD (cancel commands) then run again."
    ) from last


def vt_to_xyz(vt):
    return (float(vt[0]), float(vt[1]), float(vt[2]) if len(vt) > 2 else 0.0)


def safe_text(obj) -> str:
    try:
        return str(com_call_retry(lambda: obj.TextString))
    except Exception:
        try:
            return str(com_call_retry(lambda: obj.Contents))
        except Exception:
            return ""
