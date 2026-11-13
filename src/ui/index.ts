/**
 * Public exports for the universal terminal UI presentation layer.
 */

export { TerminalController } from "./controller.js";
export { computeCompletion } from "./completion.js";
export { dispatchKeyEvent } from "./keymap.js";
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

