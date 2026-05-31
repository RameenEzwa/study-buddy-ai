import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/PortalShell";
import { useDataset } from "@/lib/dataset-hooks";
import { predict, recommendations } from "@/lib/dataset";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useState, useEffect } from "react";
import { Sparkles, BookOpen, Bot, Send, User } from "lucide-react";

export const Route = createFileRoute("/student")({
  component: StudentPage,
});

type Profile = {
  hours: number;
  attendance: number;
  previous: number;
  sleep: number;
  tutoring: number;
  lastScore: number | null;
};

function StudentPage() {
  return (
    <PortalShell allow="student" title="Student Dashboard">
      <StudentBody />
    </PortalShell>
  );
}

function StudentBody() {
  const { model, loading, error } = useDataset();
  const [profile, setProfile] = useState<Profile>({
    hours: 15,
    attendance: 85,
    previous: 70,
    sleep: 7,
    tutoring: 1,
    lastScore: null,
  });

  if (loading) return <p className="text-muted-foreground">Preparing AI model…</p>;
  if (error || !model) return <p className="text-destructive">Model unavailable.</p>;

  return (
    <Tabs defaultValue="predictor" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="predictor" className="gap-1.5">
          <Sparkles className="h-4 w-4" /> <span className="hidden sm:inline">Score Predictor</span><span className="sm:hidden">Predict</span>
        </TabsTrigger>
        <TabsTrigger value="tips" className="gap-1.5">
          <BookOpen className="h-4 w-4" /> <span className="hidden sm:inline">Study Tips</span><span className="sm:hidden">Tips</span>
        </TabsTrigger>
        <TabsTrigger value="chat" className="gap-1.5">
          <Bot className="h-4 w-4" /> <span className="hidden sm:inline">AI Chatbot</span><span className="sm:hidden">Chat</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="predictor" className="mt-4">
        <Predictor model={model} profile={profile} setProfile={setProfile} />
      </TabsContent>
      <TabsContent value="tips" className="mt-4">
        <StudyTips profile={profile} />
      </TabsContent>
      <TabsContent value="chat" className="mt-4">
        <AIChatbot profile={profile} />
      </TabsContent>
    </Tabs>
  );
}

function Predictor({
  model,
  profile,
  setProfile,
}: {
  model: any;
  profile: Profile;
  setProfile: (p: Profile) => void;
}) {
  const [result, setResult] = useState<number | null>(profile.lastScore);
  const onPredict = (e: React.FormEvent) => {
    e.preventDefault();
    const score = predict(model, {
      hours: profile.hours,
      attendance: profile.attendance,
      previous: profile.previous,
      sleep: profile.sleep,
      tutoring: profile.tutoring,
    });
    const rounded = +score.toFixed(1);
    setResult(rounded);
    setProfile({ ...profile, lastScore: rounded });
  };
  const tier =
    result === null ? null : result >= 80 ? "High" : result >= 60 ? "Medium" : "Needs support";
  const tierColor =
    tier === "High" ? "text-emerald-600" : tier === "Medium" ? "text-amber-600" : "text-red-600";

  const set = (k: keyof Profile, v: number) => setProfile({ ...profile, [k]: v });

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
            <Field label="Study hours per week" value={profile.hours} onChange={(v) => set("hours", v)} min={0} max={50} />
            <Field label="Attendance (%)" value={profile.attendance} onChange={(v) => set("attendance", v)} min={0} max={100} />
            <Field label="Previous exam score" value={profile.previous} onChange={(v) => set("previous", v)} min={0} max={100} />
            <Field label="Sleep (hrs / night)" value={profile.sleep} onChange={(v) => set("sleep", v)} min={0} max={12} />
            <Field label="Tutoring sessions / month" value={profile.tutoring} onChange={(v) => set("tutoring", v)} min={0} max={20} />
            <Button type="submit" className="w-full">Predict score</Button>
          </form>
        </CardContent>
      </Card>

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
              <p className="text-xs text-muted-foreground mt-3">
                Switch to <span className="font-medium">Study Tips</span> or chat with the{" "}
                <span className="font-medium">AI Chatbot</span> for personalized guidance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StudyTips({ profile }: { profile: Profile }) {
  const tips =
    profile.lastScore !== null
      ? recommendations(profile.lastScore, profile.hours, profile.attendance)
      : [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" /> Personalized Study Recommendations
        </CardTitle>
        <CardDescription>
          Tailored advice based on your latest prediction and habits.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tips.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Run a prediction first in the <span className="font-medium">Score Predictor</span> tab to unlock tips.
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
  );
}

type ChatMsg = { role: "user" | "assistant"; text: string };

function AIChatbot({ profile }: { profile: Profile }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text:
        "Hi! I'm your AI study assistant. Ask me anything about study habits, time management, sleep, motivation, or how to improve your exam score. I'll tailor advice based on your profile.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    const reply = generateReply(q, profile);
    setMessages((m) => [...m, { role: "user", text: q }, { role: "assistant", text: reply }]);
    setInput("");
  };

  const suggestions = [
    "How can I improve my score?",
    "Am I sleeping enough?",
    "How should I plan my study week?",
    "Tips to stay motivated?",
  ];

  return (
    <Card className="flex flex-col h-[70vh] max-h-[600px]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" /> AI Study Assistant
        </CardTitle>
        <CardDescription>
          Personalized to your habits: {profile.hours}h/wk study · {profile.attendance}% attendance ·{" "}
          {profile.sleep}h sleep
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <div className="border-t p-3 space-y-2">
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="text-xs px-2 py-1 rounded-full border bg-background hover:bg-secondary transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={send} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for study tips…"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}

function generateReply(q: string, p: Profile): string {
  const t = q.toLowerCase();
  const parts: string[] = [];

  const ctx = `Based on your profile (${p.hours}h/week study, ${p.attendance}% attendance, ${p.sleep}h sleep${
    p.lastScore !== null ? `, predicted score ${p.lastScore}` : ""
  }):`;

  if (/sleep|tired|rest/.test(t)) {
    parts.push(
      p.sleep < 6
        ? "You're sleeping only " + p.sleep + " hrs — that's well below the 7–9h needed for memory consolidation. Aim for a consistent bedtime."
        : p.sleep > 9
          ? "Over-sleeping (" + p.sleep + "h) can also reduce focus. Try 7–8 hrs with a fixed wake-up time."
          : "Your " + p.sleep + " hrs of sleep is in the healthy range — keep it consistent before exams.",
    );
  } else if (/motivat|focus|procrastin/.test(t)) {
    parts.push(
      "Try the Pomodoro technique: 25 min focused study + 5 min break. Set 1 small daily goal and reward yourself for finishing it. Study with a partner to stay accountable.",
    );
  } else if (/plan|schedule|week|time/.test(t)) {
    const recommended = Math.max(p.hours, 20);
    parts.push(
      `Spread ~${recommended} hrs across 5–6 days (≈${Math.round(recommended / 5)}h/day). Block fixed study slots in your calendar, and reserve weekends for review + practice tests.`,
    );
  } else if (/attendance|class|lecture/.test(t)) {
    parts.push(
      p.attendance < 80
        ? `Your attendance (${p.attendance}%) is the single biggest lever right now. Each missed lecture costs ~2–3 score points. Commit to attending every class for the next 2 weeks.`
        : `Great attendance (${p.attendance}%). Now focus on active note-taking and asking 1 question per lecture.`,
    );
  } else if (/improve|better|raise|increase|score|grade/.test(t)) {
    if (p.hours < 15) parts.push(`Increase study time from ${p.hours} → 20+ hrs/week.`);
    if (p.attendance < 85) parts.push(`Push attendance from ${p.attendance}% → 90%+.`);
    if (p.sleep < 7) parts.push(`Sleep 7–8 hrs nightly for better recall.`);
    if (p.tutoring < 2) parts.push(`Add 1–2 tutoring sessions/month for weak topics.`);
    if (parts.length === 0)
      parts.push("Your habits are solid! Focus on practice tests and reviewing past mistakes.");
  } else if (/tutor/.test(t)) {
    parts.push(
      `You currently do ${p.tutoring} tutoring session(s)/month. Students who do 2+ sessions score noticeably higher on average. Consider booking one for your weakest subject.`,
    );
  } else if (/exam|test|prepare/.test(t)) {
    parts.push(
      "Exam prep checklist: 1) Review notes in spaced intervals (1d, 3d, 7d). 2) Do at least 2 past papers under timed conditions. 3) Sleep well the night before — no all-nighters.",
    );
  } else if (/hi|hello|hey/.test(t)) {
    return "Hello! Ask me about your study plan, sleep, motivation, attendance, or how to improve your score.";
  } else {
    parts.push(
      "Great question. Generally: consistent daily study, 90%+ attendance, 7–8 hrs sleep, and regular practice tests are the strongest predictors of exam success. Want tips on a specific area (sleep, motivation, planning)?",
    );
  }

  return ctx + "\n\n" + parts.join(" ");
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
