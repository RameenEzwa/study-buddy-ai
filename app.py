"""
AI Student Performance Assistant
Supports UN SDG 4: Quality Education
A menu-driven assistant that analyzes the Kaggle "Student Performance Factors"
dataset, visualizes insights, and uses machine learning to predict exam scores.
"""

import os
import sys

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, accuracy_score

DATA_FILE = "StudentPerformanceFactors.csv"


# ---------- Data Loading ----------
def load_data(path: str = DATA_FILE) -> pd.DataFrame:
    """Load the CSV dataset safely and return a cleaned DataFrame."""
    if not os.path.exists(path):
        print(f"❌ Dataset '{path}' not found. Put it next to app.py.")
        sys.exit(1)
    df = pd.read_csv(path)
    # Drop rows with missing target/feature values to keep things simple
    df = df.dropna(subset=["Hours_Studied", "Exam_Score"])
    return df


# ---------- Feature 1: Dataset Summary ----------
def show_summary(df: pd.DataFrame) -> None:
    print("\n=== Dataset Summary ===")
    print(f"Rows: {len(df)} | Columns: {len(df.columns)}")
    print("\nColumns:", ", ".join(df.columns))
    print("\nNumeric description:")
    print(df.describe().round(2))


# ---------- Feature 2: Average Scores ----------
def show_averages(df: pd.DataFrame) -> None:
    print("\n=== Average Student Scores ===")
    print(f"Average Exam Score    : {df['Exam_Score'].mean():.2f}")
    print(f"Average Previous Score: {df['Previous_Scores'].mean():.2f}")
    print(f"Average Hours Studied : {df['Hours_Studied'].mean():.2f}")
    print(f"Average Attendance %  : {df['Attendance'].mean():.2f}")


# ---------- Feature 3: Weak Students ----------
def show_weak_students(df: pd.DataFrame, threshold: int = 60) -> None:
    weak = df[df["Exam_Score"] < threshold]
    print(f"\n=== Weak Students (Exam Score < {threshold}) ===")
    print(f"Found {len(weak)} students.")
    if not weak.empty:
        print(weak[["Hours_Studied", "Attendance",
                    "Previous_Scores", "Exam_Score"]].head(10))


# ---------- Feature 4: Predict Score from Study Hours ----------
def train_regression(df: pd.DataFrame) -> LinearRegression:
    """Train a simple linear regression: hours studied -> exam score."""
    X = df[["Hours_Studied"]]
    y = df["Exam_Score"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    model = LinearRegression().fit(X_train, y_train)
    mae = mean_absolute_error(y_test, model.predict(X_test))
    print(f"(Regression model trained — MAE: {mae:.2f})")
    return model


def predict_score(model: LinearRegression) -> None:
    raw = input("Enter study hours per week (0-50): ").strip()
    try:
        hours = float(raw)
        if not 0 <= hours <= 50:
            raise ValueError
    except ValueError:
        print("⚠️  Please enter a number between 0 and 50.")
        return
    pred = float(model.predict(pd.DataFrame({"Hours_Studied": [hours]}))[0])
    pred = max(0, min(100, pred))
    print(f"📘 Predicted Exam Score for {hours} hrs/week: {pred:.2f}")


# ---------- Feature 5: Study Recommendations ----------
def study_recommendations() -> None:
    raw = input("Enter your current average exam score (0-100): ").strip()
    try:
        score = float(raw)
        if not 0 <= score <= 100:
            raise ValueError
    except ValueError:
        print("⚠️  Please enter a number between 0 and 100.")
        return

    print("\n=== Personalized Study Recommendations ===")
    if score < 50:
        tips = [
            "Increase study time to at least 20 hours/week.",
            "Attend every class — attendance strongly predicts performance.",
            "Ask teachers or tutors for help on weak topics.",
            "Sleep 7–8 hours; rested brains learn faster.",
        ]
    elif score < 75:
        tips = [
            "Aim for 25+ focused study hours per week.",
            "Practice past exam questions weekly.",
            "Form a study group for tough subjects.",
            "Balance study with light physical activity.",
        ]
    else:
        tips = [
            "Maintain your routine — consistency wins.",
            "Mentor classmates; teaching deepens mastery.",
            "Challenge yourself with advanced material.",
            "Keep a healthy study–rest balance.",
        ]
    for i, t in enumerate(tips, 1):
        print(f"  {i}. {t}")


# ---------- Feature 6: Charts ----------
def show_charts(df: pd.DataFrame) -> None:
    print("Generating charts... close each window to continue.")

    # Histogram of exam scores
    plt.figure(figsize=(8, 5))
    plt.hist(df["Exam_Score"], bins=20, color="#4F8EF7", edgecolor="white")
    plt.title("Distribution of Exam Scores")
    plt.xlabel("Exam Score")
    plt.ylabel("Number of Students")
    plt.tight_layout()
    plt.show()

    # Scatter: hours studied vs exam score
    plt.figure(figsize=(8, 5))
    plt.scatter(df["Hours_Studied"], df["Exam_Score"],
                alpha=0.4, color="#34A853")
    plt.title("Hours Studied vs Exam Score")
    plt.xlabel("Hours Studied / week")
    plt.ylabel("Exam Score")
    plt.tight_layout()
    plt.show()

    # Bar: average score by parental involvement
    if "Parental_Involvement" in df.columns:
        grouped = df.groupby("Parental_Involvement")["Exam_Score"].mean()
        plt.figure(figsize=(7, 5))
        grouped.plot(kind="bar", color="#FBBC05", edgecolor="white")
        plt.title("Average Exam Score by Parental Involvement")
        plt.ylabel("Average Exam Score")
        plt.xticks(rotation=0)
        plt.tight_layout()
        plt.show()


# ---------- Feature 7: Classify Performance Category ----------
def train_classifier(df: pd.DataFrame) -> RandomForestClassifier:
    """Random Forest classifier predicting Low / Medium / High performance."""
    def categorize(score: float) -> str:
        if score < 60:
            return "Low"
        if score < 80:
            return "Medium"
        return "High"

    data = df.copy()
    data["Category"] = data["Exam_Score"].apply(categorize)
    features = ["Hours_Studied", "Attendance",
                "Previous_Scores", "Sleep_Hours", "Tutoring_Sessions"]
    X = data[features]
    y = data["Category"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    clf = RandomForestClassifier(n_estimators=120, random_state=42)
    clf.fit(X_train, y_train)
    acc = accuracy_score(y_test, clf.predict(X_test))
    print(f"(Classifier trained — accuracy: {acc * 100:.1f}%)")
    return clf


def predict_category(clf: RandomForestClassifier) -> None:
    print("Enter the following details:")
    try:
        hours = float(input("  Hours studied per week (0-50): "))
        attendance = float(input("  Attendance % (0-100): "))
        prev = float(input("  Previous exam score (0-100): "))
        sleep = float(input("  Sleep hours per night (0-12): "))
        tutoring = float(input("  Tutoring sessions per month (0-10): "))
    except ValueError:
        print("⚠️  All inputs must be numbers.")
        return

    row = pd.DataFrame([{
        "Hours_Studied": hours,
        "Attendance": attendance,
        "Previous_Scores": prev,
        "Sleep_Hours": sleep,
        "Tutoring_Sessions": tutoring,
    }])
    category = clf.predict(row)[0]
    print(f"🎯 Predicted Performance Category: {category}")


# ---------- Menu ----------
def print_menu() -> None:
    print("\n========== AI Student Performance Assistant ==========")
    print("Supporting UN SDG 4 — Quality Education")
    print("------------------------------------------------------")
    print("1. View dataset summary")
    print("2. Show average student scores")
    print("3. Detect weak-performing students")
    print("4. Predict exam score from study hours")
    print("5. Get study recommendations")
    print("6. Show charts and graphs")
    print("7. Predict performance category (ML classifier)")
    print("0. Exit")


def main() -> None:
    df = load_data()
    regressor = train_regression(df)
    classifier = train_classifier(df)

    actions = {
        "1": lambda: show_summary(df),
        "2": lambda: show_averages(df),
        "3": lambda: show_weak_students(df),
        "4": lambda: predict_score(regressor),
        "5": study_recommendations,
        "6": lambda: show_charts(df),
        "7": lambda: predict_category(classifier),
    }

    while True:
        print_menu()
        choice = input("Choose an option: ").strip()
        if choice == "0":
            print("Goodbye — keep learning! 🎓")
            break
        action = actions.get(choice)
        if action is None:
            print("⚠️  Invalid choice. Pick a number from the menu.")
            continue
        try:
            action()
        except Exception as exc:  # noqa: BLE001
            print(f"⚠️  Something went wrong: {exc}")


if __name__ == "__main__":
    main()
