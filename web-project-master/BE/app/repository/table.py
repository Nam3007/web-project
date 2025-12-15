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
    

    def update_table_status(self, db: Session, table_id: int , is_occupied: bool)-> Optional[Table]:
        table = db.query(Table).filter(Table.id == table_id).first()
        if table: 
            table.is_occupied = is_occupied
            db.commit()
            db.refresh(table)
        return table
    
    def get_available_tables(self,db: Session)->List[Table]:
        return db.query(Table).filter(Table.is_occupied == False).all()
    
    def get_sized_available_tables(self, db: Session, size: int)->List[Table]:
        return db.query(Table).filter(Table.is_occupied == False, Table.table_size == size).all()
    
    