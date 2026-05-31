# AI Student Performance Assistant 🎓

A beginner-friendly, menu-driven Python AI assistant that analyzes student
performance data and provides predictions and recommendations to help improve
learning outcomes.

## 🌍 SDG 4 — Quality Education

This project supports the United Nations **Sustainable Development Goal 4:
Quality Education**, which aims to *"ensure inclusive and equitable quality
education and promote lifelong learning opportunities for all."*

By using data and machine learning, the assistant helps:
- Identify students who may be falling behind
- Recommend personalized study habits
- Show which factors (study hours, attendance, parental involvement, etc.)
  most influence success
- Empower students, teachers, and parents to make data-informed decisions

## 📊 Dataset

- **Name:** Student Performance Factors
- **Source (Kaggle):** https://www.kaggle.com/datasets/lainguyn123/student-performance-factors
- **File:** `StudentPerformanceFactors.csv` (included)
- **Records:** ~6,600 students, 20 columns including study hours, attendance,
  sleep, parental involvement, motivation, and exam scores.

## ✨ Features

1. **View dataset summary** — rows, columns, and statistics
2. **Show average student scores** — exam, previous, hours, attendance
3. **Detect weak-performing students** — students below a score threshold
4. **Predict exam score** from study hours (Linear Regression)
5. **Personalized study recommendations** based on current score
6. **Charts & graphs** — score distribution, study vs score, parental impact
7. **Predict performance category** — Low / Medium / High (Random Forest)

## 🛠 Tech Stack

- Python 3.9+
- pandas, numpy — data analysis
- matplotlib — visualization
- scikit-learn — machine learning

## 🚀 How to Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Make sure StudentPerformanceFactors.csv is in the same folder as app.py

# 3. Run the assistant
python app.py
```

Then pick options from the menu (0 to exit).

## 📁 Project Structure

```
.
├── app.py                          # Main assistant program
├── requirements.txt                # Python dependencies
├── README.md                       # This file
└── StudentPerformanceFactors.csv   # Kaggle dataset
```

## 💡 Notes

- All inputs are validated — invalid entries show a friendly warning.
- The code is organized into small, commented functions for easy learning.
- Models are trained automatically when the app starts.
