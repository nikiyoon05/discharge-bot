
import json
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List, Dict

from app.models.emr import ParsedEMRData
from app.services.ai_service import AIService
from app.services.database_service import DatabaseService, get_db

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def broadcast_patient(self, patient_id: str, message: str):
        # Only send to connections for the same patient_id
        prefix = f"{patient_id}_"
        for cid, connection in self.active_connections.items():
            if cid.startswith(prefix):
                await connection.send_text(message)

manager = ConnectionManager()
router = APIRouter()

# In-memory chat history for simplicity
chat_history: Dict[str, List[Dict[str, str]]] = {}

@router.websocket("/ws/{patient_id}/{client_type}")
async def websocket_endpoint(
    websocket: WebSocket, 
    patient_id: str,
    client_type: str, # 'doctor' or 'patient'
):
    client_id = f"{patient_id}_{client_type}"
    await manager.connect(websocket, client_id)
    
    ai_service = AIService()
    db_service = DatabaseService()

    # Initialize chat history for the patient if it doesn't exist
    if patient_id not in chat_history:
        chat_history[patient_id] = []

    # Send existing chat history to the newly connected client
    for msg in chat_history.get(patient_id, []):
        await websocket.send_text(json.dumps(msg))

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Add message to history
            chat_history[patient_id].append(message_data)
            
            # Broadcast the new message to all clients for this patient
            await manager.broadcast_patient(patient_id, json.dumps(message_data))
            
            # If the message is from the patient OR doctor, generate an AI response
            if message_data.get("sender") in ("patient", "doctor"):
                # Get patient's EMR data for context
                patient_data = db_service.get_patient_data(patient_id)
                emr_data_dict = patient_data.get("emr_data") if patient_data else None
                emr_data = ParsedEMRData(**emr_data_dict) if emr_data_dict else None

                # Generate AI response
                ai_response_text = await ai_service.generate_chat_response(
                    patient_id=patient_id,
                    chat_history=chat_history[patient_id],
                    emr_data=emr_data
                )
                
                ai_message = {
                    "sender": "ai_assistant",
                    "message": ai_response_text,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                # Add AI message to history and broadcast it
                chat_history[patient_id].append(ai_message)
                await manager.broadcast_patient(patient_id, json.dumps(ai_message))

    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        print(f"Error in WebSocket: {e}")
        manager.disconnect(client_id)
