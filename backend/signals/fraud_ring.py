# backend/signals/fraud_ring.py
"""Fraud Ring Graph Generation

This module builds a simple undirected graph of resumes based on shared contact information
(emails, phone numbers, and optionally shared skills). Nodes represent individual resumes
and edges represent a connection when two resumes share at least `min_shared` pieces of
contact data.

The graph is serialised to a JSON-friendly format for the frontend visualisation.
"""
import networkx as nx
from typing import List, Dict, Any

def build_fraud_graph(resumes: List[Dict[str, Any]], min_shared: int = 2) -> Dict[str, List[Dict[str, Any]]]:
    """Construct a fraud‑ring graph.

    Args:
        resumes: List of resume dictionaries as stored in `resume_store["resumes"]`.
        min_shared: Minimum number of shared contact items (email/phone) to create an edge.

    Returns:
        A dict with two keys: ``nodes`` and ``edges``. ``nodes`` is a list of dicts with
        ``id``, ``label`` (candidate name), and ``risk_level``. ``edges`` is a list of
        dicts with ``source`` and ``target`` node ids.
    """
    G = nx.Graph()
    for idx, r in enumerate(resumes):
        node_id = idx
        label = r.get("name") or r.get("candidate_name") or f"Resume {idx+1}"
        risk = r.get("risk_level", "UNKNOWN").lower()
        G.add_node(node_id, label=label, risk_level=risk)
    for i in range(len(resumes)):
        for j in range(i + 1, len(resumes)):
            shared = 0
            emails_i = set(resumes[i].get("emails", []))
            emails_j = set(resumes[j].get("emails", []))
            shared += len(emails_i & emails_j)
            phones_i = set(resumes[i].get("phones", []))
            phones_j = set(resumes[j].get("phones", []))
            shared += len(phones_i & phones_j)
            skills_i = set(resumes[i].get("skills", {}).get("technical", []))
            skills_j = set(resumes[j].get("skills", {}).get("technical", []))
            shared += len(skills_i & skills_j)
            if shared >= min_shared:
                G.add_edge(i, j, weight=shared)
    nodes = [{"id": n, "label": data.get("label"), "risk_level": data.get("risk_level")} for n, data in G.nodes(data=True)]
    edges = [{"source": src, "target": tgt, "weight": data.get("weight", 1)} for src, tgt, data in G.edges(data=True)]
    return {"nodes": nodes, "edges": edges}
