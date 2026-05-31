import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/PortalShell";
import { useDataset } from "@/lib/dataset-hooks";
import { summary } from "@/lib/dataset";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { RefreshCw, Database, Activity } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  return (
    <PortalShell allow="admin" title="Admin Dashboard">
      <AdminBody />
    </PortalShell>
  );
}

function AdminBody() {
  const { rows, model, loading, error } = useDataset();
  const [reloadKey, setReloadKey] = useState(0);
  const stats = useMemo(() => (rows ? summary(rows) : null), [rows]);

  if (loading) return <p className="text-muted-foreground">Loading dataset…</p>;
  if (error || !rows || !model || !stats)
    return <p className="text-destructive">Failed to load dataset.</p>;

  const featureNames = [
    "Intercept",
    "Hours_Studied",
    "Attendance",
    "Previous_Scores",
    "Sleep_Hours",
    "Tutoring_Sessions",
  ];

  return (
    <div className="space-y-6" key={reloadKey}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total students" value={stats.count.toLocaleString()} />
        <Stat label="Avg exam score" value={`${stats.avgScore}`} />
        <Stat label="At-risk (<60)" value={stats.weakCount.toLocaleString()} />
        <Stat label="High performers (≥80)" value={stats.topCount.toLocaleString()} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> ML Model Performance
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" /> Retrain
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Linear regression trained on {stats.count.toLocaleString()} rows.
          </p>
          <div className="text-sm">
            <span className="font-medium">R² score:</span>{" "}
            <span className="font-mono">{model.r2.toFixed(4)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1 pr-4">Feature</th>
                  <th className="py-1">Weight</th>
                </tr>
              </thead>
              <tbody>
                {model.weights.map((w, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1 pr-4 font-mono">{featureNames[i]}</td>
                    <td className="py-1 font-mono">{w.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" /> Dataset Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-1 pr-3">Hours</th>
                <th className="py-1 pr-3">Attendance</th>
                <th className="py-1 pr-3">Prev Score</th>
                <th className="py-1 pr-3">Sleep</th>
                <th className="py-1 pr-3">Tutoring</th>
                <th className="py-1 pr-3">Motivation</th>
                <th className="py-1">Exam Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1 pr-3">{r.Hours_Studied}</td>
                  <td className="py-1 pr-3">{r.Attendance}</td>
                  <td className="py-1 pr-3">{r.Previous_Scores}</td>
                  <td className="py-1 pr-3">{r.Sleep_Hours}</td>
                  <td className="py-1 pr-3">{r.Tutoring_Sessions}</td>
                  <td className="py-1 pr-3">{r.Motivation_Level}</td>
                  <td className="py-1 font-medium">{r.Exam_Score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-2">Showing 20 of {rows.length} rows.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
