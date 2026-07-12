from sqlalchemy.orm import Session
from typing import List, Optional
from models import ItemRating, MenuItem
from schemas.item_ratingDTO import ItemRatingCreateDTO, ItemRatingBulkCreateDTO
from repository import ItemRatingRepository, MenuItemRepository


class ItemRatingService:
    def __init__(self):
        self.rating_repo = ItemRatingRepository()
        self.menu_repo = MenuItemRepository()

    def submit_rating(self, db: Session, dto: ItemRatingCreateDTO) -> ItemRating:
        """Submit a single item rating and recalculate average."""
        # Check if already rated
        existing = self.rating_repo.get_by_order_and_item(db, dto.order_id, dto.menu_item_id)
        if existing:
            raise ValueError(f"Item {dto.menu_item_id} in order {dto.order_id} has already been rated.")

        item_rating = ItemRating(
            menu_item_id=dto.menu_item_id,
            order_id=dto.order_id,
            customer_id=dto.customer_id,
            rating=dto.rating,
            review_text=dto.review_text,
        )
        created = self.rating_repo.create(db, item_rating)
        self._recalculate_average(db, dto.menu_item_id)
        return created

    def submit_bulk_ratings(self, db: Session, bulk_dto: ItemRatingBulkCreateDTO) -> List[ItemRating]:
        """Submit ratings for multiple items in an order at once."""
        results = []
        affected_items = set()

        for single in bulk_dto.ratings:
            # Skip if already rated
            existing = self.rating_repo.get_by_order_and_item(db, bulk_dto.order_id, single.menu_item_id)
            if existing:
                continue

            item_rating = ItemRating(
                menu_item_id=single.menu_item_id,
                order_id=bulk_dto.order_id,
                customer_id=bulk_dto.customer_id,
                rating=single.rating,
                review_text=single.review_text,
            )
            db.add(item_rating)
            results.append(item_rating)
            affected_items.add(single.menu_item_id)

        db.commit()
        for r in results:
            db.refresh(r)

        # Recalculate averages for all affected items
        for menu_item_id in affected_items:
            self._recalculate_average(db, menu_item_id)

        return results

    def _recalculate_average(self, db: Session, menu_item_id: int):
        """Recalculate and persist the average rating for a menu item."""
        avg = self.rating_repo.calculate_average(db, menu_item_id)
        menu_item = self.menu_repo.get_by_id(db, menu_item_id)
        if menu_item:
            menu_item.average_rating = avg
            db.commit()
            db.refresh(menu_item)

    def get_ratings_for_item(self, db: Session, menu_item_id: int, skip: int = 0, limit: int = 100) -> List[ItemRating]:
        """Get all ratings for a specific menu item (paginated)."""
        return self.rating_repo.get_ratings_by_menu_item(db, menu_item_id, skip, limit)

    def get_ratings_for_order(self, db: Session, order_id: int) -> List[ItemRating]:
        """Get all ratings already submitted for an order."""
        return self.rating_repo.get_ratings_by_order(db, order_id)

    def has_customer_rated_order(self, db: Session, order_id: int, customer_id: int) -> bool:
        """Check if a customer has already submitted any ratings for this order."""
        return self.rating_repo.has_rated_order(db, order_id, customer_id)

    def get_item_rating_summary(self, db: Session, menu_item_id: int) -> dict:
        """Get average rating and count for a menu item."""
        avg = self.rating_repo.calculate_average(db, menu_item_id)
        count = self.rating_repo.count_by_menu_item(db, menu_item_id)
        return {
            "menu_item_id": menu_item_id,
            "average_rating": avg,
            "total_ratings": count,
        }
