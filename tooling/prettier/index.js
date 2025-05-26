import { fileURLToPath } from "node:url";

/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */
/** @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */

/** @type { PrettierConfig | SortImportsConfig | TailwindConfig } */
const config = {
	// Core Prettier options
	semi: true,
	singleQuote: false,
	quoteProps: "as-needed",
	arrowParens: "always",
	bracketSpacing: true,
	jsxBracketSameLine: true,
	jsxSingleQuote: false,
	endOfLine: "auto",
	tabWidth: 2,
	useTabs: true,
	trailingComma: "all",
	printWidth: 100,

	// Prettier plugins
	plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
	tailwindConfig: fileURLToPath(new URL("../../tooling/tailwind/web.ts", import.meta.url)),

	// Tailwind plugin options
	tailwindFunctions: ["cn", "cva"],

	// Sort imports plugin options
	importOrder: [
		"<TYPES>",
		"^(react/(.*)$)|^(react$)|^(react-native(.*)$)",
		"^(next/(.*)$)|^(next$)",
		"^(expo(.*)$)|^(expo$)",
		"<THIRD_PARTY_MODULES>",
		"",
		"<TYPES>^@de100",
		"^@de100/(.*)$",
		"",
		"<TYPES>^[.|..|~]",
		"^#",
		"^~/",
		"^[../]",
		"^[./]",
	],
	importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
	importOrderTypeScriptVersion: "4.4.0",

	// File-specific overrides
	overrides: [
		{
			files: "*.json.hbs",
			options: {
				parser: "json",
			},
		},
		{
			files: "*.js.hbs",
			options: {
				parser: "babel",
			},
		},
	],
};

export default config;
