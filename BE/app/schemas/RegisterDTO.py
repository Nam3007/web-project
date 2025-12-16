from pydantic import BaseModel

class RegisterRequestDTO(BaseModel):
    usernmame: str
    password_hashed: str
    full_name: str
    email: str
    