from . import meeting_router as meeting
# Note: Do not eagerly import other routers here to avoid loading optional
# dependencies during app startup. Submodules like `emr`, `ehr`, `chat`, etc.
# can still be imported via `from app.routers import emr` without being re-exported here.