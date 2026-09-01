"use client"

import * as React from "react"
import { toast } from "sonner"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@workspace/ui/components/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"

export function OtpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [otpValue, setOtpValue] = React.useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const email = typeof window !== "undefined" ? sessionStorage.getItem("resetEmail") : null
    if (!email) {
      toast.error("Session expired. Please request a new code.")
      setTimeout(() => {
        window.location.href = "/auth/forgot-password"
      }, 1000)
      return
    }

    if (otpValue.length !== 6) {
      toast.error("Please enter the 6-digit code.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://178-104-240-146.sslip.io/api/v1"}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Verification failed")
      }

      toast.success("Email verified! Redirecting to reset password...")
      setTimeout(() => {
        window.location.href = "/auth/reset-password"
      }, 500)
    } catch (err) {
      setIsLoading(false)
      toast.error(err instanceof Error ? err.message : "Invalid or expired code. Please try again.")
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
                <h1 className="text-2xl font-bold">Verify Your Email</h1>
                <p className="text-balance text-muted-foreground">
                  We sent a 6-digit code to your email. Enter it below.
                </p>
              </div>
              <Field>
                <div className="flex justify-center py-2">
                  <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="size-12 text-base" />
                      <InputOTPSlot index={1} className="size-12 text-base" />
                      <InputOTPSlot index={2} className="size-12 text-base" />
                    </InputOTPGroup>
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className="size-12 text-base" />
                      <InputOTPSlot index={4} className="size-12 text-base" />
                      <InputOTPSlot index={5} className="size-12 text-base" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </Field>
              <Field>
                <Button type="submit" size="lg" loading={isLoading} className="h-12 w-full text-base">
                  Verify Code
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Didn&apos;t receive a code?{" "}
                <a href="#">Resend code</a>
              </FieldDescription>
              <FieldDescription className="text-center">
                <a href="/auth/forgot-password">Use a different email</a>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
