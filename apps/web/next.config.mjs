const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://syncspace-server-production.up.railway.app/api/:path*',
      },
    ];
  },
};
export default nextConfig;
