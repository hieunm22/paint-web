// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Provider } from "react-redux"
import {
	afterEach,
	describe,
	expect,
	it,
} from "vitest"
import { Ribbon } from "components/Ribbon"
import { useDismissMenus } from "hooks/useDismissMenus"
import "locales/i18n"
import { store } from "store"
import { setTool } from "store/slices/toolSlice"
import { closeMenu, setTab } from "store/slices/uiSlice"

/** the tool a fresh app starts on, read before any test has moved it. */
const FIRST_TOOL = store.getState().tool.active

/** the strip plus the dismissal the app shell wires around it. */
function Harness() {
	useDismissMenus()
	return <Ribbon />
}

function mount() {
	// the store is one instance for the whole run; each test puts it back where
	// a fresh app would have left it
	store.dispatch(setTab("home"))
	store.dispatch(setTool(FIRST_TOOL))
	store.dispatch(closeMenu())

	return render(
		<Provider store={store}>
			<Harness />
		</Provider>,
	)
}

afterEach(cleanup)

describe("the ribbon", () => {
	it("opens on the rectangular selection, not on a drawing tool", () => {
		const { container } = mount()

		const select = container.querySelector(".ribbon-split__top[title='Select']")
		const pencil = screen.getByRole("button", { name: "Pencil" })
		expect(FIRST_TOOL).toBe("select-rect")
		expect(select?.className).toContain("ribbon-btn--selected")
		expect(pencil.getAttribute("aria-pressed")).toBe("false")
	})

	it("moves the pressed state onto the tool that was clicked", async () => {
		const user = userEvent.setup()
		mount()

		const pencil = screen.getByRole("button", { name: "Pencil" })
		const eraser = screen.getByRole("button", { name: "Eraser" })

		await user.click(pencil)
		expect(pencil.getAttribute("aria-pressed")).toBe("true")
		expect(eraser.getAttribute("aria-pressed")).toBe("false")

		await user.click(eraser)

		expect(pencil.getAttribute("aria-pressed")).toBe("false")
		expect(eraser.getAttribute("aria-pressed")).toBe("true")
	})

	it("closes an open menu on Escape and hands the button its focus back", async () => {
		const user = userEvent.setup()
		const { container } = mount()

		// both halves of a split button answer to the label; only one opens a menu
		const opener = container.querySelector<HTMLButtonElement>(
			".ribbon-split__bottom",
		)
		if (!opener) throw new Error("the Select split button is not on the strip")

		await user.click(opener)
		expect(opener.getAttribute("aria-expanded")).toBe("true")
		expect(screen.getByRole("menu")).toBeDefined()

		await user.keyboard("{Escape}")

		expect(opener.getAttribute("aria-expanded")).toBe("false")
		expect(document.activeElement).toBe(opener)
	})

	it("keeps one button in the tab order and walks the rest with the arrows", async () => {
		const user = userEvent.setup()
		const { container } = mount()

		const toolbar = container.querySelector(".ribbon__content")
		const buttons = [
			...(toolbar?.querySelectorAll<HTMLButtonElement>(
				"button:not(:disabled)",
			) ?? []),
		]
		const reachable = buttons.filter(b => b.tabIndex === 0)
		expect(reachable).toHaveLength(1)
		expect(reachable[0]).toBe(buttons[0])

		buttons[0].focus()
		await user.keyboard("{ArrowRight}")
		expect(document.activeElement).toBe(buttons[1])

		await user.keyboard("{ArrowLeft}")
		expect(document.activeElement).toBe(buttons[0])
	})
})
