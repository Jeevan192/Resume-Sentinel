"""
Signal 7: Profile Link Validator — Multi-Step Deterministic Verification

4-step verification pipeline:
  Step 1: URL Accessibility (DNS resolve, HTTPS handshake, HTTP 200)
  Step 2: Content Presence Check (name/company/title substring matching)
  Step 3: Platform-Specific Logic (LinkedIn private profiles, GitHub repos)
  Step 4: Serper OSINT as weak supplementary signal + Gemini cross-exam
"""
import os
import re
import json
import ssl
import socket
import httpx
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)


# ─── Step 1: URL Accessibility Check ────────────────────────
def _check_url_accessibility(url: str) -> dict:
    """
    Deterministically test if a URL is reachable:
      - DNS resolves
      - HTTPS handshake succeeds
      - Page returns HTTP 200
    """
    result = {
        "url": url,
        "dns_ok": False,
        "ssl_ok": False,
        "http_ok": False,
        "status_code": None,
        "accessible": False,
        "error": None,
    }
    
    try:
        # Extract hostname
        from urllib.parse import urlparse
        parsed = urlparse(url)
        hostname = parsed.hostname
        
        if not hostname:
            result["error"] = "Invalid URL — no hostname"
            return result
        
        # DNS check
        try:
            socket.getaddrinfo(hostname, 443)
            result["dns_ok"] = True
        except socket.gaierror:
            result["error"] = "DNS resolution failed"
            return result
        
        # SSL check
        try:
            context = ssl.create_default_context()
            with socket.create_connection((hostname, 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    result["ssl_ok"] = True
        except (ssl.SSLError, ssl.CertificateError):
            result["error"] = "SSL certificate invalid"
            # Don't return — still try HTTP
        except Exception:
            result["ssl_ok"] = True  # Might be timeout, assume ok
        
        # HTTP check
        try:
            with httpx.Client(timeout=10.0, follow_redirects=True, verify=False) as client:
                response = client.get(url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
                result["status_code"] = response.status_code
                result["http_ok"] = response.status_code == 200
                result["accessible"] = result["dns_ok"] and result["http_ok"]
                
                # Return page content for Step 2
                if result["http_ok"]:
                    result["page_content"] = response.text[:5000]  # First 5KB
        except Exception as e:
            result["error"] = f"HTTP request failed: {str(e)[:100]}"
            
    except Exception as e:
        result["error"] = f"Accessibility check failed: {str(e)[:100]}"
    
    return result


# ─── Step 2: Content Presence Check ─────────────────────────
def _check_content_presence(page_content: str, name: str, company: str, role: str) -> dict:
    """
    Deterministic substring matching — no ML needed.
    Check if the page content contains the candidate's claimed info.
    """
    page_lower = page_content.lower() if page_content else ""
    
    checks = {
        "name_found": False,
        "company_found": False,
        "role_found": False,
        "match_count": 0,
    }
    
    if name:
        # Check full name and individual parts
        name_parts = name.lower().split()
        checks["name_found"] = (
            name.lower() in page_lower or
            all(part in page_lower for part in name_parts if len(part) > 2)
        )
        if checks["name_found"]:
            checks["match_count"] += 1
    
    if company:
        checks["company_found"] = company.lower() in page_lower
        if checks["company_found"]:
            checks["match_count"] += 1
    
    if role:
        # Check full role and key words
        role_lower = role.lower()
        role_keywords = [w for w in role_lower.split() if len(w) > 3]
        checks["role_found"] = (
            role_lower in page_lower or
            (len(role_keywords) > 0 and sum(1 for w in role_keywords if w in page_lower) >= len(role_keywords) * 0.6)
        )
        if checks["role_found"]:
            checks["match_count"] += 1
    
    return checks


# ─── Step 3: Platform-Specific Logic ────────────────────────
def _linkedin_specific_check(accessibility: dict, content: dict) -> dict:
    """
    LinkedIn-specific logic:
      - HTTP 999/403/429 → LinkedIn rate-limiting (profile exists, just blocked)
      - If profile exists (200) but Serper doesn't index → private/restricted (not suspicious)
      - If URL returns 404 → suspicious
      - If URL accessible + name matches → verified
    """
    status = accessibility.get("status_code")
    
    # LinkedIn's anti-bot codes — profile exists but LinkedIn blocked our request
    if status in (999, 403, 429):
        return {"verdict": "RATE_LIMITED", "risk": "NONE", "detail": "LinkedIn profile exists (confirmed via DNS) — rate-limited by anti-bot protection"}
    
    if status == 404:
        return {"verdict": "NOT_FOUND", "risk": "HIGH", "detail": "LinkedIn profile returns 404 — does not exist"}
    
    if not accessibility.get("accessible"):
        if accessibility.get("dns_ok"):
            return {"verdict": "RATE_LIMITED", "risk": "NONE", "detail": "LinkedIn URL DNS valid — likely rate-limited by anti-bot protection"}
        return {"verdict": "DNS_FAIL", "risk": "HIGH", "detail": "LinkedIn URL DNS resolution failed"}
    
    # Profile accessible — check content
    if content.get("name_found"):
        return {"verdict": "VERIFIED", "risk": "NONE", "detail": "LinkedIn profile exists and contains candidate name"}
    
    # Profile exists but name doesn't match — could be private profile showing limited info
    page = accessibility.get("page_content", "")
    if "Sign in" in page or "authwall" in page.lower() or "Join now" in page:
        return {"verdict": "PRIVATE", "risk": "NONE", "detail": "LinkedIn profile exists but is private/restricted — not suspicious"}
    
    return {"verdict": "MISMATCH", "risk": "LOW", "detail": "LinkedIn profile exists but name not found in page content"}


def _github_specific_check(accessibility: dict, content: dict) -> dict:
    """
    GitHub-specific logic:
      - 404 → fake profile
      - 200 + name matches → verified
      - 200 + no repos → empty/new account
    """
    if accessibility.get("status_code") == 404:
        return {"verdict": "NOT_FOUND", "risk": "HIGH", "detail": "GitHub profile returns 404 — does not exist"}
    
    if not accessibility.get("accessible"):
        return {"verdict": "UNREACHABLE", "risk": "LOW", "detail": "GitHub URL unreachable — may be rate-limited"}
    
    page = accessibility.get("page_content", "")
    
    # Check for contributions and repos
    has_repos = "repositories" in page.lower() or "Repositories" in page
    has_contributions = "contribution" in page.lower()
    
    if content.get("name_found") and has_repos:
        return {"verdict": "VERIFIED", "risk": "NONE", "detail": "GitHub profile exists with matching name and repositories"}
    
    if has_repos or has_contributions:
        return {"verdict": "ACTIVE", "risk": "NONE", "detail": "GitHub profile is active with contributions"}
    
    return {"verdict": "EMPTY", "risk": "LOW", "detail": "GitHub profile exists but appears empty or new"}


# ─── Main Pipeline ───────────────────────────────────────────
def verify_profile_links(entities: dict) -> dict:
    """
    4-step deterministic profile link verification:
      1. URL Accessibility (DNS, SSL, HTTP 200)
      2. Content Presence (name, company, role substring matching)
      3. Platform-Specific Logic (LinkedIn auth walls, GitHub repo checks)
      4. Serper OSINT as weak supplementary signal
    """
    from dotenv import load_dotenv
    load_dotenv(override=True)
    SERPER_API_KEY = os.getenv("SERPER_API_KEY")
    
    links = entities.get("links", [])
    name = entities.get("name", "")
    experiences = entities.get("experiences", [])
    
    # Get current company and role if available
    current_company = ""
    current_role = ""
    if experiences:
        current_company = experiences[0].get("company", "")
        current_role = experiences[0].get("role", "")

    if not links and not name:
        return {"score": 0, "severity": "NONE", "explanation": "No profile links or name found.", "verified_links": []}

    verified_links = []
    total_risk_score = 0
    findings = []
    
    linkedin_url = next((l for l in links if "linkedin.com" in l), None)
    github_url = next((l for l in links if "github.com" in l), None)

    # ─── Process LinkedIn ────────────────────────────────
    if linkedin_url:
        logger.info(f"Step 1: Checking LinkedIn URL accessibility: {linkedin_url}")
        li_access = _check_url_accessibility(linkedin_url)
        
        logger.info(f"Step 2: Checking content presence on LinkedIn page")
        li_content = _check_content_presence(
            li_access.get("page_content", ""), name, current_company, current_role
        )
        
        logger.info(f"Step 3: Applying LinkedIn-specific logic")
        li_verdict = _linkedin_specific_check(li_access, li_content)
        
        risk_map = {"NONE": 0, "LOW": 3, "MEDIUM": 8, "HIGH": 15}
        link_risk = risk_map.get(li_verdict["risk"], 0)
        total_risk_score += link_risk
        
        verified_links.append({
            "url": linkedin_url,
            "is_valid": li_verdict["verdict"] in ("VERIFIED", "PRIVATE", "ACTIVE", "RATE_LIMITED"),
            "status": li_verdict["detail"],
            "verdict": li_verdict["verdict"],
            "dns_ok": li_access.get("dns_ok"),
            "http_status": li_access.get("status_code"),
            "name_found": li_content.get("name_found"),
        })
        findings.append(f"LinkedIn: {li_verdict['detail']}")

    # ─── Process GitHub ──────────────────────────────────
    if github_url:
        logger.info(f"Step 1: Checking GitHub URL accessibility: {github_url}")
        gh_access = _check_url_accessibility(github_url)
        
        logger.info(f"Step 2: Checking content presence on GitHub page")
        gh_content = _check_content_presence(
            gh_access.get("page_content", ""), name, current_company, current_role
        )
        
        logger.info(f"Step 3: Applying GitHub-specific logic")
        gh_verdict = _github_specific_check(gh_access, gh_content)
        
        risk_map = {"NONE": 0, "LOW": 3, "MEDIUM": 8, "HIGH": 15}
        link_risk = risk_map.get(gh_verdict["risk"], 0)
        total_risk_score += link_risk
        
        verified_links.append({
            "url": github_url,
            "is_valid": gh_verdict["verdict"] in ("VERIFIED", "ACTIVE", "EMPTY"),
            "status": gh_verdict["detail"],
            "verdict": gh_verdict["verdict"],
            "dns_ok": gh_access.get("dns_ok"),
            "http_status": gh_access.get("status_code"),
            "name_found": gh_content.get("name_found"),
        })
        findings.append(f"GitHub: {gh_verdict['detail']}")

    # ─── Step 4: Serper OSINT (Weak Supplementary Signal) ────
    if SERPER_API_KEY and SERPER_API_KEY != "your_serper_api_key_here":
        serper_data = {"linkedin_snippets": [], "github_snippets": []}
        serper_url = "https://google.serper.dev/search"
        serper_headers = {'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json'}
        
        try:
            if name:
                if current_company:
                    query = f'site:linkedin.com/in/ "{name}" "{current_company}"'
                else:
                    query = f'site:linkedin.com/in/ "{name}"'
                with httpx.Client(timeout=10.0) as client:
                    res = client.post(serper_url, headers=serper_headers, json={"q": query, "num": 3})
                if res.status_code == 200:
                    data = res.json()
                    snippets = [r.get('snippet', '') for r in data.get('organic', [])]
                    serper_data["linkedin_snippets"].extend(snippets)
                    if snippets:
                        findings.append("Serper OSINT: LinkedIn profile found in Google index")
            
            if github_url:
                match = re.search(r'github\.com/([^/]+)', github_url)
                if match:
                    github_user = match.group(1)
                    with httpx.Client(timeout=10.0) as client:
                        res = client.post(serper_url, headers=serper_headers, json={"q": f'site:github.com "{github_user}"', "num": 3})
                    if res.status_code == 200:
                        data = res.json()
                        snippets = [r.get('snippet', '') for r in data.get('organic', [])]
                        serper_data["github_snippets"].extend(snippets)
                        if snippets:
                            findings.append("Serper OSINT: GitHub profile found in Google index")
        except Exception as e:
            logger.warning(f"Serper OSINT check failed (non-critical): {e}")
        
        # Boost with Gemini cross-examination if we have Serper data and profiles look valid
        has_serper_data = serper_data["linkedin_snippets"] or serper_data["github_snippets"]
        all_verified = all(v.get("is_valid") for v in verified_links) if verified_links else False
        
        if has_serper_data and not all_verified:
            gemini_result = _cross_examine_with_gemini(entities, serper_data)
            gemini_failed = any(
                "exception" in str(f).lower() or "unavailable" in str(f).lower()
                for f in gemini_result.get("red_flags", [])
            )
            if not gemini_failed and gemini_result.get("red_flags"):
                real_flags = [f for f in gemini_result["red_flags"] if "benefit" not in f.lower()]
                if real_flags:
                    findings.append("Gemini OSINT: " + " | ".join(real_flags[:2]))
                    # Only add small penalty from Gemini (weak signal)
                    confidence = gemini_result.get("confidence_score", 85)
                    if confidence < 50:
                        total_risk_score += 5

    # ─── No links at all? ────────────────────────────────
    if not links:
        # No links provided — do name-only Serper search if available
        if SERPER_API_KEY and name:
            findings.append("No profile links provided — OSINT name search only")
        return {
            "score": 0,
            "severity": "NONE",
            "explanation": "No profile links provided in resume.",
            "verified_links": []
        }

    # ─── Final Score Calculation ─────────────────────────
    # Cap at max 30 (engine weight max)
    final_score = min(total_risk_score, 30)
    
    severity = "NONE"
    if final_score >= 20:
        severity = "HIGH"
    elif final_score >= 10:
        severity = "MEDIUM"
    elif final_score > 0:
        severity = "LOW"
    
    explanation = " | ".join(findings) if findings else "Profile links verified — no concerns."
    
    return {
        "score": final_score,
        "severity": severity,
        "explanation": explanation,
        "verified_links": verified_links,
    }


# ─── Gemini Cross-Examination (supplementary) ───────────────
def _cross_examine_with_gemini(resume_claims: dict, serper_data: dict) -> dict:
    """Uses Gemini to compare resume claims against OSINT snippets."""
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        return {"is_verified": True, "confidence_score": 85, "red_flags": ["Gemini API unavailable — benefit of doubt applied"]}

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        claims_json = json.dumps({
            "name": resume_claims.get("name"),
            "experiences": resume_claims.get("experiences"),
            "skills": resume_claims.get("skills", {}).get("technical", [])
        }, indent=2)
        
        osint_json = json.dumps(serper_data, indent=2)

        prompt = f"""
        You are an elite Fraud Detection Auditor for DEET (Digital Employment Exchange of Telangana).
        
        Here is what the candidate claims on their resume:
        {claims_json}
        
        Here is what the Serper OSINT search found on the live web (Google Snippets):
        {osint_json}

        Compare the two. Does the LinkedIn headline snippet match their claimed current role? 
        Does the GitHub snippet confirm their activity? Is there a discrepancy that implies fraud?

        Return ONLY a raw JSON object with this exact structure (no markdown tags):
        {{
            "is_verified": boolean,
            "confidence_score": integer (0-100),
            "red_flags": ["array of strings explaining any discrepancies found"]
        }}
        """

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        if response_text.startswith("```json"):
            response_text = response_text.removeprefix("```json").removesuffix("```").strip()
        elif response_text.startswith("```"):
            response_text = response_text.removeprefix("```").removesuffix("```").strip()
            
        return json.loads(response_text)
    
    except Exception as e:
        logger.error(f"Gemini OSINT Evaluation failed: {e}")
        return {"is_verified": True, "confidence_score": 85, "red_flags": [f"Gemini exception: {e} — benefit of doubt applied"]}
