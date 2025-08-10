import hashlib
import io
import os
import time
from typing import Iterator, Tuple

import requests


class ElevenLabsTTSService:
    """
    Minimal ElevenLabs TTS client with on-disk caching to save credits.
    """

    def __init__(self) -> None:
        self.api_key = os.getenv("ELEVENLABS_API_KEY", "")
        # Use a known public voice ID by default to avoid 404s; override with ELEVENLABS_VOICE_ID
        self.default_voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
        self.model_id = os.getenv("ELEVENLABS_MODEL_ID", "eleven_turbo_v2")
        self.cache_dir = os.getenv("TTS_CACHE_DIR", "backend/tts_cache")
        os.makedirs(self.cache_dir, exist_ok=True)

    def _cache_path(self, text: str, voice_id: str) -> str:
        h = hashlib.sha256(f"{voice_id}|{text}".encode("utf-8")).hexdigest()
        return os.path.join(self.cache_dir, f"{h}.mp3")

    def _stream_file(self, path: str) -> Iterator[bytes]:
        with open(path, "rb") as f:
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                yield chunk

    def synthesize(self, text: str, voice_id: str | None = None) -> Tuple[Iterator[bytes], str]:
        if not text.strip():
            raise ValueError("text is empty")

        voice = voice_id or self.default_voice_id
        cache_path = self._cache_path(text=text.strip(), voice_id=voice)

        # Serve from cache when available
        if os.path.exists(cache_path):
            return self._stream_file(cache_path), "audio/mpeg"

        if not self.api_key:
            # Fallback mock audio if no API key
            # Return empty mp3 header to avoid player errors
            fake = io.BytesIO(b"\x49\x44\x33" + b"\x00" * 1024)

            def _iter():
                yield fake.getvalue()

            return _iter(), "audio/mpeg"

        # Call ElevenLabs API
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}"
        headers = {
            "xi-api-key": self.api_key,
            "accept": "audio/mpeg",
            "Content-Type": "application/json",
        }
        payload = {
            "text": text,
            "model_id": self.model_id,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
        }
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=30)
            if resp.status_code != 200:
                raise RuntimeError(f"TTS failed: {resp.status_code} {resp.text}")
        except Exception:
            # Fallback: small silent-like mp3 to avoid breaking flow
            fake = io.BytesIO(b"\x49\x44\x33" + b"\x00" * 1024)
            def _iter():
                yield fake.getvalue()
            return _iter(), "audio/mpeg"

        # Cache result to disk
        with open(cache_path, "wb") as f:
            f.write(resp.content)

        return self._stream_file(cache_path), "audio/mpeg"


tts_service = ElevenLabsTTSService()

