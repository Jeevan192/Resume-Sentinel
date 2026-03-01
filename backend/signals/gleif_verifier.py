"""
Signal 8: GLEIF Company Verifier — Deterministic LEI validation.

Verifies companies mentioned in resume experience sections against the
GLEIF (Global Legal Entity Identifier Foundation) public API.
Uses CORS-compatible, fully deterministic HTTP lookups — no ML involved.

Pipeline:
  1. Extract company names from experience entities
  2. Normalize each name (strip suffixes like Inc, LLC, Ltd, etc.)
  3. Query GLEIF Fuzzy-Search API for matching Legal Entities
  4. Score based on how many companies are verifiable vs. unverifiable
"""
import re
import logging
import httpx

logger = logging.getLogger(__name__)

GLEIF_SEARCH_URL = "https://api.gleif.org/api/v1/fuzzycompletions"
GLEIF_AUTOCOMPLETE_URL = "https://api.gleif.org/api/v1/autocompletions"

# Common suffixes to strip for cleaner matching
COMPANY_SUFFIXES = re.compile(
    r"\b(?:Inc\.?|LLC|Ltd\.?|Corp\.?|Corporation|Company|Co\.?|PLC|GmbH|AG|SA|SAS|S\.?A\.?|"
    r"Pvt\.?\s*Ltd\.?|Private\s+Limited|Limited|LLP|LP|Pty\.?|NV|BV|SE|KG|OHG)\s*$",
    re.IGNORECASE,
)

# Minimum company name length to bother querying
MIN_NAME_LENGTH = 3
# Maximum companies to check (avoid API hammering)
MAX_COMPANIES = 8
# HTTP timeout per request (seconds)
REQUEST_TIMEOUT = 6


def _normalize_company_name(name: str) -> str:
    """Strip legal suffixes, extra whitespace, and common noise."""
    name = name.strip()
    name = COMPANY_SUFFIXES.sub("", name).strip()
    # Remove trailing punctuation
    name = re.sub(r"[,.\-;:]+$", "", name).strip()
    return name


def _query_gleif(name: str) -> dict:
    """
    Query GLEIF fuzzy-completions API for a company name.
    Returns {"found": bool, "entity_name": str|None, "lei": str|None, "jurisdiction": str|None}.
    """
    result = {
        "query": name,
        "found": False,
        "entity_name": None,
        "lei": None,
        "jurisdiction": None,
        "match_score": 0.0,
        "error": None,
    }

    if not name or len(name) < MIN_NAME_LENGTH:
        result["error"] = "Name too short"
        return result

    try:
        # Use the fuzzy completions endpoint
        resp = httpx.get(
            GLEIF_SEARCH_URL,
            params={"field": "fulltext", "q": name},
            timeout=REQUEST_TIMEOUT,
            headers={"Accept": "application/json"},
        )
        if resp.status_code == 200:
            data = resp.json()
            completions = data.get("data", [])
            if completions:
                # Best match is the first result
                top = completions[0]
                relationships = top.get("relationships", {})
                lei_records = relationships.get("lei-records", {})
                lei_data = lei_records.get("data", {}) if isinstance(lei_records, dict) else {}
                lei_id = lei_data.get("id") if isinstance(lei_data, dict) else None

                entity_name = top.get("attributes", {}).get("value", "")
                result["found"] = True
                result["entity_name"] = entity_name
                result["lei"] = lei_id

                # Compute simple similarity between query and result
                name_lower = name.lower()
                entity_lower = entity_name.lower()
                if name_lower == entity_lower:
                    result["match_score"] = 1.0
                elif name_lower in entity_lower or entity_lower in name_lower:
                    result["match_score"] = 0.85
                else:
                    # Token overlap
                    tokens_q = set(name_lower.split())
                    tokens_e = set(entity_lower.split())
                    if tokens_q and tokens_e:
                        overlap = len(tokens_q & tokens_e) / max(len(tokens_q), len(tokens_e))
                        result["match_score"] = round(overlap, 2)
                    else:
                        result["match_score"] = 0.3

                return result

        # Fallback: try autocomplete endpoint
        resp2 = httpx.get(
            GLEIF_AUTOCOMPLETE_URL,
            params={"field": "fulltext", "q": name},
            timeout=REQUEST_TIMEOUT,
            headers={"Accept": "application/json"},
        )
        if resp2.status_code == 200:
            data2 = resp2.json()
            completions2 = data2.get("data", [])
            if completions2:
                top2 = completions2[0]
                entity_name = top2.get("attributes", {}).get("value", "")
                result["found"] = True
                result["entity_name"] = entity_name
                result["match_score"] = 0.6  # Lower confidence for autocomplete-only
                return result

    except httpx.TimeoutException:
        result["error"] = "GLEIF API timeout"
        logger.warning(f"GLEIF timeout for '{name}'")
    except Exception as e:
        result["error"] = str(e)
        logger.error(f"GLEIF query error for '{name}': {e}")

    return result


def verify_companies_gleif(experiences: list) -> dict:
    """
    Main signal function: verify companies from experience entities against GLEIF.

    Args:
        experiences: list of experience dicts with "company" key
    
    Returns:
        Signal result dict with score, severity, explanation, verified_companies
    """
    companies = []
    seen = set()
    for exp in experiences:
        raw = exp.get("company", "").strip()
        if not raw:
            continue
        normalized = _normalize_company_name(raw)
        if normalized.lower() in seen or len(normalized) < MIN_NAME_LENGTH:
            continue
        seen.add(normalized.lower())
        companies.append({"raw": raw, "normalized": normalized})

    if not companies:
        return {
            "score": 0,
            "severity": "NONE",
            "explanation": "No company names found in experience section to verify.",
            "verified_companies": [],
            "total_companies": 0,
            "verified_count": 0,
            "unverified_count": 0,
        }

    # Limit to MAX_COMPANIES
    companies = companies[:MAX_COMPANIES]

    verified = []
    unverified = []

    for c in companies:
        result = _query_gleif(c["normalized"])
        entry = {
            "resume_company": c["raw"],
            "normalized_query": c["normalized"],
            "gleif_found": result["found"],
            "gleif_entity": result.get("entity_name"),
            "lei": result.get("lei"),
            "match_score": result.get("match_score", 0),
            "error": result.get("error"),
        }
        if result["found"] and result.get("match_score", 0) >= 0.3:
            verified.append(entry)
        else:
            unverified.append(entry)

    total = len(companies)
    verified_count = len(verified)
    unverified_count = len(unverified)
    verify_ratio = verified_count / total if total > 0 else 0

    # Scoring: higher score = more risk (more unverified companies)
    # 0 unverified → 0 score (clean)
    # All unverified → max score 25
    max_score = 25
    if total == 0:
        score = 0
    else:
        score = round((1 - verify_ratio) * max_score, 1)

    # Severity
    if score >= 20:
        severity = "HIGH"
    elif score >= 12:
        severity = "MEDIUM"
    elif score >= 5:
        severity = "LOW"
    else:
        severity = "NONE"

    # Explanation
    if unverified_count == 0:
        explanation = f"All {verified_count} companies verified in GLEIF registry. Entities appear legitimate."
    elif verified_count == 0:
        explanation = (
            f"None of the {total} companies could be verified in the GLEIF global registry. "
            f"This may indicate fabricated employment history or very small/informal employers."
        )
    else:
        explanation = (
            f"{verified_count}/{total} companies verified in GLEIF registry. "
            f"{unverified_count} company(ies) could not be found: "
            f"{', '.join(u['resume_company'] for u in unverified)}."
        )

    return {
        "score": score,
        "severity": severity,
        "explanation": explanation,
        "verified_companies": verified + unverified,
        "total_companies": total,
        "verified_count": verified_count,
        "unverified_count": unverified_count,
    }
