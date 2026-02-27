"""
Custom CSS for premium dark-theme ResumeGuard dashboard.
Glassmorphism, gradients, and micro-animations.
"""

CUSTOM_CSS = """
<style>
    /* ─── Root Variables ──────────────────────────────── */
    :root {
        --bg-primary: #0f0f1a;
        --bg-secondary: #1a1a2e;
        --bg-card: rgba(30, 30, 50, 0.8);
        --bg-glass: rgba(255, 255, 255, 0.05);
        --border-glass: rgba(255, 255, 255, 0.1);
        --accent-blue: #4fc3f7;
        --accent-purple: #bb86fc;
        --accent-green: #66bb6a;
        --accent-red: #ef5350;
        --accent-orange: #ffa726;
        --accent-yellow: #ffee58;
        --text-primary: #e0e0e0;
        --text-secondary: #9e9e9e;
        --gradient-1: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        --gradient-2: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        --gradient-danger: linear-gradient(135deg, #ff512f 0%, #dd2476 100%);
        --gradient-safe: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }

    /* ─── Main App Styling ────────────────────────────── */
    .stApp {
        background: var(--bg-primary);
        color: var(--text-primary);
    }
    
    .main .block-container {
        max-width: 1200px;
        padding-top: 2rem;
    }

    /* ─── Glass Card ──────────────────────────────────── */
    .glass-card {
        background: var(--bg-glass);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid var(--border-glass);
        border-radius: 16px;
        padding: 1.5rem;
        margin: 0.5rem 0;
        transition: all 0.3s ease;
    }
    .glass-card:hover {
        border-color: var(--accent-blue);
        box-shadow: 0 8px 32px rgba(79, 195, 247, 0.15);
        transform: translateY(-2px);
    }

    /* ─── Risk Score Gauge ─────────────────────────────── */
    .risk-gauge {
        text-align: center;
        padding: 2rem;
        border-radius: 20px;
        background: var(--bg-glass);
        backdrop-filter: blur(20px);
        border: 1px solid var(--border-glass);
    }
    .risk-score-number {
        font-size: 4.5rem;
        font-weight: 800;
        letter-spacing: -2px;
        line-height: 1;
        margin: 0.5rem 0;
        background: var(--gradient-1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .risk-score-number.critical {
        background: var(--gradient-danger);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .risk-score-number.safe {
        background: var(--gradient-safe);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .risk-label {
        font-size: 1.1rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-top: 0.5rem;
    }

    /* ─── Signal Cards ────────────────────────────────── */
    .signal-card {
        background: var(--bg-glass);
        backdrop-filter: blur(12px);
        border: 1px solid var(--border-glass);
        border-radius: 12px;
        padding: 1.2rem;
        text-align: center;
        transition: all 0.3s ease;
    }
    .signal-card:hover {
        transform: scale(1.03);
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .signal-icon {
        font-size: 2rem;
        margin-bottom: 0.3rem;
    }
    .signal-name {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-bottom: 0.3rem;
    }
    .signal-score {
        font-size: 1.8rem;
        font-weight: 700;
    }

    /* ─── Header Styling ──────────────────────────────── */
    .main-header {
        text-align: center;
        padding: 1rem 0 2rem 0;
    }
    .main-header h1 {
        font-size: 2.5rem;
        font-weight: 800;
        background: var(--gradient-1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }
    .main-header p {
        color: var(--text-secondary);
        font-size: 1rem;
    }

    /* ─── Alert Boxes ─────────────────────────────────── */
    .alert-critical {
        background: linear-gradient(135deg, rgba(239,83,80,0.15) 0%, rgba(221,36,118,0.15) 100%);
        border: 1px solid rgba(239,83,80,0.4);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin: 1rem 0;
    }
    .alert-safe {
        background: linear-gradient(135deg, rgba(102,187,106,0.15) 0%, rgba(56,239,125,0.15) 100%);
        border: 1px solid rgba(102,187,106,0.4);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin: 1rem 0;
    }
    .alert-warning {
        background: linear-gradient(135deg, rgba(255,167,38,0.15) 0%, rgba(255,238,88,0.15) 100%);
        border: 1px solid rgba(255,167,38,0.4);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin: 1rem 0;
    }

    /* ─── Stat Pill ────────────────────────────────────── */
    .stat-pill {
        display: inline-block;
        padding: 0.3rem 0.8rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        margin: 0.2rem;
    }
    .pill-red { background: rgba(239,83,80,0.2); color: #ef5350; }
    .pill-orange { background: rgba(255,167,38,0.2); color: #ffa726; }
    .pill-yellow { background: rgba(255,238,88,0.2); color: #ffee58; }
    .pill-green { background: rgba(102,187,106,0.2); color: #66bb6a; }

    /* ─── Progress Bar ────────────────────────────────── */
    .progress-bar-bg {
        background: rgba(255,255,255,0.08);
        border-radius: 8px;
        height: 10px;
        overflow: hidden;
        margin: 0.3rem 0;
    }
    .progress-bar-fill {
        height: 100%;
        border-radius: 8px;
        transition: width 0.8s ease;
    }

    /* ─── Animations ──────────────────────────────────── */
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
    }
    .animate-in {
        animation: fadeInUp 0.5s ease forwards;
    }
    .pulse {
        animation: pulse 2s infinite;
    }

    /* ─── Streamlit Overrides ─────────────────────────── */
    .stMetric {
        background: var(--bg-glass);
        border: 1px solid var(--border-glass);
        border-radius: 12px;
        padding: 1rem;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        background: var(--bg-glass);
        border: 1px solid var(--border-glass);
        border-radius: 8px;
        padding: 0.5rem 1rem;
        color: var(--text-primary);
    }
    .stTabs [aria-selected="true"] {
        background: var(--gradient-1);
        border: none;
    }
    div[data-testid="stFileUploader"] {
        background: var(--bg-glass);
        border: 2px dashed var(--border-glass);
        border-radius: 16px;
        padding: 1rem;
    }
    
    /* Hide Streamlit default elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    .stDeployButton {visibility: hidden;}
</style>
"""


def inject_css():
    """Inject custom CSS into Streamlit page."""
    import streamlit as st
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)
