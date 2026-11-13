/**
 * Stylesheet and theme injection for WebTerminal display.
 */

/**
 * Standard CSS rules with customizable CSS variables.
 */
export const TERMINAL_CSS = `
.wt-container {
    position: relative;
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
.wt-file-link {
    text-decoration: underline;
    cursor: pointer;
    color: var(--wt-link-color, #58a6ff);
}
.wt-file-link:hover {
    color: var(--wt-link-hover-color, #79c0ff);
}
.wt-pager {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background-color: var(--wt-bg, #0d1117);
    color: var(--wt-fg, #c9d1d9);
    box-sizing: border-box;
}
.wt-pager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    background-color: var(--wt-pager-header-bg, #161b22);
    border-bottom: 1px solid var(--wt-pager-border, #30363d);
    font-size: 12px;
    font-weight: 600;
    color: var(--wt-prompt-color, #2ea043);
    user-select: none;
}
.wt-pager-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    font-family: inherit;
    font-size: var(--wt-font-size, 14px);
    line-height: var(--wt-line-height, 1.6);
    box-sizing: border-box;
}
.wt-pager-text {
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
}
.wt-md-h1 { font-size: 1.4em; margin: 0 0 10px 0; color: #f0f6fc; border-bottom: 1px solid #30363d; padding-bottom: 4px; }
.wt-md-h2 { font-size: 1.2em; margin: 10px 0 6px 0; color: #f0f6fc; }
.wt-md-h3 { font-size: 1.05em; margin: 8px 0 4px 0; color: #f0f6fc; }
.wt-md-p { margin: 0 0 8px 0; }
.wt-md-quote { border-left: 3px solid #58a6ff; padding-left: 12px; margin: 8px 0; color: #8b949e; }
.wt-md-code { background: rgba(110, 118, 129, 0.2); padding: 2px 4px; border-radius: 4px; font-family: inherit; font-size: 0.9em; }
.wt-md-pre { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 12px; overflow-x: auto; margin: 8px 0; }
.wt-md-pre code { background: none; padding: 0; }
.wt-md-li { margin-left: 20px; margin-bottom: 4px; }
.wt-md-hr { border: none; border-top: 1px solid #30363d; margin: 12px 0; }
.wt-md-link { color: #58a6ff; text-decoration: underline; }
.wt-md-empty { height: 8px; }
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

