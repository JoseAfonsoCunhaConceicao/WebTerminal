/**
 * Type definitions for the universal headless terminal UI controller.
 */

import type { WebTerminal } from "../terminal.js";

/**
 * Categorization of terminal display lines.
 */
export type TerminalLineKind = "input" | "output" | "error" | "system";

/**
 * Represents a single line rendered in the terminal output.
 */
export interface TerminalLine {
    readonly id: number;
    readonly kind: TerminalLineKind;
    readonly text: string;
    readonly prompt?: string | undefined;
}

/**
 * Immutable snapshot of the terminal's visible state.
 */
export interface TerminalViewState {
    readonly lines: readonly TerminalLine[];
    readonly input: string;
    readonly cursorIndex: number;
    readonly prompt: string;
}

/**
 * Configuration options for creating a TerminalController.
 */
export interface TerminalControllerOptions {
    readonly terminal: WebTerminal;
    readonly user?: string | undefined;
    readonly host?: string | undefined;
    readonly maxRenderedLines?: number | undefined;
    readonly welcomeBanner?: string | undefined;
}

/**
 * Result returned by the tab completion engine.
 */
export interface CompletionResult {
    readonly completedInput: string;
    readonly newCursorIndex: number;
    readonly candidates: readonly string[];
}

/**
 * Unsubscribe callback for state listeners.
 */
export type Unsubscribe = () => void;

