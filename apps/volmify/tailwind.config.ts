import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

import baseConfig from "@de100/tailwind-config/web";

export default {
	// We need to append the path to the UI package to the content array so that
	// those classes are included correctly.
	content: [...baseConfig.content, "../../packages/ui/src/*.{js,jsx,ts,tsx}"],
	presets: [baseConfig],
	theme: {
		extend: {
			fontFamily: {
				sans: ["var(--font-geist-sans)", ...defaultTheme.fontFamily.sans],
				mono: ["var(--font-geist-mono)", ...defaultTheme.fontFamily.mono],
			},
		},
	},
} satisfies Config;
