// Credit to <https://stackoverflow.com/a/73883783/13961420>

import path from "path";
import { defineConfig } from "tsup";

export default defineConfig([
	{
		clean: true,
		dts: true,
		minify: true,
		entry: ["./src/**", "!src/**/*.md"],
		// Credit to: <https://stackoverflow.com/a/74604287/13961420>
		esbuildOptions(options) {
			options.loader = {
				".md": "text",
			};
			options.plugins = [
				{
					name: "ignore-md",
					setup(build) {
						build.onLoad({ filter: /\.md$/ }, () => ({
							contents: "",
						}));
					},
				},
				{
					name: "ignore-md",
					setup(build) {
						build.onResolve({ filter: /\.md$/ }, (args) => ({
							path: args.path,
							namespace: "ignore-md",
						}));
						build.onLoad({ filter: /.*/, namespace: "ignore-md" }, () => ({
							contents: "export default ''",
						}));
					},
				},
			];

			options.alias = {
				"#schema": "./src/schema", // adjust to your actual path
			};
		},
		format: ["esm"],
		sourcemap: true,
		tsconfig: path.resolve(process.cwd(), "./tsconfig.json"),
		outDir: "dist",
	},
]);
