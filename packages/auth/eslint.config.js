import baseConfig from "@de100/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
	...baseConfig,
	{
		ignores: ["./src/drizzle/**"],
		rules: {
			"@typescript-eslint/no-unsafe-assignment": "off",
		},
	},
];
