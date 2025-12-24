import type { NextConfig } from 'next';

// Require environment variables for API URLs
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const KYC_AGENT_URL = process.env.KYC_AGENT_URL;

if (!KYC_AGENT_URL) {
  console.warn('⚠️ KYC_AGENT_URL environment variable is not set. Agent features may not work.');
}

const nextConfig: NextConfig = {
  async rewrites() {
    const rewrites = [
      // Java Backend API (Spring Boot)
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];

    // Only add agent rewrite if URL is configured
    if (KYC_AGENT_URL) {
      rewrites.push({
        source: '/agent/:path*',
        destination: `${KYC_AGENT_URL}/:path*`,
      });
    }

    return rewrites;
  },
};

export default nextConfig;