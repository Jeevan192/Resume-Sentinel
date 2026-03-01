import os
import logging
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, JSON, Float
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("resumeguard.db")

Base = declarative_base()

# Lazy engine initialization — avoids import-order race with load_dotenv
_engine = None
_SessionLocal = None

def _get_engine():
    global _engine, _SessionLocal
    if _engine is None:
        db_url = os.getenv("DATABASE_URL", "postgresql://custom_deet_user:deet_secure_password@localhost:5433/resumeguard")
        try:
            _engine = create_engine(db_url, pool_pre_ping=True)
            _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
            logger.info(f"Connected to PostgreSQL: {db_url}")
            Base.metadata.create_all(bind=_engine)
            logger.info("PostgreSQL tables created/verified.")
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            _engine = False  # Mark as failed so we don't retry every call
    return _engine

def _get_session():
    _get_engine()
    if _SessionLocal is None:
        return None
    return _SessionLocal()

class DBResume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    candidate_name = Column(String(255))
    text_hash = Column(String(255), unique=True, index=True)
    raw_text = Column(Text)
    risk_score = Column(Float)
    risk_level = Column(String(50))
    analyzed_at = Column(DateTime, default=datetime.utcnow)
    data_json = Column(JSON)

class DBContact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    contact_type = Column(String(50), index=True)
    contact_value = Column(String(255), index=True)
    source_resume = Column(String(255))

class DBExperience(Base):
    __tablename__ = "experiences"
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String(255))
    role = Column(String(255))
    experience_text = Column(Text)
    source_resume = Column(String(255))

def get_db():
    db = _get_session()
    if not db:
        yield None
    else:
        try:
            yield db
        finally:
            db.close()


def save_resume_to_db(filename, candidate_name, text_hash, raw_text, risk_score, risk_level, data_json):
    """Save a resume record to Postgres. Uses atomic UPSERT to safely overwrite duplicates."""
    db = _get_session()
    if not db: return
    try:
        from sqlalchemy.dialects.postgresql import insert
        
        stmt = insert(DBResume).values(
            filename=filename, candidate_name=candidate_name, text_hash=text_hash,
            raw_text=raw_text, risk_score=risk_score, risk_level=risk_level, data_json=data_json
        )
        
        stmt = stmt.on_conflict_do_update(
            index_elements=['text_hash'],
            set_={
                'filename': stmt.excluded.filename,
                'candidate_name': stmt.excluded.candidate_name,
                'risk_score': stmt.excluded.risk_score,
                'risk_level': stmt.excluded.risk_level,
                'data_json': stmt.excluded.data_json,
                'analyzed_at': datetime.utcnow()
            }
        )
        db.execute(stmt)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to save resume to DB: {e}")
        db.rollback()
    finally:
        db.close()

def save_contacts_to_db(emails, phones, source_resume):
    """Save contacts to Postgres. Deletes old records for this resume first to prevent duplicates."""
    db = _get_session()
    if not db: return
    try:
        db.query(DBContact).filter(DBContact.source_resume == source_resume).delete()
        for email in emails:
            db.add(DBContact(contact_type="email", contact_value=email, source_resume=source_resume))
        for phone in phones:
            db.add(DBContact(contact_type="phone", contact_value=phone, source_resume=source_resume))
        db.commit()
    except Exception as e:
        logger.error(f"Failed to save contacts to DB: {e}")
        db.rollback()
    finally:
        db.close()

def save_experiences_to_db(experiences, source_resume):
    """Save experiences to Postgres. Deletes old records for this resume first to prevent duplicates."""
    db = _get_session()
    if not db: return
    try:
        db.query(DBExperience).filter(DBExperience.source_resume == source_resume).delete()
        for exp in experiences:
            db.add(DBExperience(
                company=exp.get("company", ""),
                role=exp.get("role", ""),
                experience_text=f"{exp.get('role', '')} at {exp.get('company', '')}",
                source_resume=source_resume
            ))
        db.commit()
    except Exception as e:
        logger.error(f"Failed to save experiences to DB: {e}")
        db.rollback()
    finally:
        db.close()

def hydrate_store_from_db():
    """Load historical data from DB into memory cache."""
    cache = {"resumes": [], "emails_seen": [], "phones_seen": [], "experiences_seen": [], "embeddings": [], "submission_counts": {}}
    db = _get_session()
    if not db: return cache
    
    try:
        for contact in db.query(DBContact).all():
            if contact.contact_type == "email":
                cache["emails_seen"].append(contact.contact_value)
            elif contact.contact_type == "phone":
                cache["phones_seen"].append(contact.contact_value)
                
        for exp in db.query(DBExperience).all():
            cache["experiences_seen"].append({
                "company": exp.company, "role": exp.role, "source_resume": exp.source_resume
            })
            
        for res in db.query(DBResume).all():
            cache["resumes"].append({
                "filename": res.filename,
                "name": res.candidate_name,
                "text_hash": res.text_hash,
                "risk_score": res.risk_score or 0,
                "risk_level": res.risk_level or "UNKNOWN",
                "analyzed_at": res.analyzed_at.isoformat() if res.analyzed_at else "",
            })
            # Track submission counts — each DB record means at least 1 prior submission
            if res.text_hash:
                cache["submission_counts"][res.text_hash] = cache["submission_counts"].get(res.text_hash, 0) + 1
            
    except Exception as e:
        logger.error(f"Failed to hydrate memory from DB: {e}")
    finally:
        db.close()
        
    return cache
