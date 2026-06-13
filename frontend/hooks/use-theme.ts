"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

function getPreferredTheme(): Theme {
	const saved = localStorage.getItem("theme") as Theme | null;
	if (saved === "light" || saved === "dark") {
		return saved;
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function useTheme() {
	const [theme, setTheme] = useState<Theme>("light");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setTheme(getPreferredTheme());
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;

		const root = window.document.documentElement;
		if (theme === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}

		localStorage.setItem("theme", theme);
	}, [mounted, theme]);

	const toggleTheme = () => {
		setMounted(true);
		setTheme((prev) => (prev === "dark" ? "light" : "dark"));
	};

	return { theme, setTheme, toggleTheme, isDark: theme === "dark", mounted };
}
