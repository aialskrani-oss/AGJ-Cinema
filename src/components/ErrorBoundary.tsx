import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AGJ Cinema error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center gap-5 px-4 text-center">
          <div className="text-6xl">🎬</div>
          <h1 className="text-white text-2xl font-black">Something went wrong</h1>
          <p className="text-white/40 text-sm max-w-sm">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
            className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold px-8 py-3 rounded-full transition-colors"
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
