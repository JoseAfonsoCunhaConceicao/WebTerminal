/**
 * Public exports for the universal terminal UI presentation layer.
 */

export { TerminalController } from "./controller.js";
export { computeCompletion } from "./completion.js";
export { computeSuggestion, acceptSuggestion } from "./autosuggest.js";
export { dispatchKeyEvent } from "./keymap.js";
export { mountTerminal } from "./dom.js";
export type { MountTerminalOptions } from "./dom.js";
export { injectTerminalStyles, TERMINAL_CSS } from "./styles.js";
export { renderMarkdown } from "./markdown.js";
export { highlightCode } from "./highlight/index.js";
export {
    THEME_GHOSTTY,
    THEME_GITHUB_DARK,
    THEME_DRACULA,
    THEME_MONOKAI,
    listThemes,
    getTheme,
    applyTheme,
} from "./theme.js";
export type { TerminalTheme, ThemeColors, ThemeChrome } from "./theme.js";
export {
    formatClassicPrompt,
    formatRobbyrussellPrompt,
    formatMinimalPrompt,
    resolvePrompt,
} from "./prompt.js";
export type { PromptContext, PromptStyle, PromptFormatter } from "./prompt.js";
export {
    insertAt,
    deleteBackwardAt,
    deleteForwardAt,
} from "./buffer.js";
export type {
    CursorStyle,
    TerminalLineKind,
    TerminalLine,
    TerminalViewMode,
    TerminalPagerState,
    TerminalViewState,
    TerminalControllerOptions,
    CompletionResult,
    Unsubscribe,
} from "./types.js";
