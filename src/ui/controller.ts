/**
 * Universal headless terminal UI controller.
 */

import type { WebTerminal } from "../terminal.js";
import { formatPath } from "../vfs/path.js";
import { CLEAR_SCREEN_SEQUENCE } from "../command/builtins/clear.js";
import { DEFAULT_USER } from "../command/builtins/whoami.js";
import type {
    TerminalControllerOptions,
    TerminalLine,
    TerminalLineKind,
    TerminalViewState,
    Unsubscribe,
} from "./types.js";
import { computeCompletion } from "./completion.js";
import { dispatchKeyEvent } from "./keymap.js";
import { insertAt, deleteBackwardAt, deleteForwardAt } from "./buffer.js";

/**
 * Headless state controller managing interactive terminal UI state.
 */
export class TerminalController {
    private readonly terminal: WebTerminal;
    private readonly user: string;
    private readonly host: string;
    private readonly maxRenderedLines: number;
    private readonly lines: TerminalLine[];
    private readonly listeners: Set<(state: TerminalViewState) => void>;
    private input: string;
    private cursorIndex: number;
    private historyIndex: number;
    private draftInput: string;
    private nextLineId: number;

    constructor(options: TerminalControllerOptions) {
        if (typeof options !== "object" || options === null) {
            throw new TypeError("Options must be a valid object.");
        }
        if (typeof options.terminal !== "object" || options.terminal === null) {
            throw new TypeError("Options.terminal must be a valid WebTerminal instance.");
        }

        this.terminal = options.terminal;
        this.user = options.user ?? DEFAULT_USER;
        this.host = options.host ?? "webterminal";
        this.maxRenderedLines = options.maxRenderedLines ?? 1000;
        this.lines = [];
        this.listeners = new Set();
        this.input = "";
        this.cursorIndex = 0;
        this.historyIndex = -1;
        this.draftInput = "";
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
        };
    }

    public getInput(): string {
        return this.input;
    }

    public getCursorIndex(): number {
        return this.cursorIndex;
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
        const count = history.length;
        if (count === 0) return;

        if (direction === "up") {
            if (this.historyIndex === -1) {
                this.draftInput = this.input;
                this.historyIndex = count - 1;
            } else if (this.historyIndex > 0) {
                this.historyIndex--;
            }
            this.input = history[this.historyIndex]!;
        } else {
            if (this.historyIndex === -1) return;
            if (this.historyIndex < count - 1) {
                this.historyIndex++;
                this.input = history[this.historyIndex]!;
            } else {
                this.historyIndex = -1;
                this.input = this.draftInput;
            }
        }
        this.cursorIndex = this.input.length;
        this.notify();
    }

    public submit(): void {
        const commandToRun = this.input;
        const currentPrompt = this.getPrompt();
        this.appendLine("input", commandToRun, currentPrompt);

        this.input = "";
        this.cursorIndex = 0;
        this.historyIndex = -1;
        this.draftInput = "";

        const result = this.terminal.execute(commandToRun);
        if (result.output === CLEAR_SCREEN_SEQUENCE) {
            this.lines.length = 0;
        } else {
            if (result.output.length > 0) {
                this.appendLine("output", result.output);
            }
            if (result.error && result.error.length > 0) {
                this.appendLine("error", result.error);
            }
        }
        this.notify();
    }

    public abort(): void {
        const currentPrompt = this.getPrompt();
        this.appendLine("input", `${this.input}^C`, currentPrompt);
        this.input = "";
        this.cursorIndex = 0;
        this.historyIndex = -1;
        this.draftInput = "";
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
        const cwd = formatPath(this.terminal.getSession().getCurrentPath());
        return `${this.user}@${this.host}:${cwd}$ `;
    }

    private appendLine(kind: TerminalLineKind, text: string, prompt?: string): void {
        this.lines.push({ id: this.nextLineId++, kind, text, prompt });
        if (this.lines.length > this.maxRenderedLines) {
            this.lines.shift();
        }
    }

    private notify(): void {
        const state = this.getState();
        this.listeners.forEach((listener) => listener(state));
    }
}
