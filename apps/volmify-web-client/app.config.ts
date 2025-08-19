// import commonjs from "vite-plugin-commonjs"; // @rollup/plugin-commonjs
// import commonjs from "@rollup/plugin-commonjs";

import commonjs from "@rollup/plugin-commonjs";
import { defineConfig } from "@solidjs/start/config";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
	vite: {
		plugins: [/** @type {any} */ (topLevelAwait() as any), commonjs()],

		// ✅ Don't prebundle server-only packages
		optimizeDeps: {
			exclude: [
				"@de100/db",
				"@node-rs/argon2",
				"@node-rs/bcrypt",
				"oslo",
				// "@node-rs/argon2-wasm32-wasi",
			],
		},

		// ✅ Tell Vite SSR to use Node loader for these packages
		ssr: {
			external: ["@de100/db"],
			// noExternal: [
			// 	"@node-rs/argon2",
			// 	"@node-rs/bcrypt",
			// 	"oslo",
			// 	"@node-rs/argon2-wasm32-wasi",
			// ], // keep empty so they are truly external
			// Let Vite bundle everything
			// noExternal: ["@de100/db", "@de100/auth-core"],
		},

		// build: {
		// 	commonjsOptions: {
		// 		transformMixedEsModules: true,
		// 	},
		// 	sourcemap: true,
		// },
	},
	server: {
		// externals: {
		// 	external: [
		// 		"@node-rs/argon2",
		// 		"@node-rs/bcrypt",
		// 		"oslo",
		// 		"@node-rs/argon2-wasm32-wasi",
		// 	],
		// },
		// prerender: {
		// 	crawlLinks: true,
		// 	failOnError: true,
		// },
	},
	middleware: "src/middleware/index.ts",
	// server: {
	// 	routeRules: {
	// 		"/": { isr: { expiration: 300 } },
	// 		// "/perfect": { isr: { expiration: 300 } },
	// 		// "/perfect/make-sense": { isr: { expiration: 300 } },
	// 	},
	// },
	// ssr: true,
});
