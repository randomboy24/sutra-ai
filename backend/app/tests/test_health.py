from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_health_nonexistent_returns_404():
    response = client.get("/api/health/nonexistent_user")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


def test_seed_health_nonexistent_returns_404():
    response = client.post(
        "/api/health/seed/nonexistent_user",
        json={"health_score": 80.0},
    )
    assert response.status_code == 404


def test_root_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}
