"""Quick test script to validate the API."""
import requests
import json
import os

API = "http://localhost:8000"
DEMO_DIR = os.path.join(os.path.dirname(__file__), "..", "demo_resumes")

def test_resume(filename):
    filepath = os.path.join(DEMO_DIR, filename)
    print(f"\n{'='*60}")
    print(f"Testing: {filename}")
    print(f"{'='*60}")
    
    with open(filepath, "rb") as f:
        res = requests.post(f"{API}/validate_resume", files={"file": (filename, f)})
    
    if res.status_code == 200:
        data = res.json()
        print(f"  Name:          {data.get('name', 'N/A')}")
        print(f"  Risk Score:    {data.get('risk_score')}/100")
        print(f"  Risk Level:    {data.get('risk_level')}")
        print(f"  Alert:         {data.get('alert')}")
        print(f"  Active Sigs:   {data.get('active_signals')}/6")
        print(f"  Signals:")
        for k, v in data.get("signals", {}).items():
            print(f"    {k}: {v}")
    else:
        print(f"  ERROR: {res.status_code} - {res.text[:200]}")

if __name__ == "__main__":
    print("ResumeGuard API Test")
    print("=" * 60)
    
    # Test health
    r = requests.get(f"{API}/health")
    print(f"Health: {r.json()}")
    
    # Test all demo resumes
    for f in sorted(os.listdir(DEMO_DIR)):
        if f.endswith(".txt"):
            test_resume(f)
    
    print(f"\n{'='*60}")
    print("All tests complete!")
