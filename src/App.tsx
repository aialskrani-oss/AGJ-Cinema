import { lazy, Suspense } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";

const Home        = lazy(() => import("./pages/Home"));
const MovieDetails = lazy(() => import("./pages/MovieDetails"));
const TVDetails   = lazy(() => import("./pages/TVDetails"));
const TVShows     = lazy(() => import("./pages/TVShows"));
const Search      = lazy(() => import("./pages/Search"));
const MyList      = lazy(() => import("./pages/MyList"));
const Profile     = lazy(() => import("./pages/Profile"));
const Login       = lazy(() => import("./pages/Login"));
const NotFound    = lazy(() => import("./pages/NotFound"));
const Watch       = lazy(() => import("./pages/Watch"));

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Redirect to="/login" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        <Route path="/"                               component={Home} />
        <Route path="/movie/:id"                      component={MovieDetails} />
        <Route path="/tv/:id"                         component={TVDetails} />
        <Route path="/tv-shows"                       component={TVShows} />
        <Route path="/search"                         component={Search} />
        <Route path="/login"                          component={Login} />
        <Route path="/watch/movie/:id"                component={Watch} />
        <Route path="/watch/tv/:id/:season/:episode"  component={Watch} />
        <Route path="/list">
          <ProtectedRoute><MyList /></ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute><Profile /></ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppShell() {
  const [location] = useLocation();
  const isWatch = location.startsWith("/watch/");
  return (
    <div className="min-h-screen bg-[#141414]">
      {!isWatch && <Navbar />}
      <Router />
      {!isWatch && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  );
}
