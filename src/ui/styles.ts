/**
 * Stylesheet and theme injection for WebTerminal display.
 */

/**
 * Standard CSS rules with customizable CSS variables.
 */
export const TERMINAL_CSS = `
.wt-container {
    background-color: var(--wt-bg, #0d1117);
    color: var(--wt-fg, #c9d1d9);
    font-family: var(--wt-font, "SF Mono", "Fira Code", "JetBrains Mono", Menlo, Consolas, monospace);
    font-size: var(--wt-font-size, 14px);
    line-height: var(--wt-line-height, 1.5);
    padding: var(--wt-padding, 16px);
    overflow-y: auto;
    height: 100%;
    box-sizing: border-box;
    outline: none;
    cursor: text;
}
.wt-line {
    white-space: pre-wrap;
    word-break: break-word;
    margin-bottom: 2px;
}
.wt-line-input {
    color: var(--wt-input-color, #f0f6fc);
}
.wt-line-output {
    color: var(--wt-output-color, #c9d1d9);
}
.wt-line-error {
    color: var(--wt-error-color, #f85149);
}
.wt-line-system {
    color: var(--wt-system-color, #58a6ff);
}
.wt-prompt {
    color: var(--wt-prompt-color, #2ea043);
    font-weight: 600;
}
.wt-prompt-active {
    color: var(--wt-prompt-color, #2ea043);
    font-weight: 600;
    user-select: none;
    margin-right: 2px;
}
.wt-active-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    white-space: pre-wrap;
    word-break: break-word;
}
.wt-cursor {
    display: inline-block;
    width: 8px;
    height: 1.15em;
    background-color: var(--wt-cursor-color, #58a6ff);
    vertical-align: text-bottom;
    animation: wt-blink 1s step-end infinite;
}
@keyframes wt-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}
`;

/**
 * Injects default terminal styles into the specified document head.
 *
 * @param doc - Target Document object (defaults to global document).
 */
export function injectTerminalStyles(doc?: Document): void {
    const targetDoc = doc ?? (typeof document !== "undefined" ? document : undefined);
    if (!targetDoc || !targetDoc.head) {
        return;
    }

    const styleId = "wt-terminal-styles";
    if (targetDoc.getElementById(styleId)) {
        return;
    }

    const style = targetDoc.createElement("style");
    style.id = styleId;
    style.textContent = TERMINAL_CSS;
    targetDoc.head.appendChild(style);
}

