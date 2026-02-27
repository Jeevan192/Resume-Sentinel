"""
AI Explainer — Generates human-readable explanations.
Uses Google Gemini API for intelligent explanations,
with template-based fallback if the API is unavailable.
"""
import json
import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load env variables explicitly so they're available during import
# Using override=True to ensure we pick up the new key from .env instead of a cached OS variable
load_dotenv(override=True)

# ─── Gemini Configuration ───────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

SYSTEM_PROMPT = (
    "You are a recruitment fraud analyst for ResumeSentinel, an AI-based resume fraud detection engine. "
    "Given structured fraud signal data from our 6-signal detection pipeline, write a clear, "
    "professional recruiter alert (4-6 sentences). Be factual, specific, and reference the actual "
    "signal names and scores. Do not assign blame or say the person is definitely fraudulent. "
    "Mention the composite risk score, which signals fired, and give a concrete recommendation. "
    "Use the signal data provided."
)

gemini_model = None
if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={"temperature": 0.2},
            system_instruction=SYSTEM_PROMPT,
        )
        logger.info("Gemini AI successfully configured for explanations.")
    except ImportError:
        logger.warning("google-generativeai not installed. AI Explanations disabled.")
    except Exception as e:
        logger.error(f"Failed to configure Gemini AI: {e}")


def _generate_gemini_explanation(signal_results: dict, risk_score: dict, entities: dict) -> str:
    """Try to generate explanation using Gemini API."""
    if not gemini_model:
        return None

    payload = {
        "candidate_name": entities.get("name", "Unknown"),
        "composite_score": risk_score.get("composite_score", 0),
        "risk_level": risk_score.get("risk_level", "UNKNOWN"),
        "active_signals": risk_score.get("active_signals", 0),
        "total_signals": risk_score.get("total_signals", 6),
        "most_critical_signal": risk_score.get("most_critical_signal", "None"),
        "signals": {},
    }

    for signal_name, result in signal_results.items():
        payload["signals"][signal_name] = {
            "score": result.get("score", 0),
            "severity": result.get("severity", "NONE"),
            "explanation": result.get("explanation", ""),
        }

    try:
        response = gemini_model.generate_content(json.dumps(payload))
        content = response.text if response else None
        if content:
            logger.info("Gemini explanation generated successfully.")
            return content.strip()
        return None
    except Exception as e:
        logger.error(f"Gemini API call failed during generation: {str(e)}", exc_info=True)
        return None


def _generate_template_explanation(signal_results: dict, risk_score: dict, entities: dict) -> str:
    """Fallback: Generate explanation using templates (no API needed)."""
    parts = []
    name = entities.get("name", "The candidate")
    score = risk_score.get("composite_score", 0)
    level = risk_score.get("risk_level", "UNKNOWN")
    active = risk_score.get("active_signals", 0)
    total = risk_score.get("total_signals", 6)

    # Opening summary
    if score >= 85:
        parts.append(
            f"⚠️ CRITICAL ALERT: {name}'s resume has been flagged with a risk score of "
            f"{score}/100. Multiple fraud indicators detected across {active}/{total} signals."
        )
    elif score >= 65:
        parts.append(
            f"🔴 HIGH RISK: {name}'s resume scored {score}/100. "
            f"Significant concerns found in {active} detection signals."
        )
    elif score >= 40:
        parts.append(
            f"🟡 MEDIUM RISK: {name}'s resume scored {score}/100. "
            f"Some inconsistencies detected that warrant manual review."
        )
    elif score >= 20:
        parts.append(
            f"🟢 LOW RISK: {name}'s resume scored {score}/100. "
            f"Minor concerns detected but overall appears legitimate."
        )
    else:
        parts.append(
            f"✅ CLEAN: {name}'s resume scored {score}/100. "
            f"No significant fraud indicators detected."
        )

    # Signal-specific explanations
    signal_explanations = []

    timeline = signal_results.get("timeline_overlap", {})
    if timeline.get("score", 0) > 0:
        overlaps = timeline.get("overlap_count", 0)
        months = timeline.get("total_overlap_months", 0)
        signal_explanations.append(
            f"📅 **Timeline Analysis**: Found {overlaps} overlapping employment period(s) "
            f"totaling {months} month(s). "
            + (timeline.get("explanation", ""))
        )

    email = signal_results.get("email_validation", {})
    if email.get("score", 0) > 0:
        flags = email.get("flags", [])
        signal_explanations.append(
            f"📧 **Email Analysis**: {len(flags)} concern(s) — "
            + email.get("explanation", "Issues found with email address.")
        )

    phone = signal_results.get("phone_validation", {})
    if phone.get("score", 0) > 0:
        signal_explanations.append(
            f"📱 **Phone Analysis**: " + phone.get("explanation", "Concerns with phone number.")
        )

    jd = signal_results.get("jd_plagiarism", {})
    if jd.get("score", 0) > 0:
        exact = jd.get("exact_matches", 0)
        partial = jd.get("partial_matches", 0)
        signal_explanations.append(
            f"📝 **JD Plagiarism**: {exact} exact match(es), {partial} partial match(es). "
            + jd.get("explanation", "")
        )

    semantic = signal_results.get("semantic_similarity", {})
    if semantic.get("score", 0) > 0:
        max_sim = semantic.get("max_similarity", 0)
        signal_explanations.append(
            f"🔍 **Semantic Similarity**: {max_sim}% similarity with other submissions. "
            + semantic.get("explanation", "")
        )

    skills = signal_results.get("skills_mismatch", {})
    if skills.get("score", 0) > 0:
        signal_explanations.append(
            f"🎯 **Skills Mismatch**: " + skills.get("explanation", "Inconsistencies detected.")
        )

    if signal_explanations:
        parts.append("\n**Detailed Findings:**")
        for i, exp in enumerate(signal_explanations, 1):
            parts.append(f"\n{i}. {exp}")
    else:
        parts.append("\nAll detection signals passed with no concerns.")

    # Recommendation
    parts.append("\n**Recommendation:**")
    if score >= 65:
        parts.append(
            "This resume should be manually reviewed by a senior recruiter before proceeding. "
            "Consider requesting additional documentation or verification."
        )
    elif score >= 40:
        parts.append(
            "This resume has some concerns. A brief manual check of the flagged areas "
            "is recommended before advancing the candidate."
        )
    else:
        parts.append(
            "This resume appears legitimate. Standard verification procedures are sufficient."
        )

    return "\n".join(parts)


def generate_explanation(
    signal_results: dict,
    risk_score: dict,
    entities: dict
) -> str:
    """
    Generate a comprehensive, human-readable explanation of the analysis.

    Tries Gemini API first for intelligent AI-powered explanations.
    Falls back to template-based generation if the API is unavailable.

    Args:
        signal_results: dict of all signal outputs
        risk_score: output from risk_engine.calculate_risk_score()
        entities: extracted entities from the resume

    Returns:
        Formatted explanation string
    """
    # Try Gemini first
    gemini_result = _generate_gemini_explanation(signal_results, risk_score, entities)
    if gemini_result:
        return gemini_result

    # Fallback to template-based
    logger.info("Using template-based explanation (Gemini unavailable).")
    return _generate_template_explanation(signal_results, risk_score, entities)


def generate_signal_summary(signal_results: dict) -> dict:
    """Generate a compact summary of all signals for API response."""
    summary = {}
    for signal_name, result in signal_results.items():
        summary[signal_name] = {
            "score": result.get("score", 0),
            "severity": result.get("severity", "NONE"),
            "headline": result.get("explanation", "")[:100],
        }
    return summary
