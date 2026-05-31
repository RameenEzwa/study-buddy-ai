import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, type Role } from "../lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, Shield, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Student Performance Assistant" },
      {
        name: "description",
        content:
          "Role-based AI educational platform supporting SDG 4 — Quality Education. Login as Admin, Teacher, or Student.",
      },
    ],
  }),
  component: LoginPage,
});

const PORTAL_PATH: Record<Role, "/admin" | "/teacher" | "/student"> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to={PORTAL_PATH[user.role]} />;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(username, password);
    if (!res.ok) setError(res.error);
    else navigate({ to: PORTAL_PATH[res.role] });
  };

  const quick = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" /> SDG 4 · Quality Education
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            AI Student Performance Assistant
          </h1>
          <p className="text-muted-foreground text-lg">
            A role-based AI platform that helps schools predict outcomes, support at-risk students,
            and align learning with Vision 2030 & 2035 goals.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <RoleBadge icon={<Shield className="h-4 w-4" />} label="Admin" />
            <RoleBadge icon={<Users className="h-4 w-4" />} label="Teacher" />
            <RoleBadge icon={<GraduationCap className="h-4 w-4" />} label="Student" />
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Choose a role to access its dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / teacher / student"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full">
                Login
              </Button>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Quick demo logins:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => quick("admin", "admin123")}>
                    Admin
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => quick("teacher", "teacher123")}>
                    Teacher
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => quick("student", "student123")}>
                    Student
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RoleBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
      {icon}
      <span>{label}</span>
    </div>
  );
}
