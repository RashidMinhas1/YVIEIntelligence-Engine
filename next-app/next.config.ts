import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd()),
  serverExternalPackages: ["postgres"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
