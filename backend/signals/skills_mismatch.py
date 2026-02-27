"""
Signal 6: Skills-Experience Mismatch Detector
Cross-references claimed skills level against stated experience.
Flags impossible or highly unlikely skill claims for the stated
career stage.
"""
import re
import logging

logger = logging.getLogger(__name__)

# Skills that require significant experience to claim expertise
SENIOR_SKILLS = {
    "system design", "architecture", "distributed systems", "microservices",
    "technical leadership", "solution architect", "enterprise architecture",
    "platform engineering", "staff engineer", "principal engineer",
    "devops", "site reliability", "infrastructure", "kubernetes",
}

# Skills typically associated with certain minimum years of experience
SKILL_EXPERIENCE_MAP = {
    "machine learning": 1,
    "deep learning": 2,
    "mlops": 2,
    "system design": 3,
    "architecture": 3,
    "distributed systems": 3,
    "microservices": 2,
    "kubernetes": 1,
    "devops": 1,
    "technical leadership": 4,
    "team lead": 3,
    "data engineering": 2,
    "cloud architecture": 2,
}

# Experience level indicators
FRESHER_INDICATORS = [
    "fresher", "fresh graduate", "entry level", "entry-level",
    "recent graduate", "seeking first", "0 years", "no experience",
    "intern", "internship",
]

SENIOR_INDICATORS = [
    "senior", "lead", "principal", "staff", "architect", "manager",
    "director", "vp ", "vice president", "head of", "cto", "cio",
]


def estimate_experience_years(experiences: list) -> float:
    """Estimate total years of experience from parsed experience entries."""
    from signals.timeline_overlap import parse_date
    
    total_months = 0
    for exp in experiences:
        start = parse_date(exp.get("start", ""))
        end = parse_date(exp.get("end", ""))
        if start and end and end > start:
            months = (end.year - start.year) * 12 + (end.month - start.month)
            total_months += max(months, 0)

    return round(total_months / 12, 1)


def check_skills_mismatch(
    skills: dict,
    experiences: list,
    raw_text: str
) -> dict:
    """
    Detect mismatches between claimed skills and experience level.
    
    Args:
        skills: dict with 'technical' and 'soft' skill lists
        experiences: list of experience dicts
        raw_text: full resume text for context analysis
    
    Returns:
        dict with score (0-20), flags, and severity
    """
    result = {
        "signal_name": "skills_mismatch",
        "score": 0,
        "flags": [],
        "details": [],
        "severity": "NONE",
        "explanation": "",
        "estimated_years": 0,
        "skill_count": 0,
    }

    text_lower = raw_text.lower()
    tech_skills = skills.get("technical", [])
    result["skill_count"] = len(tech_skills)

    # Estimate experience
    years = estimate_experience_years(experiences)
    result["estimated_years"] = years

    score = 0

    # ─── Check 1: Fresher claiming senior skills ─────────
    is_fresher = any(ind in text_lower for ind in FRESHER_INDICATORS) or years < 1
    
    if is_fresher:
        for skill in tech_skills:
            min_years = SKILL_EXPERIENCE_MAP.get(skill, 0)
            if min_years >= 2:
                result["flags"].append(f"FRESHER_SENIOR_SKILL: {skill}")
                result["details"].append(
                    f"Claims '{skill}' (typically requires {min_years}+ years) as a fresher"
                )
                score += 5
        
        # Fresher with senior title in experiences
        for exp in experiences:
            role = exp.get("role", "").lower()
            if any(ind in role for ind in SENIOR_INDICATORS):
                result["flags"].append(f"FRESHER_SENIOR_ROLE: {role}")
                result["details"].append(
                    f"Fresher with senior role: '{exp.get('role', '')}'"
                )
                score += 8

    # ─── Check 2: Unreasonable number of skills ──────────
    if len(tech_skills) > 25 and years < 3:
        result["flags"].append("SKILL_INFLATION")
        result["details"].append(
            f"Claims {len(tech_skills)} technical skills with only {years} years experience"
        )
        score += 5

    # ─── Check 3: Contradictory experience claims ────────
    has_senior_claim = any(ind in text_lower for ind in SENIOR_INDICATORS)
    has_fresher_claim = any(ind in text_lower for ind in FRESHER_INDICATORS)
    if has_senior_claim and has_fresher_claim:
        result["flags"].append("CONTRADICTORY_LEVEL")
        result["details"].append(
            "Resume contains both fresher and senior-level indicators"
        )
        score += 10

    # ─── Check 4: Skills not mentioned in experience descriptions ─
    if tech_skills and experiences:
        desc_text = " ".join(exp.get("description", "") for exp in experiences).lower()
        orphan_skills = []
        for skill in tech_skills[:15]:  # Check top 15
            if skill not in desc_text and len(skill) > 2:
                orphan_skills.append(skill)
        
        orphan_ratio = len(orphan_skills) / max(len(tech_skills[:15]), 1)
        if orphan_ratio > 0.7 and len(orphan_skills) > 5:
            result["flags"].append("ORPHAN_SKILLS")
            result["details"].append(
                f"{len(orphan_skills)} skills claimed but never mentioned in experience descriptions"
            )
            score += 5

    result["score"] = min(score, 20)

    # Severity
    if result["score"] >= 15:
        result["severity"] = "HIGH"
        result["explanation"] = f"Significant skill-experience mismatches: " + "; ".join(result["details"][:3])
    elif result["score"] >= 8:
        result["severity"] = "MEDIUM"
        result["explanation"] = f"Some skill concerns detected: " + "; ".join(result["details"][:2])
    elif result["score"] > 0:
        result["severity"] = "LOW"
        result["explanation"] = "Minor skill-experience inconsistencies."
    else:
        result["explanation"] = "Skills align reasonably with stated experience."

    return result
