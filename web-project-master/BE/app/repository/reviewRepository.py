from typing import List
from sqlalchemy.orm import Session
from models import Review

class ReviewRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Review]:
        return db.query(Review).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, review_id: int) -> Review:
        return db.query(Review).filter(Review.id == review_id).first()

    def create(self, db: Session, review_obj: Review) -> Review:
        db.add(review_obj)
        db.commit()
        db.refresh(review_obj)
        return review_obj

    def update(self, db: Session, review_obj: Review) -> Review:
        db.merge(review_obj)
        db.commit()
        db.refresh(review_obj)
        return review_obj

    def delete(self, db: Session, review_obj: Review) -> None:
        db.delete(review_obj)
        db.commit()
    
    def find_by_customer_id(self, db: Session, customer_id: int) -> List[Review]:
        return db.query(Review).filter(Review.customer_id == customer_id).all()
    
    def find_by_rating(self, db: Session, rating: int) -> List[Review]:
        return db.query(Review).filter(Review.rating == rating).all()
    
    