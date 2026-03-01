"""
🛡️ ResumeGuard — AI-Based Resume Fraud Detection Engine
Main FastAPI Application

Hybrid Architecture: Python (ML/NLP) service
Endpoints: /validate_resume, /batch_validate, /compare_resumes, /health
"""
import os
import sys
import re
import json
import logging
import hashlib
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool
import uvicorn
from dotenv import load_dotenv

load_dotenv(override=True)

# ─── Setup Logging ──────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("resumeguard")

# ─── Add parent to path ─────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ─── Imports ─────────────────────────────────────────────
from parsers.pdf_parser import extract_text_from_pdf
from parsers.docx_parser import extract_text_from_docx
from extractors.entity_extractor import extract_entities
from signals.timeline_overlap import check_timeline_overlap
from signals.email_validator import validate_emails
from signals.phone_dedup import validate_phones
from signals.jd_plagiarism import check_jd_plagiarism
from signals.semantic_similarity import check_semantic_similarity
from signals.skills_mismatch import check_skills_mismatch
from signals.link_validator import verify_profile_links
from signals.gleif_verifier import verify_companies_gleif
from signals.diff_engine import diff_compare
from scoring.risk_engine import calculate_risk_score, get_risk_color, get_risk_label
from scoring.explainer import generate_explanation, generate_signal_summary

from db import hydrate_store_from_db, save_resume_to_db, save_contacts_to_db, save_experiences_to_db

# ─── In-Memory Store (for hackathon demo) ───────────────
# Hydrate memory from PostgreSQL cluster on boot to maintain DEET data persistence
resume_store = hydrate_store_from_db()

# ─── Frontend path ──────────────────────────────────────
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")

# ─── FastAPI App ─────────────────────────────────────────
app = FastAPI(
    title="🛡️ ResumeGuard — Fraud Detection Engine",
    description="AI-powered resume fraud detection with 8-signal analysis pipeline + GLEIF verification",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend at root
@app.get("/", include_in_schema=False)
async def serve_frontend():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


# ─── Helper Functions ────────────────────────────────────

def parse_file(file_bytes: bytes, filename: str) -> dict:
    """Parse uploaded file and return extracted text."""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(file_bytes)
    elif ext == "txt":
        try:
            text = file_bytes.decode("utf-8", errors="replace")
            return {"text": text, "success": True, "error": None}
        except Exception as e:
            return {"text": "", "success": False, "error": str(e)}
    else:
        return {"text": "", "success": False, "error": f"Unsupported file type: .{ext}"}


# ─── Resume Content Classifier ──────────────────────────
# Heuristic scoring to determine if a document is actually a resume
RESUME_SECTION_KEYWORDS = {
    "work experience", "education", "skills", "projects", "certifications",
    "work history", "employment history", "qualifications", "career objective",
    "professional summary", "internship", "achievements",
    "technical skills", "proficiency", "coursework",
    "volunteer experience", "personal projects", "professional experience",
    "academic qualifications", "areas of expertise",
}

# Patterns that strongly suggest the document is NOT a resume
NON_RESUME_PATTERNS = [
    r"(?:chapter|table of contents|abstract|bibliography|appendix|acknowledgement)",
    r"(?:invoice|receipt|order|shipment|tracking|payment)",
    r"(?:terms and conditions|privacy policy|end user license)",
    r"(?:dear sir|dear madam|to whom it may concern|yours sincerely|yours faithfully)",
    r"(?:plaintiff|defendant|court|verdict|judgment|statute)",
    r"(?:experiment|hypothesis|methodology|literature review|findings|conclusion)",
]

def validate_resume_content(text: str) -> dict:
    """
    Heuristic check: is this document plausibly a resume?
    Returns {"is_resume": bool, "confidence": float, "reason": str, "signals_found": list}
    """
    signals_found = []
    score = 0
    text_lower = text.lower()
    word_count = len(text.split())

    # 1. Minimum word count (a real resume has at least ~40 words)
    if word_count < 30:
        return {
            "is_resume": False,
            "confidence": 0.0,
            "reason": f"Document has only {word_count} words — too short to be a resume.",
            "signals_found": [],
        }
    if word_count >= 80:
        score += 1
        signals_found.append("adequate_length")

    # 2. Contains email address
    if re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text):
        score += 2
        signals_found.append("has_email")

    # 3. Contains phone number
    if re.search(r"\+?\d[\d\s\-.()]{8,15}\d", text):
        score += 1
        signals_found.append("has_phone")

    # 4. Contains resume section keywords
    section_hits = [kw for kw in RESUME_SECTION_KEYWORDS if kw in text_lower]
    if len(section_hits) >= 3:
        score += 3
        signals_found.append(f"section_keywords({len(section_hits)})")
    elif len(section_hits) >= 1:
        score += 1
        signals_found.append(f"section_keywords({len(section_hits)})")

    # 5. Contains date ranges (employment dates)
    date_ranges = re.findall(
        r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s*\d{4}\s*[\-–—to]+",
        text, re.IGNORECASE
    )
    year_ranges = re.findall(r"(?:19|20)\d{2}\s*[\-–—]+\s*(?:(?:19|20)\d{2}|[Pp]resent|[Cc]urrent)", text)
    if date_ranges or year_ranges:
        score += 2
        signals_found.append("has_date_ranges")

    # 6. Contains degree/education keywords
    if re.search(r"(?:B\.?Tech|B\.?E|B\.?Sc|B\.?S|Bachelor|M\.?Tech|M\.?S|Master|Ph\.?D|MBA|Diploma)", text, re.IGNORECASE):
        score += 2
        signals_found.append("has_education")

    # 7. Contains known tech/soft skills (at least 2)
    from extractors.entity_extractor import TECH_SKILLS, SOFT_SKILLS
    skill_count = sum(1 for s in TECH_SKILLS if s in text_lower) + sum(1 for s in SOFT_SKILLS if s in text_lower)
    if skill_count >= 3:
        score += 2
        signals_found.append(f"skills_found({skill_count})")
    elif skill_count >= 1:
        score += 1
        signals_found.append(f"skills_found({skill_count})")

    # 8. Contains LinkedIn or GitHub link
    if re.search(r"linkedin\.com|github\.com", text_lower):
        score += 1
        signals_found.append("has_profile_link")

    # 9. Negative signals — penalize documents that look like non-resume content
    for pattern in NON_RESUME_PATTERNS:
        if re.search(pattern, text_lower):
            score -= 3
            signals_found.append("non_resume_content_detected")
            break  # one penalty is enough

    # Threshold: max possible ~14, require at least 5 to be plausible
    max_score = 14
    confidence = round(min(max(score, 0) / max_score, 1.0), 2)
    is_resume = score >= 5

    if not is_resume:
        reason = "This document does not appear to be a resume. No recognizable resume elements found (no contact info, experience sections, skills, or education)."
    else:
        reason = "ok"

    return {
        "is_resume": is_resume,
        "confidence": confidence,
        "reason": reason,
        "signals_found": signals_found,
    }


def run_analysis(text: str, filename: str) -> dict:
    """Run the complete 6-signal fraud analysis pipeline."""

    # Step 1: Extract entities
    logger.info(f"Extracting entities from '{filename}'...")
    entities = extract_entities(text)

    # Step 2: Run all 6 signals
    logger.info("Running fraud detection signals...")

    signal_results = {}

    # Signal 1: Timeline Overlap
    try:
        signal_results["timeline_overlap"] = check_timeline_overlap(
            entities.get("experiences", [])
        )
    except Exception as e:
        logger.error(f"Timeline signal failed: {e}")
        signal_results["timeline_overlap"] = {"score": 0, "severity": "NONE", "explanation": f"Error: {e}"}

    # Signal 2: Email Validation
    try:
        signal_results["email_validation"] = validate_emails(
            entities.get("emails", []),
            known_emails=resume_store["emails_seen"]
        )
    except Exception as e:
        logger.error(f"Email signal failed: {e}")
        signal_results["email_validation"] = {"score": 0, "severity": "NONE", "explanation": f"Error: {e}"}

    # Signal 3: Phone Dedup
    try:
        signal_results["phone_validation"] = validate_phones(
            entities.get("phones", []),
            known_phones=resume_store["phones_seen"]
        )
    except Exception as e:
        logger.error(f"Phone signal failed: {e}")
        signal_results["phone_validation"] = {"score": 0, "severity": "NONE", "explanation": f"Error: {e}"}

    # Signal 4: JD Plagiarism
    try:
        signal_results["jd_plagiarism"] = check_jd_plagiarism(
            entities.get("experiences", []),
            known_experiences=resume_store["experiences_seen"]
        )
    except Exception as e:
        logger.error(f"JD plagiarism signal failed: {e}")
        signal_results["jd_plagiarism"] = {"score": 0, "severity": "NONE", "explanation": f"Error: {e}"}

    # Signal 5: Semantic Similarity
    try:
        signal_results["semantic_similarity"] = check_semantic_similarity(
            text,
            known_resumes=resume_store["embeddings"]
        )
    except Exception as e:
        logger.error(f"Semantic similarity signal failed: {e}")
        signal_results["semantic_similarity"] = {"score": 0, "severity": "NONE", "explanation": f"Error: {e}"}

    # Signal 6: Skills Mismatch
    try:
        signal_results["skills_mismatch"] = check_skills_mismatch(
            entities.get("skills", {}),
            entities.get("experiences", []),
            text
        )
    except Exception as e:
        logger.error(f"Skills mismatch signal failed: {e}")
        signal_results["skills_mismatch"] = {"score": 0, "severity": "NONE", "explanation": f"Error: {e}"}

    # Signal 7: Profile Link Verification (Serper API)
    try:
        signal_results["profile_validation"] = verify_profile_links(entities)
    except Exception as e:
        logger.error(f"Profile link validation failed: {e}")
        signal_results["profile_validation"] = {"score": 0, "severity": "NONE", "explanation": f"Error: {e}"}

    # Signal 8: GLEIF Company Verification
    try:
        signal_results["gleif_verification"] = verify_companies_gleif(
            entities.get("experiences", [])
        )
    except Exception as e:
        logger.error(f"GLEIF verification failed: {e}")
        signal_results["gleif_verification"] = {"score": 0, "severity": "NONE", "explanation": f"Error: {e}"}

    # Step 3: Calculate composite risk score
    logger.info("Calculating risk score...")
    risk_score = calculate_risk_score(signal_results)

    # Step 4: Generate explanation
    explanation = generate_explanation(signal_results, risk_score, entities)
    signal_summary = generate_signal_summary(signal_results)

    # Step 5: Store data for future comparisons and Database
    _store_resume_data(filename, entities, signal_results, text, risk_score)

    # Build response
    return {
        "filename": filename,
        "analyzed_at": datetime.now().isoformat(),
        "name": entities.get("name", "Unknown"),
        "emails": entities.get("emails", []),
        "phones": entities.get("phones", []),
        "skills": entities.get("skills", {}),
        "experience_count": len(entities.get("experiences", [])),
        "word_count": entities.get("word_count", 0),
        "risk_score": risk_score["composite_score"],
        "risk_level": risk_score["risk_level"],
        "risk_label": get_risk_label(risk_score["composite_score"]),
        "risk_color": get_risk_color(risk_score["composite_score"]),
        "alert": risk_score["alert"],
        "active_signals": risk_score["active_signals"],
        "most_critical_signal": risk_score["most_critical_signal"],
        "signals": {
            "timeline_score": signal_results.get("timeline_overlap", {}).get("score", 0),
            "email_score": signal_results.get("email_validation", {}).get("score", 0),
            "phone_score": signal_results.get("phone_validation", {}).get("score", 0),
            "plagiarism_score": signal_results.get("jd_plagiarism", {}).get("score", 0),
            "similarity_score": signal_results.get("semantic_similarity", {}).get("score", 0),
            "mismatch_score": signal_results.get("skills_mismatch", {}).get("score", 0),
            "profile_score": signal_results.get("profile_validation", {}).get("score", 0),
            "gleif_score": signal_results.get("gleif_verification", {}).get("score", 0),
        },
        "gleif_verification": signal_results.get("gleif_verification", {}).get("verified_companies", []),
        "email_verification": signal_results.get("email_validation", {}).get("verified_emails", []),
        "phone_verification": signal_results.get("phone_validation", {}).get("verified_phones", []),
        "profile_verification": signal_results.get("profile_validation", {}).get("verified_links", []),
        "signal_details": signal_summary,
        "breakdown": risk_score["breakdown"],
        "llm_explanation": explanation,
        "entities": {
            "name": entities.get("name"),
            "emails": entities.get("emails", []),
            "phones": entities.get("phones", []),
            "skills_count": entities.get("skills", {}).get("total_count", 0),
            "experiences": [
                {
                    "company": e.get("company", ""),
                    "role": e.get("role", ""),
                    "start": e.get("start", ""),
                    "end": e.get("end", ""),
                }
                for e in entities.get("experiences", [])
            ],
            "education": entities.get("education", []),
        },
    }


def _store_resume_data(filename: str, entities: dict, signal_results: dict, text: str, risk_score: dict):
    """Store processed resume data for cross-resume comparison and PostgreSQL DB."""
    emails = entities.get("emails", [])
    phones = entities.get("phones", [])
    experiences = entities.get("experiences", [])
    text_hash = hashlib.sha256(text.encode()).hexdigest()

    # 1. Store in Runtime Memory
    resume_store["emails_seen"].extend(emails)
    resume_store["phones_seen"].extend(phones)

    for exp in experiences:
        exp_copy = dict(exp)
        exp_copy["source_resume"] = filename
        resume_store["experiences_seen"].append(exp_copy)

    semantic = signal_results.get("semantic_similarity", {})
    if semantic.get("embedding"):
        resume_store["embeddings"].append({
            "filename": filename,
            "text": text[:1000],  # Store truncated text
            "embedding": semantic["embedding"],
        })

    resume_store["resumes"].append({
        "filename": filename,
        "analyzed_at": datetime.now().isoformat(),
        "name": entities.get("name", "Unknown"),
        "emails": emails,
        "phones": phones,
        "text_hash": text_hash,
        "risk_score": risk_score.get("composite_score", 0),
        "risk_level": risk_score.get("risk_level", "UNKNOWN"),
    })

    # 2. Persist to PostgreSQL Database
    try:
        data_json = {"entities": entities, "signals": signal_results}
        
        save_resume_to_db(
            filename=filename,
            candidate_name=entities.get("name", "Unknown"),
            text_hash=text_hash,
            raw_text=text,
            risk_score=risk_score.get("composite_score", 0),
            risk_level=risk_score.get("risk_level", "UNKNOWN"),
            data_json=data_json
        )
        save_contacts_to_db(emails, phones, filename)
        save_experiences_to_db(experiences, filename)
    except Exception as e:
        logger.error(f"PostgreSQL persistence failed: {e}")


# ─── API Endpoints ───────────────────────────────────────

@app.get("/api-info")
async def api_info():
    """API info endpoint."""
    return {
        "name": "🛡️ ResumeGuard — Fraud Detection Engine",
        "version": "3.0.0",
        "status": "running",
        "signals": ["timeline_overlap", "email_validation", "phone_validation",
                     "jd_plagiarism", "semantic_similarity", "skills_mismatch",
                     "profile_validation", "gleif_verification"],
        "resumes_analyzed": len(resume_store["resumes"]),
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


from fastapi.security import APIKeyHeader
from fastapi import Security

# ─── DEET SECURITY: API Key Authentication ───────────────
DEET_SECRET_KEY = os.getenv("DEET_SECRET_KEY", "deet-telangana-hackathon-2026")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != DEET_SECRET_KEY:
        raise HTTPException(status_code=403, detail="DEET Security: Invalid or missing API Key")
    return api_key


@app.post("/validate_resume")
async def validate_resume(
    file: UploadFile = File(...),
    api_key: str = Security(verify_api_key)
):
    """
    Analyze a single resume for fraud signals.
    Accepts PDF, DOCX, or TXT files.
    """
    logger.info(f"Received resume: {file.filename}")

    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""
    if ext not in ("pdf", "docx", "doc", "txt"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{ext}. Accepted: PDF, DOCX, TXT"
        )

    # Read file bytes
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # Size limit: 10MB
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Minimum size check
    if len(file_bytes) < 10:
        raise HTTPException(status_code=400, detail="File too small to be a valid resume")

    # Parse file
    parse_result = parse_file(file_bytes, file.filename)
    if not parse_result.get("success") and not parse_result.get("text"):
        raise HTTPException(
            status_code=422,
            detail=f"Could not extract text from file: {parse_result.get('error', 'Unknown error')}"
        )

    text = parse_result["text"]

    # ─── Resume Content Validation ───────────────────────────
    content_check = validate_resume_content(text)
    if not content_check["is_resume"]:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "NOT_A_RESUME",
                "message": content_check["reason"],
                "confidence": content_check["confidence"],
                "word_count": len(text.split()),
                "signals_found": content_check["signals_found"],
                "suggestion": "Please upload a valid resume document (PDF, DOCX, or TXT) containing contact information, work experience, education, or skills.",
            }
        )

    # Run analysis — always re-evaluate, never return cached results
    try:
        file_hash = hashlib.sha256(text.encode()).hexdigest()

        # Check how many times this exact resume was submitted before
        prev_count = resume_store["submission_counts"].get(file_hash, 0)

        # Always run full analysis pipeline (no caching)
        analysis = await run_in_threadpool(run_analysis, text, file.filename)

        # ─── Duplicate Submission Penalty ────────────────────────
        if prev_count > 0:
            penalty = min(prev_count * 7, 25)  # +7 per repeat, capped at +25
            original_score = analysis["risk_score"]
            new_score = min(round(original_score + penalty, 1), 100)

            analysis["risk_score"] = new_score
            # Recalculate risk level based on penalized score
            if new_score >= 85:
                analysis["risk_level"] = "CRITICAL"
            elif new_score >= 65:
                analysis["risk_level"] = "HIGH"
            elif new_score >= 40:
                analysis["risk_level"] = "MEDIUM"
            elif new_score >= 20:
                analysis["risk_level"] = "LOW"
            else:
                analysis["risk_level"] = "CLEAN"
            analysis["risk_label"] = get_risk_label(new_score)
            analysis["risk_color"] = get_risk_color(new_score)
            analysis["alert"] = new_score >= 65

            analysis["duplicate_submission"] = {
                "is_duplicate": True,
                "times_submitted": prev_count + 1,
                "penalty_applied": penalty,
                "original_score": original_score,
            }
            logger.warning(
                f"Duplicate submission #{prev_count + 1} for '{file.filename}' "
                f"(hash={file_hash[:12]}…). Penalty +{penalty} → {new_score}"
            )

            # Update the DB record with the penalized score
            try:
                save_resume_to_db(
                    filename=file.filename,
                    candidate_name=analysis.get("name", "Unknown"),
                    text_hash=file_hash,
                    raw_text=text,
                    risk_score=new_score,
                    risk_level=analysis["risk_level"],
                    data_json={"penalized": True, "original_score": original_score, "penalty": penalty},
                )
            except Exception as e:
                logger.error(f"Failed to update penalized score in DB: {e}")
        else:
            analysis["duplicate_submission"] = {
                "is_duplicate": False,
                "times_submitted": 1,
                "penalty_applied": 0,
            }

        # Increment submission count
        resume_store["submission_counts"][file_hash] = prev_count + 1

        return JSONResponse(content=analysis)
    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/batch_validate")
async def batch_validate(
    files: list[UploadFile] = File(...),
    api_key: str = Security(verify_api_key)
):
    """
    Analyze multiple resumes in batch.
    Returns individual results + cross-resume analysis.
    """
    if len(files) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 files per batch")

    results = []
    errors = []

    for file in files:
        try:
            file_bytes = await file.read()
            ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""

            if ext not in ("pdf", "docx", "doc", "txt"):
                errors.append({"filename": file.filename, "error": f"Unsupported type: .{ext}"})
                continue

            parse_result = parse_file(file_bytes, file.filename)
            if not parse_result.get("text"):
                errors.append({"filename": file.filename, "error": parse_result.get("error", "No text")})
                continue

            analysis = await run_in_threadpool(run_analysis, parse_result["text"], file.filename)
            results.append(analysis)

        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})

    # Summary stats
    scores = [r["risk_score"] for r in results]
    summary = {
        "total_analyzed": len(results),
        "total_errors": len(errors),
        "avg_risk_score": round(sum(scores) / len(scores), 1) if scores else 0,
        "max_risk_score": max(scores) if scores else 0,
        "high_risk_count": sum(1 for s in scores if s >= 65),
        "medium_risk_count": sum(1 for s in scores if 40 <= s < 65),
        "low_risk_count": sum(1 for s in scores if s < 40),
    }

    return JSONResponse(content={
        "summary": summary,
        "results": results,
        "errors": errors,
    })


@app.post("/compare_resumes")
async def compare_resumes(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    api_key: str = Security(verify_api_key)
):
    """Compare two resumes side-by-side for similarity."""
    results = []
    for f in [file1, file2]:
        file_bytes = await f.read()
        parse_result = parse_file(file_bytes, f.filename)
        if not parse_result.get("text"):
            raise HTTPException(status_code=422, detail=f"Cannot parse {f.filename}")
        entities = extract_entities(parse_result["text"])
        results.append({
            "filename": f.filename,
            "text": parse_result["text"],
            "entities": entities,
        })

    # Compute direct similarity
    from signals.semantic_similarity import get_embedding, cosine_similarity
    emb1 = get_embedding(results[0]["text"])
    emb2 = get_embedding(results[1]["text"])
    import numpy as np
    similarity = cosine_similarity(emb1, emb2) if emb1 is not None and emb2 is not None else 0

    # Check shared contact info
    shared_emails = set(results[0]["entities"]["emails"]) & set(results[1]["entities"]["emails"])
    shared_phones = set(results[0]["entities"]["phones"]) & set(results[1]["entities"]["phones"])

    return JSONResponse(content={
        "file1": results[0]["filename"],
        "file2": results[1]["filename"],
        "similarity_score": round(similarity * 100, 1),
        "shared_emails": list(shared_emails),
        "shared_phones": list(shared_phones),
        "name1": results[0]["entities"].get("name"),
        "name2": results[1]["entities"].get("name"),
        "skills_overlap": list(
            set(results[0]["entities"]["skills"].get("technical", [])) &
            set(results[1]["entities"]["skills"].get("technical", []))
        ),
        "fraud_indicators": {
            "same_contact": bool(shared_emails or shared_phones),
            "high_similarity": similarity >= 0.85,
            "possible_duplicate": similarity >= 0.95,
        }
    })


@app.get("/history")
async def get_history():
    """Get analysis history."""
    return JSONResponse(content={
        "total_resumes": len(resume_store["resumes"]),
        "resumes": resume_store["resumes"][-50:],  # Last 50
    })


@app.post("/diff_compare")
async def diff_compare_endpoint(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    api_key: str = Security(verify_api_key)
):
    """
    Deterministic diff comparison between two resumes.
    Returns similarity score, matching blocks, highlight spans,
    n-gram overlap, and template fingerprints.
    """
    texts = []
    filenames = []
    for f in [file1, file2]:
        file_bytes = await f.read()
        parse_result = parse_file(file_bytes, f.filename)
        if not parse_result.get("text"):
            raise HTTPException(status_code=422, detail=f"Cannot parse {f.filename}")
        texts.append(parse_result["text"])
        filenames.append(f.filename)

    result = await run_in_threadpool(diff_compare, texts[0], texts[1])

    return JSONResponse(content={
        "file1": filenames[0],
        "file2": filenames[1],
        **result,
    })


@app.get("/stats")
async def get_stats():
    """Get overall system statistics."""
    return JSONResponse(content={
        "total_resumes_analyzed": len(resume_store["resumes"]),
        "unique_emails": len(set(resume_store["emails_seen"])),
        "unique_phones": len(set(resume_store["phones_seen"])),
        "embeddings_stored": len(resume_store["embeddings"]),
        "experiences_indexed": len(resume_store["experiences_seen"]),
    })


@app.get("/export_csv")
async def export_csv():
    """Export analysis history as a downloadable CSV file."""
    import csv
    import io
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Candidate", "Filename", "Risk Score", "Risk Level", "Emails", "Phones", "Analyzed At"])
    
    for r in resume_store["resumes"]:
        writer.writerow([
            r.get("name", r.get("candidate_name", "")),
            r.get("filename", ""),
            round(r.get("risk_score", 0), 1),
            r.get("risk_level", ""),
            ", ".join(r.get("emails", [])) if isinstance(r.get("emails"), list) else "",
            ", ".join(r.get("phones", [])) if isinstance(r.get("phones"), list) else "",
            r.get("analyzed_at", ""),
        ])
    
    from starlette.responses import StreamingResponse
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=resumeguard_report.csv"}
    )


@app.delete("/reset")
async def reset_store():
    """Reset the in-memory store AND PostgreSQL database."""
    # Clear in-memory store
    resume_store["resumes"] = []
    resume_store["emails_seen"] = []
    resume_store["phones_seen"] = []
    resume_store["experiences_seen"] = []
    resume_store["embeddings"] = []
    resume_store["submission_counts"] = {}
    
    # Clear PostgreSQL tables
    try:
        from db import _get_session, DBResume, DBContact, DBExperience
        db = _get_session()
        if db:
            db.query(DBResume).delete()
            db.query(DBContact).delete()
            db.query(DBExperience).delete()
            db.commit()
            db.close()
            logger.info("PostgreSQL tables cleared via /reset endpoint.")
    except Exception as e:
        logger.error(f"Failed to clear PostgreSQL tables: {e}")
    
    # Reload .env so any new API keys take effect immediately
    load_dotenv(override=True)
    
    return {"status": "reset", "message": "All stored data and database cleared"}





# ─── Main ────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
