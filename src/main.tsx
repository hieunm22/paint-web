import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { registerServiceWorker } from "common/pwa"
import "locales/i18n"
import App from "./App"
import { store } from "store"
import "./styles/reset.scss"
import "./styles/tokens.scss"
// only the two styles the registry uses; all.css would pull every Pro family.
import "@fortawesome/fontawesome-free/css/fontawesome.css"
import "@fortawesome/fontawesome-free/css/solid.css"
import "@fortawesome/fontawesome-free/css/regular.css"

registerServiceWorker()

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider store={store}>
			<App />
		</Provider>
	</StrictMode>,
)
