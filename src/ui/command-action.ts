/**
 * Command post-execution side-effects coordinator and controller configuration.
 */

import type { WebTerminal } from "../terminal.js";
import { DEFAULT_USER } from "../command/builtins/whoami.js";
import { processOpenCommand } from "./file-action.js";
import { processThemeCommand, type ThemeTargetController } from "./theme-action.js";
import type {
    CursorStyle,
    PagerContentType,
    TerminalControllerOptions,
} from "./types.js";
import type { PromptFormatter, PromptStyle } from "./prompt.js";
import type { TerminalTheme } from "./theme.js";

export interface ControllerConfig {
    readonly user: string;
    readonly host: string;
    readonly maxRenderedLines: number;
    promptStyle?: PromptStyle | PromptFormatter | undefined;
    cursorStyle?: CursorStyle | undefined;
    theme?: string | TerminalTheme | undefined;
}

export function createControllerConfig(options: TerminalControllerOptions): ControllerConfig {
    return {
        user: options.user ?? DEFAULT_USER,
        host: options.host ?? "webterminal",
        maxRenderedLines: options.maxRenderedLines ?? 1000,
        promptStyle: options.promptStyle ?? "classic",
        cursorStyle: options.cursorStyle ?? "beam",
        theme: options.theme,
    };
}

export interface SideEffectTarget extends ThemeTargetController {
    enterPager(title: string, content: string, contentType?: PagerContentType): void;
}

export function handleCommandSideEffects(
    command: string,
    terminal: WebTerminal,
    target: SideEffectTarget
): void {
    if (typeof command !== "string" || !terminal || !target) {
        return;
    }
    processOpenCommand(command, terminal, (title, content, type) => {
        target.enterPager(title, content, type);
    });
    processThemeCommand(command, target);
}
