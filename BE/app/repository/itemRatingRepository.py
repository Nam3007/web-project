from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import ItemRating


class ItemRatingRepository:
    def create(self, db: Session, item_rating: ItemRating) -> ItemRating:
        db.add(item_rating)
        db.commit()
        db.refresh(item_rating)
        return item_rating

    def get_by_order_and_item(self, db: Session, order_id: int, menu_item_id: int) -> Optional[ItemRating]:
        return db.query(ItemRating).filter(
            ItemRating.order_id == order_id,
            ItemRating.menu_item_id == menu_item_id
        ).first()

    def get_ratings_by_menu_item(self, db: Session, menu_item_id: int, skip: int = 0, limit: int = 100) -> List[ItemRating]:
        return db.query(ItemRating).filter(
            ItemRating.menu_item_id == menu_item_id
        ).order_by(ItemRating.created_at.desc()).offset(skip).limit(limit).all()

    def get_ratings_by_order(self, db: Session, order_id: int) -> List[ItemRating]:
        return db.query(ItemRating).filter(
            ItemRating.order_id == order_id
        ).all()

    def calculate_average(self, db: Session, menu_item_id: int) -> Optional[float]:
        result = db.query(func.avg(ItemRating.rating)).filter(
            ItemRating.menu_item_id == menu_item_id
        ).scalar()
        if result is not None:
            return round(float(result), 1)
        return None

    def count_by_menu_item(self, db: Session, menu_item_id: int) -> int:
        return db.query(ItemRating).filter(
            ItemRating.menu_item_id == menu_item_id
        ).count()

    def has_rated_order(self, db: Session, order_id: int, customer_id: int) -> bool:
        return db.query(ItemRating).filter(
            ItemRating.order_id == order_id,
            ItemRating.customer_id == customer_id
        ).first() is not None
