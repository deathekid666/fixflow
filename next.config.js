/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Bound parallel build work so local builds fit on smaller machines.
  experimental: { cpus: 1, webpackMemoryOptimizations: true },
};
module.exports = nextConfig;
