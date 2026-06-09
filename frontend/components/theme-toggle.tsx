"use client";

import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();

	return (
		<Button
			onClick={toggleTheme}
			variant="ghost"
			size="icon"
			className="relative h-9 w-9 rounded-md border border-border/20 bg-background/50 hover:bg-muted dark:hover:bg-muted/50 text-foreground transition-all duration-300"
			aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
		>
			<span className="sr-only">Toggle theme</span>
			<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
			<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sky-400" />
		</Button>
	);
}
