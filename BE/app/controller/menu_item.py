from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from models import MenuItem,item_type
from schemas import MenuItemCreateDTO, MenuItemResponse, MenuItemUpdateDTO
from services import MenuItemService

router = APIRouter()
# Initialize service
menu_item_service = MenuItemService()
@router.get("/", response_model=List[MenuItemResponse])
async def get_all_menu_items(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """Get all menu items"""
    menu_items = menu_item_service.get_all(db, skip=skip, limit=limit)
    return menu_items

# Get menu items by item_type
@router.get("/{item_type}", response_model=List[MenuItemResponse])
async def get_menu_item_by_type(item_type: item_type, db: Session = Depends(get_db)):
    """Get menu item by type"""
    menu_item = menu_item_service.get_all_by_type(db, item_type)
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    return menu_item

@router.post("/", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
async def create_menu_item(   
    item_data: MenuItemCreateDTO,
    db: Session = Depends(get_db)
):
    """Create new menu item"""
    return menu_item_service.create(db, item_data)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    """Delete menu item"""
    success = menu_item_service.delete(db, item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    return None

@router.put("/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: int,
    item_data: MenuItemUpdateDTO,
    db: Session = Depends(get_db)
):
    """Update menu item"""
    updated_item = menu_item_service.update(db, item_id, item_data)
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    return updated_item
