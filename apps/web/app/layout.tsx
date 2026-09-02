import { Geist, Geist_Mono, Nunito_Sans } from "next/font/google"
import type { Metadata } from "next"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Providers } from "@/lib/providers"
import { cn } from "@workspace/ui/lib/utils";

export const metadata: Metadata = {
  title: "Sinza Classic Wear",
  description: "Classic style, timeless elegance. Premium fashion for the modern individual.",
  icons: {
    icon: "/assets/SC-logo.svg",
    shortcut: "/assets/SC-logo.svg",
    apple: "/assets/SC-logo.svg",
  },
}

const nunitoSans = Nunito_Sans({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", nunitoSans.variable)}
    >
      <body>
        <ThemeProvider>
          <Providers>
            <TooltipProvider>{children}</TooltipProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
