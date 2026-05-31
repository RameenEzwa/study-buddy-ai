import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "admin" | "teacher" | "student";
export interface AuthUser {
  username: string;
  role: Role;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (username: string, password: string) => { ok: true; role: Role } | { ok: false; error: string };
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const STORAGE_KEY = "sp_auth_user";

const CREDENTIALS: Record<string, { password: string; role: Role }> = {
  admin: { password: "admin123", role: "admin" },
  teacher: { password: "teacher123", role: "teacher" },
  student: { password: "student123", role: "student" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const login: AuthCtx["login"] = (username, password) => {
    const entry = CREDENTIALS[username.toLowerCase().trim()];
    if (!entry || entry.password !== password) {
      return { ok: false, error: "Invalid username or password" };
    }
    const u: AuthUser = { username: username.toLowerCase().trim(), role: entry.role };
    setUser(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
    return { ok: true, role: entry.role };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
