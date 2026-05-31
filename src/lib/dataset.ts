// Dataset utilities: load CSV, parse rows, compute stats, train a simple
// linear regression model for predicting Exam_Score from Hours_Studied,
// Attendance, Previous_Scores, Sleep_Hours, and Tutoring_Sessions.

export interface StudentRow {
  Hours_Studied: number;
  Attendance: number;
  Sleep_Hours: number;
  Previous_Scores: number;
  Tutoring_Sessions: number;
  Exam_Score: number;
  Parental_Involvement: string;
  Access_to_Resources: string;
  Motivation_Level: string;
  Teacher_Quality: string;
  School_Type: string;
  Gender: string;
}

function parseCSV(text: string): StudentRow[] {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  const idx = (name: string) => headers.indexOf(name);
  const out: StudentRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < headers.length) continue;
    const num = (n: string) => {
      const v = parseFloat(parts[idx(n)]);
      return Number.isFinite(v) ? v : NaN;
    };
    const row: StudentRow = {
      Hours_Studied: num("Hours_Studied"),
      Attendance: num("Attendance"),
      Sleep_Hours: num("Sleep_Hours"),
      Previous_Scores: num("Previous_Scores"),
      Tutoring_Sessions: num("Tutoring_Sessions"),
      Exam_Score: num("Exam_Score"),
      Parental_Involvement: parts[idx("Parental_Involvement")] ?? "",
      Access_to_Resources: parts[idx("Access_to_Resources")] ?? "",
      Motivation_Level: parts[idx("Motivation_Level")] ?? "",
      Teacher_Quality: parts[idx("Teacher_Quality")] ?? "",
      School_Type: parts[idx("School_Type")] ?? "",
      Gender: parts[idx("Gender")] ?? "",
    };
    if (
      Number.isFinite(row.Exam_Score) &&
      Number.isFinite(row.Hours_Studied) &&
      Number.isFinite(row.Attendance)
    ) {
      out.push(row);
    }
  }
  return out;
}

let cache: StudentRow[] | null = null;
export async function loadDataset(): Promise<StudentRow[]> {
  if (cache) return cache;
  const res = await fetch("/StudentPerformanceFactors.csv");
  const text = await res.text();
  cache = parseCSV(text);
  return cache;
}

// ---- Stats helpers ----
export function mean(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
export function summary(rows: StudentRow[]) {
  const scores = rows.map((r) => r.Exam_Score);
  const sorted = [...scores].sort((a, b) => a - b);
  return {
    count: rows.length,
    avgScore: +mean(scores).toFixed(2),
    minScore: sorted[0] ?? 0,
    maxScore: sorted[sorted.length - 1] ?? 0,
    avgHours: +mean(rows.map((r) => r.Hours_Studied)).toFixed(2),
    avgAttendance: +mean(rows.map((r) => r.Attendance)).toFixed(2),
    avgSleep: +mean(rows.map((r) => r.Sleep_Hours)).toFixed(2),
    weakCount: rows.filter((r) => r.Exam_Score < 60).length,
    topCount: rows.filter((r) => r.Exam_Score >= 80).length,
  };
}

// ---- Multivariate linear regression via normal equations ----
// Features: [1, Hours_Studied, Attendance, Previous_Scores, Sleep_Hours, Tutoring_Sessions]
export interface Model {
  weights: number[];
  r2: number;
}

function mulMatVec(A: number[][], v: number[]): number[] {
  return A.map((row) => row.reduce((s, x, i) => s + x * v[i], 0));
}
function transpose(A: number[][]): number[][] {
  return A[0].map((_, i) => A.map((r) => r[i]));
}
function matMul(A: number[][], B: number[][]): number[][] {
  const Bt = transpose(B);
  return A.map((row) => Bt.map((col) => row.reduce((s, x, i) => s + x * col[i], 0)));
}
function inverse(M: number[][]): number[][] {
  const n = M.length;
  const A = M.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < n; i++) {
    let pivot = A[i][i];
    let swap = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(pivot)) {
        pivot = A[k][i];
        swap = k;
      }
    }
    if (swap !== i) [A[i], A[swap]] = [A[swap], A[i]];
    pivot = A[i][i];
    if (Math.abs(pivot) < 1e-10) throw new Error("Singular matrix");
    for (let j = 0; j < 2 * n; j++) A[i][j] /= pivot;
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const f = A[k][i];
      for (let j = 0; j < 2 * n; j++) A[k][j] -= f * A[i][j];
    }
  }
  return A.map((row) => row.slice(n));
}

export function trainModel(rows: StudentRow[]): Model {
  const X = rows.map((r) => [
    1,
    r.Hours_Studied,
    r.Attendance,
    r.Previous_Scores,
    r.Sleep_Hours,
    r.Tutoring_Sessions,
  ]);
  const y = rows.map((r) => r.Exam_Score);
  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  const XtXInv = inverse(XtX);
  const Xty = mulMatVec(Xt, y);
  const weights = mulMatVec(XtXInv, Xty);
  const preds = X.map((row) => row.reduce((s, x, i) => s + x * weights[i], 0));
  const yMean = mean(y);
  const ssTot = y.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = y.reduce((s, v, i) => s + (v - preds[i]) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  return { weights, r2 };
}

export function predict(model: Model, features: {
  hours: number;
  attendance: number;
  previous: number;
  sleep: number;
  tutoring: number;
}) {
  const x = [1, features.hours, features.attendance, features.previous, features.sleep, features.tutoring];
  const score = x.reduce((s, v, i) => s + v * model.weights[i], 0);
  return Math.max(0, Math.min(100, score));
}

export function recommendations(score: number, hours: number, attendance: number): string[] {
  const tips: string[] = [];
  if (score < 60) {
    tips.push("Focus on fundamentals — schedule daily 1-hour review sessions.");
    tips.push("Request tutoring support from your teacher this week.");
  } else if (score < 75) {
    tips.push("You're on track — add 1–2 weekly practice tests to push higher.");
    tips.push("Form a study group to reinforce weak topics.");
  } else {
    tips.push("Excellent! Maintain consistency and mentor a peer.");
    tips.push("Try advanced/enrichment material to stretch further.");
  }
  if (hours < 10) tips.push("Increase weekly study hours to at least 12–15.");
  if (attendance < 80) tips.push("Improve attendance — aim for 90%+ for measurable gains.");
  return tips;
}
