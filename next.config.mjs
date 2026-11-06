/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
  // OneDrive sync corrupts webpack's on-disk cache in .next (chunk "reading 'call'" errors)
  webpack: (config, { dev }) => {
    if (dev) config.cache = { type: "memory" }
    return config
  },
}

export default nextConfig
