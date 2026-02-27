"""
Signal 4: JD Plagiarism Detection
Uses SHA-256 hashing of text blocks to detect copy-paste job descriptions
between resumes. Also uses n-gram fingerprinting for partial matches.
"""
import hashlib
import re
from collections import Counter
import logging

logger = logging.getLogger(__name__)


def normalize_text_block(text: str) -> str:
    """Normalize text for comparison: lowercase, remove extra whitespace, strip punctuation."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def hash_text_block(text: str) -> str:
    """Generate SHA-256 hash of normalized text."""
    normalized = normalize_text_block(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def get_ngrams(text: str, n: int = 4) -> list:
    """Generate word-level n-grams from text."""
    words = normalize_text_block(text).split()
    if len(words) < n:
        return [" ".join(words)]
    return [" ".join(words[i:i+n]) for i in range(len(words) - n + 1)]


def get_text_fingerprint(text: str) -> dict:
    """
    Generate a fingerprint for a text block using multiple hash methods.
    """
    normalized = normalize_text_block(text)
    words = normalized.split()

    return {
        "full_hash": hashlib.sha256(normalized.encode()).hexdigest(),
        "word_count": len(words),
        "ngram_hashes": set(hashlib.md5(ng.encode()).hexdigest() for ng in get_ngrams(normalized, 4)),
        "sentence_hashes": set(
            hashlib.sha256(normalize_text_block(s).encode()).hexdigest()
            for s in re.split(r"[.!?\n]", text) if len(s.strip()) > 20
        ),
    }


def check_jd_plagiarism(experiences: list, known_experiences: list = None) -> dict:
    """
    Detect job description plagiarism between current and known resumes.
    
    Args:
        experiences: list of experience dicts from current resume
        known_experiences: list of experience dicts from other resumes in DB
    
    Returns:
        dict with score (0-30), collision details, and severity
    """
    if known_experiences is None:
        known_experiences = []

    result = {
        "signal_name": "jd_plagiarism",
        "score": 0,
        "exact_matches": 0,
        "partial_matches": 0,
        "details": [],
        "severity": "NONE",
        "explanation": "",
        "hashes": [],  # Store hashes for future comparison
    }

    if not experiences:
        result["explanation"] = "No experience entries to check for plagiarism."
        return result

    # Generate fingerprints for current resume's experiences
    current_fingerprints = []
    for exp in experiences:
        desc = exp.get("description", "")
        if len(desc.strip()) < 30:
            continue
        fp = get_text_fingerprint(desc)
        fp["company"] = exp.get("company", "Unknown")
        fp["role"] = exp.get("role", "")
        current_fingerprints.append(fp)
        result["hashes"].append(fp["full_hash"])

    if not current_fingerprints:
        result["explanation"] = "Job descriptions too short for plagiarism analysis."
        return result

    if not known_experiences:
        result["explanation"] = "No comparison data available yet. Fingerprints stored for future checks."
        return result

    # Generate fingerprints for known experiences
    known_fingerprints = []
    for exp in known_experiences:
        desc = exp.get("description", "")
        if len(desc.strip()) < 30:
            continue
        fp = get_text_fingerprint(desc)
        fp["company"] = exp.get("company", "Unknown")
        fp["source_resume"] = exp.get("source_resume", "Unknown")
        known_fingerprints.append(fp)

    # Check for exact matches (full hash collision)
    score = 0
    for cfp in current_fingerprints:
        for kfp in known_fingerprints:
            if cfp["full_hash"] == kfp["full_hash"]:
                result["exact_matches"] += 1
                result["details"].append({
                    "type": "EXACT_MATCH",
                    "current_company": cfp["company"],
                    "matched_company": kfp["company"],
                    "source": kfp.get("source_resume", "Unknown"),
                })
                score += 20
            else:
                # Check partial match via n-gram overlap
                common = cfp["ngram_hashes"] & kfp["ngram_hashes"]
                total = cfp["ngram_hashes"] | kfp["ngram_hashes"]
                if total:
                    similarity = len(common) / len(total)
                    if similarity > 0.5:
                        result["partial_matches"] += 1
                        result["details"].append({
                            "type": "PARTIAL_MATCH",
                            "similarity": round(similarity * 100, 1),
                            "current_company": cfp["company"],
                            "matched_company": kfp["company"],
                        })
                        score += int(similarity * 15)

                # Check sentence-level collisions
                common_sentences = cfp["sentence_hashes"] & kfp["sentence_hashes"]
                if len(common_sentences) >= 2:
                    result["details"].append({
                        "type": "SENTENCE_COLLISION",
                        "matching_sentences": len(common_sentences),
                        "current_company": cfp["company"],
                        "matched_company": kfp["company"],
                    })
                    score += len(common_sentences) * 5

    result["score"] = min(score, 30)

    # Severity
    if result["exact_matches"] > 0:
        result["severity"] = "CRITICAL"
        result["explanation"] = f"Found {result['exact_matches']} exact job description match(es) with other submissions. This strongly indicates copy-paste fraud."
    elif result["partial_matches"] > 0:
        result["severity"] = "HIGH"
        result["explanation"] = f"Found {result['partial_matches']} partially matching job description(s). Significant text overlap detected."
    elif result["score"] > 0:
        result["severity"] = "MEDIUM"
        result["explanation"] = "Some sentence-level similarities found with other submissions."
    else:
        result["explanation"] = "No plagiarism detected in job descriptions."

    return result
