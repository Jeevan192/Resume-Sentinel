"""
Deterministic Resume Diff Engine — Template & Plagiarism Detection.

Fully local, no ML involved. Uses difflib for sequence matching
and n-gram overlap for block-level similarity detection.

Pipeline:
  Step 1 — Preprocessing: normalize, lowercase, tokenize
  Step 2 — Similarity Gate: only compute diff if similarity >= DIFF_THRESHOLD
  Step 3 — Compute Differences: SequenceMatcher + n-gram overlap matrix
  Step 4 — Generate highlight spans for frontend rendering
  Optional: Template Fingerprint ID for recurring blocks
"""
import re
import string
import hashlib
import logging
from difflib import SequenceMatcher
from collections import Counter

logger = logging.getLogger(__name__)

# ── Configuration ───────────────────────────────────────
DIFF_THRESHOLD = 0.50       # Minimum similarity to trigger diff view
NGRAM_SIZE = 4              # Word n-gram size for block matching
BLOCK_MIN_WORDS = 6         # Minimum words in a matching block to report
TEMPLATE_BLOCK_MIN = 8      # Minimum words for a block to count as a template fragment


# ── Step 1: Preprocessing ───────────────────────────────

def _preprocess(text: str) -> str:
    """Normalize text: lowercase, strip punctuation, collapse whitespace."""
    text = text.lower()
    # Remove punctuation but keep spaces
    text = text.translate(str.maketrans(string.punctuation, " " * len(string.punctuation)))
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _tokenize(text: str) -> list[str]:
    """Split preprocessed text into word tokens."""
    return text.split()


def _ngrams(tokens: list[str], n: int) -> list[tuple[str, ...]]:
    """Generate n-grams from a list of tokens."""
    return [tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]


# ── Step 2: Similarity Gate ─────────────────────────────

def compute_similarity(text_a: str, text_b: str) -> float:
    """
    Compute overall text similarity using SequenceMatcher.
    Returns a float 0.0 – 1.0.
    """
    proc_a = _preprocess(text_a)
    proc_b = _preprocess(text_b)
    return SequenceMatcher(None, proc_a, proc_b).ratio()


# ── Step 3: Compute Differences ─────────────────────────

def compute_diff_blocks(text_a: str, text_b: str) -> list[dict]:
    """
    Compute matching blocks between two texts using SequenceMatcher.
    
    Returns list of dicts:
      {
        "start_a": int,  # word offset in A
        "end_a": int,
        "start_b": int,  # word offset in B
        "end_b": int,
        "text": str,     # the matching text
        "similarity": float  # 1.0 for exact matches
      }
    """
    proc_a = _preprocess(text_a)
    proc_b = _preprocess(text_b)
    tokens_a = _tokenize(proc_a)
    tokens_b = _tokenize(proc_b)

    sm = SequenceMatcher(None, tokens_a, tokens_b)
    blocks = []

    for match in sm.get_matching_blocks():
        if match.size < BLOCK_MIN_WORDS:
            continue
        block_text = " ".join(tokens_a[match.a : match.a + match.size])
        blocks.append({
            "start_a": match.a,
            "end_a": match.a + match.size,
            "start_b": match.b,
            "end_b": match.b + match.size,
            "text": block_text,
            "word_count": match.size,
            "similarity": 1.0,  # exact token match
        })

    return blocks


def compute_ngram_overlap(text_a: str, text_b: str, n: int = NGRAM_SIZE) -> dict:
    """
    Compute n-gram overlap between two texts.
    Returns overlap ratio and the shared n-grams.
    """
    tokens_a = _tokenize(_preprocess(text_a))
    tokens_b = _tokenize(_preprocess(text_b))

    if len(tokens_a) < n or len(tokens_b) < n:
        return {"overlap_ratio": 0.0, "shared_ngrams": 0, "total_a": 0, "total_b": 0}

    ngrams_a = set(_ngrams(tokens_a, n))
    ngrams_b = set(_ngrams(tokens_b, n))

    shared = ngrams_a & ngrams_b
    total = len(ngrams_a | ngrams_b) if ngrams_a or ngrams_b else 1

    return {
        "overlap_ratio": round(len(shared) / total, 4) if total > 0 else 0.0,
        "shared_ngrams": len(shared),
        "total_a": len(ngrams_a),
        "total_b": len(ngrams_b),
    }


# ── Step 4: Highlight Rendering Data ────────────────────

def generate_highlights(text_a: str, text_b: str, blocks: list[dict]) -> dict:
    """
    Generate highlight spans for frontend rendering.
    Each span has start/end character offsets in the ORIGINAL text and a color category.
    
    Color categories:
      - "exact"    (green)  : similarity == 1.0
      - "high"     (yellow) : similarity >= 0.85
      - "moderate" (orange) : similarity >= 0.6
    """
    proc_a = _preprocess(text_a)
    proc_b = _preprocess(text_b)
    tokens_a = _tokenize(proc_a)
    tokens_b = _tokenize(proc_b)

    def _token_offsets(preprocessed: str, tokens: list[str]) -> list[tuple[int, int]]:
        """Map each token to its (start, end) char offset in preprocessed text."""
        offsets = []
        pos = 0
        for tok in tokens:
            idx = preprocessed.find(tok, pos)
            if idx == -1:
                idx = pos
            offsets.append((idx, idx + len(tok)))
            pos = idx + len(tok)
        return offsets

    offsets_a = _token_offsets(proc_a, tokens_a)
    offsets_b = _token_offsets(proc_b, tokens_b)

    highlights_a = []
    highlights_b = []

    for block in blocks:
        sim = block["similarity"]
        if sim >= 1.0:
            color = "exact"
        elif sim >= 0.85:
            color = "high"
        else:
            color = "moderate"

        # Text A spans
        if block["start_a"] < len(offsets_a) and block["end_a"] - 1 < len(offsets_a):
            highlights_a.append({
                "start": offsets_a[block["start_a"]][0],
                "end": offsets_a[block["end_a"] - 1][1],
                "color": color,
                "word_count": block["word_count"],
            })

        # Text B spans
        if block["start_b"] < len(offsets_b) and block["end_b"] - 1 < len(offsets_b):
            highlights_b.append({
                "start": offsets_b[block["start_b"]][0],
                "end": offsets_b[block["end_b"] - 1][1],
                "color": color,
                "word_count": block["word_count"],
            })

    return {
        "text_a_preprocessed": proc_a,
        "text_b_preprocessed": proc_b,
        "highlights_a": highlights_a,
        "highlights_b": highlights_b,
    }


# ── Optional: Template Fingerprinting ───────────────────

def compute_template_fingerprint(text: str) -> str:
    """
    Generate a deterministic fingerprint from the largest blocks
    of a document. If multiple resumes share the same fingerprint,
    they likely used the same template.
    """
    tokens = _tokenize(_preprocess(text))
    # Use overlapping fixed-size chunks
    chunk_size = TEMPLATE_BLOCK_MIN
    if len(tokens) < chunk_size:
        return hashlib.md5(" ".join(tokens).encode()).hexdigest()[:12]

    chunks = []
    for i in range(0, len(tokens) - chunk_size + 1, chunk_size // 2):
        chunk = " ".join(tokens[i : i + chunk_size])
        chunks.append(chunk)

    # Sort chunks for order-invariance, then hash them
    chunks.sort()
    combined = "|".join(chunks)
    return hashlib.md5(combined.encode()).hexdigest()[:12]


# ── Main API Function ───────────────────────────────────

def diff_compare(text_a: str, text_b: str) -> dict:
    """
    Full deterministic diff pipeline for two texts.

    Returns:
        {
            "similarity": float,
            "above_threshold": bool,
            "diff_blocks": [...],
            "ngram_overlap": {...},
            "highlights": {...} | None,
            "fingerprint_a": str,
            "fingerprint_b": str,
            "same_template": bool,
        }
    """
    similarity = compute_similarity(text_a, text_b)
    above_threshold = similarity >= DIFF_THRESHOLD

    result = {
        "similarity": round(similarity, 4),
        "above_threshold": above_threshold,
        "diff_blocks": [],
        "ngram_overlap": compute_ngram_overlap(text_a, text_b),
        "highlights": None,
        "fingerprint_a": compute_template_fingerprint(text_a),
        "fingerprint_b": compute_template_fingerprint(text_b),
        "same_template": False,
    }

    result["same_template"] = result["fingerprint_a"] == result["fingerprint_b"]

    if above_threshold:
        blocks = compute_diff_blocks(text_a, text_b)
        result["diff_blocks"] = blocks
        result["highlights"] = generate_highlights(text_a, text_b, blocks)

    return result
