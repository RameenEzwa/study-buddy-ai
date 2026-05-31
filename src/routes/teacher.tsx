import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/PortalShell";
import { useDataset } from "@/lib/dataset-hooks";
import { summary } from "@/lib/dataset";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { AlertTriangle, TrendingUp, Award, Target } from "lucide-react";

export const Route = createFileRoute("/teacher")({
  component: TeacherPage,
});

function TeacherPage() {
  return (
    <PortalShell allow="teacher" title="Teacher Dashboard">
      <TeacherBody />
    </PortalShell>
  );
}

function TeacherBody() {
  const { rows, loading, error } = useDataset();
  const stats = useMemo(() => (rows ? summary(rows) : null), [rows]);
  const atRisk = useMemo(
    () =>
      rows
        ? [...rows].filter((r) => r.Exam_Score < 60).sort((a, b) => a.Exam_Score - b.Exam_Score).slice(0, 10)
        : [],
    [rows],
  );
  const top = useMemo(
    () =>
      rows
        ? [...rows].sort((a, b) => b.Exam_Score - a.Exam_Score).slice(0, 10)
        : [],
    [rows],
  );

  // Score distribution buckets
  const dist = useMemo(() => {
    if (!rows) return [];
    const buckets = [0, 0, 0, 0, 0]; // <50, 50-59, 60-69, 70-79, 80+
    rows.forEach((r) => {
      const s = r.Exam_Score;
      if (s < 50) buckets[0]++;
      else if (s < 60) buckets[1]++;
      else if (s < 70) buckets[2]++;
      else if (s < 80) buckets[3]++;
      else buckets[4]++;
    });
    const max = Math.max(...buckets);
    const labels = ["<50", "50–59", "60–69", "70–79", "80+"];
    return buckets.map((v, i) => ({ label: labels[i], value: v, pct: (v / max) * 100 }));
  }, [rows]);

  if (loading) return <p className="text-muted-foreground">Loading analytics…</p>;
  if (error || !rows || !stats)
    return <p className="text-destructive">Failed to load dataset.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric icon={<Target className="h-5 w-5" />} label="School avg" value={`${stats.avgScore}`} />
        <Metric icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} label="At-risk students" value={`${stats.weakCount}`} />
        <Metric icon={<Award className="h-5 w-5 text-emerald-500" />} label="High performers" value={`${stats.topCount}`} />
        <Metric icon={<TrendingUp className="h-5 w-5 text-blue-500" />} label="Avg attendance" value={`${stats.avgAttendance}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dist.map((b) => (
              <div key={b.label} className="grid grid-cols-[60px_1fr_60px] items-center gap-3 text-sm">
                <span className="text-muted-foreground">{b.label}</span>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="text-right font-mono text-xs">{b.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Most at-risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StudentTable rows={atRisk} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-500" /> Top performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StudentTable rows={top} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SDG 4 · Vision 2030 / 2035 Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • <span className="text-foreground font-medium">Inclusive education:</span>{" "}
            {Math.round((1 - stats.weakCount / stats.count) * 100)}% of students meeting baseline targets.
          </p>
          <p>
            • <span className="text-foreground font-medium">Engagement:</span> average{" "}
            {stats.avgHours} weekly study hours, {stats.avgAttendance}% attendance.
          </p>
          <p>
            • <span className="text-foreground font-medium">Wellbeing:</span> average{" "}
            {stats.avgSleep} hrs of sleep — a key driver of cognitive performance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs uppercase tracking-wide">{label}</span>
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function StudentTable({ rows }: { rows: { Hours_Studied: number; Attendance: number; Exam_Score: number }[] }) {
  return (
    <table className="text-xs w-full">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-1">#</th>
          <th className="py-1">Hours</th>
          <th className="py-1">Attendance</th>
          <th className="py-1">Score</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b last:border-0">
            <td className="py-1">{i + 1}</td>
            <td className="py-1">{r.Hours_Studied}</td>
            <td className="py-1">{r.Attendance}%</td>
            <td className="py-1 font-semibold">{r.Exam_Score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
