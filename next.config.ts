import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Video thumbnails pulled from YouTube. Add other hosts here if you use them.
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
};

export default nextConfig;
