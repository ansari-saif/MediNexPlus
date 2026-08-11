const isDev = process.env.NODE_ENV !== "production";
const skipDockerTypecheck = process.env.SKIP_DOCKER_TYPECHECK === "1";

const nextConfig = {
  output: "standalone",
  distDir: isDev ? ".next-dev" : ".next",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: skipDockerTypecheck },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
    // Externalize native/OTel pkgs instead of NFT-including them on every
    // route (`outputFileTracingIncludes: { "/**": ... }` made prod builds ~12m).
    serverComponentsExternalPackages: [
      "@opentelemetry/sdk-node",
      "@opentelemetry/auto-instrumentations-node",
      "@opentelemetry/instrumentation",
      "@pyroscope/nodejs",
      "@datadog/pprof",
      "require-in-the-middle",
      "import-in-the-middle",
      "pino",
      "prom-client",
      "sharp",
    ],
  },
  images: {
    // Docker prod builds set NEXT_UNOPTIMIZED_IMAGES=1 — avoids sharp on Alpine.
    unoptimized: process.env.NEXT_UNOPTIMIZED_IMAGES === "1",
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/subdept/:slug/dashboard",
        destination: "/subdept/dashboard",
      },
    ];
  },
};

export default nextConfig;
