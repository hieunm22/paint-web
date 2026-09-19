import { useDispatch, useSelector, useStore } from "react-redux"
import type { AppDispatch, AppStore, RootState } from "./index"

/**
 * typed react-redux hooks. they live apart from configureStore because the
 * engine imports the store and must not pull react into its module graph.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()

/** the store itself, for a callback that must read state without subscribing. */
export const useAppStore = useStore.withTypes<AppStore>()
