"""
Signal 3: Phone Number Deduplication & Validation
Normalizes phone numbers and checks for duplicates across submissions.
"""
import re
import logging

logger = logging.getLogger(__name__)


def normalize_phone(phone: str) -> str:
    """Normalize a phone number to digits only, stripping country code if India (+91)."""
    digits = re.sub(r"\D", "", phone)

    # Handle Indian phone numbers
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]

    return digits


def validate_phones(phones: list, known_phones: list = None) -> dict:
    """
    Validate phone numbers for fraud signals.
    
    Args:
        phones: list of phone numbers from current resume
        known_phones: list of previously seen phone numbers (for dedup)
    
    Returns:
        dict with score (0-15), flags, and details
    """
    if known_phones is None:
        known_phones = []

    result = {
        "signal_name": "phone_validation",
        "score": 0,
        "flags": [],
        "details": [],
        "severity": "NONE",
        "explanation": "",
        "duplicate_found": False,
        "normalized_phones": [],
    }

    if not phones:
        result["flags"].append("NO_PHONE")
        result["score"] = 5
        result["severity"] = "LOW"
        result["explanation"] = "No phone number found in resume."
        return result

    score = 0
    normalized = [normalize_phone(p) for p in phones]
    result["normalized_phones"] = normalized

    # Check for duplicate phones within the same resume (multiple numbers)
    if len(set(normalized)) < len(normalized):
        result["flags"].append("INTERNAL_DUPLICATE")
        result["details"].append("Same phone number appears multiple times in resume")
        score += 3

    # Check for invalid phone numbers
    for phone in normalized:
        if len(phone) < 10:
            result["flags"].append(f"INVALID_LENGTH: {phone}")
            result["details"].append(f"Phone number '{phone}' has fewer than 10 digits")
            score += 3
        elif len(phone) > 15:
            result["flags"].append(f"TOO_LONG: {phone}")
            result["details"].append(f"Phone number '{phone}' exceeds 15 digits")
            score += 2

    # Check for known fake patterns
    for phone in normalized:
        if re.match(r"^(\d)\1{9}$", phone):  # All same digit: 1111111111
            result["flags"].append(f"FAKE_PATTERN: {phone}")
            result["details"].append(f"Phone '{phone}' appears to be fake (repeating digits)")
            score += 10
        elif phone in ("1234567890", "0987654321", "9876543210"):
            result["flags"].append(f"SEQUENTIAL: {phone}")
            result["details"].append(f"Phone '{phone}' is a sequential number")
            score += 8

    # Check against known submissions
    known_normalized = [normalize_phone(p) for p in known_phones]
    for phone in normalized:
        if phone in known_normalized:
            result["duplicate_found"] = True
            result["flags"].append(f"CROSS_DUPLICATE: {phone}")
            result["details"].append(f"Phone '{phone}' found in another submission")
            score += 10

    result["score"] = min(score, 15)

    # Severity
    if result["score"] >= 10:
        result["severity"] = "HIGH"
        result["explanation"] = f"Phone validation flagged issues: " + "; ".join(result["details"][:3])
    elif result["score"] >= 5:
        result["severity"] = "MEDIUM"
        result["explanation"] = f"Phone has concerns: " + "; ".join(result["details"][:2])
    elif result["score"] > 0:
        result["severity"] = "LOW"
        result["explanation"] = "Minor phone concerns detected."
    else:
        result["explanation"] = "Phone validation passed — no concerns."

    return result
