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
 * Display mode of the terminal interface.
 */
export type TerminalViewMode = "normal" | "pager";

/**
 * Kind of content presented inside the in-terminal pager.
 */
export type PagerContentType = "text" | "code" | "markdown";

/**
 * State of the in-terminal pager (nano / less style viewer).
 */
export interface TerminalPagerState {
    readonly title: string;
    readonly content: string;
    readonly contentType: PagerContentType;
}

/**
 * Immutable snapshot of the terminal's visible state.
 */
export interface TerminalViewState {
    readonly lines: readonly TerminalLine[];
    readonly input: string;
    readonly cursorIndex: number;
    readonly prompt: string;
    readonly viewMode: TerminalViewMode;
    readonly pager?: TerminalPagerState | null | undefined;
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

