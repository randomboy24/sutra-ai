"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

export function useTheme() {
	const [theme, setTheme] = useState<Theme>(() => {
		// Default to system preference or saved value
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("theme") as Theme | null;
			if (saved === "light" || saved === "dark") {
				return saved;
			}
			const systemPrefersDark = window.matchMedia(
				"(prefers-color-scheme: dark)"
			).matches;
			return systemPrefersDark ? "dark" : "light";
		}
		return "light";
	});

	useEffect(() => {
		const root = window.document.documentElement;
		if (theme === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
		localStorage.setItem("theme", theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prev) => (prev === "dark" ? "light" : "dark"));
	};

	return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}
