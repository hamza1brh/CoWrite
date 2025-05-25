/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placeholder.svg",
        port: "",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    dirs: ["src/pages", "src/components", "src/lib"],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  pageExtensions: ["ts", "tsx", "js", "jsx"],
};

export default nextConfig;
