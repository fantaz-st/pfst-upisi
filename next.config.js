/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
      bodySizeLimit: "10mb", // Increase from default 1mb to 10mb
    },
  },
};

module.exports = nextConfig;
