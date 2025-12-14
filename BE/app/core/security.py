import bcrypt

def hash_password(password: str) -> str:
    """
    Hash plain password before saving to DB
    Returns hash as string (e.g. b'$2b$12$...')
    """
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()  # Default rounds=12, adjustable: gensalt(rounds=14)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")  # Store as string in DB

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify login password
    """
    plain_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(plain_bytes, hashed_bytes)

