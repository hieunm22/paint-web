import type { StorybookConfig } from "@storybook/react-vite"

/**
 * the builder loads the project's own vite.config.ts: a story resolves the root
 * specifiers and compiles scss exactly as the app does.
 */
const config: StorybookConfig = {
	stories: ["../src/**/stories.tsx"],
	addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
	framework: { name: "@storybook/react-vite", options: {} },
}

export default config
