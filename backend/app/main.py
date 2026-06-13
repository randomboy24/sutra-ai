from fastapi import FastAPI
from app.routes.auth import router as auth_router
from app.routes.webhooks import router as webhooks_router
from app.routes.health import router as health_router
from app.routes.readiness import router as readiness_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.include_router(auth_router)
app.include_router(webhooks_router)
app.include_router(health_router)
app.include_router(readiness_router)

@app.get("/")
def root():
    return {"message": "Hello World"}
