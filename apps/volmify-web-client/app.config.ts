import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
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
