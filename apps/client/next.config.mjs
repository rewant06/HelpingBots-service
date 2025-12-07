// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   async rewrites() {

//     const backendUrl = (process.env.BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

//     console.log(` Proxying /api requests to: ${backendUrl}`);

//     return [
//       {
//         source: "/api/:path*",
//         destination: `${backendUrl}/:path*`,
//       },
//     ];
//   },
// };

// export default nextConfig;

// apps/client/next.config.mjs

const nextConfig = {
  async rewrites() {
    return [
      // Auth goes to IAM (8000)
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:8000/auth/:path*",
      },
      // ... users route ...

      // CRITICAL: Posts go to Anonymously Service (8001)
      {
        source: "/api/v1/posts/:path*",
        destination: "http://localhost:8001/v1/posts/:path*", 
      },
    ];
  },
};
export default nextConfig;