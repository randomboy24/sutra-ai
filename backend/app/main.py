import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router
from app.routes.webhooks import router as webhooks_router
from app.routes.health import router as health_router
from app.routes.readiness import router as readiness_router
from app.routes.mock_exams import router as mock_exams_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

default_cors_origins = "http://localhost:3000,http://127.0.0.1:3000"
cors_origins = [
    origin.strip()
    for origin in os.getenv("BACKEND_CORS_ORIGINS", default_cors_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(webhooks_router)
app.include_router(health_router)
app.include_router(readiness_router)
app.include_router(mock_exams_router)

@app.get("/")
def root():
    return {"message": "Hello World"}
