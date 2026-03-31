import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // 👇 ADDED: Allow images from your local Express server via IP
      {
        protocol: 'http',
        hostname: '192.168.**', // The ** allows any device on your local network
        port: '',
        pathname: '/**',
      },
      // 👇 ADDED: Allow images from localhost
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;