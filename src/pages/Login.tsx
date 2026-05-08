import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff, User, Lock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type Mode = "signin" | "register";

export default function Login() {
  const [mode, setMode]                     = useState<Mode>("signin");
  const [username, setUsername]             = useState("");
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [error, setError]                   = useState("");
  const [success, setSuccess]               = useState("");
  const [loading, setLoading]               = useState(false);
  const [, navigate]                        = useLocation();
  const { login, register }                 = useAuth();

  useEffect(() => {
    document.title = "Sign In — AGJ Cinema";
    return () => { document.title = "AGJ Cinema"; };
  }, []);

  function clearFields() { setUsername(""); setPassword(""); setConfirmPassword(""); setError(""); setSuccess(""); }
  function switchMode(m: Mode) { setMode(m); clearFields(); }

  function handleBack() {
    if (window.history.length > 1) window.history.back();
    else navigate("/");
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    const ok = await login(username.trim(), password);
    setLoading(false);
    if (!ok) { setError("Invalid username or password."); return; }
    navigate("/");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (username.trim().length < 3) { setError("Username must be at least 3 characters."); return; }
    if (password.length < 4)        { setError("Password must be at least 4 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    const ok = await register(username.trim(), password);
    setLoading(false);
    if (!ok) { setError("Username already taken. Please choose another."); return; }
    setSuccess("Account created! Redirecting...");
    setTimeout(() => navigate("/"), 800);
  }

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center px-4 animate-fadeIn">
      <button onClick={handleBack} className="absolute top-6 left-4 md:left-8 flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-black"><span className="text-cyan-400">AGJ</span><span className="text-white"> Cinema</span></span>
          <p className="text-white/40 text-sm mt-2">{mode === "signin" ? "Welcome back" : "Create your account"}</p>
        </div>
        <div className="flex rounded-xl bg-[#1a1a1a] p-1 mb-6 border border-white/5">
          {(["signin", "register"] as Mode[]).map((m) => (
            <button key={m} onClick={() => switchMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === m ? "bg-cyan-400 text-black shadow" : "text-white/50 hover:text-white"}`}>
              {m === "signin" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>
        <form onSubmit={mode === "signin" ? handleSignIn : handleRegister} className="flex flex-col gap-4">
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" autoComplete="username" className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-400/50 focus:bg-[#1f1f1f] transition-all" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete={mode === "signin" ? "current-password" : "new-password"} className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-white/30 rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:border-cyan-400/50 focus:bg-[#1f1f1f] transition-all" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {mode === "register" && (
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" autoComplete="new-password" className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-white/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-400/50 focus:bg-[#1f1f1f] transition-all" />
            </div>
          )}
          {error && <p className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-green-400 text-sm text-center bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">{success}</p>}
          <button type="submit" disabled={loading} className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:bg-cyan-400/50 text-black font-bold py-3 rounded-xl text-sm transition-all duration-200 active:scale-95 mt-1">
            {loading ? (<span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />{mode === "signin" ? "Signing in..." : "Creating account..."}</span>) : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
