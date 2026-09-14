from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..services.threat_service import get_analytics_summary

router = APIRouter(tags=["Analytics"])

@router.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    return get_analytics_summary(db)
