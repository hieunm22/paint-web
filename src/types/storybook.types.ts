import type { RootState } from "store"

/** what a story preloads; a slice it leaves out keeps the app's own default. */
export type StoryState = {
	[Slice in keyof RootState]?: Partial<RootState[Slice]>
}
