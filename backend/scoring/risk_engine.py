"""
Risk Scoring Engine — Weighted aggregation of all 6 fraud signals.
Produces a 0-100 composite risk score with configurable weights.
"""
import logging

logger = logging.getLogger(__name__)

# ─── Signal Weight Configuration ────────────────────────
# Total max possible = 100
SIGNAL_WEIGHTS = {
    "timeline_overlap": {
        "max_score": 40,
        "weight": 0.20,
        "display_name": "Timeline Risk",
    },
    "email_validation": {
        "max_score": 20,
        "weight": 0.12,
        "display_name": "Contact Risk (Email)",
    },
    "phone_validation": {
        "max_score": 15,
        "weight": 0.07,
        "display_name": "Contact Risk (Phone)",
    },
    "jd_plagiarism": {
        "max_score": 30,
        "weight": 0.16,
        "display_name": "JD Plagiarism Risk",
    },
    "semantic_similarity": {
        "max_score": 35,
        "weight": 0.15,
        "display_name": "Similarity Risk",
    },
    "skills_mismatch": {
        "max_score": 20,
        "weight": 0.07,
        "display_name": "Skills Mismatch",
    },
    "profile_validation": {
        "max_score": 30,
        "weight": 0.13,
        "display_name": "OSINT Profile Risk",
    },
    "gleif_verification": {
        "max_score": 25,
        "weight": 0.10,
        "display_name": "Company Verification (GLEIF)",
    },
}

# Risk level thresholds
RISK_THRESHOLDS = {
    "CRITICAL": 85,
    "HIGH": 65,
    "MEDIUM": 40,
    "LOW": 20,
    "CLEAN": 0,
}


def calculate_risk_score(signal_results: dict) -> dict:
    """
    Calculate composite risk score from individual signal results.
    
    Args:
        signal_results: dict mapping signal_name -> signal result dict
    
    Returns:
        dict with composite_score, risk_level, breakdown, and alert status
    """
    weighted_score = 0.0
    breakdown = {}
    total_weight = 0.0
    active_signals = 0

    for signal_name, config in SIGNAL_WEIGHTS.items():
        signal_data = signal_results.get(signal_name, {})
        raw_score = signal_data.get("score", 0)
        max_score = config["max_score"]
        weight = config["weight"]

        # Normalize signal score to 0-100 range, then apply weight
        if max_score > 0:
            normalized = (raw_score / max_score) * 100
        else:
            normalized = 0

        weighted_contribution = normalized * weight
        weighted_score += weighted_contribution
        total_weight += weight

        if raw_score > 0:
            active_signals += 1

        breakdown[signal_name] = {
            "display_name": config["display_name"],
            "raw_score": raw_score,
            "max_score": max_score,
            "normalized": round(normalized, 1),
            "weighted_contribution": round(weighted_contribution, 1),
            "severity": signal_data.get("severity", "NONE"),
        }

    # Final composite score (0-100)
    composite = round(weighted_score, 1)

    # Apply multiplier if multiple signals fire (compound risk)
    if active_signals >= 4:
        composite = min(composite * 1.15, 100)
    elif active_signals >= 3:
        composite = min(composite * 1.08, 100)

    composite = round(min(composite, 100), 1)

    # Determine risk level
    risk_level = "CLEAN"
    for level, threshold in RISK_THRESHOLDS.items():
        if composite >= threshold:
            risk_level = level
            break

    # Determine if alert should be triggered
    alert = composite >= RISK_THRESHOLDS["HIGH"]

    # Find the most critical signal
    most_critical = max(
        breakdown.items(),
        key=lambda x: x[1]["normalized"],
        default=(None, {"display_name": "None", "normalized": 0})
    )

    return {
        "composite_score": composite,
        "risk_level": risk_level,
        "alert": alert,
        "active_signals": active_signals,
        "total_signals": len(SIGNAL_WEIGHTS),
        "most_critical_signal": most_critical[1]["display_name"],
        "breakdown": breakdown,
    }


def get_risk_color(score: float) -> str:
    """Get display color for risk score."""
    if score >= 85:
        return "🔴"
    elif score >= 65:
        return "🟠"
    elif score >= 40:
        return "🟡"
    elif score >= 20:
        return "🟢"
    return "✅"


def get_risk_label(score: float) -> str:
    """Get human-readable risk label."""
    if score >= 85:
        return "CRITICAL RISK — Immediate Review Required"
    elif score >= 65:
        return "HIGH RISK — Recruiter Alert Triggered"
    elif score >= 40:
        return "MEDIUM RISK — Manual Verification Recommended"
    elif score >= 20:
        return "LOW RISK — Minor Concerns"
    return "CLEAN — No Significant Issues"
