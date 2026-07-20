/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allows production builds to successfully complete even if the project has ESLint warnings/errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allows production builds to successfully complete even if there are strict typing errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
