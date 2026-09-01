import { LoginForm } from "@workspace/ui/components/login-form"
import { Toaster } from "@workspace/ui/components/sonner"

export default function AuthPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden p-6">
      <img
        src="/assets/41714.jpg"
        alt="Sinza Classic Wear"
        className="absolute inset-0 h-full w-full object-cover animate-[zoom_20s_ease-in-out_infinite_alternate]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-black/70 to-slate-950/90" />
      <div className="absolute inset-0 backdrop-blur-sm" />

      {/* Floating animated orbs */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl animate-[float_6s_ease-in-out_infinite]" />

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-white/30"
            style={{
              top: `${(i * 37) % 100}%`,
              left: `${(i * 53) % 100}%`,
              animation: `floatUp ${5 + (i % 4)}s ease-in-out ${i * 0.5}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <LoginForm className="relative z-10 w-full max-w-md animate-[fadeInUp_0.8s_ease-out]" />
      <Toaster />
    </div>
  )
}
