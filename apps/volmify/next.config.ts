import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: [
		"@de100/auth",
		"@de100/env",
		"@de100/i18n",
		"@de100/i18n-nextjs",
		"@de100/i18n-reactjs",
		"@de100/ui",
	],

	serverExternalPackages: ["@node-rs/argon2"],
	// outputFileTracingIncludes: {},

	experimental: {
		useWasmBinary: true,
		workerThreads: true,
		// outputFileTracingIncludes: {},

		staleTimes: {
			dynamic: 0,
		},
	},

	/**
	 *
	 * @param {{ plugins: unknown[] }} config
	 * @param {import("next/dist/server/config-shared").WebpackConfigContext} param1
	 * @returns
	 */
	webpack: (config, { isServer }) => {
		// @ts-ignore
		config.experiments = {
			// @ts-ignore
			...config.experiments,
			asyncWebAssembly: true,
			syncWebAssembly: true,
			layers: true,
		};
		// if (isServer) {
		//   // eslint-disable-next-line @typescript-eslint/no-unsafe-call
		//   config.plugins = [...config.plugins, new PrismaPlugin()];
		// }

		// fix warnings for async functions in the browser (https://github.com/vercel/next.js/issues/64792)
		if (!isServer) {
			// @ts-ignore
			config.output.environment = { ...config.output.environment, asyncFunction: true };
		}

		return config;
	},

	// turbopack: {},
};

export default nextConfig;
