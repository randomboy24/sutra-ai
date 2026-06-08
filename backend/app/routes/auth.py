from fastapi import FastAPI 
from fastapi import APIRouter

router = APIRouter( prefix="/auth", tags=["auth"] )

@router.post("/login")
def login(): 
    return {"message" : "Login successful"}

@router.post("/register")
def register():
    return {"message" : "Registration successful"}

