from sqlalchemy.orm import Session
from typing import List, Optional
from models import MenuItem
from schemas import MenuItemCreateDTO, MenuItemUpdateDTO
from repository import MenuItemRepository

class MenuItemService:

    def __init__(self):
        self.repository = MenuItemRepository()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[MenuItem]:
        """Get all menu items with pagination"""
        return self.repository.get_all(db, skip=skip, limit=limit)
    
    def get_all_by_type(self, db: Session, item_type: str) -> List[MenuItem]:
        """Get all menu items by type"""
        return self.repository.get_all_by_type(db, item_type)
    
    def create(self, db: Session, item_data: MenuItemCreateDTO) -> MenuItem:
        """Create new menu item"""
        menu_item = MenuItem(
            item_name=item_data.item_name,
            item_type=item_data.item_type,
            item_price=item_data.item_price,
            item_description=item_data.item_description,
            item_image=item_data.item_image,
            is_available=item_data.is_available
        )
        return self.repository.create(db, menu_item)
    
    def delete(self, db: Session, item_id: int) -> bool:
        """Delete menu item"""
        menu_item = self.repository.get_by_id(db, item_id)
        if not menu_item:
            return False
        self.repository.delete(db, menu_item)
        return True
    
    def update(self, db: Session, item_id: int, item_data: MenuItemUpdateDTO) -> Optional[MenuItem]:
        """Update menu item"""
        existing_item = self.repository.get_by_id(db, item_id)
        if not existing_item:
            return None
        
        for field, value in item_data.model_dump(exclude_unset=True).items():
            setattr(existing_item, field, value)
        
        return self.repository.update(db, existing_item)
