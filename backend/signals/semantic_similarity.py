"""
Signal 5: Semantic Similarity Detection
Uses sentence-transformers (MiniLM) to compute cosine similarity
between resume embeddings. Detects resumes that are semantically
similar even if wording differs.
"""
import numpy as np
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Lazy-loaded model
_model = None


def _get_model():
    """Lazy-load the sentence transformer model."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading sentence-transformers model (all-MiniLM-L6-v2)...")
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return None
    return _model


def get_embedding(text: str) -> Optional[np.ndarray]:
    """Get the embedding vector for a text string."""
    model = _get_model()
    if model is None:
        return None
    try:
        # Truncate to model's max length (256 tokens ≈ 1500 chars for safety)
        truncated = text[:3000]
        embedding = model.encode(truncated, normalize_embeddings=True)
        return embedding
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return None


def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    if vec1 is None or vec2 is None:
        return 0.0
    dot = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot / (norm1 * norm2))


def check_semantic_similarity(
    resume_text: str,
    known_resumes: list = None,
    similarity_threshold: float = 0.85
) -> dict:
    """
    Check semantic similarity of current resume against known resumes.
    
    Args:
        resume_text: full text of current resume
        known_resumes: list of dicts with 'text', 'filename', 'embedding' keys
        similarity_threshold: threshold above which resumes are flagged (0-1)
    
    Returns:
        dict with score (0-35), matches, and severity
    """
    result = {
        "signal_name": "semantic_similarity",
        "score": 0,
        "max_similarity": 0.0,
        "similar_resumes": [],
        "details": [],
        "severity": "NONE",
        "explanation": "",
        "embedding": None,  # Store for future comparisons
    }

    if not resume_text or len(resume_text.strip()) < 50:
        result["explanation"] = "Resume text too short for semantic analysis."
        return result

    # Generate embedding for current resume
    current_embedding = get_embedding(resume_text)
    if current_embedding is None:
        result["explanation"] = "Could not generate embedding — model not available."
        return result

    result["embedding"] = current_embedding.tolist()

    if not known_resumes:
        result["explanation"] = "No comparison resumes available. Embedding stored for future checks."
        return result

    # Compare against all known resumes
    max_sim = 0.0
    score = 0

    for known in known_resumes:
        known_emb = known.get("embedding")
        if known_emb is None:
            known_emb = get_embedding(known.get("text", ""))

        if known_emb is None:
            continue

        if isinstance(known_emb, list):
            known_emb = np.array(known_emb)

        sim = cosine_similarity(current_embedding, known_emb)
        max_sim = max(max_sim, sim)

        if sim >= similarity_threshold:
            result["similar_resumes"].append({
                "filename": known.get("filename", "Unknown"),
                "similarity": round(sim * 100, 1),
            })
            result["details"].append(
                f"Resume is {sim*100:.1f}% similar to '{known.get('filename', 'Unknown')}'"
            )

    result["max_similarity"] = round(max_sim * 100, 1)

    # Scoring based on similarity levels
    if max_sim >= 0.95:
        score = 35  # Near-identical
    elif max_sim >= 0.90:
        score = 28
    elif max_sim >= 0.85:
        score = 20
    elif max_sim >= 0.80:
        score = 12
    elif max_sim >= 0.75:
        score = 5

    result["score"] = min(score, 35)

    # Severity
    if result["score"] >= 28:
        result["severity"] = "CRITICAL"
        result["explanation"] = f"Resume is {max_sim*100:.1f}% semantically similar to another submission — near-duplicate detected!"
    elif result["score"] >= 20:
        result["severity"] = "HIGH"
        result["explanation"] = f"High semantic similarity ({max_sim*100:.1f}%) detected with another submission."
    elif result["score"] >= 10:
        result["severity"] = "MEDIUM"
        result["explanation"] = f"Moderate similarity ({max_sim*100:.1f}%) with another submission — could indicate shared templates."
    elif result["score"] > 0:
        result["severity"] = "LOW"
        result["explanation"] = f"Slight similarity ({max_sim*100:.1f}%) detected — likely coincidental."
    else:
        result["explanation"] = "No significant semantic similarity with other submissions."

    return result
