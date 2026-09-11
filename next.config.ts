import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  async rewrites() {
    return [
      { source: "/platform", destination: "/" },
      { source: "/feature", destination: "/" },
      { source: "/platform/how-it-work", destination: "/" },
      { source: "/faq", destination: "/" },
    ];
  },
};

export default nextConfig;