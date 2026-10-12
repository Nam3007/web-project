from datetime import datetime, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette import status
from models import Customer, Staff
from db import get_db
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from security import verify_password, verify_password
from pydantic import BaseModel

from schemas import LoginResponseDTO 
from schemas import LoginRequestDTO
from db import get_db
from services import CustomerService, StaffService
import os
from dotenv import load_dotenv
load_dotenv()
router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
SECRET_KEY = os.getenv("SECRET_KEY")  # Load from environment
ALGORITHM = "HS256"

