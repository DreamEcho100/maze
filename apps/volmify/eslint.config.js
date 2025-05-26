import baseConfig, { restrictEnvAccess } from "@de100/eslint-config/base";
import nextjsConfig from "@de100/eslint-config/nextjs";
import reactConfig from "@de100/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
	...baseConfig,
	...reactConfig,
	...nextjsConfig,
	...restrictEnvAccess,
	...baseConfig,
	{
		ignores: [".next/**"],
	},
];
