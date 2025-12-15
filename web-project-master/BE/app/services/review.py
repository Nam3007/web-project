from sqlalchemy.orm import Session
from models import Review
from typing import List
from repository import ReviewRepository
from schemas import ReviewCreateDTO, ReviewUpdateDTO

class ReviewService:
    def __init__(self):
        self.repository = ReviewRepository()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Review]:
        return self.repository.get_all(db, skip, limit)
    
    def get_by_id(self, db: Session, review_id: int) -> Review:
        return self.repository.get_by_id(db, review_id)
    
    def create(self, db: Session, review_data: ReviewCreateDTO) -> Review:
        review = Review(
            customer_id = review_data.customer_id,
            order_id = review_data.order_id,
            rating = review_data.rating,
            comment = review_data.comment,
            review_date = review_data.review_date
        )
        return self.repository.create(db, review)
    
    def update(self, db: Session, review_id: int, review_data: ReviewUpdateDTO) -> Review:
        review = self.get_by_id(db, review_id)

        for key, value in review_data.model_dump(exclude_unset=True).items():
            setattr(review, key, value)
        
        return self.repository.update(db, review)
    
    def delete(self, db: Session, review_id: int) -> bool:
        review = self.get_by_id(db, review_id)
        if not review:
            return False
        self.repository.delete(db, review)
        return True
    
    def find_by_customer_id(self, db: Session, customer_id: int) -> List[Review]:
        return self.repository.find_by_customer_id(db, customer_id)
    
    