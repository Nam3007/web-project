from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db import get_db
from models import TableModel
from schemas import TableCreateDTO, TableUpdateDTO, TableResponse
from services import TableService


router = APIRouter()
# Initialize service
table_service = TableService()

@router.get("/", response_model=list[TableResponse])
def get_all_tables(
    skip:int = 0,
    limit:int = 100,
):
    """Get all tables"""
    db: Session = Depends(get_db)
    tables = table_service.get_all(db, skip=skip, limit=limit)
    return tables


@router.get("/{table_id}", response_model=TableResponse)
def get_table(table_id : int , db: Session = Depends(get_db)):
    """Get table by ID"""
    table = table_service.get_by_id(db, table_id)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    return table

@router.post("/", response_model=TableResponse, status_code=status.HTTP_201_CREATED)
def create_table(
    table_data: TableCreateDTO,
    db: Session = Depends(get_db)
):
    """Create new table"""
    try:
        return table_service.create(db, table_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{table_id}", response_model=TableResponse)
def update_table(
    table_id: int,
    table_data: TableUpdateDTO,
    db: Session = Depends(get_db)
):
    """Update table"""
    table = table_service.update(db, table_id,  table_data)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    return table

@router.delete("/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_table(table_id: int, db: Session = Depends(get_db)):
    """Delete table"""
    success = table_service.delete(db, table_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    return None

@router.get("/available/", response_model=list[TableResponse])
def get_available_tables(db: Session = Depends(get_db)):
    """Get all available (not occupied) tables"""
    tables = table_service.get_available_tables(db)
    return tables

@router.get("/available/size/{size}", response_model=list[TableResponse])
def get_sized_available_tables(size: int, db: Session = Depends(get_db)):
    """Get all available (not occupied) tables of a specific size"""
    tables = table_service.get_sized_available_tables(db, size)
    return tables

@router.patch("/{table_id}", response_model=TableResponse)
def update_table_status(
    table_id: int,
    data: TableUpdateDTO,
    db: Session = Depends(get_db)
):
    table = table_service.update_table_status(db, table_id, data.is_occupied)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    return table