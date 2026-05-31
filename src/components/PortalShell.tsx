import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth, type Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, GraduationCap, Shield, Users } from "lucide-react";
import { useEffect, type ReactNode } from "react";

const ROLE_META: Record<Role, { label: string; icon: ReactNode; color: string }> = {
  admin: { label: "Administrator", icon: <Shield className="h-4 w-4" />, color: "bg-red-500/10 text-red-600 border-red-200" },
  teacher: { label: "Teacher", icon: <Users className="h-4 w-4" />, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  student: { label: "Student", icon: <GraduationCap className="h-4 w-4" />, color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
};

export function PortalShell({
  allow,
  title,
  children,
}: {
  allow: Role;
  title: string;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/" });
    else if (user.role !== allow) navigate({ to: `/${user.role}` as "/admin" | "/teacher" | "/student" });
  }, [user, allow, navigate]);

  if (!user || user.role !== allow) return null;
  const meta = ROLE_META[user.role];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-5 w-5" />
            <span className="hidden sm:inline">AI Student Performance Assistant</span>
            <span className="sm:hidden">AI SPA</span>
          </Link>
          <div className="flex items-center gap-3">
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.color}`}
            >
              {meta.icon}
              {meta.label}
            </span>
            <span className="text-sm text-muted-foreground hidden md:inline">
              {user.username}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        {children}
      </main>
      
    </div>
  );
}
