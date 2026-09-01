"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon, LockPasswordIcon, ViewIcon, ViewOffIcon, LogInIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [emailFocused, setEmailFocused] = React.useState(false)
  const [passwordFocused, setPasswordFocused] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value

    if (!email || !password) {
      toast.error("Please fill in all fields", { description: "Email and password are required." })
      return
    }

    setIsLoading(true)
    toast.loading("Signing in...", { id: "login" })

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://pictures-urge-effort-parking.trycloudflare.com/api/v1"
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login failed")
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.data.accessToken)
        localStorage.setItem("refreshToken", data.data.refreshToken)
        localStorage.setItem("user", JSON.stringify(data.data.user))
      }

      toast.success("Welcome back!", {
        id: "login",
        description: `Logged in as ${data.data.user.name}. Redirecting...`,
      })
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 800)
    } catch (err) {
      setIsLoading(false)
      toast.error("Login failed", {
        id: "login",
        description: err instanceof Error ? err.message : "Please check your credentials and try again.",
      })
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-white/20 bg-white/10 p-0 shadow-2xl backdrop-blur-2xl">
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400" />

        <CardContent className="p-0">
          <form className="p-8 md:p-10" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-8">
              {/* Logo + Title */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-emerald-400/30 blur-xl" />
                  <img
                    src="/assets/social-media.png"
                    alt="Sinza Classic Wear"
                    className="relative size-20 rounded-2xl object-contain animate-[fadeIn_0.6s_ease-out]"
                  />
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-white animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
                    Sinza Classic Wear
                  </h1>
                  <p className="text-sm text-white/60 animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
                    Sign in to your account to continue
                  </p>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2 animate-[fadeInUp_0.5s_ease-out_0.3s_both]">
                <label
                  htmlFor="email"
                  className={cn(
                    "text-sm font-medium transition-colors",
                    emailFocused ? "text-emerald-400" : "text-white/70"
                  )}
                >
                  Email Address
                </label>
                <div className="group relative">
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    className={cn(
                      "pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 transition-colors",
                      emailFocused ? "text-emerald-400" : "text-white/40"
                    )}
                    strokeWidth={2}
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    className="h-14 rounded-xl border-white/15 bg-white/5 ps-12 text-base text-white placeholder:text-white/30 transition-all focus:border-emerald-400/50 focus:bg-white/10 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2 animate-[fadeInUp_0.5s_ease-out_0.4s_both]">
                <label
                  htmlFor="password"
                  className={cn(
                    "text-sm font-medium transition-colors",
                    passwordFocused ? "text-emerald-400" : "text-white/70"
                  )}
                >
                  Password
                </label>
                <div className="group relative">
                  <HugeiconsIcon
                    icon={LockPasswordIcon}
                    className={cn(
                      "pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 transition-colors",
                      passwordFocused ? "text-emerald-400" : "text-white/40"
                    )}
                    strokeWidth={2}
                  />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="h-14 rounded-xl border-white/15 bg-white/5 ps-12 pe-12 text-base text-white placeholder:text-white/30 transition-all focus:border-emerald-400/50 focus:bg-white/10 focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-white/40 transition-colors hover:text-white/70"
                  >
                    <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} className="size-5" strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <div className="animate-[fadeInUp_0.5s_ease-out_0.5s_both]">
                <Button
                  type="submit"
                  size="lg"
                  loading={isLoading}
                  className="group relative h-14 w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:brightness-110 active:scale-[0.98]"
                >
                  {!isLoading && (
                    <span className="flex items-center justify-center gap-2">
                      Login
                      <HugeiconsIcon icon={LogInIcon} className="size-5 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                    </span>
                  )}
                </Button>
              </div>

              {/* Footer */}
              <p className="text-center text-sm text-white/40 animate-[fadeInUp_0.5s_ease-out_0.6s_both]">
                Authorized personnel only. Contact admin for access.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
