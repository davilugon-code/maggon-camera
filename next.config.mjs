/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.externals.push({
      sharp: 'commonjs sharp',
    });
    return config;
  },
};

export default nextConfig;
