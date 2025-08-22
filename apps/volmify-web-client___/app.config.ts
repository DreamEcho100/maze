// import commonjs from "@rollup/plugin-commonjs";
// import { defineConfig } from "@solidjs/start/config";
// // import { visualizer } from "rollup-plugin-visualizer";
// // import topLevelAwait from "vite-plugin-top-level-await";

// export default defineConfig({
// 	vite: {
// 		esbuild: {
// 			supported: {
// 				"top-level-await": true, // Enable top-level await support
// 			},
// 		},
// 		plugins: [
// 			// /** @type {any} */ (topLevelAwait() as any),
// 			commonjs(),
// 			// visualizer({
// 			// 	filename: "dist/stats.html",
// 			// 	open: true,
// 			// 	gzipSize: true,
// 			// 	template: "treemap", // or "sunburst", "network"
// 			// }),
// 		],
// 	},
// 	server: {
// 		// prerender: {
// 		// 	crawlLinks: true,
// 		// 	failOnError: true,
// 		// },
// 		// experimental: {
// 		// 	asyncContext: true, // Disable async context for compatibility
// 		// },
// 	},
// 	middleware: "./src/middleware/index.ts",
// 	ssr: true,
// });

// import commonjs from "vite-plugin-commonjs"; // @rollup/plugin-commonjs
// import commonjs from "@rollup/plugin-commonjs";

// import commonjs from "@rollup/plugin-commonjs";

import { defineConfig } from "@solidjs/start/config";
// import { visualizer } from "rollup-plugin-visualizer";
// import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
	// vite: {
	// 	// esbuild: {
	// 	// 	supported: {
	// 	// 		"top-level-await": true, // Enable top-level await support
	// 	// 	},
	// 	// },
	// 	// plugins: [
	// 	// 	// /** @type {any} */ (topLevelAwait() as any),
	// 	// 	// commonjs({
	// 	// 	// 	dynamicRequireTargets: ["@de100/db"],
	// 	// 	// }),
	// 	// 	// ✅ Visualize what's in your bundles
	// 	// 	// visualizer({
	// 	// 	// 	filename: "dist/stats.html",
	// 	// 	// 	open: true,
	// 	// 	// 	gzipSize: true,
	// 	// 	// 	template: "treemap", // or "sunburst", "network"
	// 	// 	// }),
	// 	// ],
	// 	// build: {
	// 	// 	commonjsOptions: {
	// 	// 		transformMixedEsModules: true,
	// 	// 	},
	// 	// 	rollupOptions: {
	// 	// 		external: ["oslo", "@node-rs/argon2-wasm32-wasi"],
	// 	// 	},
	// 	// },
	// 	// ssr: {
	// 	// 	// Externalize the entire auth-core package on the server
	// 	// 	// This prevents server-only code from being bundled for client
	// 	// 	external: ["@de100/auth-core"],

	// 	// 	// BUT allow specific client-safe exports to be processed
	// 	// 	noExternal: [
	// 	// 		// Create a pattern or explicitly list client-safe exports
	// 	// 		"@de100/auth-shared/constants",
	// 	// 		"@de100/auth-shared/types", // if types are client-safe
	// 	// 		"@de100/auth-shared/validations", // if validations are client-safe
	// 	// 	],
	// 	// },

	// 	// optimizeDeps: {
	// 	// 	// Include client-safe parts for dev bundling
	// 	// 	include: [
	// 	// 		// Create a pattern or explicitly list client-safe exports
	// 	// 		"@de100/auth-shared/constants",
	// 	// 		"@de100/auth-shared/types", // if types are client-safe
	// 	// 		"@de100/auth-shared/validations", // if validations are client-safe
	// 	// 	],
	// 	// },

	// 	// optimizeDeps: {
	// 	// 	include: ["@de100/db", "@de100/auth-core"],
	// 	// },

	// 	// ssr: {
	// 	// 	// Externalize server-only packages completely
	// 	// 	external: ["@de100/auth-core", "@de100/db"],

	// 	// 	// Only allow specific client-safe exports to be processed
	// 	// 	noExternal: [
	// 	// 		// Only truly client-safe utilities (no Node.js dependencies)
	// 	// 		"@de100/auth-shared/constants",
	// 	// 		"@de100/auth-shared/validations",
	// 	// 		"@de100/auth-shared/types",
	// 	// 		// Don't include any db exports - they all use Node.js
	// 	// 	],
	// 	// },

	// 	// build: {
	// 	// 	// commonjsOptions: {
	// 	// 	// 	include: [/@de100\/db/, /@de100\/auth-core/, /node_modules/],
	// 	// 	// },
	// 	// },

	// 	// build: {
	// 	// 	// target: "esnext", // Use modern JS for better performance
	// 	// 	rollupOptions: {
	// 	// 		external: [
	// 	// 			// Node.js built-ins that should never be in client
	// 	// 			// "node:crypto",
	// 	// 			"node:module",
	// 	// 			"node:async_hooks",
	// 	// 			"crypto",
	// 	// 			"fs",
	// 	// 			"path",
	// 	// 			"net",
	// 	// 			"dns",
	// 	// 			"tls",
	// 	// 			"stream",
	// 	// 			"util",

	// 	// 			// Server-only packages
	// 	// 			"jsonwebtoken",
	// 	// 			"pg",
	// 	// 			"drizzle-orm",
	// 	// 			"@node-rs/argon2",
	// 	// 			"uuid",

	// 	// 			// Your server-only package exports
	// 	// 			"@de100/auth-core",
	// 	// 			"@de100/db",
	// 	// 			"@de100/auth-core/*",
	// 	// 			"@de100/db/*",
	// 	// 		],
	// 	// 	},
	// 	// },

	// 	// optimizeDeps: {
	// 	// 	// Exclude all server packages from pre-bundling
	// 	// 	exclude: ["@de100/auth-core", "@de100/db"],

	// 	// 	// Only include truly universal packages
	// 	// 	include: [
	// 	// 		"zod", // if used on client and doesn't import Node.js modules
	// 	// 	],
	// 	// },
	// },
	// server: {
	// 	inlineDynamicImports: undefined,
	// 	// prerender: {
	// 	// 	crawlLinks: true,
	// 	// 	failOnError: true,
	// 	// },
	// 	// experimental: {
	// 	// 	asyncContext: true, // Disable async context for compatibility
	// 	// },
	// },
	middleware: "src/middleware/index.ts",
	ssr: true,
	vite: {
		build: {
			minify: false,
			target: 'esnext'
		}
	}
});
