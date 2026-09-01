"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon, LockPasswordIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = React.useState(false)

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

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://atlas-devon-cardiac-convicted.trycloudflare.com/api/v1"
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

      toast.success("Welcome back! Redirecting to dashboard...")
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 500)
    } catch (err) {
      setIsLoading(false)
      toast.error(err instanceof Error ? err.message : "Login failed. Please try again.")
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <img
                  src="/assets/social-media.png"
                  alt="Sinza Classic Wear"
                  className="size-16 object-contain"
                />
                <h1 className="text-2xl font-bold">Sinza Classic Wear</h1>
                <p className="text-balance text-muted-foreground">
                  Sign in to your account to continue
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <div className="relative">
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
                    strokeWidth={2}
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="h-12 ps-10 text-base"
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <HugeiconsIcon
                    icon={LockPasswordIcon}
                    className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
                    strokeWidth={2}
                  />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    className="h-12 ps-10 text-base"
                  />
                </div>
              </Field>
              <Field>
                <Button type="submit" size="lg" loading={isLoading} className="h-12 w-full text-base">
                  Login
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Authorized personnel only. Contact admin for access.
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
