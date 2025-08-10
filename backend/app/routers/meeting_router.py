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