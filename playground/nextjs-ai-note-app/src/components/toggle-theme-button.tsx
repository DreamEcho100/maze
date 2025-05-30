import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@de100/ui/components/button";

export default function ThemeToggleButton() {
	const { theme, setTheme } = useTheme();

	return (
		<Button
			variant="outline"
			size="icon"
			className="rounded-full"
			onClick={() => {
				if (theme === "dark") {
					setTheme("light");
				} else {
					setTheme("dark");
				}
			}}
		>
			<Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
			<Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
