import { createContext, useContext, useState, useEffect } from "react";
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
  login: (username: string, password: string) => boolean;
  logout: () => void;
  register: (username: string, password: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

  function login(username: string, password: string): boolean {
    const users = getStoredUsers();
    const found = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (!found) return false;
    const sessionUser: User = { username: found.username };
    localStorage.setItem("agj_user", JSON.stringify(sessionUser));
    setUser(sessionUser);
    return true;
  }

  function register(username: string, password: string): boolean {
    const users = getStoredUsers();
    const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
    if (exists) return false;
    const newUser: StoredUser = { username, password };
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
