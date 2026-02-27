# 🛡️ ResumeGuard — AI-Based Resume Fraud Detection Engine

> **HackWith AI 2025** | Hybrid Architecture: Python + Java Spring Boot  
> Real-time resume fraud detection with 6 AI-powered signals, graph-based fraud ring detection, and explainable AI.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Streamlit Frontend (:8501)                    │
│   Upload │ Dashboard │ Fraud Graph │ Batch Analysis     │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│          Python FastAPI Service (:8000)                  │
│  PDF/DOCX Parser │ NLP Extraction │ ML Signals │ Scorer │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│         Java Spring Boot Service (:8080)                │
│  Rule Engine │ Fraud Ring Graph │ Audit Log │ H2 DB     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 6 Fraud Detection Signals

| # | Signal | What It Detects | Max Score |
|---|--------|----------------|-----------|
| 1 | **Timeline Overlap** | Overlapping employment dates | 40 |
| 2 | **Email Validation** | Disposable/fake emails, duplicates | 20 |
| 3 | **Phone Dedup** | Fake patterns, cross-resume duplicates | 15 |
| 4 | **JD Plagiarism** | Copy-paste job descriptions (SHA-256 + n-gram) | 30 |
| 5 | **Semantic Similarity** | Near-duplicate resumes (MiniLM embeddings) | 35 |
| 6 | **Skills Mismatch** | Fresher claiming senior skills, skill inflation | 20 |

**Composite Score**: Weighted aggregation → 0-100 risk score with compound multiplier.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Java 17+ (for Spring Boot service)
- Maven (for Spring Boot service)

### Option 1: Start All Services (Windows)
```bash
start_all.bat
```

### Option 2: Start Individually

**1. Python Backend (required for demo)**
```bash
cd backend
pip install -r requirements.txt
python main.py
# API running at http://localhost:8000
# Docs at http://localhost:8000/docs
```

**2. Streamlit Frontend (required for demo)**
```bash
cd frontend
pip install -r requirements.txt
streamlit run app.py --server.port 8501
# Dashboard at http://localhost:8501
```

**3. Spring Boot Service (optional, for persistence + fraud graph)**
```bash
cd spring-boot-service
mvnw spring-boot:run
# Service at http://localhost:8080
# H2 Console at http://localhost:8080/h2-console
```

---

## 🎯 Demo Flow

### For Hackathon Eval:
1. Start Python backend + Streamlit frontend
2. Open `http://localhost:8501`
3. Upload `demo_resumes/resume_a_clean.txt` → ✅ Low risk score
4. Upload `demo_resumes/resume_b_suspicious.txt` → 🟡 Medium risk (timeline overlap + disposable email)
5. Upload `demo_resumes/resume_c_high_risk.txt` → 🔴 High risk (plagiarism + duplicate contact)
6. Upload `demo_resumes/resume_e_ultra_fraud.txt` → 🚨 Critical (ALL signals fire)
7. Use **Batch Analysis** to upload all 5 at once → shows distribution
8. Use **Compare** to compare Resume B vs C → high similarity + shared contact

---

## 📂 Project Structure

```
klh_hackAI/
├── backend/                    # Python FastAPI ML/NLP Service
│   ├── main.py                 # FastAPI app (6 endpoints)
│   ├── requirements.txt
│   ├── parsers/
│   │   ├── pdf_parser.py       # Robust PDF extraction
│   │   └── docx_parser.py      # DOCX extraction
│   ├── extractors/
│   │   └── entity_extractor.py # Name/email/phone/skills/experience extraction
│   ├── signals/
│   │   ├── timeline_overlap.py # Signal 1: Date overlap detection
│   │   ├── email_validator.py  # Signal 2: Disposable email detection
│   │   ├── phone_dedup.py      # Signal 3: Phone deduplication
│   │   ├── jd_plagiarism.py    # Signal 4: JD hash collision
│   │   ├── semantic_similarity.py # Signal 5: MiniLM embeddings
│   │   └── skills_mismatch.py  # Signal 6: Skills-experience mismatch
│   └── scoring/
│       ├── risk_engine.py      # Weighted scoring engine
│       └── explainer.py        # AI explanation generator
│
├── frontend/                   # Streamlit Dashboard
│   ├── app.py                  # 4-page dashboard
│   ├── styles.py               # Premium dark theme CSS
│   └── requirements.txt
│
├── spring-boot-service/        # Java Spring Boot Service
│   ├── pom.xml
│   └── src/main/java/com/resumeguard/
│       ├── ResumeGuardApplication.java
│       ├── model/              # JPA Entities (Resume, FraudSignal, AuditLog, FraudLink)
│       ├── repository/         # Spring Data JPA Repositories
│       ├── service/            # RuleEngine, FraudRingService
│       ├── controller/         # REST Controllers
│       └── config/             # CORS Config
│
├── demo_resumes/               # 5 seed resumes for demo
│   ├── resume_a_clean.txt
│   ├── resume_b_suspicious.txt
│   ├── resume_c_high_risk.txt
│   ├── resume_d_clean_fresher.txt
│   └── resume_e_ultra_fraud.txt
│
├── start_all.bat               # Windows startup script
├── start_all.sh                # Linux/Mac startup script
└── README.md
```

---

## 🎨 What Makes This Unique

1. **Hybrid Architecture** — Python for ML/NLP + Java Spring Boot for enterprise business logic
2. **6-Signal Pipeline** — Not just one check, but 6 independent fraud signals with weighted scoring
3. **Graph-Based Fraud Ring Detection** — Union-Find algorithm detects clusters of connected fraudulent resumes
4. **Explainable AI** — Every score comes with a detailed, human-readable explanation
5. **Multi-Layer Plagiarism Detection** — SHA-256 exact match + n-gram fingerprinting + sentence-level collision
6. **Compound Risk Multiplier** — Multiple firing signals amplify the risk score (compound fraud)
7. **Premium Dashboard** — Glassmorphism dark theme with animated gauges, radar charts, and signal cards
8. **Batch + Comparison Modes** — Analyze many resumes at once or compare two side-by-side

---

## 🔧 API Endpoints

### Python FastAPI (:8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/validate_resume` | Analyze single resume |
| POST | `/batch_validate` | Batch analyze multiple resumes |
| POST | `/compare_resumes` | Compare two resumes |
| GET | `/health` | Health check |
| GET | `/history` | Analysis history |
| GET | `/stats` | System statistics |

### Spring Boot (:8080)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resumes/store` | Store analysis result |
| GET | `/api/resumes` | Get all resumes |
| GET | `/api/resumes/{id}` | Get resume + signals + audit |
| GET | `/api/resumes/high-risk` | Get high-risk resumes |
| GET | `/api/resumes/stats` | System statistics |
| GET | `/api/fraud-graph` | Fraud network graph |

---

## 👥 Team

Built with ❤️ for HackWith AI 2025