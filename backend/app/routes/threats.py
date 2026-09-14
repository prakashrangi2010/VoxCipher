from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database.connection import get_db
from ..services.threat_service import get_threats_list, get_threat_by_id

router = APIRouter(tags=["Threat Intelligence"])

@router.get("/api/threats")
def list_threats(
    level: str = Query("ALL"),
    limit: int = Query(50),
    search: str = Query(""),
    db: Session = Depends(get_db)
):
    return get_threats_list(db=db, level=level, limit=limit, search=search)

@router.get("/api/threats/{id}")
def get_threat(id: str, db: Session = Depends(get_db)):
    record = get_threat_by_id(db=db, threat_id=id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Threat record {id} not found.")
    return record
