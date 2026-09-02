import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  typescript: { ignoreBuildErrors: true },
}

export default nextConfig
