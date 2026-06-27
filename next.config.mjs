const isDev = process.env.NODE_ENV !== "production";
const skipDockerTypecheck = process.env.SKIP_DOCKER_TYPECHECK === "1";

const nextConfig = {
  output: "standalone",
  distDir: isDev ? ".next-dev" : ".next",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: skipDockerTypecheck },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
  images: {
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
