"""
Custom CSS for Resume Sentinel dashboard — Landing page theme.
Gold/orange accent, near-black backgrounds, glassmorphism, micro-animations.
Matches the Next.js landing page design system.
"""

CUSTOM_CSS = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

    /* ─── Root Variables (Landing Theme) ──────────── */
    :root {
        --bg-primary: #030304;
        --bg-secondary: #0F1115;
        --bg-card: rgba(15, 17, 21, 0.85);
        --bg-glass: rgba(26, 29, 36, 0.6);
        --border-glass: rgba(30, 41, 59, 0.7);
        --border-active: rgba(252, 194, 0, 0.4);
        --accent-gold: #FCC200;
        --accent-orange: #EA580C;
        --accent-bright-gold: #FFD600;
        --accent-green: #22c55e;
        --accent-red: #ef4444;
        --accent-orange-light: #f97316;
        --accent-yellow: #eab308;
        --accent-blue: #3b82f6;
        --text-primary: #ffffff;
        --text-secondary: #94A3B8;
        --text-dim: #71717a;
        --gradient-gold: linear-gradient(135deg, #EA580C 0%, #FCC200 50%, #FFD600 100%);
        --gradient-orange: linear-gradient(135deg, #EA580C 0%, #FCC200 100%);
        --gradient-danger: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        --gradient-safe: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
        --muted: #1E293B;
    }

    /* ─── Main App Styling ────────────────────────── */
    .stApp {
        background: var(--bg-primary);
        color: var(--text-primary);
        font-family: 'Inter', system-ui, sans-serif;
    }

    .main .block-container {
        max-width: 1200px;
        padding-top: 2rem;
    }

    /* ─── Glass Card ──────────────────────────────── */
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
        border-color: var(--accent-gold);
        box-shadow: 0 8px 32px rgba(252, 194, 0, 0.1);
        transform: translateY(-2px);
    }

    /* ─── Risk Score Gauge ─────────────────────────── */
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
        font-family: 'Space Grotesk', system-ui, sans-serif;
        background: var(--gradient-gold);
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
        font-family: 'JetBrains Mono', monospace;
    }

    /* ─── Signal Cards ────────────────────────────── */
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
        border-color: var(--accent-gold);
        box-shadow: 0 4px 20px rgba(252, 194, 0, 0.08);
    }
    .signal-icon {
        font-size: 2rem;
        margin-bottom: 0.3rem;
    }
    .signal-name {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-bottom: 0.3rem;
        font-family: 'JetBrains Mono', monospace;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .signal-score {
        font-size: 1.8rem;
        font-weight: 700;
        font-family: 'Space Grotesk', system-ui, sans-serif;
    }

    /* ─── Header Styling ──────────────────────────── */
    .main-header {
        text-align: center;
        padding: 1rem 0 2rem 0;
    }
    .main-header h1 {
        font-size: 2.5rem;
        font-weight: 800;
        font-family: 'Space Grotesk', system-ui, sans-serif;
        background: var(--gradient-gold);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }
    .main-header p {
        color: var(--text-secondary);
        font-size: 1rem;
    }

    /* ─── Alert Boxes ─────────────────────────────── */
    .alert-critical {
        background: linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.12) 100%);
        border: 1px solid rgba(239,68,68,0.35);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin: 1rem 0;
    }
    .alert-safe {
        background: linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(22,163,74,0.12) 100%);
        border: 1px solid rgba(34,197,94,0.35);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin: 1rem 0;
    }
    .alert-warning {
        background: linear-gradient(135deg, rgba(252,194,0,0.1) 0%, rgba(234,88,12,0.1) 100%);
        border: 1px solid rgba(252,194,0,0.35);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin: 1rem 0;
    }

    /* ─── Stat Pill ────────────────────────────────── */
    .stat-pill {
        display: inline-block;
        padding: 0.3rem 0.8rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        margin: 0.2rem;
        font-family: 'JetBrains Mono', monospace;
    }
    .pill-red { background: rgba(239,68,68,0.15); color: #ef4444; }
    .pill-orange { background: rgba(249,115,22,0.15); color: #f97316; }
    .pill-yellow { background: rgba(252,194,0,0.15); color: #FCC200; }
    .pill-green { background: rgba(34,197,94,0.15); color: #22c55e; }

    /* ─── Progress Bar ────────────────────────────── */
    .progress-bar-bg {
        background: rgba(30, 41, 59, 0.5);
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

    /* ─── Animations ──────────────────────────────── */
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
        background: var(--gradient-gold);
        border: none;
    }
    div[data-testid="stFileUploader"] {
        background: var(--bg-glass);
        border: 2px dashed var(--border-glass);
        border-radius: 16px;
        padding: 1rem;
    }
    div[data-testid="stFileUploader"]:hover {
        border-color: var(--accent-gold);
    }

    /* ─── Sidebar ──────────────────────────────────── */
    section[data-testid="stSidebar"] {
        background: var(--bg-secondary) !important;
        border-right: 1px solid var(--border-glass) !important;
    }
    section[data-testid="stSidebar"] .stRadio label {
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 0.85rem !important;
    }

    /* ─── Subheader (gold accent) ─────────────────── */
    .stSubheader, h2, h3 {
        font-family: 'Space Grotesk', system-ui, sans-serif !important;
    }

    /* ─── Divider ──────────────────────────────────── */
    hr {
        border-color: var(--border-glass) !important;
    }

    /* ─── Gold glow on interactive elements ────────── */
    .stButton > button[kind="primary"] {
        background: var(--gradient-gold) !important;
        border: none !important;
        color: #000 !important;
        font-weight: 700 !important;
        font-family: 'Space Grotesk', system-ui, sans-serif !important;
    }
    .stButton > button[kind="primary"]:hover {
        box-shadow: 0 4px 16px rgba(252, 194, 0, 0.25) !important;
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
