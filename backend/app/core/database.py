"""
Database configuration and models for Bela Discharge Planning
"""

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# SQLite database path
DATABASE_PATH = "bela_discharge.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Patient(Base):
    """Patient information and uploaded files"""
    __tablename__ = "patients"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    mrn = Column(String, unique=True, index=True)
    
    # File storage
    ehr_file_path = Column(String, nullable=True)
    doctor_notes_path = Column(String, nullable=True)
    discharge_summary_path = Column(String, nullable=True)
    
    # Parsed EMR data as JSON
    emr_data = Column(JSON, nullable=True)
    
    # Status
    status = Column(String, default="not-connected")  # not-connected, connected, processed
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MedicationAnalysis(Base):
    """Store medication reconciliation analysis results"""
    __tablename__ = "medication_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    
    # Analysis results
    interactions = Column(JSON)  # List of interactions
    duplicates = Column(JSON)    # List of duplicates
    clinical_concerns = Column(JSON)  # List of concerns
    summary = Column(Text)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)

class PatientInstructions(Base):
    """Store generated patient instructions"""
    __tablename__ = "patient_instructions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    
    # Instructions content
    original_instructions = Column(Text)
    translated_instructions = Column(Text, nullable=True)
    language = Column(String, default="en")
    literacy_level = Column(String, default="high-school")
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)


class MeetingRecord(Base):
    """Store pre-discharge meeting artifacts"""
    __tablename__ = "meeting_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    status = Column(String, default="not-started")  # not-started, in-progress, completed
    transcript = Column(JSON, nullable=True)  # list of messages
    summary = Column(Text, nullable=True)
    extracted_answers = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()