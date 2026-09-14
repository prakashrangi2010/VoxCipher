from fastapi import APIRouter, Form
from typing import Optional
from pydantic import BaseModel

from ..services.lab_service import run_codec_experiment

router = APIRouter(tags=["Attack Laboratory"])

class LabExperimentRequest(BaseModel):
    codec: str = "gsm"

@router.post("/api/lab/experiment")
def test_codec(payload: LabExperimentRequest):
    return run_codec_experiment(codec=payload.codec)
