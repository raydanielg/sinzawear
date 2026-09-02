import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Home02Icon, ArrowLeft02Icon, Search01Icon } from "@hugeicons/core-free-icons"

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6">
      {/* Glow effects */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        <img
          src="/assets/SC-logo.svg"
          alt="Sinza Classic Wear"
          className="size-20 object-contain mb-8 transition-transform duration-300 hover:scale-110"
        />

        {/* 404 Number */}
        <div className="relative">
          <h1 className="text-[120px] font-extrabold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 sm:text-[180px]">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-[120px] font-extrabold leading-none tracking-tighter text-amber-500/10 blur-sm sm:text-[180px]">
              404
            </h1>
          </div>
        </div>

        {/* Message */}
        <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
          Page Not Found
        </h2>
        <p className="mt-3 max-w-md text-sm text-slate-400 sm:text-base">
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="gap-2 bg-amber-500 text-black hover:bg-amber-400 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 active:scale-95"
            >
              <HugeiconsIcon icon={Home02Icon} strokeWidth={2} className="size-5" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/auth">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-5" />
              Go to Login
            </Button>
          </Link>
        </div>

        {/* Search hint */}
        <div className="mt-12 flex items-center gap-2 text-xs text-slate-500">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-4" />
          <span>Try checking the URL or navigating from the dashboard</span>
        </div>
      </div>
    </div>
  )
}
