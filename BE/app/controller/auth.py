from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.security import create_access_token
from db import get_db
from schemas import LoginRequestDTO, LoginResponseDTO
from services import AuthService

router = APIRouter()
# Initialize service
auth_service = AuthService()

# auth.py (controller)
@router.post("/login", response_model=LoginResponseDTO)
def login(
    data: LoginRequestDTO,
    db: Session = Depends(get_db)
):
    try:
        result = auth_service.login(db, data.username, data.password)
        return result  # Now returns all required fields
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
