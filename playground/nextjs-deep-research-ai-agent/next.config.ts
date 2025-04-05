import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: ["@de100/env", "@de100/tailwindcss-utils", "@de100/ui"],
};

export default nextConfig;
