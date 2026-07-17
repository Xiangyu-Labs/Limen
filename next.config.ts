import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.6.156", "xiangyu-server", "xiangyu-server.lan"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
