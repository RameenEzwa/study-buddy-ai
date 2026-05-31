"""
AI Student Performance Assistant — Streamlit Edition
Supports UN SDG 4 (Quality Education) and aligns with Vision 2030 / 2035.

A clean, role-based AI educational platform with three portals:
  • Student Portal  — AI predictions & personalized recommendations
  • Admin Portal    — dataset management, ML monitoring, system analytics
  • Teacher Portal  — school analytics, at-risk students, SDG 4 reports

Dataset: Kaggle — "Student Performance Factors"
https://www.kaggle.com/datasets/lainguyn123/student-performance-factors
"""

import os
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, accuracy_score, r2_score

DATA_FILE = "StudentPerformanceFactors.csv"

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
      /* hide default streamlit chrome for a cleaner SaaS feel */
      #MainMenu {visibility: hidden;}
      footer {visibility: hidden;}

      .hero {
        text-align: center;
        padding: 3rem 1rem 2rem 1rem;
      }
      .hero h1 {
        font-size: 3rem;
        font-weight: 800;
        background: linear-gradient(90deg, #4F8EF7, #34A853);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
      }
      .hero p { font-size: 1.1rem; color: #555; max-width: 720px; margin: 0 auto;}
      .portal-card {
        background: linear-gradient(135deg, #ffffff, #f5f8ff);
        border: 1px solid #e6ecf5;
        border-radius: 16px;
        padding: 1.75rem 1.5rem;
        text-align: center;
        box-shadow: 0 4px 18px rgba(80,110,180,0.08);
        height: 100%;
      }
      .portal-card h3 { margin: 0.5rem 0 0.4rem 0; }
      .portal-card p  { color: #5a6477; min-height: 60px; }
      .pill {
        display:inline-block; padding:4px 12px; border-radius:999px;
        background:#eef3ff; color:#3056d3; font-size:0.8rem; font-weight:600;
        margin: 2px;
      }
      .section-title {
        font-size: 1.4rem; font-weight: 700; margin: 1rem 0 0.5rem 0;
      }
      .ai-insight {
        background: linear-gradient(135deg, #eef7ff, #f3fff0);
        border-left: 4px solid #4F8EF7;
        padding: 1rem 1.2rem; border-radius: 8px; margin: 0.6rem 0;
      }
    </style>
    """,
    unsafe_allow_html=True,
)


# ---------------------------------------------------------------------------
# Data loading & ML training (cached)
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
    def categorize(score: float) -> str:
        if score < 60: return "Low"
        if score < 80: return "Medium"
        return "High"

    data = df.copy()
    data["Category"] = data["Exam_Score"].apply(categorize)
    features = ["Hours_Studied", "Attendance", "Previous_Scores",
                "Sleep_Hours", "Tutoring_Sessions"]
    X = data[features]
    y = data["Category"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=120, random_state=42).fit(Xtr, ytr)
    acc = accuracy_score(yte, clf.predict(Xte))
    return clf, float(acc), features


# ---------------------------------------------------------------------------
# Mock LMSYS / LM Arena AI insight wrapper
# ---------------------------------------------------------------------------
def ai_insight(prompt: str, score: float | None = None) -> str:
    """
    Mock wrapper around an LLM API (e.g., LMSYS / LM Arena).
    In production this would call the real endpoint:

        response = requests.post(
            "https://api.lmarena.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={"model": "gpt-4o-mini",
                  "messages": [{"role": "user", "content": prompt}]},
        )
        return response.json()["choices"][0]["message"]["content"]

    For demo purposes we return deterministic, rule-based insights.
    """
    if score is None:
        return "AI assistant ready. Ask about your study plan or performance."
    if score < 50:
        return ("⚠️ The AI detects a high risk of underperformance. "
                "Prioritize attendance, build a 20+ hour weekly study schedule, "
                "and seek tutoring support on weak topics.")
    if score < 75:
        return ("📈 You're on a solid path. The AI suggests deliberate practice "
                "with past exam questions and forming a small study group "
                "to push into the high-performing band.")
    return ("🌟 Excellent trajectory! The AI recommends mentoring peers and "
            "exploring advanced material to sustain mastery.")


# ---------------------------------------------------------------------------
# Session state helpers
# ---------------------------------------------------------------------------
def init_state():
    st.session_state.setdefault("portal", None)   # None | student | admin | teacher
    st.session_state.setdefault("user", None)


def go_to(portal: str | None):
    st.session_state.portal = portal
    if portal is None:
        st.session_state.user = None


# ---------------------------------------------------------------------------
# Landing page
# ---------------------------------------------------------------------------
def landing_page():
    st.markdown(
        """
        <div class="hero">
          <h1>🎓 AI Student Performance Assistant</h1>
          <p>
            An AI-powered educational platform supporting
            <b>UN SDG 4 — Quality Education</b> and aligned with
            <b>Vision 2030</b> &amp; <b>Vision 2035</b> for a smarter,
            data-driven learning future.
          </p>
          <div style="margin-top:1rem">
            <span class="pill">SDG 4</span>
            <span class="pill">Vision 2030</span>
            <span class="pill">Vision 2035</span>
            <span class="pill">AI · Machine Learning</span>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.write("")
    c1, c2, c3 = st.columns(3, gap="large")

    with c1:
        st.markdown(
            '<div class="portal-card">'
            '<div style="font-size:2.4rem">👩‍🎓</div>'
            '<h3>Student Portal</h3>'
            '<p>Get AI-powered exam predictions and personalized study guidance.</p>'
            '</div>',
            unsafe_allow_html=True,
        )
        if st.button("Enter Student Portal", use_container_width=True, key="b_student"):
            go_to("student"); st.rerun()

    with c2:
        st.markdown(
            '<div class="portal-card">'
            '<div style="font-size:2.4rem">🛠️</div>'
            '<h3>Admin Portal</h3>'
            '<p>Manage the dataset, monitor ML models, and check system health.</p>'
            '</div>',
            unsafe_allow_html=True,
        )
        if st.button("Enter Admin Portal", use_container_width=True, key="b_admin"):
            go_to("admin"); st.rerun()

    with c3:
        st.markdown(
            '<div class="portal-card">'
            '<div style="font-size:2.4rem">🏫</div>'
            '<h3>Teacher Portal</h3>'
            '<p>Track at-risk students, school analytics, and SDG 4 progress.</p>'
            '</div>',
            unsafe_allow_html=True,
        )
        if st.button("Enter Teacher Portal", use_container_width=True, key="b_teacher"):
            go_to("teacher"); st.rerun()


# ---------------------------------------------------------------------------
# Sidebar (only inside portals)
# ---------------------------------------------------------------------------
def portal_sidebar(role_label: str):
    with st.sidebar:
        st.markdown(f"### 👤 {st.session_state.user or 'Guest'}")
        st.caption(f"Signed in to **{role_label}**")
        st.divider()
        if st.button("🏠 Back to Home", use_container_width=True):
            go_to(None); st.rerun()
        if st.button("🚪 Logout", use_container_width=True):
            go_to(None); st.rerun()
        st.divider()
        with st.expander("Help"):
            st.write("Need help? Contact your platform admin or open the README "
                     "for documentation on each portal.")


# ---------------------------------------------------------------------------
# Student Portal
# ---------------------------------------------------------------------------
def student_portal(df: pd.DataFrame):
    if not st.session_state.user:
        st.markdown("## 👩‍🎓 Student Login")
        with st.container(border=True):
            name = st.text_input("Enter your name", placeholder="e.g., Alex")
            col1, col2 = st.columns([1, 1])
            if col1.button("Sign in", type="primary", use_container_width=True):
                if name.strip():
                    st.session_state.user = name.strip()
                    st.rerun()
                else:
                    st.warning("Please enter your name.")
            if col2.button("Back", use_container_width=True):
                go_to(None); st.rerun()
        return

    portal_sidebar("Student Portal")
    st.markdown(f"## 👋 Welcome, {st.session_state.user}")
    st.caption("Your personal AI learning assistant")

    model, metrics = train_regression(df)

    tab1, tab2, tab3 = st.tabs(["🔮 Predict Score", "💡 Recommendations", "🤖 AI Assistant"])

    with tab1:
        st.markdown("#### Predict your exam score")
        hours = st.slider("Study hours per week", 0.0, 50.0, 15.0, 0.5)
        pred = float(model.predict(pd.DataFrame({"Hours_Studied": [hours]}))[0])
        pred = max(0.0, min(100.0, pred))

        c1, c2, c3 = st.columns(3)
        c1.metric("Predicted score", f"{pred:.1f} / 100")
        c2.metric("Model MAE", f"{metrics['mae']:.2f}")
        c3.metric("Model R²", f"{metrics['r2']:.2f}")

        gauge = go.Figure(go.Indicator(
            mode="gauge+number",
            value=pred,
            title={"text": "Predicted Exam Score"},
            gauge={"axis": {"range": [0, 100]},
                   "bar": {"color": "#4F8EF7"},
                   "steps": [
                       {"range": [0, 50], "color": "#ffe0e0"},
                       {"range": [50, 75], "color": "#fff4cc"},
                       {"range": [75, 100], "color": "#dff5e1"}]}))
        gauge.update_layout(height=300, margin=dict(t=40, b=10))
        st.plotly_chart(gauge, use_container_width=True)

    with tab2:
        st.markdown("#### Personalized Recommendations")
        score = st.number_input("Your current average score", 0.0, 100.0, 65.0, 1.0)
        if score < 50:
            tips = ["Study at least 20 hrs/week",
                    "Attend every class — attendance matters",
                    "Ask teachers for help on weak topics",
                    "Sleep 7–8 hours nightly"]
            level = "🚨 At Risk"
        elif score < 75:
            tips = ["Aim for 25+ focused hours weekly",
                    "Practice past exam papers",
                    "Form a small study group",
                    "Balance study with light exercise"]
            level = "📈 On Track"
        else:
            tips = ["Maintain your strong routine",
                    "Mentor a peer — teaching deepens mastery",
                    "Challenge yourself with advanced material",
                    "Keep a healthy study–rest balance"]
            level = "🌟 Excelling"

        st.metric("Performance status", level)
        for t in tips:
            st.markdown(f"- {t}")

    with tab3:
        st.markdown("#### AI Learning Assistant")
        score = st.slider("Tell the AI your current score", 0, 100, 65, key="ai_score")
        st.markdown(f'<div class="ai-insight">{ai_insight("student", score)}</div>',
                    unsafe_allow_html=True)
        st.caption("Powered by a mock LMSYS / LM Arena integration (see code comments).")


# ---------------------------------------------------------------------------
# Admin Portal
# ---------------------------------------------------------------------------
def admin_portal(df: pd.DataFrame):
    if not st.session_state.user:
        st.markdown("## 🛠️ Admin Login")
        with st.container(border=True):
            name = st.text_input("Admin username", value="admin")
            col1, col2 = st.columns(2)
            if col1.button("Sign in", type="primary", use_container_width=True):
                st.session_state.user = name.strip() or "admin"
                st.rerun()
            if col2.button("Back", use_container_width=True):
                go_to(None); st.rerun()
        return

    portal_sidebar("Admin Portal")
    st.markdown("## 🛠️ Admin Dashboard")
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
        st.markdown("#### Full Dataset Viewer")
        if st.button("🔄 Reload dataset"):
            load_data.clear()
            st.rerun()
        st.dataframe(df, use_container_width=True, height=400)
        st.markdown("#### Numeric Summary")
        st.dataframe(df.describe().round(2), use_container_width=True)

    with tab2:
        st.markdown("#### Missing Value Analysis")
        missing = df.isna().sum().reset_index()
        missing.columns = ["Column", "Missing"]
        fig = px.bar(missing, x="Column", y="Missing",
                     title="Missing values per column", color="Missing",
                     color_continuous_scale="Reds")
        st.plotly_chart(fig, use_container_width=True)
        st.success("✅ Data health check completed.")

    with tab3:
        st.markdown("#### Model Training & Metrics")
        with st.spinner("Training models..."):
            _, reg_metrics = train_regression(df)
            _, clf_acc, feats = train_classifier(df)

        c1, c2, c3 = st.columns(3)
        c1.metric("Regression MAE", f"{reg_metrics['mae']:.2f}")
        c2.metric("Regression R²", f"{reg_metrics['r2']:.2f}")
        c3.metric("Classifier accuracy", f"{clf_acc*100:.1f}%")

        st.markdown("**Classifier features:** " + ", ".join(feats))
        if st.button("🔁 Retrain models"):
            train_regression.clear(); train_classifier.clear()
            st.rerun()

    with tab4:
        st.markdown("#### Kaggle Dataset Hosting")
        st.info(
            "**Dataset:** Student Performance Factors  \n"
            "**Source:** https://www.kaggle.com/datasets/lainguyn123/student-performance-factors  \n"
            f"**Local file:** `{DATA_FILE}`"
        )
        st.markdown("#### System Stack")
        st.markdown("- Python · Streamlit · Plotly\n- pandas · NumPy · scikit-learn\n- Mock LMSYS / LM Arena API wrapper")


# ---------------------------------------------------------------------------
# Teacher Portal
# ---------------------------------------------------------------------------
def teacher_portal(df: pd.DataFrame):
    if not st.session_state.user:
        st.markdown("## 🏫 Teacher Login")
        with st.container(border=True):
            name = st.text_input("Teacher name", placeholder="e.g., Ms. Khan")
            col1, col2 = st.columns(2)
            if col1.button("Sign in", type="primary", use_container_width=True):
                if name.strip():
                    st.session_state.user = name.strip()
                    st.rerun()
                else:
                    st.warning("Please enter your name.")
            if col2.button("Back", use_container_width=True):
                go_to(None); st.rerun()
        return

    portal_sidebar("Teacher Portal")
    st.markdown(f"## 🏫 School Analytics — {st.session_state.user}")
    st.caption("High-level insights for decision makers")

    avg = df["Exam_Score"].mean()
    weak = df[df["Exam_Score"] < 60]
    top = df.nlargest(10, "Exam_Score")
    bottom = df.nsmallest(10, "Exam_Score")

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Average score", f"{avg:.1f}")
    c2.metric("At-risk students", f"{len(weak):,}")
    c3.metric("Total students", f"{len(df):,}")
    c4.metric("SDG 4 index", f"{min(100, avg*1.05):.1f}%")

    tab1, tab2, tab3 = st.tabs(["📊 Analytics", "⚠️ At-Risk", "🌍 SDG 4 Report"])

    with tab1:
        c1, c2 = st.columns(2)
        with c1:
            fig = px.histogram(df, x="Exam_Score", nbins=25,
                               title="Score Distribution", color_discrete_sequence=["#4F8EF7"])
            st.plotly_chart(fig, use_container_width=True)
        with c2:
            fig = px.scatter(df, x="Hours_Studied", y="Exam_Score",
                             trendline="ols" if False else None,
                             opacity=0.5, title="Hours Studied vs Exam Score",
                             color_discrete_sequence=["#34A853"])
            st.plotly_chart(fig, use_container_width=True)

        if "Parental_Involvement" in df.columns:
            grp = df.groupby("Parental_Involvement")["Exam_Score"].mean().reset_index()
            fig = px.bar(grp, x="Parental_Involvement", y="Exam_Score",
                         title="Average Score by Parental Involvement",
                         color="Exam_Score", color_continuous_scale="Blues")
            st.plotly_chart(fig, use_container_width=True)

    with tab2:
        st.markdown("#### ⚠️ Students Needing Support (score < 60)")
        st.dataframe(
            weak[["Hours_Studied", "Attendance", "Previous_Scores", "Exam_Score"]]
            .head(25),
            use_container_width=True,
        )
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
        st.markdown("#### 🌍 SDG 4 — Quality Education Progress")
        pct_passing = (df["Exam_Score"] >= 60).mean() * 100
        c1, c2, c3 = st.columns(3)
        c1.metric("Students passing (≥60)", f"{pct_passing:.1f}%")
        c2.metric("Avg attendance", f"{df['Attendance'].mean():.1f}%")
        c3.metric("Avg study hours", f"{df['Hours_Studied'].mean():.1f}")

        st.markdown(
            '<div class="ai-insight">'
            f"🤖 <b>AI Insight:</b> {pct_passing:.0f}% of students currently meet "
            "the SDG 4 quality-education threshold. Focused interventions on the "
            f"{len(weak)} at-risk learners could lift the school's index "
            "significantly within one term."
            "</div>",
            unsafe_allow_html=True,
        )


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
def main():
    init_state()
    df = load_data()

    if df.empty:
        st.error(
            f"Dataset `{DATA_FILE}` not found. Place it in the project root "
            "and reload the app."
        )
        return

    portal = st.session_state.portal
    if portal is None:
        landing_page()
    elif portal == "student":
        student_portal(df)
    elif portal == "admin":
        admin_portal(df)
    elif portal == "teacher":
        teacher_portal(df)


if __name__ == "__main__":
    main()
