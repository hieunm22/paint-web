import { config } from "@fortawesome/fontawesome-svg-core"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { store } from "store"
import App from "./App"
import "./styles/reset.scss"
import "./styles/tokens.scss"
import "@fortawesome/fontawesome-svg-core/styles.css"

// FA css is imported explicitly above, need to disable autoAddCss to avoid duplicates.
config.autoAddCss = false

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider store={store}>
			<App />
		</Provider>
	</StrictMode>,
)
