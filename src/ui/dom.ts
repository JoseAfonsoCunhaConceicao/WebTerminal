/**
 * Universal DOM mounting adapter for WebTerminal.
 */

import type { TerminalController } from "./controller.js";
import type { TerminalLine, TerminalPagerState, TerminalViewState, Unsubscribe } from "./types.js";
import { injectTerminalStyles } from "./styles.js";
import { renderMarkdown } from "./markdown.js";

/**
 * Options for mounting the terminal into a DOM element.
 */
export interface MountTerminalOptions {
    readonly autoFocus?: boolean | undefined;
    readonly injectStyles?: boolean | undefined;
    readonly onStateChange?: ((state: TerminalViewState) => void) | undefined;
}

const CLICKABLE_FILE_PATTERN = /\.(txt|rtf|md|markdown|png|jpg|jpeg|gif|svg|webp|pdf|zip|tar|gz|mp3|wav|mp4|webm|js|ts|json|py|sh|css|html|sql|url)$/i;

function renderLineText(
    doc: Document,
    text: string,
    onFileClick?: (filename: string) => void
): HTMLElement {
    const span = doc.createElement("span");
    if (!onFileClick || !text.includes(".")) {
        span.textContent = text;
        return span;
    }

    const tokens = text.split(/(\s+)/);
    const count = tokens.length;
    for (let idx = 0; idx < count; idx++) {
        const token = tokens[idx]!;
        const clean = token.replace(/^[├──└──│\s]+/, "").trim();
        const isClickable = CLICKABLE_FILE_PATTERN.test(clean) && !clean.includes("/");
        if (isClickable) {
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

function renderPagerView(
    doc: Document,
    pagerBox: HTMLElement,
    pager: TerminalPagerState
): void {
    pagerBox.innerHTML = "";

    const header = doc.createElement("div");
    header.className = "wt-pager-header";
    const titleSpan = doc.createElement("span");
    const label = pager.contentType === "text" ? "view" : `view (${pager.contentType})`;
    titleSpan.textContent = `[ ${label}: ${pager.title} ]`;
    const exitSpan = doc.createElement("span");
    exitSpan.textContent = "Press [q] or [Esc] to exit";
    header.appendChild(titleSpan);
    header.appendChild(exitSpan);

    const body = doc.createElement("div");
    body.className = "wt-pager-body";
    if (pager.contentType === "markdown") {
        body.innerHTML = renderMarkdown(pager.content);
    } else {
        const pre = doc.createElement("pre");
        pre.className = "wt-pager-text";
        pre.textContent = pager.content;
        body.appendChild(pre);
    }

    pagerBox.appendChild(header);
    pagerBox.appendChild(body);
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
    const pagerBox = doc.createElement("div");
    pagerBox.className = "wt-pager";
    pagerBox.style.display = "none";

    container.appendChild(linesBox);
    container.appendChild(activeRow);
    container.appendChild(pagerBox);

    const onFileClick = (filename: string): void => {
        controller.openFile(filename);
    };

    const unsubscribe = controller.subscribe((state) => {
        if (state.viewMode === "pager" && state.pager) {
            linesBox.style.display = "none";
            activeRow.style.display = "none";
            pagerBox.style.display = "flex";
            renderPagerView(doc, pagerBox, state.pager);
            options?.onStateChange?.(state);
            return;
        }

        pagerBox.style.display = "none";
        linesBox.style.display = "";
        activeRow.style.display = "flex";

        linesBox.innerHTML = "";
        const lineCount = state.lines.length;
        for (let idx = 0; idx < lineCount; idx++) {
            linesBox.appendChild(createLineElement(doc, state.lines[idx]!, onFileClick));
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
