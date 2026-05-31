import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/PortalShell";
import { useDataset } from "@/lib/dataset-hooks";
import { summary } from "@/lib/dataset";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { AlertTriangle, TrendingUp, Award, Target, Sparkles, Globe } from "lucide-react";

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
        ? [...rows].filter((r) => r.Exam_Score < 60).sort((a, b) => a.Exam_Score - b.Exam_Score)
        : [],
    [rows],
  );
  const top = useMemo(
    () => (rows ? [...rows].sort((a, b) => b.Exam_Score - a.Exam_Score).slice(0, 10) : []),
    [rows],
  );
  const dist = useMemo(() => {
    if (!rows) return [];
    const buckets = [0, 0, 0, 0, 0];
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
  if (error || !rows || !stats) return <p className="text-destructive">Failed to load dataset.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric icon={<Target className="h-5 w-5" />} label="School avg" value={`${stats.avgScore}`} />
        <Metric icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} label="At-risk" value={`${stats.weakCount}`} />
        <Metric icon={<Award className="h-5 w-5 text-emerald-500" />} label="High performers" value={`${stats.topCount}`} />
        <Metric icon={<TrendingUp className="h-5 w-5 text-blue-500" />} label="Avg attendance" value={`${stats.avgAttendance}%`} />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-1.5">
            <Target className="h-4 w-4" /> <span className="hidden sm:inline">Class Overview</span><span className="sm:hidden">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="atrisk" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" /> <span className="hidden sm:inline">At-Risk Analytics</span><span className="sm:hidden">At-risk</span>
          </TabsTrigger>
          <TabsTrigger value="sdg" className="gap-1.5">
            <Globe className="h-4 w-4" /> <span className="hidden sm:inline">SDG 4 Impact</span><span className="sm:hidden">SDG 4</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
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
        </TabsContent>

        <TabsContent value="atrisk" className="mt-4 space-y-4">
          <AtRiskAnalytics atRisk={atRisk} totalCount={stats.count} />
        </TabsContent>

        <TabsContent value="sdg" className="mt-4">
          <SdgImpact stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AtRiskAnalytics({
  atRisk,
  totalCount,
}: {
  atRisk: any[];
  totalCount: number;
}) {
  const [insight, setInsight] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setInsight(buildInsight(atRisk, totalCount));
      setGenerating(false);
    }, 600);
  };

  const avgHours = atRisk.length
    ? (atRisk.reduce((s, r) => s + r.Hours_Studied, 0) / atRisk.length).toFixed(1)
    : "—";
  const avgAtt = atRisk.length
    ? (atRisk.reduce((s, r) => s + r.Attendance, 0) / atRisk.length).toFixed(0)
    : "—";
  const avgSleep = atRisk.length
    ? (atRisk.reduce((s, r) => s + r.Sleep_Hours, 0) / atRisk.length).toFixed(1)
    : "—";

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Avg study hrs" value={`${avgHours}`} />
        <MiniStat label="Avg attendance" value={`${avgAtt}%`} />
        <MiniStat label="Avg sleep" value={`${avgSleep}h`} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> AI Insight Generator
            </CardTitle>
            <CardDescription>
              Get automated recommendations to support the {atRisk.length} at-risk students.
            </CardDescription>
          </div>
          <Button onClick={generate} disabled={generating || atRisk.length === 0} size="sm">
            {generating ? "Analyzing…" : "Generate"}
          </Button>
        </CardHeader>
        <CardContent>
          {insight === null ? (
            <p className="text-muted-foreground text-sm">
              Click <span className="font-medium">Generate</span> for AI-powered guidance.
            </p>
          ) : (
            <div className="text-sm whitespace-pre-wrap leading-relaxed bg-secondary/50 rounded-md p-3 border">
              {insight}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> At-risk students ({atRisk.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-80 overflow-y-auto">
          <StudentTable rows={atRisk.slice(0, 50)} />
        </CardContent>
      </Card>
    </>
  );
}

function buildInsight(atRisk: any[], totalCount: number): string {
  if (atRisk.length === 0) return "No at-risk students detected. Great work!";
  const n = atRisk.length;
  const pct = ((n / totalCount) * 100).toFixed(1);
  const avgH = atRisk.reduce((s, r) => s + r.Hours_Studied, 0) / n;
  const avgA = atRisk.reduce((s, r) => s + r.Attendance, 0) / n;
  const avgS = atRisk.reduce((s, r) => s + r.Sleep_Hours, 0) / n;
  const lowAtt = atRisk.filter((r) => r.Attendance < 75).length;
  const lowHours = atRisk.filter((r) => r.Hours_Studied < 10).length;
  const lowSleep = atRisk.filter((r) => r.Sleep_Hours < 6).length;

  const recs: string[] = [];
  if (lowAtt / n > 0.4)
    recs.push(`• Attendance is the strongest driver: ${lowAtt}/${n} students attend <75%. Launch an attendance recovery program (mentor check-ins, parent notifications).`);
  if (lowHours / n > 0.4)
    recs.push(`• ${lowHours}/${n} students study <10 hrs/week. Provide structured study planners and after-school tutoring sessions.`);
  if (lowSleep / n > 0.3)
    recs.push(`• ${lowSleep}/${n} students sleep <6 hrs. Run a wellbeing workshop on sleep hygiene — sleep strongly affects exam recall.`);
  recs.push(`• Pair each at-risk student with a peer mentor from the top performers.`);
  recs.push(`• Schedule a parent–teacher session within 2 weeks for the bottom 10 students.`);

  return `AI ANALYSIS — ${n} at-risk students (${pct}% of cohort)\n\nProfile averages:\n  • Study: ${avgH.toFixed(1)} hrs/week\n  • Attendance: ${avgA.toFixed(0)}%\n  • Sleep: ${avgS.toFixed(1)} hrs/night\n\nRecommended interventions:\n${recs.join("\n")}\n\nExpected impact: focused action on attendance + study hours typically lifts at-risk scores by 8–15 points within one term.`;
}

function SdgImpact({ stats }: { stats: any }) {
  const inclusion = Math.round((1 - stats.weakCount / stats.count) * 100);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-4 w-4" /> SDG 4 · Vision 2030 / 2035 Snapshot
        </CardTitle>
        <CardDescription>Live metrics mapped to global education goals.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm space-y-3">
        <ImpactRow label="Inclusive education" value={`${inclusion}%`} desc="students meeting baseline targets" />
        <ImpactRow label="Engagement" value={`${stats.avgHours} hrs / ${stats.avgAttendance}%`} desc="weekly study & attendance" />
        <ImpactRow label="Wellbeing" value={`${stats.avgSleep} hrs`} desc="average sleep — key cognitive driver" />
      </CardContent>
    </Card>
  );
}

function ImpactRow({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div className="flex justify-between items-center border-b last:border-0 pb-2 last:pb-0">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <p className="text-lg font-bold">{value}</p>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs uppercase text-muted-foreground tracking-wide">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
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
