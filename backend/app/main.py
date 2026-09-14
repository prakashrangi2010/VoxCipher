from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager
import os

from .database.connection import engine, Base, SessionLocal
from .services.threat_service import seed_demo_threats_if_empty
from .routes import analyze, challenge, threats, analytics, lab, reports, health

# Ensure tables exist immediately
Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    seed_demo_threats_if_empty(db)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_demo_threats_if_empty(db)
    yield

app = FastAPI(
    title="VoxCipher – Adaptive Voice Impersonation Defense API",
    description="Multi-layered zero-trust voice defense against deepfakes, channel spoofing, and social engineering.",
    version="1.0.0",
    lifespan=lifespan
)

# Robust CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes FIRST so they take precedence over static SPA
app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(challenge.router)
app.include_router(threats.router)
app.include_router(analytics.router)
app.include_router(lab.router)
app.include_router(reports.router)

# Locate frontend production build
FRONTEND_DIST = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
)

if os.path.exists(FRONTEND_DIST) and os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Do not intercept /api or /docs
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        
        target = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(target):
            return FileResponse(target)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "name": "VoxCipher – Adaptive Voice Impersonation Defense API",
            "status": "ONLINE",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/api/health"
        }
