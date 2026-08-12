import time
def benchmark_call(fn, *args, **kwargs):
    start=time.perf_counter()
    try:
        value=fn(*args, **kwargs)
        return {"success": True, "latency_ms": (time.perf_counter()-start)*1000, "result": value}
    except Exception as exc:
        return {"success": False, "latency_ms": (time.perf_counter()-start)*1000, "error": str(exc)}
