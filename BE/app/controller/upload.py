import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

# Absolute path: controller is at app/controller/upload.py → go up two levels to BE/
_BASE = os.path.dirname(os.path.abspath(__file__))
MENU_IMAGE_DIR = os.path.normpath(os.path.join(_BASE, "..", "..", "uploaded_images", "menu_image"))
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/menu-image")
async def upload_menu_image(file: UploadFile = File(...)):
    """Upload a menu item image. Returns the accessible URL."""

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' is not allowed. Use: jpg, jpeg, png, webp, gif"
        )

    # Read content and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 5 MB limit.")

    # Generate a unique filename to avoid collisions
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(MENU_IMAGE_DIR, unique_name)

    # Ensure directory exists
    os.makedirs(MENU_IMAGE_DIR, exist_ok=True)

    # Write file to disk
    with open(save_path, "wb") as f:
        f.write(content)

    # Return the public URL (served by StaticFiles at /images/menu_image/<filename>)
    image_url = f"http://localhost:8000/images/menu_image/{unique_name}"
    return {"url": image_url, "filename": unique_name}
