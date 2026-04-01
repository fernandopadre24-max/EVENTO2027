import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Only if needed to bypass persistent Vercel issues
  },
  // Recharts/Next.js 15 Fix (if icons or charts cause issues)
  transpilePackages: ['lucide-react', 'recharts'],
};

export default nextConfig;