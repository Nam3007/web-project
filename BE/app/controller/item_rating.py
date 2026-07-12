from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from schemas.item_ratingDTO import (
    ItemRatingCreateDTO,
    ItemRatingBulkCreateDTO,
    ItemRatingResponse,
    ItemRatingSummaryResponse,
)
from services import ItemRatingService

router = APIRouter()

item_rating_service = ItemRatingService()


@router.post("/", response_model=ItemRatingResponse, status_code=status.HTTP_201_CREATED)
async def submit_rating(
    dto: ItemRatingCreateDTO,
    db: Session = Depends(get_db),
):
    """Submit a single item rating."""
    try:
        return item_rating_service.submit_rating(db, dto)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bulk", response_model=List[ItemRatingResponse], status_code=status.HTTP_201_CREATED)
async def submit_bulk_ratings(
    dto: ItemRatingBulkCreateDTO,
    db: Session = Depends(get_db),
):
    """Submit ratings for all items in an order at once."""
    return item_rating_service.submit_bulk_ratings(db, dto)


@router.get("/menu-item/{menu_item_id}", response_model=List[ItemRatingResponse])
async def get_ratings_by_menu_item(
    menu_item_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get all ratings for a specific menu item (paginated)."""
    return item_rating_service.get_ratings_for_item(db, menu_item_id, skip, limit)


@router.get("/order/{order_id}", response_model=List[ItemRatingResponse])
async def get_ratings_by_order(
    order_id: int,
    db: Session = Depends(get_db),
):
    """Get ratings already submitted for an order."""
    return item_rating_service.get_ratings_for_order(db, order_id)


@router.get("/check/{order_id}/{customer_id}")
async def check_order_rated(
    order_id: int,
    customer_id: int,
    db: Session = Depends(get_db),
):
    """Check if a customer has already rated items in this order."""
    has_rated = item_rating_service.has_customer_rated_order(db, order_id, customer_id)
    return {"has_rated": has_rated}


@router.get("/summary/{menu_item_id}", response_model=ItemRatingSummaryResponse)
async def get_item_rating_summary(
    menu_item_id: int,
    db: Session = Depends(get_db),
):
    """Get average rating and total count for a menu item."""
    return item_rating_service.get_item_rating_summary(db, menu_item_id)
