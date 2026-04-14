import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'tcewuosobusprmrkowth.supabase.co', // para imagens upadas no supabase depois
      }
    ]
  }
};

export default nextConfig;
