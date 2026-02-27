"""
Signal 1: Timeline Overlap Detection
Detects overlapping employment periods — a major fraud indicator.
Scores based on overlap count and duration in months.
"""
import re
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

MONTH_MAP = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
    "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6,
    "jul": 7, "july": 7, "aug": 8, "august": 8, "sep": 9, "september": 9,
    "oct": 10, "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12,
}


def parse_date(date_str: str) -> Optional[datetime]:
    """Parse a date string into a datetime object."""
    if not date_str:
        return None

    date_str = date_str.strip().lower()

    # Handle "present", "current", "now"
    if date_str in ("present", "current", "now", "ongoing"):
        return datetime.now()

    # Try "Month Year" format: "Jan 2020", "January 2020"
    match = re.match(r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{4})", date_str)
    if match:
        month = MONTH_MAP.get(match.group(1)[:3], 1)
        year = int(match.group(2))
        return datetime(year, month, 1)

    # Try "YYYY" format
    match = re.match(r"^(\d{4})$", date_str)
    if match:
        return datetime(int(match.group(1)), 1, 1)

    # Try "MM/YYYY" or "MM-YYYY"
    match = re.match(r"(\d{1,2})[/\-](\d{4})", date_str)
    if match:
        return datetime(int(match.group(2)), int(match.group(1)), 1)

    return None


def months_overlap(start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> int:
    """Calculate the number of months of overlap between two date ranges."""
    overlap_start = max(start1, start2)
    overlap_end = min(end1, end2)
    if overlap_start >= overlap_end:
        return 0
    return max(1, (overlap_end.year - overlap_start.year) * 12 + (overlap_end.month - overlap_start.month))


def check_timeline_overlap(experiences: list) -> dict:
    """
    Analyze employment timeline for overlapping periods.
    
    Args:
        experiences: list of dicts with 'start', 'end', 'company', 'role' keys
    
    Returns:
        dict with overlap_count, details, score (0-40), and severity
    """
    result = {
        "signal_name": "timeline_overlap",
        "overlap_count": 0,
        "total_overlap_months": 0,
        "details": [],
        "score": 0,
        "severity": "NONE",
        "explanation": "",
    }

    if not experiences or len(experiences) < 2:
        result["explanation"] = "Insufficient experience entries to check for overlaps."
        return result

    # Parse all date ranges
    parsed = []
    for exp in experiences:
        start = parse_date(exp.get("start", ""))
        end = parse_date(exp.get("end", ""))
        if start and end and start < end:
            parsed.append({
                "start": start,
                "end": end,
                "company": exp.get("company", "Unknown"),
                "role": exp.get("role", ""),
            })

    if len(parsed) < 2:
        result["explanation"] = "Could not parse enough date ranges to check overlaps."
        return result

    # Check all pairs for overlap
    overlaps = []
    total_months = 0
    for i in range(len(parsed)):
        for j in range(i + 1, len(parsed)):
            overlap = months_overlap(
                parsed[i]["start"], parsed[i]["end"],
                parsed[j]["start"], parsed[j]["end"]
            )
            if overlap > 0:
                detail = {
                    "company_a": parsed[i]["company"],
                    "company_b": parsed[j]["company"],
                    "overlap_months": overlap,
                    "period_a": f"{parsed[i]['start'].strftime('%b %Y')} – {parsed[i]['end'].strftime('%b %Y')}",
                    "period_b": f"{parsed[j]['start'].strftime('%b %Y')} – {parsed[j]['end'].strftime('%b %Y')}",
                }
                overlaps.append(detail)
                total_months += overlap

    result["overlap_count"] = len(overlaps)
    result["total_overlap_months"] = total_months
    result["details"] = overlaps

    # Scoring: each overlap = 12 points, + bonus for long overlaps
    base_score = min(len(overlaps) * 12, 30)
    duration_bonus = min(total_months * 2, 10)
    result["score"] = min(base_score + duration_bonus, 40)

    # Severity
    if result["score"] >= 30:
        result["severity"] = "HIGH"
        result["explanation"] = f"Found {len(overlaps)} overlapping employment period(s) totaling {total_months} months. This is a strong indicator of fabricated or exaggerated work history."
    elif result["score"] >= 15:
        result["severity"] = "MEDIUM"
        result["explanation"] = f"Found {len(overlaps)} overlapping employment period(s). Some overlap could be legitimate (part-time roles), but warrants review."
    elif result["score"] > 0:
        result["severity"] = "LOW"
        result["explanation"] = f"Minor overlap detected ({total_months} month(s)). Could be a transition period between jobs."
    else:
        result["explanation"] = "No employment timeline overlaps detected."

    return result
