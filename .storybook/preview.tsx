import { configureStore } from "@reduxjs/toolkit"
import type { Decorator, Preview } from "@storybook/react-vite"
import { useEffect, useMemo } from "react"
import { Provider } from "react-redux"
import { LANGUAGES } from "common/constant"
import { setLanguage } from "locales/i18n"
import { reducer, store, type RootState } from "store"
import type { Language } from "types/locales.types"
import type { StoryState } from "types/storybook.types"
import "../src/styles/reset.scss"
import "../src/styles/tokens.scss"
import "./preview.scss"
// the two styles the icon registry uses, as main.tsx loads them
import "@fortawesome/fontawesome-pro/css/fontawesome.css"
import "@fortawesome/fontawesome-pro/css/solid.css"
import "@fortawesome/fontawesome-pro/css/regular.css"

/** every slice at its own default, the ground a story's overrides sit on. */
const emptyStore = configureStore({ reducer })
const baseState = emptyStore.getState()

/** a slice a story leaves out keeps the default it was built with. */
function merged(state: StoryState): RootState {
	const next = { ...baseState } as Record<string, object>
	for (const [slice, patch] of Object.entries(state)) {
		next[slice] = { ...next[slice], ...patch }
	}

	return next as RootState
}

/**
 * the app's own store keeps the one engine instance and the interface in step;
 * a story naming `state` is given a store of its own instead.
 */
function storeFor(state: StoryState | undefined) {
	if (!state) return store

	const preloadedState = merged(state)

	return configureStore({ reducer, preloadedState })
}

const withStore: Decorator = (Story, { parameters }) => {
	const state = parameters.state as StoryState | undefined
	const storyStore = useMemo(() => storeFor(state), [state])

	return (
		<Provider store={storyStore}>
			<Story />
		</Provider>
	)
}

/** the toolbar switch: every screen can be read in both languages. */
const withLanguage: Decorator = (Story, { globals }) => {
	useEffect(() => {
		setLanguage(globals.language as Language)
	}, [globals.language])

	return <Story />
}

const preview: Preview = {
	decorators: [withStore, withLanguage],
	globalTypes: {
		language: {
			toolbar: {
				icon: "globe",
				items: LANGUAGES.map(language => ({
					value: language.id,
					title: language.id,
				})),
				dynamicTitle: true,
			},
		},
	},
	initialGlobals: { language: "en" },
	parameters: {
		layout: "centered",
		controls: { matchers: { color: /(color|hex)$/i } },
	},
	tags: ["autodocs"],
}

export default preview
