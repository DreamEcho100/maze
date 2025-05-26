import { useEffect, useState } from "react";

/**
 * Custom React hook to detect if the screen is in mobile view.
 * @param maxWidth Max width in pixels to be considered mobile (default: 768)
 * @returns Whether the screen is considered mobile
 */
export function useIsMobile(maxWidth = 768): boolean {
	const [isMobile, setIsMobile] = useState(() => {
		if (typeof window === "undefined") return false;
		return window.matchMedia(`(max-width: ${maxWidth}px)`).matches;
	});

	useEffect(() => {
		if (typeof window === "undefined") return;

		const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`);
		const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

		// Initial check
		setIsMobile(mediaQuery.matches);

		// Listen for changes
		mediaQuery.addEventListener("change", handleChange);

		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [maxWidth]);

	return isMobile;
}
