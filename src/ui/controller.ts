/**
 * Universal headless terminal UI controller.
 */

import type { WebTerminal } from "../terminal.js";
import { formatPath } from "../vfs/path.js";
import { CLEAR_SCREEN_SEQUENCE } from "../command/builtins/clear.js";
import {
    createControllerConfig,
    handleCommandSideEffects,
    type ControllerConfig,
} from "./command-action.js";
import { navigateHistoryState, type HistoryTracker } from "./history.js";
import { computeSuggestion, acceptSuggestion } from "./autosuggest.js";
import type {
    CursorStyle, PagerContentType, TerminalControllerOptions, TerminalLine,
    TerminalLineKind, TerminalPagerState, TerminalViewMode, TerminalViewState, Unsubscribe,
} from "./types.js";
import { computeCompletion } from "./completion.js";
import { dispatchKeyEvent } from "./keymap.js";
import { insertAt, deleteBackwardAt, deleteForwardAt } from "./buffer.js";
import { resolvePrompt, type PromptFormatter, type PromptStyle } from "./prompt.js";
import type { TerminalTheme } from "./theme.js";

/**
 * Headless state controller managing interactive terminal UI state.
 */
export class TerminalController {
    private readonly terminal: WebTerminal;
    private readonly config: ControllerConfig;
    private readonly lines: TerminalLine[];
    private readonly listeners: Set<(state: TerminalViewState) => void>;
    private readonly historyTracker: HistoryTracker;
    private input: string;
    private cursorIndex: number;
    private nextLineId: number;
    private viewMode: TerminalViewMode = "normal";
    private pager: TerminalPagerState | null = null;

    constructor(options: TerminalControllerOptions) {
        if (typeof options !== "object" || options === null) {
            throw new TypeError("Options must be a valid object.");
        }
        if (typeof options.terminal !== "object" || options.terminal === null) {
            throw new TypeError("Options.terminal must be a valid WebTerminal instance.");
        }

        this.terminal = options.terminal;
        this.config = createControllerConfig(options);
        this.lines = [];
        this.listeners = new Set();
        this.historyTracker = { index: -1, draft: "" };
        this.input = "";
        this.cursorIndex = 0;
        this.nextLineId = 1;
        if (options.welcomeBanner) {
            this.appendLine("system", options.welcomeBanner);
        }
    }

    public getState(): TerminalViewState {
        return {
            lines: [...this.lines],
            input: this.input,
            cursorIndex: this.cursorIndex,
            prompt: this.getPrompt(),
            viewMode: this.viewMode,
            pager: this.pager,
            cursorStyle: this.config.cursorStyle,
            theme: this.config.theme,
            suggestion: this.getSuggestion(),
        };
    }

    public getViewMode(): TerminalViewMode {
        return this.viewMode;
    }

    public getPager(): TerminalPagerState | null {
        return this.pager;
    }

    public enterPager(title: string, content: string, contentType: PagerContentType = "text"): void {
        if (typeof title !== "string" || typeof content !== "string") {
            throw new TypeError("Pager title and content must be strings.");
        }
        this.viewMode = "pager";
        this.pager = { title, content, contentType };
        this.notify();
    }

    public exitPager(): void {
        if (this.viewMode !== "normal" || this.pager !== null) {
            this.viewMode = "normal";
            this.pager = null;
            this.notify();
        }
    }

    public openFile(filePath: string): void {
        if (typeof filePath !== "string") {
            throw new TypeError("File path must be a string.");
        }
        this.input = `open ${filePath}`;
        this.submit();
    }

    public setPromptStyle(style: PromptStyle | PromptFormatter): void {
        if (!style) {
            throw new TypeError("Prompt style or formatter is required.");
        }
        this.config.promptStyle = style;
        this.notify();
    }

    public setCursorStyle(style: CursorStyle): void {
        if (typeof style !== "string") {
            throw new TypeError("Cursor style must be a string.");
        }
        this.config.cursorStyle = style;
        this.notify();
    }

    public setTheme(theme: string | TerminalTheme): void {
        if (!theme) {
            throw new TypeError("Theme is required.");
        }
        this.config.theme = theme;
        this.notify();
    }

    public getInput(): string {
        return this.input;
    }

    public getCursorIndex(): number {
        return this.cursorIndex;
    }

    public getSuggestion(): string {
        const history = this.terminal.getSession().getHistory();
        return computeSuggestion(this.input, history);
    }

    public acceptGhostSuggestion(): boolean {
        if (this.cursorIndex !== this.input.length) {
            return false;
        }
        const suggestion = this.getSuggestion();
        if (suggestion.length === 0) {
            return false;
        }
        const res = acceptSuggestion(this.input, suggestion);
        this.input = res.input;
        this.cursorIndex = res.cursor;
        this.notify();
        return true;
    }

    public subscribe(listener: (state: TerminalViewState) => void): Unsubscribe {
        if (typeof listener !== "function") {
            throw new TypeError("Listener must be a function.");
        }
        this.listeners.add(listener);
        listener(this.getState());
        return () => this.listeners.delete(listener);
    }

    public insertText(text: string): void {
        if (typeof text !== "string" || text.length === 0) return;
        const res = insertAt(this.input, this.cursorIndex, text);
        this.input = res.input;
        this.cursorIndex = res.cursor;
        this.notify();
    }

    public deleteBackward(): void {
        const res = deleteBackwardAt(this.input, this.cursorIndex);
        if (res.cursor !== this.cursorIndex) {
            this.input = res.input;
            this.cursorIndex = res.cursor;
            this.notify();
        }
    }

    public deleteForward(): void {
        const res = deleteForwardAt(this.input, this.cursorIndex);
        if (res.input !== this.input) {
            this.input = res.input;
            this.cursorIndex = res.cursor;
            this.notify();
        }
    }

    public setCursorIndex(index: number): void {
        const clamped = Math.max(0, Math.min(this.input.length, index));
        if (clamped !== this.cursorIndex) {
            this.cursorIndex = clamped;
            this.notify();
        }
    }

    public navigateHistory(direction: "up" | "down"): void {
        const history = this.terminal.getSession().getHistory();
        const res = navigateHistoryState(history, this.historyTracker, this.input, direction);
        if (res.input !== this.input || res.cursor !== this.cursorIndex) {
            this.input = res.input;
            this.cursorIndex = res.cursor;
            this.notify();
        }
    }

    public submit(): void {
        const cmd = this.input;
        const currentPrompt = this.getPrompt();
        this.appendLine("input", cmd, currentPrompt);

        this.input = "";
        this.cursorIndex = 0;
        this.historyTracker.index = -1;
        this.historyTracker.draft = "";

        if (cmd.trim().length === 0) {
            this.notify();
            return;
        }

        const result = this.terminal.execute(cmd);
        if (result.output === CLEAR_SCREEN_SEQUENCE) {
            this.clear();
        } else {
            if (result.output.length > 0) this.appendLine("output", result.output);
            if (result.error && result.error.length > 0) this.appendLine("error", result.error);
            if (result.exitCode === 0) {
                handleCommandSideEffects(cmd, this.terminal, this);
            }
        }
        this.notify();
    }

    public abort(): void {
        const currentPrompt = this.getPrompt();
        this.appendLine("input", `${this.input}^C`, currentPrompt);
        this.input = "";
        this.cursorIndex = 0;
        this.historyTracker.index = -1;
        this.historyTracker.draft = "";
        this.notify();
    }

    public clear(): void {
        this.lines.length = 0;
        this.notify();
    }

    public tabComplete(): void {
        const res = computeCompletion(this.input, this.cursorIndex, this.terminal);
        if (res.completedInput !== this.input || res.newCursorIndex !== this.cursorIndex) {
            this.input = res.completedInput;
            this.cursorIndex = res.newCursorIndex;
            this.notify();
        }
    }

    public handleKey(key: string, ctrlKey = false): boolean {
        return dispatchKeyEvent(this, key, ctrlKey);
    }

    private getPrompt(): string {
        const cur = this.terminal.getSession().getCurrentPath();
        const count = cur.components.length;
        const basename = count > 0 ? cur.components[count - 1]! : "~";
        return resolvePrompt(this.config.promptStyle, {
            cwd: formatPath(cur),
            basename,
            user: this.config.user,
            host: this.config.host,
        });
    }

    private appendLine(kind: TerminalLineKind, text: string, prompt?: string): void {
        this.lines.push({ id: this.nextLineId++, kind, text, prompt });
        if (this.lines.length > this.config.maxRenderedLines) {
            this.lines.shift();
        }
    }

    private notify(): void {
        const state = this.getState();
        this.listeners.forEach((listener) => listener(state));
    }
}
