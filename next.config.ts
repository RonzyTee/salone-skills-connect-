import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add the images configuration here
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co', // This is the required hostname for imgbb
        port: '',
        pathname: '/**',
      },
      // You can add other domains here in the future if needed
    ],
  },
  /* other config options can go here */
};

export default nextConfig;