import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff, User, Lock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type Mode = "signin" | "register";

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { login, register } = useAuth();

  function clearFields() {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  }

  function switchMode(m: Mode) {
    setMode(m);
    clearFields();
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const ok = login(username.trim(), password);
    setLoading(false);
    if (!ok) {
      setError("Invalid username or password.");
      return;
    }
    navigate("/");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const ok = register(username.trim(), password);
    setLoading(false);
    if (!ok) {
      setError("Username already taken. Please choose another.");
      return;
    }
    setSuccess("Account created! Redirecting...");
    setTimeout(() => navigate("/"), 800);
  }

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center px-4 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-4 md:left-8 flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to browsing
      </button>

      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-black tracking-wider">
            <span className="text-cyan-400">AGJ</span>
            <span className="text-white"> Cinema</span>
          </span>
          <p className="text-white/40 text-sm mt-1">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <div className="bg-[#181818] rounded-2xl p-8 shadow-2xl border border-white/5">
          {/* Tabs */}
          <div className="flex rounded-xl bg-black/30 p-1 mb-6">
            <button
              onClick={() => switchMode("signin")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "signin"
                  ? "bg-cyan-400 text-black shadow"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "register"
                  ? "bg-cyan-400 text-black shadow"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={mode === "signin" ? handleSignIn : handleRegister} className="flex flex-col gap-3">
            {/* Username */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                className="w-full bg-white/8 border border-white/10 focus:border-cyan-400/60 text-white placeholder-white/25 rounded-xl px-4 py-3 pl-10 outline-none transition-colors duration-200 text-sm"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full bg-white/8 border border-white/10 focus:border-cyan-400/60 text-white placeholder-white/25 rounded-xl px-4 py-3 pl-10 pr-10 outline-none transition-colors duration-200 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm password (register only) */}
            {mode === "register" && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  className="w-full bg-white/8 border border-white/10 focus:border-cyan-400/60 text-white placeholder-white/25 rounded-xl px-4 py-3 pl-10 outline-none transition-colors duration-200 text-sm"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg animate-fadeIn">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-500/15 border border-green-500/30 text-green-400 text-xs px-3 py-2 rounded-lg animate-fadeIn">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-black font-bold py-3 rounded-xl transition-all duration-200 active:scale-95 text-sm mt-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Register hint for sign in mode */}
          {mode === "signin" && (
            <p className="text-center text-white/30 text-xs mt-4">
              Don't have an account?{" "}
              <button onClick={() => switchMode("register")} className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                Register
              </button>
            </p>
          )}
          {mode === "register" && (
            <p className="text-center text-white/30 text-xs mt-4">
              Already have an account?{" "}
              <button onClick={() => switchMode("signin")} className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                Sign In
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-white/15 text-xs mt-6">
          AGJ Cinema — for entertainment purposes only
        </p>
      </div>
    </div>
  );
}
