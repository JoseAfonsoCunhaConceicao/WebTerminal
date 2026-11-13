/**
 * Public exports for the universal terminal UI presentation layer.
 */

export { TerminalController } from "./controller.js";
export { computeCompletion } from "./completion.js";
export { dispatchKeyEvent } from "./keymap.js";
export { mountTerminal } from "./dom.js";
export type { MountTerminalOptions } from "./dom.js";
export { injectTerminalStyles, TERMINAL_CSS } from "./styles.js";
export {
    insertAt,
    deleteBackwardAt,
    deleteForwardAt,
} from "./buffer.js";
export type {
    TerminalLineKind,
    TerminalLine,
    TerminalViewState,
    TerminalControllerOptions,
    CompletionResult,
    Unsubscribe,
} from "./types.js";

