/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: 'standalone' is used for Docker/Railway deployments
  // For Cloudflare Workers, run 'npm run build:cloudflare' which uses @cloudflare/next-on-pages
  output: 'standalone',
};

module.exports = nextConfig;
