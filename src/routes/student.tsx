import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/PortalShell";
import { useDataset } from "@/lib/dataset-hooks";
import { predict, recommendations } from "@/lib/dataset";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sparkles, BookOpen } from "lucide-react";

export const Route = createFileRoute("/student")({
  component: StudentPage,
});

function StudentPage() {
  return (
    <PortalShell allow="student" title="Student Dashboard">
      <StudentBody />
    </PortalShell>
  );
}

function StudentBody() {
  const { model, loading, error } = useDataset();
  const [hours, setHours] = useState(15);
  const [attendance, setAttendance] = useState(85);
  const [previous, setPrevious] = useState(70);
  const [sleep, setSleep] = useState(7);
  const [tutoring, setTutoring] = useState(1);
  const [result, setResult] = useState<number | null>(null);

  if (loading) return <p className="text-muted-foreground">Preparing AI model…</p>;
  if (error || !model) return <p className="text-destructive">Model unavailable.</p>;

  const onPredict = (e: React.FormEvent) => {
    e.preventDefault();
    const score = predict(model, { hours, attendance, previous, sleep, tutoring });
    setResult(+score.toFixed(1));
  };

  const tips = result !== null ? recommendations(result, hours, attendance) : [];
  const tier =
    result === null ? null : result >= 80 ? "High" : result >= 60 ? "Medium" : "Needs support";
  const tierColor =
    tier === "High"
      ? "text-emerald-600"
      : tier === "Medium"
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Predict Your Exam Score
          </CardTitle>
          <CardDescription>
            Enter your study habits — our AI model will estimate your exam outcome.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onPredict} className="space-y-4">
            <Field label="Study hours per week" value={hours} onChange={setHours} min={0} max={50} />
            <Field label="Attendance (%)" value={attendance} onChange={setAttendance} min={0} max={100} />
            <Field label="Previous exam score" value={previous} onChange={setPrevious} min={0} max={100} />
            <Field label="Sleep (hrs / night)" value={sleep} onChange={setSleep} min={0} max={12} />
            <Field label="Tutoring sessions / month" value={tutoring} onChange={setTutoring} min={0} max={20} />
            <Button type="submit" className="w-full">
              Predict score
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            {result === null ? (
              <p className="text-muted-foreground text-sm">
                Fill in the form to generate a personalized estimate.
              </p>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs uppercase text-muted-foreground tracking-wide">Estimated score</p>
                <p className="text-5xl font-bold mt-2">{result}</p>
                <p className={`mt-2 font-medium ${tierColor}`}>{tier}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" /> Personalized Study Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tips.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Tips will appear here after your first prediction.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {tips.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium flex justify-between">
        <span>{label}</span>
        <span className="text-muted-foreground font-mono text-xs">{value}</span>
      </label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : 0);
        }}
      />
    </div>
  );
}
