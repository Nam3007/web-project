from typing import List 
from sqlalchemy.orm import Session
from models import MenuItem
from decimal import Decimal

class MenuItemRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(MenuItem).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, item_id: int) -> MenuItem:
        return db.query(MenuItem).filter(MenuItem.id == item_id).first()

    def create(self, db: Session, menu_item: MenuItem):
        db.add(menu_item)
        db.commit()
        db.refresh(menu_item)
        return menu_item

    def update(self, db: Session, menu_item: MenuItem):
        db.merge(menu_item)
        db.commit()
        db.refresh(menu_item)
        return menu_item

    def delete(self, db: Session, menu_item: MenuItem):
        db.delete(menu_item)
        db.commit()

    def get_all_by_type(self, db: Session, item_type: str) -> List[MenuItem]:
        return db.query(MenuItem).filter(MenuItem.item_type == item_type).all()
    

    def get_item_price_by_id(self, db: Session, item_id: int) -> Decimal:
        return db.query(MenuItem.item_price).filter(MenuItem.id == item_id).scalar()