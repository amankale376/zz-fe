"""Minimal FastAPI stub so Emergent supervisor's `backend` process stays healthy.

The real game backend lives elsewhere; this process only exposes a tiny /api
surface area so the preview pod's supervisor doesn't loop-restart.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="zz-fe preview stub")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "zz-fe-preview-stub"}


@app.get("/api/")
def root():
    return {"message": "zz-fe preview stub. Game backend runs separately."}
