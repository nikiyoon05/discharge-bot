from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from app.services.tts_service import tts_service

router = APIRouter()


@router.post("/speak")
async def speak(text: str = Query(..., min_length=1), voice_id: str | None = Query(None)):
    try:
        audio_iter, content_type = tts_service.synthesize(text=text, voice_id=voice_id)
        return StreamingResponse(audio_iter, media_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

