import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return [
      {
        source: '/images/posts/:path*',
        destination: `${backendUrl}/images/posts/:path*`,
      },
    ];
  },
};

export default nextConfig;
