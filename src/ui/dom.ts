/**
 * Universal DOM mounting adapter for WebTerminal.
 */

import type { TerminalController } from "./controller.js";
import type { TerminalLine, TerminalModalState, TerminalViewState, Unsubscribe } from "./types.js";
import { injectTerminalStyles } from "./styles.js";

/**
 * Options for mounting the terminal into a DOM element.
 */
export interface MountTerminalOptions {
    readonly autoFocus?: boolean | undefined;
    readonly injectStyles?: boolean | undefined;
    readonly onStateChange?: ((state: TerminalViewState) => void) | undefined;
}

function renderLineText(
    doc: Document,
    text: string,
    onFileClick?: (filename: string) => void
): HTMLElement {
    const span = doc.createElement("span");
    if (!onFileClick || (!text.includes(".txt") && !text.includes(".md"))) {
        span.textContent = text;
        return span;
    }

    const tokens = text.split(/(\s+)/);
    const count = tokens.length;
    for (let idx = 0; idx < count; idx++) {
        const token = tokens[idx]!;
        const clean = token.replace(/^[├──└──│\s]+/, "").trim();
        if ((clean.endsWith(".txt") || clean.endsWith(".md")) && !clean.includes("/")) {
            const link = doc.createElement("span");
            link.className = "wt-file-link";
            link.textContent = token;
            link.onclick = (ev) => {
                ev.stopPropagation();
                onFileClick(clean);
            };
            span.appendChild(link);
        } else {
            span.appendChild(doc.createTextNode(token));
        }
    }
    return span;
}

function createLineElement(
    doc: Document,
    line: TerminalLine,
    onFileClick?: (filename: string) => void
): HTMLElement {
    const div = doc.createElement("div");
    div.className = `wt-line wt-line-${line.kind}`;

    if (line.prompt) {
        const promptSpan = doc.createElement("span");
        promptSpan.className = "wt-prompt";
        promptSpan.textContent = line.prompt;
        div.appendChild(promptSpan);
    }

    div.appendChild(renderLineText(doc, line.text, onFileClick));
    return div;
}

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
    activeRow.appendChild(doc.createTextNode(beforeText));

    const cursorSpan = doc.createElement("span");
    cursorSpan.className = "wt-cursor";
    activeRow.appendChild(cursorSpan);

    activeRow.appendChild(doc.createTextNode(afterText));
}

function createModalWindow(
    doc: Document,
    modal: TerminalModalState,
    onClose: () => void
): HTMLElement {
    const win = doc.createElement("div");
    win.className = "wt-modal-window";

    const header = doc.createElement("div");
    header.className = "wt-modal-header";

    const title = doc.createElement("span");
    title.textContent = modal.title;
    header.appendChild(title);

    const closeBtn = doc.createElement("button");
    closeBtn.className = "wt-modal-close";
    closeBtn.textContent = "✕";
    closeBtn.onclick = () => onClose();
    header.appendChild(closeBtn);

    const body = doc.createElement("div");
    body.className = "wt-modal-body";
    body.textContent = modal.content;

    win.appendChild(header);
    win.appendChild(body);
    return win;
}

function renderModalElement(
    doc: Document,
    container: HTMLElement,
    modal: TerminalModalState | null | undefined,
    onClose: () => void
): void {
    const existing = container.querySelector(".wt-modal-backdrop");
    if (existing) {
        existing.remove();
    }
    if (!modal) {
        return;
    }

    const backdrop = doc.createElement("div");
    backdrop.className = "wt-modal-backdrop";
    backdrop.onclick = (event) => {
        if (event.target === backdrop) onClose();
    };

    backdrop.appendChild(createModalWindow(doc, modal, onClose));
    container.appendChild(backdrop);
}

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

    const onFileClick = (filename: string): void => {
        controller.openFile(filename);
    };

    const unsubscribe = controller.subscribe((state) => {
        linesBox.innerHTML = "";
        const lineCount = state.lines.length;
        for (let idx = 0; idx < lineCount; idx++) {
            linesBox.appendChild(createLineElement(doc, state.lines[idx]!, onFileClick));
        }
        updateActiveInput(doc, activeRow, state);
        renderModalElement(doc, container, state.activeModal, () => controller.closeModal());
        container.scrollTop = container.scrollHeight;
        options?.onStateChange?.(state);
    });

    const onKeyDown = (event: KeyboardEvent): void => {
        const isHandled = controller.handleKey(event.key, event.ctrlKey || event.metaKey);
        if (isHandled) {
            event.preventDefault();
        }
    };

    container.addEventListener("keydown", onKeyDown);
    container.addEventListener("click", () => container.focus());

    if (options?.autoFocus !== false) {
        container.focus();
    }

    return () => {
        unsubscribe();
        container.removeEventListener("keydown", onKeyDown);
        container.classList.remove("wt-container");
        container.innerHTML = "";
    };
}
