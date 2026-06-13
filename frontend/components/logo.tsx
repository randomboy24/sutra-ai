import type React from "react";

export const LogoIcon = (props: React.ComponentProps<"svg">) => (
	<svg
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		{...props}
	>
		{/* Facet 1: Left Ambient Outer */}
		<path d="M12 2 L4 12 L12 22 Z" fill="currentColor" fillOpacity={0.25} />
		{/* Facet 2: Right Ambient Outer */}
		<path d="M12 2 L20 12 L12 22 Z" fill="currentColor" fillOpacity={0.12} />
		{/* Facet 3: Left Core Diamond */}
		<path d="M12 5 L7 12 L12 19 Z" fill="currentColor" fillOpacity={0.55} />
		{/* Facet 4: Right Highlight Core */}
		<path d="M12 5 L17 12 L12 19 Z" fill="currentColor" fillOpacity={0.9} className="text-purple-500 dark:text-purple-400" />
	</svg>
);

export const Logo = (props: React.ComponentProps<"svg">) => (
	<svg
		viewBox="0 0 135 24"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		{...props}
	>
		{/* Icon Unit */}
		<g transform="translate(0, 0)">
			{/* Facet 1: Left Ambient Outer */}
			<path d="M12 2 L4 12 L12 22 Z" fill="currentColor" fillOpacity={0.25} />
			{/* Facet 2: Right Ambient Outer */}
			<path d="M12 2 L20 12 L12 22 Z" fill="currentColor" fillOpacity={0.12} />
			{/* Facet 3: Left Core Diamond */}
			<path d="M12 5 L7 12 L12 19 Z" fill="currentColor" fillOpacity={0.55} />
			{/* Facet 4: Right Highlight Core */}
			<path d="M12 5 L17 12 L12 19 Z" fill="currentColor" fillOpacity={0.9} className="text-purple-400 dark:text-purple-400" />
		</g>

		{/* Wordmark Unit */}
		<text
			x="30"
			y="17"
			fontFamily="Inter, system-ui, -apple-system, sans-serif"
			fontWeight="800"
			fontSize="15.5"
			letterSpacing="-0.035em"
			fill="currentColor"
		>
			Sutra
		</text>

		{/* Tag Unit */}
		<text
			x="72"
			y="15.5"
			fontFamily="JetBrains Mono, Menlo, Monaco, Consolas, monospace"
			fontWeight="700"
			fontSize="9.5"
			letterSpacing="0.08em"
			fill="currentColor"
			fillOpacity={0.8}
			className="text-purple-400"
		>
			AI
		</text>
	</svg>
);

