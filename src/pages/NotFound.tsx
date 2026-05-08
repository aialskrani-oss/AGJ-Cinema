import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center gap-4 text-center px-4 animate-fadeIn">
      <p className="text-[#e50914] font-black text-9xl md:text-[12rem] leading-none select-none">
        404
      </p>
      <p className="text-white text-2xl font-bold">Lost your way?</p>
      <p className="text-white/50 text-sm max-w-xs">
        Sorry, we can't find that page. You'll find lots to explore on the home screen.
      </p>
      <button
        onClick={() => navigate("/")}
        className="mt-4 bg-white text-black font-bold px-8 py-3 rounded-full hover:bg-white/90 transition-colors active:scale-95"
      >
        AGJ Cinema Home
      </button>
    </div>
  );
}
