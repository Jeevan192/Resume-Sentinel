"""
Entity Extractor — Extracts structured data from raw resume text.
Uses regex + heuristics to pull: name, emails, phones, dates, 
companies, skills, education, and experience blocks.
"""
import re
from typing import Optional

# ─── Skill Taxonomy ─────────────────────────────────────────────
TECH_SKILLS = {
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "sql", "nosql",
    "html", "css", "react", "angular", "vue", "node.js", "express", "django",
    "flask", "fastapi", "spring boot", "spring", "hibernate", ".net", "asp.net",
    "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ansible",
    "jenkins", "ci/cd", "git", "linux", "mongodb", "postgresql", "mysql",
    "redis", "elasticsearch", "kafka", "rabbitmq", "graphql", "rest api",
    "microservices", "machine learning", "deep learning", "nlp", "computer vision",
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "spark",
    "hadoop", "tableau", "power bi", "figma", "jira", "agile", "scrum",
    "devops", "blockchain", "solidity", "web3", "flutter", "react native",
    "unity", "unreal engine", "opencv", "selenium", "cypress", "playwright",
}

SOFT_SKILLS = {
    "leadership", "communication", "teamwork", "problem solving",
    "critical thinking", "time management", "adaptability", "creativity",
    "project management", "collaboration", "mentoring", "presentation",
}

# ─── Disposable Email Domains (top 100) ─────────────────────────
DISPOSABLE_DOMAINS = {
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
}

# ─── Education Keywords ─────────────────────────────────────────
DEGREE_PATTERNS = [
    r"(?:B\.?Tech|B\.?E\.?|B\.?Sc|B\.?S\.?|Bachelor)",
    r"(?:M\.?Tech|M\.?E\.?|M\.?Sc|M\.?S\.?|Master)",
    r"(?:Ph\.?D|Doctorate|Doctor)",
    r"(?:MBA|BBA|BCA|MCA|Diploma)",
]

# ─── Common Section Headers ─────────────────────────────────────
EXPERIENCE_HEADERS = [
    r"(?:work\s*)?experience", r"employment\s*history", r"professional\s*experience",
    r"work\s*history", r"career\s*summary", r"positions?\s*held",
]
EDUCATION_HEADERS = [
    r"education", r"academic", r"qualifications?", r"degrees?",
]


def extract_entities(text: str) -> dict:
    """
    Extract structured entities from resume text.
    """
    return {
        "name": extract_name(text),
        "emails": extract_emails(text),
        "phones": extract_phones(text),
        "skills": extract_skills(text),
        "experiences": extract_experiences(text),
        "education": extract_education(text),
        "raw_text": text,
        "word_count": len(text.split()),
        "line_count": len(text.strip().split("\n")),
    }


def extract_name(text: str) -> Optional[str]:
    """Extract candidate name — typically the first non-empty line."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if not lines:
        return None

    # First line is usually the name
    first_line = lines[0].strip()
    
    # Filter out lines that look like headers/titles or contain emails
    if "@" in first_line or len(first_line) > 60:
        return None
    if re.search(r"(resume|curriculum|vitae|cv)", first_line, re.IGNORECASE):
        # Try second line
        if len(lines) > 1:
            return lines[1].strip()[:60]
        return None
    
    # Validate it looks like a name (2-4 words, mostly alphabetic)
    words = first_line.split()
    if 1 <= len(words) <= 5 and all(re.match(r"^[A-Za-z.\-']+$", w) for w in words):
        return first_line
    
    return first_line[:60]  # fallback: truncated first line


def extract_emails(text: str) -> list:
    """Extract all email addresses."""
    pattern = r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
    return list(set(re.findall(pattern, text.lower())))


def extract_phones(text: str) -> list:
    """Extract phone numbers (handles international formats)."""
    patterns = [
        r"\+?\d{1,3}[\s\-.]?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}",
        r"\(\d{3}\)\s*\d{3}[\s\-.]?\d{4}",
        r"\d{10}",
    ]
    phones = set()
    for pattern in patterns:
        matches = re.findall(pattern, text)
        for m in matches:
            # Normalize: remove all non-digit characters
            digits = re.sub(r"\D", "", m)
            if 10 <= len(digits) <= 15:
                phones.add(digits)
    return list(phones)


def extract_skills(text: str) -> dict:
    """Extract technical and soft skills mentioned in the resume."""
    text_lower = text.lower()
    found_tech = []
    found_soft = []

    for skill in TECH_SKILLS:
        # Use word boundary matching for short skills
        if len(skill) <= 3:
            if re.search(r"\b" + re.escape(skill) + r"\b", text_lower):
                found_tech.append(skill)
        else:
            if skill in text_lower:
                found_tech.append(skill)

    for skill in SOFT_SKILLS:
        if skill in text_lower:
            found_soft.append(skill)

    return {
        "technical": sorted(found_tech),
        "soft": sorted(found_soft),
        "total_count": len(found_tech) + len(found_soft),
    }


def extract_experiences(text: str) -> list:
    """
    Extract work experience blocks with company, role, and dates.
    Uses heuristic parsing of common resume formats.
    """
    experiences = []

    # Find experience section
    exp_section = _extract_section(text, EXPERIENCE_HEADERS)
    if not exp_section:
        exp_section = text  # fallback to full text

    # Date patterns: "Jan 2020 - Present", "2019-2022", "March 2021 – Dec 2023"
    date_pattern = r"((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\d{4}|(?:19|20)\d{2})"
    range_pattern = rf"({date_pattern})\s*[\-–—to]+\s*({date_pattern}|[Pp]resent|[Cc]urrent|[Nn]ow)"

    lines = exp_section.split("\n")
    current_exp = None

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check if line contains a date range
        date_match = re.search(range_pattern, line)
        if date_match:
            if current_exp:
                experiences.append(current_exp)

            # Try to extract company and role from the same or adjacent context
            clean_line = re.sub(range_pattern, "", line).strip(" |–—-,")
            parts = re.split(r"[|,\-–—]", clean_line, maxsplit=1)

            current_exp = {
                "company": parts[0].strip() if parts else "",
                "role": parts[1].strip() if len(parts) > 1 else "",
                "start": date_match.group(1),
                "end": date_match.group(3) if date_match.group(3) else "Present",
                "description": "",
            }
        elif current_exp:
            current_exp["description"] += " " + line

    if current_exp:
        experiences.append(current_exp)

    return experiences


def extract_education(text: str) -> list:
    """Extract education entries."""
    education = []
    edu_section = _extract_section(text, EDUCATION_HEADERS)
    if not edu_section:
        edu_section = text

    for pattern in DEGREE_PATTERNS:
        matches = re.finditer(pattern, edu_section, re.IGNORECASE)
        for match in matches:
            # Get surrounding context (the line containing the match)
            start = max(0, edu_section.rfind("\n", 0, match.start()))
            end = edu_section.find("\n", match.end())
            if end == -1:
                end = len(edu_section)
            context = edu_section[start:end].strip()
            education.append({
                "degree": match.group(),
                "context": context[:200],  # limit context length
            })

    return education


def _extract_section(text: str, header_patterns: list) -> Optional[str]:
    """Extract a section of text based on header patterns."""
    lines = text.split("\n")
    start_idx = None

    for i, line in enumerate(lines):
        for pattern in header_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                start_idx = i + 1
                break
        if start_idx:
            break

    if start_idx is None:
        return None

    # Find the end of this section (next major header)
    all_headers = EXPERIENCE_HEADERS + EDUCATION_HEADERS + [
        r"skills?", r"certifications?", r"projects?", r"awards?",
        r"publications?", r"references?", r"interests?", r"hobbies?",
    ]
    end_idx = len(lines)
    for i in range(start_idx, len(lines)):
        for pattern in all_headers:
            if re.search(r"^\s*" + pattern + r"\s*$", lines[i], re.IGNORECASE):
                end_idx = i
                break
        if end_idx != len(lines):
            break

    return "\n".join(lines[start_idx:end_idx])


def is_disposable_email(email: str) -> bool:
    """Check if an email uses a known disposable/temporary domain."""
    domain = email.split("@")[-1].lower()
    return domain in DISPOSABLE_DOMAINS


def get_email_domain(email: str) -> str:
    """Extract domain from email."""
    return email.split("@")[-1].lower() if "@" in email else ""
