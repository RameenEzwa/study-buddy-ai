import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/PortalShell";
import { useDataset } from "@/lib/dataset-hooks";
import { summary, predict } from "@/lib/dataset";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { RefreshCw, Database, Activity, AlertTriangle, Sparkles } from "lucide-react";

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

  return (
    <div className="space-y-6" key={reloadKey}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total students" value={stats.count.toLocaleString()} />
        <Stat label="Avg exam score" value={`${stats.avgScore}`} />
        <Stat label="At-risk (<60)" value={stats.weakCount.toLocaleString()} />
        <Stat label="High performers (≥80)" value={stats.topCount.toLocaleString()} />
      </div>

      <Tabs defaultValue="dataset" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dataset" className="gap-1.5">
            <Database className="h-4 w-4" /> <span className="hidden sm:inline">Dataset Explorer</span><span className="sm:hidden">Data</span>
          </TabsTrigger>
          <TabsTrigger value="prediction" className="gap-1.5">
            <Activity className="h-4 w-4" /> <span className="hidden sm:inline">Performance Prediction</span><span className="sm:hidden">Model</span>
          </TabsTrigger>
          <TabsTrigger value="weak" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" /> <span className="hidden sm:inline">Weak Students</span><span className="sm:hidden">At-risk</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dataset" className="mt-4">
          <DatasetExplorer rows={rows} />
        </TabsContent>
        <TabsContent value="prediction" className="mt-4">
          <PerformancePrediction
            model={model}
            count={stats.count}
            onRetrain={() => setReloadKey((k) => k + 1)}
          />
        </TabsContent>
        <TabsContent value="weak" className="mt-4">
          <WeakStudents rows={rows} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DatasetExplorer({ rows }: { rows: any[] }) {
  return (
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
              <th className="py-1 pr-3">Prev</th>
              <th className="py-1 pr-3">Sleep</th>
              <th className="py-1 pr-3">Tutoring</th>
              <th className="py-1 pr-3">Motivation</th>
              <th className="py-1">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 25).map((r, i) => (
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
        <p className="text-xs text-muted-foreground mt-2">Showing 25 of {rows.length} rows.</p>
      </CardContent>
    </Card>
  );
}

function PerformancePrediction({
  model,
  count,
  onRetrain,
}: {
  model: { weights: number[]; r2: number };
  count: number;
  onRetrain: () => void;
}) {
  const featureNames = [
    "Intercept",
    "Hours_Studied",
    "Attendance",
    "Previous_Scores",
    "Sleep_Hours",
    "Tutoring_Sessions",
  ];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" /> ML Model Performance
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onRetrain}>
          <RefreshCw className="h-4 w-4" /> Retrain
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Linear regression trained on {count.toLocaleString()} rows.
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
  );
}

function WeakStudents({ rows }: { rows: any[] }) {
  const [threshold, setThreshold] = useState(60);
  const weak = useMemo(
    () =>
      [...rows]
        .filter((r) => r.Exam_Score < threshold)
        .sort((a, b) => a.Exam_Score - b.Exam_Score),
    [rows, threshold],
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" /> Weak-Performing Students
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm">Threshold:</label>
          <Input
            type="number"
            className="w-24"
            value={threshold}
            min={0}
            max={100}
            onChange={(e) => setThreshold(parseInt(e.target.value || "0", 10))}
          />
          <span className="text-sm text-muted-foreground">
            {weak.length} students below {threshold}
          </span>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="text-xs w-full">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-1 pr-3">#</th>
                <th className="py-1 pr-3">Hours</th>
                <th className="py-1 pr-3">Attendance</th>
                <th className="py-1 pr-3">Sleep</th>
                <th className="py-1">Score</th>
              </tr>
            </thead>
            <tbody>
              {weak.slice(0, 100).map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1 pr-3">{i + 1}</td>
                  <td className="py-1 pr-3">{r.Hours_Studied}</td>
                  <td className="py-1 pr-3">{r.Attendance}%</td>
                  <td className="py-1 pr-3">{r.Sleep_Hours}h</td>
                  <td className="py-1 font-semibold text-red-600">{r.Exam_Score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
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

// Keep predict import used (silence unused warning if needed)
void predict;
