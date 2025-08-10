from fastapi import APIRouter, HTTPException
from app.schemas.meeting_schemas import (
    ConversationPlanRequest,
    ConversationPlanResponse,
    MeetingSummaryRequest,
    MeetingSummaryResponse,
    ReactiveReplyRequest,
    ReactiveReplyResponse,
)
from app.services.meeting_service import meeting_planner_service
from app.core.database import SessionLocal, MeetingRecord
from sqlalchemy import desc

router = APIRouter()

@router.post("/plan", response_model=ConversationPlanResponse)
async def create_conversation_plan(request: ConversationPlanRequest):
    """
    Generates a structured conversation plan for a pre-discharge meeting.
    """
    try:
        plan = meeting_planner_service.generate_conversation_plan(
            patient_id=request.patient_id,
            custom_questions=request.custom_questions
        )
        return ConversationPlanResponse(patient_id=request.patient_id, plan=plan)
    except Exception as e:
        # In a real app, you'd have more specific error handling
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summarize", response_model=MeetingSummaryResponse)
async def summarize_meeting(request: MeetingSummaryRequest):
    """
    Summarizes a meeting transcript and extracts answers to questions.
    """
    try:
        summary_data = meeting_planner_service.summarize_meeting(
            transcript=request.transcript,
            questions=request.questions
        )
        return MeetingSummaryResponse(**summary_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/react", response_model=ReactiveReplyResponse)
async def reactive_reply(request: ReactiveReplyRequest):
    try:
        result = meeting_planner_service.generate_reactive_reply(
            transcript=request.transcript,
            last_patient_message=request.last_patient_message,
            context_step=request.context_step,
        )
        return ReactiveReplyResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/latest")
async def get_latest_meeting(patient_id: str):
    try:
        db = SessionLocal()
        record = db.query(MeetingRecord).filter(MeetingRecord.patient_id == patient_id).order_by(desc(MeetingRecord.created_at)).first()
        if not record:
            return {"patient_id": patient_id, "status": "not-started", "extracted_answers": {}}
        return {
            "patient_id": record.patient_id,
            "status": record.status,
            "extracted_answers": record.extracted_answers or {},
            "summary": record.summary or "",
            "transcript": record.transcript or [],
            "created_at": record.created_at.isoformat(),
            "updated_at": record.updated_at.isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            db.close()
        except Exception:
            pass

@router.post("/answers")
async def upsert_answers(payload: dict):
    try:
        patient_id = payload.get('patient_id')
        answers = payload.get('answers') or {}
        if not patient_id:
            raise HTTPException(status_code=400, detail="patient_id is required")
        result = meeting_planner_service.upsert_partial_answers(patient_id, answers)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))