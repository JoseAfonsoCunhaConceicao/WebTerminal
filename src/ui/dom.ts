/**
 * Universal DOM mounting adapter for WebTerminal.
 */

import type { TerminalController } from "./controller.js";
import type { TerminalLine, TerminalViewState, Unsubscribe } from "./types.js";
import { injectTerminalStyles } from "./styles.js";

/**
 * Options for mounting the terminal into a DOM element.
 */
export interface MountTerminalOptions {
    readonly autoFocus?: boolean | undefined;
    readonly injectStyles?: boolean | undefined;
    readonly onStateChange?: ((state: TerminalViewState) => void) | undefined;
}

/**
 * Creates and renders a static terminal line element.
 */
function createLineElement(doc: Document, line: TerminalLine): HTMLElement {
    const div = doc.createElement("div");
    div.className = `wt-line wt-line-${line.kind}`;

    if (line.prompt) {
        const promptSpan = doc.createElement("span");
        promptSpan.className = "wt-prompt";
        promptSpan.textContent = line.prompt;
        div.appendChild(promptSpan);
    }

    const textSpan = doc.createElement("span");
    textSpan.textContent = line.text;
    div.appendChild(textSpan);
    return div;
}

/**
 * Updates the active prompt, input buffer, and blinking cursor display.
 */
function updateActiveInput(
    doc: Document,
    activeRow: HTMLElement,
    state: TerminalViewState
): void {
    activeRow.innerHTML = "";

    const promptSpan = doc.createElement("span");
    promptSpan.className = "wt-prompt-active";
    promptSpan.textContent = state.prompt;
    activeRow.appendChild(promptSpan);

    const beforeText = state.input.slice(0, state.cursorIndex);
    const afterText = state.input.slice(state.cursorIndex);

    const beforeNode = doc.createTextNode(beforeText);
    activeRow.appendChild(beforeNode);

    const cursorSpan = doc.createElement("span");
    cursorSpan.className = "wt-cursor";
    activeRow.appendChild(cursorSpan);

    const afterNode = doc.createTextNode(afterText);
    activeRow.appendChild(afterNode);
}

/**
 * Mounts an interactive terminal into any DOM element container.
 *
 * @param container - Target HTMLElement container.
 * @param controller - TerminalController instance.
 * @param options - Optional configuration options.
 *
 * @returns An unmount cleanup function.
 */
export function mountTerminal(
    container: HTMLElement,
    controller: TerminalController,
    options?: MountTerminalOptions
): Unsubscribe {
    if (typeof container !== "object" || container === null || typeof container.appendChild !== "function") {
        throw new TypeError("Container must be a valid HTMLElement.");
    }
    if (typeof controller !== "object" || controller === null) {
        throw new TypeError("Controller must be a valid TerminalController instance.");
    }

    const doc = container.ownerDocument ?? document;
    if (options?.injectStyles !== false) {
        injectTerminalStyles(doc);
    }

    container.classList.add("wt-container");
    container.setAttribute("tabindex", "0");

    const linesBox = doc.createElement("div");
    const activeRow = doc.createElement("div");
    activeRow.className = "wt-active-row";

    container.appendChild(linesBox);
    container.appendChild(activeRow);

    const unsubscribe = controller.subscribe((state) => {
        linesBox.innerHTML = "";
        const lineCount = state.lines.length;
        for (let idx = 0; idx < lineCount; idx++) {
            linesBox.appendChild(createLineElement(doc, state.lines[idx]!));
        }
        updateActiveInput(doc, activeRow, state);
        container.scrollTop = container.scrollHeight;
        options?.onStateChange?.(state);
    });

    const onKeyDown = (event: KeyboardEvent): void => {
        const isHandled = controller.handleKey(event.key, event.ctrlKey || event.metaKey);
        if (isHandled) {
            event.preventDefault();
        }
    };

    const onClick = (): void => {
        container.focus();
    };

    container.addEventListener("keydown", onKeyDown);
    container.addEventListener("click", onClick);

    if (options?.autoFocus !== false) {
        container.focus();
    }

    return () => {
        unsubscribe();
        container.removeEventListener("keydown", onKeyDown);
        container.removeEventListener("click", onClick);
        container.classList.remove("wt-container");
        container.innerHTML = "";
    };
}

