import reactPlugin from "eslint-plugin-react";
import compilerPlugin from "eslint-plugin-react-compiler";
import hooksPlugin from "eslint-plugin-react-hooks";

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
	{
		files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
		plugins: {
			react: reactPlugin,
			"react-compiler": compilerPlugin,
			"react-hooks": hooksPlugin,
		},
		rules: {
			...reactPlugin.configs["jsx-runtime"].rules,
			...hooksPlugin.configs.recommended.rules,
			"react-compiler/react-compiler": "error",
		},
		languageOptions: {
			globals: {
				React: "writable",
			},
		},
	},
];
