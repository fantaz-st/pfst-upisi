/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
      bodySizeLimit: "10mb",
    },
    outputFileTracingIncludes: {
      "/api/applications/[id]/pdf": ["./src/fonts/**/*"],
    },
  },
};
module.exports = nextConfig;
