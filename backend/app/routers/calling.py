"""
Calling API Routes
Handles AI-powered calling to out-of-network providers for appointment scheduling
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timedelta
import asyncio

from app.models.calling import (
    CallLog,
    CallTranscriptEntry,
    OutpatientClinic,
    SchedulingRequest,
    AppointmentDetails,
    CallStatus,
    CallOutcome,
    TranscriptSpeaker
)
from app.models.conversation import PatientAvailability

router = APIRouter()

# Mock storage - in production, this would be database
call_logs = {}
clinics = {}
active_calls = {}

# Initialize mock clinic data
def initialize_mock_clinics():
    mock_clinic = OutpatientClinic(
        id="clinic_1",
        name="Northwest Primary Care Associates",
        specialty="Internal Medicine",
        address="1234 Medical Center Dr, Seattle, WA 98101",
        phone="(206) 555-0123",
        contact_person="Sarah Johnson, Scheduling Coordinator",
        scheduling_hours="8:00 AM - 5:00 PM, Mon-Fri",
        accepts_new_patients=True,
        typical_wait_time="2-3 weeks",
        successful_calls=15,
        total_calls=18,
        notes="Preferred provider for post-discharge follow-up. Dr. Martinez has excellent bedside manner."
    )
    clinics[mock_clinic.id] = mock_clinic

initialize_mock_clinics()

@router.get("/clinics", response_model=List[OutpatientClinic])
async def get_outpatient_clinics():
    """Get list of available outpatient clinics"""
    return list(clinics.values())

@router.get("/clinic/{clinic_id}", response_model=OutpatientClinic)
async def get_clinic(clinic_id: str):
    """Get specific clinic details"""
    if clinic_id not in clinics:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return clinics[clinic_id]

@router.post("/schedule-request", response_model=CallLog)
async def initiate_scheduling_call(request: SchedulingRequest):
    """Initiate AI-powered call to schedule appointment"""
    
    if request.clinic_id not in clinics:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    clinic = clinics[request.clinic_id]
    
    # Create call log
    call_id = f"call_{request.patient_id}_{int(datetime.now().timestamp())}"
    
    call_log = CallLog(
        id=call_id,
        patient_id=request.patient_id,
        clinic_id=request.clinic_id,
        status=CallStatus.CALLING,
        notes=f"Calling {clinic.name} to schedule {request.appointment_type} appointment"
    )
    
    call_logs[call_id] = call_log
    active_calls[call_id] = call_log
    
    # Add initial transcript entry
    initial_transcript = CallTranscriptEntry(
        id=f"transcript_{call_id}_1",
        call_id=call_id,
        speaker=TranscriptSpeaker.SYSTEM,
        content=f"Calling {clinic.name} at {clinic.phone}...",
        transcript_type="action"
    )
    
    call_log.transcript.append(initial_transcript)
    
    # Start simulated call in background
    asyncio.create_task(_simulate_call(call_id, request))
    
    return call_log

@router.get("/call/{call_id}", response_model=CallLog)
async def get_call_log(call_id: str):
    """Get call log details"""
    if call_id not in call_logs:
        raise HTTPException(status_code=404, detail="Call log not found")
    return call_logs[call_id]

@router.get("/call/{call_id}/transcript", response_model=List[CallTranscriptEntry])
async def get_call_transcript(call_id: str):
    """Get live call transcript"""
    if call_id not in call_logs:
        raise HTTPException(status_code=404, detail="Call log not found")
    return call_logs[call_id].transcript

@router.post("/call/{call_id}/end")
async def end_call(call_id: str):
    """End an active call"""
    if call_id not in call_logs:
        raise HTTPException(status_code=404, detail="Call log not found")
    
    call_log = call_logs[call_id]
    
    if call_log.status in [CallStatus.COMPLETED, CallStatus.FAILED]:
        raise HTTPException(status_code=400, detail="Call already ended")
    
    # End the call
    call_log.status = CallStatus.COMPLETED
    call_log.end_time = datetime.now()
    
    if call_log.start_time and call_log.end_time:
        duration = call_log.end_time - call_log.start_time
        call_log.duration_seconds = int(duration.total_seconds())
    
    # Add final transcript entry
    final_transcript = CallTranscriptEntry(
        id=f"transcript_{call_id}_{len(call_log.transcript) + 1}",
        call_id=call_id,
        speaker=TranscriptSpeaker.SYSTEM,
        content="Call ended by user",
        transcript_type="action"
    )
    
    call_log.transcript.append(final_transcript)
    
    # Remove from active calls
    if call_id in active_calls:
        del active_calls[call_id]
    
    return {"message": "Call ended successfully"}

@router.get("/patient/{patient_id}/call-history", response_model=List[CallLog])
async def get_patient_call_history(patient_id: str):
    """Get call history for a patient"""
    
    patient_calls = [
        call for call in call_logs.values()
        if call.patient_id == patient_id
    ]
    
    # Sort by start time, most recent first
    return sorted(patient_calls, key=lambda c: c.start_time, reverse=True)

@router.get("/active-calls", response_model=List[CallLog])
async def get_active_calls():
    """Get all currently active calls"""
    return list(active_calls.values())

# Simulation functions

async def _simulate_call(call_id: str, request: SchedulingRequest):
    """Simulate an AI-powered call to schedule appointment"""
    
    call_log = call_logs[call_id]
    clinic = clinics[request.clinic_id]
    
    try:
        # Simulate connection delay
        await asyncio.sleep(3)
        
        # Update status to connected
        call_log.status = CallStatus.CONNECTED
        
        # Add connection transcript
        connection_transcript = CallTranscriptEntry(
            id=f"transcript_{call_id}_{len(call_log.transcript) + 1}",
            call_id=call_id,
            speaker=TranscriptSpeaker.SYSTEM,
            content="Call connected. Bot is speaking with clinic staff.",
            transcript_type="action"
        )
        call_log.transcript.append(connection_transcript)
        
        # Simulate conversation
        conversation_script = [
            {
                "speaker": TranscriptSpeaker.CLINIC_STAFF,
                "content": f"Hello, {clinic.name}, this is {clinic.contact_person or 'the scheduling coordinator'}. How can I help you?",
                "delay": 1
            },
            {
                "speaker": TranscriptSpeaker.BOT,
                "content": "Hi, this is the CareExit discharge planning assistant. I'm calling to schedule a follow-up appointment for a patient who was recently discharged from the hospital.",
                "delay": 2
            },
            {
                "speaker": TranscriptSpeaker.CLINIC_STAFF,
                "content": "Of course! I can help with that. Can you provide me with the patient's information?",
                "delay": 1.5
            },
            {
                "speaker": TranscriptSpeaker.BOT,
                "content": f"Yes, the patient information is available in our system. They need a {request.appointment_type} appointment for {request.reason_for_visit}.",
                "delay": 2.5
            },
            {
                "speaker": TranscriptSpeaker.CLINIC_STAFF,
                "content": "Let me check our schedule. What days and times work best for the patient?",
                "delay": 2
            }
        ]
        
        # Add availability information
        if hasattr(request, 'patient_availability') and request.patient_availability:
            availability_info = f"The patient is available {', '.join(request.patient_availability.preferred_days)} and prefers {request.patient_availability.time_preference} appointments"
            if request.patient_availability.notes:
                availability_info += f". Additional notes: {request.patient_availability.notes}"
        else:
            availability_info = "The patient has flexible availability and can accommodate most appointment times"
        
        conversation_script.extend([
            {
                "speaker": TranscriptSpeaker.BOT,
                "content": availability_info,
                "delay": 3
            },
            {
                "speaker": TranscriptSpeaker.CLINIC_STAFF,
                "content": "Perfect! I have an opening next Tuesday, August 20th at 10:30 AM with Dr. Martinez. Would that work?",
                "delay": 2.5
            },
            {
                "speaker": TranscriptSpeaker.BOT,
                "content": "That sounds excellent. Let me confirm - Tuesday, August 20th at 10:30 AM with Dr. Martinez. Can you provide a confirmation number?",
                "delay": 2
            },
            {
                "speaker": TranscriptSpeaker.CLINIC_STAFF,
                "content": "Yes, the confirmation number is NPC-8547. Please have the patient arrive 15 minutes early with their insurance card and discharge paperwork.",
                "delay": 2.5
            },
            {
                "speaker": TranscriptSpeaker.BOT,
                "content": "Excellent! I've recorded all the details. Is there anything else the patient should know before their appointment?",
                "delay": 1.5
            },
            {
                "speaker": TranscriptSpeaker.CLINIC_STAFF,
                "content": "Just that Dr. Martinez will want to review their hospital discharge summary and current medications. We'll see them next Tuesday!",
                "delay": 2
            }
        ])
        
        # Add conversation messages with delays
        for message in conversation_script:
            await asyncio.sleep(message["delay"])
            
            transcript_entry = CallTranscriptEntry(
                id=f"transcript_{call_id}_{len(call_log.transcript) + 1}",
                call_id=call_id,
                speaker=message["speaker"],
                content=message["content"],
                transcript_type="speech",
                confidence_score=0.92
            )
            
            call_log.transcript.append(transcript_entry)
        
        # Simulate call completion
        await asyncio.sleep(1)
        
        # Mark call as completed with appointment scheduled
        call_log.status = CallStatus.COMPLETED
        call_log.outcome = CallOutcome.APPOINTMENT_SCHEDULED
        call_log.appointment_scheduled = True
        call_log.end_time = datetime.now()
        
        # Add appointment details
        call_log.appointment_details = AppointmentDetails(
            date="2024-08-20",
            time="10:30 AM",
            provider_name="Dr. Martinez",
            confirmation_number="NPC-8547",
            appointment_type=request.appointment_type,
            clinic_address=clinic.address,
            what_to_bring=["Insurance card", "Discharge paperwork", "Current medications list"],
            preparation_instructions="Arrive 15 minutes early. Bring complete medication list and discharge summary."
        )
        
        # Calculate duration
        if call_log.start_time and call_log.end_time:
            duration = call_log.end_time - call_log.start_time
            call_log.duration_seconds = int(duration.total_seconds())
        
        # Add summary
        call_log.call_summary = f"Successfully scheduled {request.appointment_type} appointment with {clinic.name} for {call_log.appointment_details.date} at {call_log.appointment_details.time}. Confirmation number: {call_log.appointment_details.confirmation_number}"
        call_log.success_factors = ["Clinic had availability", "Patient flexibility", "Clear communication"]
        
        # Update clinic metrics
        clinic.successful_calls += 1
        clinic.total_calls += 1
        clinic.last_successful_call = datetime.now()
        
        # Add completion transcript
        completion_transcript = CallTranscriptEntry(
            id=f"transcript_{call_id}_{len(call_log.transcript) + 1}",
            call_id=call_id,
            speaker=TranscriptSpeaker.SYSTEM,
            content="Call completed successfully. Appointment scheduled!",
            transcript_type="action"
        )
        call_log.transcript.append(completion_transcript)
        
        # Remove from active calls
        if call_id in active_calls:
            del active_calls[call_id]
    
    except Exception as e:
        # Handle call failure
        call_log.status = CallStatus.FAILED
        call_log.outcome = CallOutcome.CLINIC_CLOSED
        call_log.end_time = datetime.now()
        call_log.failure_reasons = [str(e)]
        
        # Add failure transcript
        failure_transcript = CallTranscriptEntry(
            id=f"transcript_{call_id}_{len(call_log.transcript) + 1}",
            call_id=call_id,
            speaker=TranscriptSpeaker.SYSTEM,
            content=f"Call failed: {str(e)}",
            transcript_type="action"
        )
        call_log.transcript.append(failure_transcript)
        
        # Remove from active calls
        if call_id in active_calls:
            del active_calls[call_id]