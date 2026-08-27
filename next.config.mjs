/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone', // minimal server bundle for Docker (§41)
  images: {
    // Allow shop/product images from the configured object-storage host (§40).
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  /**
   * Proxy API + uploads through the Next server so the browser talks to its OWN
   * origin. This makes the refresh cookie first-party (no CORS, no SameSite/Secure
   * gymnastics), so sessions persist regardless of whether the site is opened via
   * localhost, 127.0.0.1 or any host. SSR still calls the backend directly.
   * The target host is resolved at runtime on the server network (e.g. Docker's
   * `backend` service), so it need not be reachable from the browser.
   */
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || 'http://backend:5000';
    return [
      { source: '/api/v1/:path*', destination: `${target}/api/v1/:path*` },
      { source: '/uploads/:path*', destination: `${target}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
