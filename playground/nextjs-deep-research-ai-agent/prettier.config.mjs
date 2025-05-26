import { fileURLToPath } from "node:url";

import defaultConfig from "@de100/prettier-config";

export default {
	...defaultConfig,
	tailwindStylesheet: fileURLToPath(new URL("./src/styles/globals.css", import.meta.url)),
	tailwindConfig: fileURLToPath(new URL("./src/styles/globals.css", import.meta.url)),
};
