from sqlalchemy.orm import Session
from models import Table
from typing import List, Optional

from schemas import TableCreateDTO, TableUpdateDTO, TableResponse
from repository import TableRepository

class TableService:
    def __init__(self):
        self.table_repository = TableRepository()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Table]:
        return self.table_repository.get_all(db, skip, limit)
    
    def get_by_id(self, db: Session, table_id: int) -> Optional[Table]:
        return self.table_repository.get_by_id(db, table_id)
    
    def create(self, db: Session, table_create_dto: TableCreateDTO) -> Table:
        table = Table(
            table_number=table_create_dto.table_number,
            table_size=table_create_dto.table_size,

        )
        return self.table_repository.create(db, table)
    
    def update(self, db: Session, table_id: int, table_update_dto: TableUpdateDTO) -> Optional[Table]:
        table = self.get_by_id(db, table_id)
        updated_table = table_update_dto.model_dump(exclude_unset=True)
        if not table:
            return None
        

        for key, value in updated_table.items():
            setattr(table, key, value)
        
        return self.table_repository.update(db, table)
    

    def delete(self, db: Session, table_id: int) -> bool:
        table = self.get_by_id(db, table_id)
        if not table:
            return False
        self.table_repository.delete(db, table)
        return True
    
    def find_by_size(self, db: Session, size: int) -> List[Table]:
        return self.table_repository.find_by_size(db, size)
    
    def get_available_tables(self, db: Session) -> List[Table]:
        return self.table_repository.get_available_tables(db)
    

    def get_sized_available_tables(self, db: Session, size: int) -> List[Table]:
        return self.table_repository.get_sized_available_tables(db, size)
    
    def update_table_status(self, db: Session, table_id: int, is_occupied: bool) -> Optional[Table]:
        return self.table_repository.update_table_status(db, table_id, is_occupied)
    
    def get_unavailable_tables(self, db: Session) -> List[Table]:
        return self.table_repository.get_unavailable_tables(db)