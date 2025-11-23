/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {

    const backendUrl = (process.env.BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");

    console.log(` Proxying /api requests to: ${backendUrl}`);

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;