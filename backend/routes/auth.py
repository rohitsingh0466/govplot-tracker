"""Auth stub routes"""
from fastapi import APIRouter
router = APIRouter()

@router.post("/register")
def register():
    return {"message": "Registration endpoint — integrate JWT + bcrypt"}

@router.post("/login")
def login():
    return {"message": "Login endpoint — returns JWT token"}
