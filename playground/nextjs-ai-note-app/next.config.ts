import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				hostname: "img.clerk.com",
			},
		],
	},

	/** Enables hot reloading for local packages without a build step */
	transpilePackages: ["@de100/env", "@de100/tailwindcss-utils", "@de100/ui"],
};

export default nextConfig;
