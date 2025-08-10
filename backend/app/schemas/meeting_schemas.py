from pydantic import BaseModel
from typing import List, Literal

class MeetingQuestion(BaseModel):
    id: str
    question: str
    category: Literal['teach-back', 'medication', 'follow-up', 'other']

class ConversationPlanRequest(BaseModel):
    patient_id: str
    custom_questions: List[MeetingQuestion]

class ConversationStep(BaseModel):
    step_type: Literal['introduction', 'summary', 'question', 'conclusion']
    content: str
    question_id: str | None = None # Link back to the original question

class ConversationPlanResponse(BaseModel):
    patient_id: str
    plan: List[ConversationStep]

class MeetingSummaryRequest(BaseModel):
    patient_id: str
    transcript: List[dict] # Each dict is a message
    questions: List[MeetingQuestion]

class MeetingSummaryResponse(BaseModel):
    summary: str
    extracted_answers: dict[str, str] # question_id -> answer