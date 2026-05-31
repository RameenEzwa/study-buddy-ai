"""
AI Student Performance Assistant — Streamlit Edition
Supports UN SDG 4 (Quality Education) · aligned with Vision 2030 / 2035.

Secure single-entry login with role-based access control (RBAC):
  • admin   / admin123    → Admin Portal   (full system authority)
  • teacher / teacher123  → Teacher Portal (educational decision-making)
  • student / student123  → Student Portal (personal learning guidance)

Dataset: Kaggle — "Student Performance Factors"
https://www.kaggle.com/datasets/lainguyn123/student-performance-factors
"""

import os
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, accuracy_score, r2_score

DATA_FILE = "StudentPerformanceFactors.csv"

# ---------------------------------------------------------------------------
# Demo credentials (for presentation only — replace with real auth in prod)
# ---------------------------------------------------------------------------
CREDENTIALS = {
    "admin":   {"password": "admin123",   "role": "admin",   "name": "System Admin"},
    "teacher": {"password": "teacher123", "role": "teacher", "name": "Ms. Teacher"},
    "student": {"password": "student123", "role": "student", "name": "Student User"},
}

ROLE_PERMISSIONS = {
    "admin": {
        "reload_data", "view_raw_data", "data_health",
        "retrain_models", "view_model_metrics", "system_analytics",
    },
    "teacher": {
        "weak_students", "school_analytics", "sdg_report",
        "average_scores", "performance_trends",
    },
    "student": {
        "ai_prediction", "study_recommendations",
        "ai_chatbot", "personal_insights",
    },
}


def can(permission: str) -> bool:
    role = st.session_state.get("role")
    return bool(role) and permission in ROLE_PERMISSIONS.get(role, set())


# ---------------------------------------------------------------------------
# Page configuration & global styles
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="AI Student Performance Assistant",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
      #MainMenu, footer {visibility: hidden;}
      .login-hero h1 {
        font-size: 2.4rem; font-weight: 800;
        background: linear-gradient(90deg, #4F8EF7, #34A853);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
      }
      .login-hero p { color:#5a6477; }
      .pill {
        display:inline-block; padding:4px 12px; border-radius:999px;
        background:#eef3ff; color:#3056d3; font-size:0.78rem; font-weight:600;
        margin: 2px;
      }
      .ai-insight {
        background: linear-gradient(135deg, #eef7ff, #f3fff0);
        border-left: 4px solid #4F8EF7;
        padding: 1rem 1.2rem; border-radius: 8px; margin: 0.6rem 0;
      }
      .role-badge {
        display:inline-block; padding:4px 10px; border-radius:6px;
        font-size:0.75rem; font-weight:700; letter-spacing:0.5px;
      }
      .badge-admin   { background:#fde7e7; color:#b42318; }
      .badge-teacher { background:#e6f4ea; color:#1e7e34; }
      .badge-student { background:#e8f0ff; color:#1d4ed8; }
      .vision-card {
        background:#f7faff; border:1px solid #e3ebf7; border-radius:12px;
        padding:1rem 1.2rem; height:100%;
      }
    </style>
    """,
    unsafe_allow_html=True,
)


# ---------------------------------------------------------------------------
# Data loading & ML (cached)
# ---------------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def load_data(path: str = DATA_FILE) -> pd.DataFrame:
    if not os.path.exists(path):
        return pd.DataFrame()
    df = pd.read_csv(path)
    df = df.dropna(subset=["Hours_Studied", "Exam_Score"])
    return df


@st.cache_resource(show_spinner=False)
def train_regression(df: pd.DataFrame):
    X = df[["Hours_Studied"]]
    y = df["Exam_Score"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LinearRegression().fit(Xtr, ytr)
    preds = model.predict(Xte)
    return model, {
        "mae": float(mean_absolute_error(yte, preds)),
        "r2": float(r2_score(yte, preds)),
    }


@st.cache_resource(show_spinner=False)
def train_classifier(df: pd.DataFrame):
    def categorize(s): return "Low" if s < 60 else ("Medium" if s < 80 else "High")
    data = df.copy()
    data["Category"] = data["Exam_Score"].apply(categorize)
    feats = ["Hours_Studied", "Attendance", "Previous_Scores",
             "Sleep_Hours", "Tutoring_Sessions"]
    X, y = data[feats], data["Category"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=120, random_state=42).fit(Xtr, ytr)
    return clf, float(accuracy_score(yte, clf.predict(Xte))), feats


def ai_insight(score: float | None = None) -> str:
    """
    Mock wrapper around an LLM API (e.g., LMSYS / LM Arena).
    In production this would call:
        requests.post("https://api.lmarena.ai/v1/chat/completions",
                      headers={"Authorization": f"Bearer {API_KEY}"}, ...)
    """
    if score is None:
        return "AI assistant ready."
    if score < 50:
        return ("⚠️ High risk of underperformance. Prioritize attendance, build a "
                "20+ hour weekly study schedule, and seek tutoring on weak topics.")
    if score < 75:
        return ("📈 You're on a solid path. Practice past exam questions and form a "
                "small study group to break into the high-performing band.")
    return ("🌟 Excellent trajectory! Mentor peers and explore advanced material "
            "to sustain mastery.")


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
def init_state():
    st.session_state.setdefault("logged_in", False)
    st.session_state.setdefault("role", None)
    st.session_state.setdefault("username", None)
    st.session_state.setdefault("display_name", None)


def logout():
    for k in ("logged_in", "role", "username", "display_name"):
        st.session_state[k] = False if k == "logged_in" else None


def login_page():
    left, center, right = st.columns([1, 2, 1])
    with center:
        st.markdown(
            """
            <div class="login-hero" style="text-align:center; padding: 2rem 0 1rem 0;">
              <div style="font-size:3rem;">🎓</div>
              <h1>AI Student Performance Assistant</h1>
              <p>Secure sign-in to your educational AI workspace</p>
              <div>
                <span class="pill">SDG 4</span>
                <span class="pill">Vision 2030</span>
                <span class="pill">Vision 2035</span>
              </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        with st.container(border=True):
            st.markdown("### 🔐 Sign in")
            with st.form("login_form", clear_on_submit=False):
                username = st.text_input("Username", max_chars=50)
                password = st.text_input("Password", type="password", max_chars=100)
                submitted = st.form_submit_button("Sign in", type="primary",
                                                  use_container_width=True)
            if submitted:
                u = (username or "").strip().lower()
                p = (password or "").strip()
                user = CREDENTIALS.get(u)
                if user and user["password"] == p:
                    st.session_state.logged_in = True
                    st.session_state.username = u
                    st.session_state.role = user["role"]
                    st.session_state.display_name = user["name"]
                    st.success(f"Welcome, {user['name']}! Redirecting…")
                    st.rerun()
                else:
                    st.error("Invalid username or password.")


# ---------------------------------------------------------------------------
# Sidebar (post-login only)
# ---------------------------------------------------------------------------
def render_sidebar():
    role = st.session_state.role
    badge_class = f"badge-{role}"
    with st.sidebar:
        st.markdown(f"### 👤 {st.session_state.display_name}")
        st.markdown(
            f'<span class="role-badge {badge_class}">{role.upper()} ROLE</span>',
            unsafe_allow_html=True,
        )
        st.caption(f"Signed in as `{st.session_state.username}`")
        st.divider()
        if st.button("🚪 Log Out", use_container_width=True):
            logout(); st.rerun()
        st.divider()
        with st.expander("Help"):
            st.write("Each role has different permissions. Contact your "
                     "administrator if you need elevated access.")


# ---------------------------------------------------------------------------
# Student Portal — guidance-focused (no raw data, no system tools)
# ---------------------------------------------------------------------------
def student_portal(df: pd.DataFrame):
    st.markdown(
        f"## 👩‍🎓 Welcome, {st.session_state.display_name}"
    )
    st.caption("Your personal AI learning assistant — guidance, predictions, and motivation.")

    model, metrics = train_regression(df)
    tab1, tab2, tab3, tab4 = st.tabs(
        ["🔮 AI Prediction", "💡 Recommendations", "🤖 AI Chatbot", "✨ My Insights"]
    )

    with tab1:
        if not can("ai_prediction"):
            st.warning("You don't have access to this feature."); return
        st.markdown("#### Predict your exam score")
        hours = st.slider("Study hours per week", 0.0, 50.0, 15.0, 0.5)
        pred = float(model.predict(pd.DataFrame({"Hours_Studied": [hours]}))[0])
        pred = max(0.0, min(100.0, pred))
        st.metric("Predicted score", f"{pred:.1f} / 100")
        gauge = go.Figure(go.Indicator(
            mode="gauge+number", value=pred,
            gauge={"axis": {"range": [0, 100]}, "bar": {"color": "#4F8EF7"},
                   "steps": [{"range": [0, 50], "color": "#ffe0e0"},
                             {"range": [50, 75], "color": "#fff4cc"},
                             {"range": [75, 100], "color": "#dff5e1"}]}))
        gauge.update_layout(height=280, margin=dict(t=20, b=10))
        st.plotly_chart(gauge, use_container_width=True)
        st.caption("🔒 Model metrics are restricted to administrators.")

    with tab2:
        if not can("study_recommendations"):
            st.warning("You don't have access to this feature."); return
        score = st.number_input("Your current average score", 0.0, 100.0, 65.0, 1.0)
        if score < 50:
            level, tips = "🚨 At Risk", [
                "Study at least 20 hrs/week",
                "Attend every class — attendance matters",
                "Ask teachers for help on weak topics",
                "Sleep 7–8 hours nightly"]
        elif score < 75:
            level, tips = "📈 On Track", [
                "Aim for 25+ focused hours weekly",
                "Practice past exam papers",
                "Form a small study group",
                "Balance study with light exercise"]
        else:
            level, tips = "🌟 Excelling", [
                "Maintain your strong routine",
                "Mentor a peer — teaching deepens mastery",
                "Challenge yourself with advanced material",
                "Keep a healthy study–rest balance"]
        st.metric("Performance status", level)
        for t in tips: st.markdown(f"- {t}")

    with tab3:
        if not can("ai_chatbot"):
            st.warning("You don't have access to this feature."); return
        st.markdown("#### AI Learning Chatbot")
        score = st.slider("Tell the AI your current score", 0, 100, 65, key="ai_score")
        st.markdown(f'<div class="ai-insight">{ai_insight(score)}</div>',
                    unsafe_allow_html=True)
        st.caption("Powered by a mock LMSYS / LM Arena integration.")

    with tab4:
        if not can("personal_insights"):
            st.warning("You don't have access to this feature."); return
        st.markdown("#### Your Personal Motivation Dashboard")
        c1, c2, c3 = st.columns(3)
        c1.metric("Weekly goal", "25 hrs", "+5 hrs")
        c2.metric("Target score", "85", "+10")
        c3.metric("Streak", "7 days", "+1")
        st.info("💪 Keep going! Consistency beats intensity. Vision 2030 starts "
                "with one focused study session at a time.")


# ---------------------------------------------------------------------------
# Admin Portal — full system authority
# ---------------------------------------------------------------------------
def admin_portal(df: pd.DataFrame):
    st.markdown("## 🛠️ Admin Control Center")
    st.markdown(
        '<span class="role-badge badge-admin">🔒 ADMIN ACCESS ONLY</span>',
        unsafe_allow_html=True,
    )
    st.caption("System monitoring · dataset management · ML operations")

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total records", f"{len(df):,}")
    c2.metric("Features", f"{len(df.columns)}")
    c3.metric("Missing values", f"{int(df.isna().sum().sum())}")
    c4.metric("Dataset source", "Kaggle")

    tab1, tab2, tab3, tab4 = st.tabs(
        ["📦 Dataset", "🩺 Data Health", "🤖 ML Models", "ℹ️ System Info"]
    )

    with tab1:
        if not (can("view_raw_data") and can("reload_data")):
            st.error("🔒 Admin Access Only"); return
        st.markdown("#### Raw Dataframe Viewer  🔒 *Admin Access Only*")
        if st.button("🔄 Reload dataset"):
            load_data.clear(); st.rerun()
        st.dataframe(df, use_container_width=True, height=400)
        st.markdown("#### Numeric Summary")
        st.dataframe(df.describe().round(2), use_container_width=True)

    with tab2:
        if not can("data_health"):
            st.error("🔒 Admin Access Only"); return
        st.markdown("#### Missing Value Analysis  🔒 *Admin Access Only*")
        missing = df.isna().sum().reset_index()
        missing.columns = ["Column", "Missing"]
        fig = px.bar(missing, x="Column", y="Missing",
                     color="Missing", color_continuous_scale="Reds",
                     title="Missing values per column")
        st.plotly_chart(fig, use_container_width=True)
        st.success("✅ Data health check completed.")

    with tab3:
        if not (can("retrain_models") and can("view_model_metrics")):
            st.error("🔒 Admin Access Only"); return
        st.markdown("#### Model Training & Metrics  🔒 *Admin Access Only*")
        with st.spinner("Training models..."):
            _, reg = train_regression(df)
            _, acc, feats = train_classifier(df)
        c1, c2, c3 = st.columns(3)
        c1.metric("Regression MAE", f"{reg['mae']:.2f}")
        c2.metric("Regression R²", f"{reg['r2']:.2f}")
        c3.metric("Classifier accuracy", f"{acc*100:.1f}%")
        st.markdown("**Classifier features:** " + ", ".join(feats))
        if st.button("🔁 Retrain models"):
            train_regression.clear(); train_classifier.clear(); st.rerun()

    with tab4:
        if not can("system_analytics"):
            st.error("🔒 Admin Access Only"); return
        st.markdown("#### Kaggle Dataset Hosting")
        st.info(
            "**Dataset:** Student Performance Factors  \n"
            "**Source:** https://www.kaggle.com/datasets/lainguyn123/student-performance-factors  \n"
            f"**Local file:** `{DATA_FILE}`"
        )
        st.markdown("#### System Stack")
        st.markdown("- Python · Streamlit · Plotly\n"
                    "- pandas · NumPy · scikit-learn\n"
                    "- Mock LMSYS / LM Arena API wrapper")
        st.markdown("#### RBAC Status")
        st.json({role: sorted(list(perms)) for role, perms in ROLE_PERMISSIONS.items()})


# ---------------------------------------------------------------------------
# Teacher Portal — educational decision-making
# ---------------------------------------------------------------------------
def teacher_portal(df: pd.DataFrame):
    st.markdown(f"## 🏫 Teacher Dashboard — {st.session_state.display_name}")
    st.markdown(
        '<span class="role-badge badge-teacher">EDUCATIONAL MANAGEMENT</span>',
        unsafe_allow_html=True,
    )
    st.caption("High-level insights for educators and decision-makers")

    avg = df["Exam_Score"].mean()
    weak = df[df["Exam_Score"] < 60]
    top = df.nlargest(10, "Exam_Score")
    bottom = df.nsmallest(10, "Exam_Score")

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Average score", f"{avg:.1f}")
    c2.metric("At-risk students", f"{len(weak):,}")
    c3.metric("Total students", f"{len(df):,}")
    c4.metric("SDG 4 index", f"{min(100, avg*1.05):.1f}%")

    tab1, tab2, tab3, tab4 = st.tabs(
        ["📊 Analytics", "⚠️ At-Risk", "🌍 SDG 4 Report", "🎯 Vision Impact"]
    )

    with tab1:
        if not can("school_analytics"):
            st.warning("You don't have access to this feature."); return
        c1, c2 = st.columns(2)
        with c1:
            st.plotly_chart(
                px.histogram(df, x="Exam_Score", nbins=25,
                             title="Score Distribution",
                             color_discrete_sequence=["#4F8EF7"]),
                use_container_width=True)
        with c2:
            st.plotly_chart(
                px.scatter(df, x="Hours_Studied", y="Exam_Score", opacity=0.5,
                           title="Hours Studied vs Exam Score",
                           color_discrete_sequence=["#34A853"]),
                use_container_width=True)
        if "Parental_Involvement" in df.columns:
            grp = df.groupby("Parental_Involvement")["Exam_Score"].mean().reset_index()
            st.plotly_chart(
                px.bar(grp, x="Parental_Involvement", y="Exam_Score",
                       title="Average Score by Parental Involvement",
                       color="Exam_Score", color_continuous_scale="Blues"),
                use_container_width=True)
        st.caption("🔒 Raw dataset access and model retraining are admin-only.")

    with tab2:
        if not can("weak_students"):
            st.warning("You don't have access to this feature."); return
        st.markdown("#### ⚠️ Students Needing Support (score < 60)")
        st.dataframe(
            weak[["Hours_Studied", "Attendance", "Previous_Scores", "Exam_Score"]].head(25),
            use_container_width=True)
        c1, c2 = st.columns(2)
        with c1:
            st.markdown("##### 🏆 Top 10 Performers")
            st.dataframe(top[["Hours_Studied", "Attendance", "Exam_Score"]],
                         use_container_width=True)
        with c2:
            st.markdown("##### 📉 Bottom 10 Performers")
            st.dataframe(bottom[["Hours_Studied", "Attendance", "Exam_Score"]],
                         use_container_width=True)

    with tab3:
        if not can("sdg_report"):
            st.warning("You don't have access to this feature."); return
        pct_passing = (df["Exam_Score"] >= 60).mean() * 100
        c1, c2, c3 = st.columns(3)
        c1.metric("Students passing (≥60)", f"{pct_passing:.1f}%")
        c2.metric("Avg attendance", f"{df['Attendance'].mean():.1f}%")
        c3.metric("Avg study hours", f"{df['Hours_Studied'].mean():.1f}")
        st.markdown(
            f'<div class="ai-insight">🤖 <b>AI Insight:</b> {pct_passing:.0f}% of '
            "students currently meet the SDG 4 quality-education threshold. "
            f"Targeted interventions on the {len(weak)} at-risk learners could "
            "lift the school's SDG 4 index significantly within one term.</div>",
            unsafe_allow_html=True)

    with tab4:
        if not can("performance_trends"):
            st.warning("You don't have access to this feature."); return
        st.markdown("#### 🎯 How This Dashboard Powers Vision 2030 & 2035")
        c1, c2 = st.columns(2)
        with c1:
            st.markdown(
                '<div class="vision-card"><h4>🇸🇦 Vision 2030</h4>'
                "<ul>"
                f"<li><b>Knowledge economy:</b> tracking {len(df):,} learner outcomes</li>"
                "<li><b>AI-assisted learning:</b> predictive model deployed in Student Portal</li>"
                f"<li><b>Workforce capability:</b> {pct_passing:.0f}% of students meeting proficiency</li>"
                "</ul></div>",
                unsafe_allow_html=True)
        with c2:
            st.markdown(
                '<div class="vision-card"><h4>🚀 Vision 2035</h4>'
                "<ul>"
                "<li><b>AI quality assurance:</b> Random Forest classifier monitors performance bands</li>"
                f"<li><b>Predictive analytics:</b> {len(weak)} at-risk students flagged for early support</li>"
                "<li><b>Equitable support:</b> personalized AI recommendations for every learner</li>"
                "<li><b>Digital transformation:</b> dataset-driven decisions replace guesswork</li>"
                "</ul></div>",
                unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
def main():
    init_state()

    if not st.session_state.logged_in:
        login_page()
        return

    df = load_data()
    if df.empty:
        render_sidebar()
        st.error(f"Dataset `{DATA_FILE}` not found. Place it in the project root.")
        return

    render_sidebar()
    role = st.session_state.role
    if role == "student":
        student_portal(df)
    elif role == "admin":
        admin_portal(df)
    elif role == "teacher":
        teacher_portal(df)
    else:
        st.error("Unknown role."); logout()


if __name__ == "__main__":
    main()
