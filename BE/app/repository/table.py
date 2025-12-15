from sqlalchemy.orm import Session
from models import Table
from typing import List, Optional

class TableRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Table]:
        return db.query(Table).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, table_id: int) -> Optional[Table]:
        return db.query(Table).filter(Table.id == table_id).first()

    def create(self, db: Session, table: Table) -> Table:
        db.add(table)
        db.commit()
        db.refresh(table)
        return table

    def update(self, db: Session, table: Table) -> Table:
        db.merge(table)
        db.commit()
        db.refresh(table)
        return table

    def delete(self, db: Session, table: Table) -> None:
        db.delete(table)
        db.commit()
    
    def find_by_size(self, db: Session, size: int) -> List[Table]:
        return db.query(Table).filter(Table.table_size == size).all()
    
    def find_by_occupied(self, db: Session, occupied: bool) -> List[Table]:
        return db.query(Table).filter(Table.is_occupied == occupied).all()

    def find_by_size_and_occupied(self, db: Session, size: int, occupied: bool) -> List[Table]:
        return db.query(Table).filter(Table.table_size == size, Table.is_occupied == occupied).all()