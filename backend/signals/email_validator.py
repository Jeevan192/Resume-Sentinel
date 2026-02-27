"""
Signal 2: Email Validator & Disposable Email Detector
Checks for fake/disposable email domains, validates format,
and flags duplicate emails across submissions.
"""
import re
import logging

logger = logging.getLogger(__name__)

# Comprehensive list of 100+ known disposable email domains
DISPOSABLE_DOMAINS = {
    # Major disposable services
    "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
    "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "grr.la",
    "dispostable.com", "mailnesia.com", "maildrop.cc", "discard.email",
    "fakeinbox.com", "temp-mail.org", "getnada.com", "trashmail.com",
    "mohmal.com", "tempail.com", "emailondeck.com", "10minutemail.com",
    "guerrillamail.info", "guerrillamail.net", "guerrillamail.org",
    "guerrillamail.de", "tempinbox.com", "trash-mail.com", "jetable.org",
    "throwam.com", "mytemp.email", "tempmailaddress.com", "burnermail.io",
    "inboxbear.com", "mailsac.com", "harakirimail.com", "crazymailing.com",
    "tmail.ws", "tempmailo.com", "tmpmail.net", "tmpmail.org",
    "bupmail.com", "mailcatch.com", "mailexpire.com", "mailmoat.com",
    "mintemail.com", "mt2015.com", "nobulk.com", "nospamfor.us",
    "pookmail.com", "spamfree24.org", "spamgourmet.com", "tempomail.fr",
    # Additional
    "mailnull.com", "spamhereplease.com", "safetypost.de", "trashymail.com",
    "uggsrock.com", "wegwerfmail.de", "wegwerfmail.net", "wh4f.org",
    "whyspam.me", "wuzup.net", "xagloo.com", "yepmail.net", "zetmail.com",
    "zippymail.info", "zoaxe.com", "33mail.com", "maildrop.gq",
    "getairmail.com", "filzmail.com", "inboxalias.com", "koszmail.pl",
    "trbvm.com", "kurzepost.de", "objectmail.com", "proxymail.eu",
    "rcpt.at", "reallymymail.com", "recode.me", "regbypass.com",
    "rejectmail.com", "rhyta.com", "rklips.com", "s0ny.net",
    "safe-mail.net", "saynotospams.com", "scbox.one.pl",
    "shieldedmail.com", "sofimail.com", "sogetthis.com",
    "soodonims.com", "spambox.us", "spambog.com", "spambog.de",
    "spambog.ru", "spamcannon.com", "spamcannon.net", "spamcero.com",
    "spamcon.org", "spamcorptastic.com", "spamcowboy.com",
}

# Suspicious but not necessarily disposable
SUSPICIOUS_PATTERNS = [
    r"^test\d*@",
    r"^fake\d*@",
    r"^dummy\d*@",
    r"^temp\d*@",
    r"^noreply@",
    r"^no-reply@",
    r"^asdf",
    r"^qwerty",
    r"\d{6,}@",  # Too many consecutive digits
]

# Professional email domains (positive signal)
PROFESSIONAL_DOMAINS = {
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com",
    "icloud.com", "protonmail.com", "zoho.com", "aol.com",
}


def validate_emails(emails: list, known_emails: list = None) -> dict:
    """
    Validate email addresses for fraud signals.
    
    Args:
        emails: list of email addresses from current resume
        known_emails: list of previously seen emails (for dedup)
    
    Returns:
        dict with score (0-20), flags, and details
    """
    if known_emails is None:
        known_emails = []

    result = {
        "signal_name": "email_validation",
        "score": 0,
        "flags": [],
        "details": [],
        "severity": "NONE",
        "explanation": "",
        "disposable_found": False,
        "duplicate_found": False,
    }

    if not emails:
        result["flags"].append("NO_EMAIL")
        result["score"] = 10  # No email at all is suspicious
        result["severity"] = "MEDIUM"
        result["explanation"] = "No email address found in resume. This is unusual and may indicate the resume was fabricated or heavily edited."
        return result

    score = 0
    for email in emails:
        email = email.lower().strip()
        domain = email.split("@")[-1] if "@" in email else ""

        # Check disposable domain
        if domain in DISPOSABLE_DOMAINS:
            result["disposable_found"] = True
            result["flags"].append(f"DISPOSABLE_EMAIL: {email}")
            result["details"].append(f"'{email}' uses disposable domain '{domain}'")
            score += 15

        # Check suspicious patterns
        for pattern in SUSPICIOUS_PATTERNS:
            if re.match(pattern, email, re.IGNORECASE):
                result["flags"].append(f"SUSPICIOUS_PATTERN: {email}")
                result["details"].append(f"'{email}' matches suspicious pattern")
                score += 5
                break

        # Check for duplicates against known submissions
        known_lower = [e.lower().strip() for e in known_emails]
        if email in known_lower:
            result["duplicate_found"] = True
            result["flags"].append(f"DUPLICATE_EMAIL: {email}")
            result["details"].append(f"'{email}' was found in another submission")
            score += 10

        # Check for very short local part (e.g., a@b.com)
        local_part = email.split("@")[0]
        if len(local_part) < 3:
            result["flags"].append(f"SHORT_LOCAL: {email}")
            score += 3

    result["score"] = min(score, 20)

    # Severity
    if result["score"] >= 15:
        result["severity"] = "HIGH"
        result["explanation"] = f"Email analysis flagged {len(result['flags'])} issue(s): " + "; ".join(result["details"][:3])
    elif result["score"] >= 8:
        result["severity"] = "MEDIUM"
        result["explanation"] = f"Email has some concerns: " + "; ".join(result["details"][:2])
    elif result["score"] > 0:
        result["severity"] = "LOW"
        result["explanation"] = "Minor email concerns detected."
    else:
        result["explanation"] = "Email validation passed — no concerns."

    return result
