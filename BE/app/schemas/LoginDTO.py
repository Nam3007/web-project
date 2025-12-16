from pydantic import BaseModel
import enum

class Role(str, enum.Enum):
    regular_customer = "regular_customer"
    vip_customer = "vip_customer"
    waiter = "waiter"
    chef = "chef"
    cashier = "cashier"
    admin = "admin"
    

class LoginRequestDTO(BaseModel):
    username: str
    password: str
    
class LoginResponseDTO(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: Role
