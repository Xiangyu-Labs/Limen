import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.6.156", "xiangyu-server", "xiangyu-server.lan"],
  // experimental: {
  //   after: true,
  // },
};

export default nextConfig;
