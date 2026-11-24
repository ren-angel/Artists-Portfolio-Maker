const api = process.env.API_INTERNAL_ORIGIN || "http://127.0.0.1:4000";
export default {
  poweredByHeader: false,
  experimental: {
    proxyClientMaxBodySize: Number(process.env.MAX_UPLOAD_BYTES || 12582912),
  },
  transpilePackages: ["@doodallery/shared"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: api + "/:path*" }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
