import commonjs from "@rollup/plugin-commonjs";
import { defineConfig } from "@solidjs/start/config";
// import { visualizer } from "rollup-plugin-visualizer";
// import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
	vite: {
		esbuild: {
			supported: {
				"top-level-await": true, // Enable top-level await support
			},
		},
		plugins: [
			// /** @type {any} */ (topLevelAwait() as any),
			commonjs(),
			// visualizer({
			// 	filename: "dist/stats.html",
			// 	open: true,
			// 	gzipSize: true,
			// 	template: "treemap", // or "sunburst", "network"
			// }),
		],
	},
	server: {
		// prerender: {
		// 	crawlLinks: true,
		// 	failOnError: true,
		// },
		// experimental: {
		// 	asyncContext: true, // Disable async context for compatibility
		// },
	},
	middleware: "./src/middleware/index.ts",
	ssr: true,
});
