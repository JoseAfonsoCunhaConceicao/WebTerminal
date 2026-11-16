/**
 * WebTerminal — Public API Entry Point
 */

// Terminal Facade
export { WebTerminal } from "./terminal.js";
export type { WebTerminalOptions } from "./terminal.js";

// Virtual Filesystem (VFS)
export type { File, Directory, Node } from "./vfs/node.js";
export { freezeVFS } from "./vfs/node.js";
export { lookup, findNode } from "./vfs/lookup.js";
export type { LookupResult } from "./vfs/lookup.js";
export { PathNotFoundError, NotADirectoryError } from "./vfs/errors.js";

// Paths
export type { Path } from "./vfs/path.js";
export {
    parsePath,
    normalizePath,
    joinPath,
    resolvePath,
    formatPath,
} from "./vfs/path.js";

// Session
export { Session, DEFAULT_MAX_HISTORY_ENTRIES } from "./session/session.js";

// UI & Built-in Constants
export { CLEAR_SCREEN_SEQUENCE } from "./command/builtins/clear.js";
export { DEFAULT_USER } from "./command/builtins/whoami.js";

// Universal Presentation Layer
export { TerminalController } from "./ui/controller.js";
export { computeCompletion } from "./ui/completion.js";
export { computeSuggestion, acceptSuggestion } from "./ui/autosuggest.js";
export { dispatchKeyEvent } from "./ui/keymap.js";
export { mountTerminal } from "./ui/dom.js";
export type { MountTerminalOptions } from "./ui/dom.js";
export { injectTerminalStyles, TERMINAL_CSS } from "./ui/styles.js";
export { renderMarkdown } from "./ui/markdown.js";
export { highlightCode } from "./ui/highlight/index.js";
export {
    THEME_GHOSTTY,
    THEME_GITHUB_DARK,
    THEME_DRACULA,
    THEME_MONOKAI,
    listThemes,
    getTheme,
    applyTheme,
} from "./ui/theme.js";
export type { TerminalTheme, ThemeColors, ThemeChrome } from "./ui/theme.js";
export {
    formatClassicPrompt,
    formatRobbyrussellPrompt,
    formatMinimalPrompt,
    resolvePrompt,
} from "./ui/prompt.js";
export type { PromptContext, PromptStyle, PromptFormatter } from "./ui/prompt.js";
export {
    insertAt,
    deleteBackwardAt,
    deleteForwardAt,
} from "./ui/buffer.js";
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
} from "./ui/types.js";

// Command & Execution Pipeline
export type { CommandResult } from "./command/result.js";
export { successResult, errorResult } from "./command/result.js";
export type { CommandInvocation } from "./command/invocation.js";
export type { TokenizerError, TokenizerErrorCode } from "./command/errors.js";
export type { ExecutionContext } from "./command/context.js";
export type { CommandHandler, CommandRegistry } from "./command/registry.js";
export { createCommandRegistry } from "./command/registry.js";
export {
    executeInvocation,
    executeLine,
    MAX_COMMAND_LINE_LENGTH,
} from "./command/executor.js";
export { tokenize } from "./command/tokenizer.js";
export { parseCommand } from "./command/parser.js";
export { registerBuiltinCommands } from "./command/builtins/index.js";
export { openCommand } from "./command/builtins/open.js";
export { themeCommand } from "./command/builtins/theme.js";
export {
    getManualPage,
    searchManualPages,
} from "./command/manual.js";
export type { ManualPage } from "./command/manual.js";
