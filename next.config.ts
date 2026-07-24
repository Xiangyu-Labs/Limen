import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (allowedDevOrigins && allowedDevOrigins.length > 0) {
  nextConfig.allowedDevOrigins = allowedDevOrigins;
}

export default nextConfig;
