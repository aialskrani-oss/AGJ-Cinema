import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface User {
  username: string;
}

interface StoredUser {
  username: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const HASH_MARKER = "$sha256$";

function isHashed(pw: string): boolean {
  return pw.startsWith(HASH_MARKER);
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return HASH_MARKER + hex;
}

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem("agj_users");
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("agj_user");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  async function login(username: string, password: string): Promise<boolean> {
    const users = getStoredUsers();
    const found = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    if (!found) return false;

    let matches = false;
    if (isHashed(found.password)) {
      const hashed = await hashPassword(password);
      matches = found.password === hashed;
    } else {
      matches = found.password === password;
      if (matches) {
        const hashed = await hashPassword(password);
        const updated = users.map((u) =>
          u.username === found.username ? { ...u, password: hashed } : u
        );
        localStorage.setItem("agj_users", JSON.stringify(updated));
      }
    }

    if (!matches) return false;
    const sessionUser: User = { username: found.username };
    localStorage.setItem("agj_user", JSON.stringify(sessionUser));
    setUser(sessionUser);
    return true;
  }

  async function register(username: string, password: string): Promise<boolean> {
    const users = getStoredUsers();
    const exists = users.some(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    if (exists) return false;
    const hashed = await hashPassword(password);
    const newUser: StoredUser = { username, password: hashed };
    const updated = [...users, newUser];
    localStorage.setItem("agj_users", JSON.stringify(updated));
    const sessionUser: User = { username };
    localStorage.setItem("agj_user", JSON.stringify(sessionUser));
    setUser(sessionUser);
    return true;
  }

  function logout() {
    localStorage.removeItem("agj_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: user !== null, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
