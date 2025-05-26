import baseConfig from "@de100/eslint-config/base";
import reactConfig from "@de100/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
	{
		ignores: [".expo/**", "expo-plugins/**"],
	},
	...baseConfig,
	...reactConfig,
];
