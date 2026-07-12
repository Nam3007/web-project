from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SingleItemRatingDTO(BaseModel):
    """A single item rating within a bulk submission."""
    menu_item_id: int = Field(..., gt=0)
    rating: float = Field(..., ge=1.0, le=5.0)
    review_text: Optional[str] = None


class ItemRatingCreateDTO(BaseModel):
    """Create a single item rating."""
    menu_item_id: int = Field(..., gt=0)
    order_id: int = Field(..., gt=0)
    customer_id: int = Field(..., gt=0)
    rating: float = Field(..., ge=1.0, le=5.0)
    review_text: Optional[str] = None


class ItemRatingBulkCreateDTO(BaseModel):
    """Bulk submit ratings for all items in an order."""
    order_id: int = Field(..., gt=0)
    customer_id: int = Field(..., gt=0)
    ratings: List[SingleItemRatingDTO]


class ItemRatingResponse(BaseModel):
    id: int
    menu_item_id: int
    order_id: int
    customer_id: int
    rating: float
    review_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ItemRatingSummaryResponse(BaseModel):
    menu_item_id: int
    average_rating: Optional[float] = None
    total_ratings: int = 0
