# 🎓 AI Student Performance Assistant

A professional, role-based **Streamlit** AI web application that helps
students, school administrators, and platform admins use data and machine
learning to improve learning outcomes.

## 🌍 SDG 4 — Quality Education

This project supports **UN Sustainable Development Goal 4: Quality Education**,
which aims to *"ensure inclusive and equitable quality education and promote
lifelong learning opportunities for all."*

By combining data analytics and AI, the platform helps:
- Identify students at risk of falling behind
- Recommend personalized study habits
- Surface which factors most influence success
- Empower educators with school-wide insights

## 🇸🇦 Vision 2030 & Vision 2035 Alignment

- **Vision 2030** — Builds a knowledge-based economy by giving learners
  AI-powered tools that personalize education and raise national learning
  outcomes.
- **Vision 2035** — Advances digital transformation in education through
  data-driven decision making, predictive analytics, and AI assistants for
  schools and policymakers.

## 📊 Dataset

- **Name:** Student Performance Factors
- **Source (Kaggle):** https://www.kaggle.com/datasets/lainguyn123/student-performance-factors
- **File:** `StudentPerformanceFactors.csv` (≈ 6,607 student records, 20 columns)

## 🧭 Role-Based Dashboards

The app uses a clean landing page → portal flow (no cluttered sidebar):

| Portal | For | Key Features |
| --- | --- | --- |
| 👩‍🎓 **Student Portal** | Students | AI score prediction, personalized recommendations, AI learning assistant |
| 🛠️ **Admin Portal** | Platform admins | Dataset viewer, data health checks, ML model training & metrics, system info |
| 🏫 **Teacher Portal** | Teachers / school leaders | School analytics, at-risk student detection, top/bottom performers, SDG 4 progress |

Each portal is fully isolated — selecting one only shows that role's tools.

## 🤖 AI / ML Functionality

- **Linear Regression** — predicts exam score from study hours
- **Random Forest Classifier** — categorizes performance as Low / Medium / High
- **Mock LMSYS / LM Arena wrapper** — `ai_insight()` in `app.py` shows where a
  real LLM API call would be plugged in for natural-language feedback

## 🚀 How to Run Locally

```bash
pip install -r requirements.txt
streamlit run app.py
```

Then open the URL Streamlit prints (usually http://localhost:8501).

Make sure `StudentPerformanceFactors.csv` is in the same folder as `app.py`.

## ☁️ Deployment

### Streamlit Community Cloud (recommended)
1. Push this repo to GitHub.
2. Go to https://share.streamlit.io and connect your repo.
3. Set the main file to `app.py` and deploy.

### Vercel
Streamlit runs as a long-lived Python server, so deploy it with the
[Vercel Python runtime](https://vercel.com/docs/functions/runtimes/python)
or proxy it behind a Vercel project. For the smoothest experience use
Streamlit Cloud, Hugging Face Spaces, or Render — all support `streamlit run`
out of the box.

## 📁 Project Structure

```
.
├── app.py                          # Streamlit application
├── requirements.txt                # Python dependencies
├── README.md                       # This file
└── StudentPerformanceFactors.csv   # Kaggle dataset
```

## 💡 Notes

- The first run trains the ML models and caches them via `st.cache_resource`.
- All inputs are validated; invalid entries show friendly warnings.
- The codebase is organized into small, commented functions for easy learning.
