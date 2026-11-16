/**
 * Helper to process theme changes from terminal commands.
 */

import type { CursorStyle } from "./types.js";
import type { PromptStyle } from "./prompt.js";
import { getTheme, type TerminalTheme } from "./theme.js";

export interface ThemeTargetController {
    setTheme(theme: string | TerminalTheme): void;
    setCursorStyle(style: CursorStyle): void;
    setPromptStyle(style: PromptStyle): void;
}

export function processThemeCommand(commandLine: string, controller: ThemeTargetController): void {
    if (typeof commandLine !== "string" || !controller) {
        return;
    }

    const tokens = commandLine.trim().split(/\s+/);
    if (tokens[0] !== "theme" || tokens.length < 2) {
        return;
    }

    const opt = tokens[1]!;
    if (opt === "--cursor" && tokens[2]) {
        controller.setCursorStyle(tokens[2].toLowerCase() as CursorStyle);
        return;
    }

    if (opt === "--prompt" && tokens[2]) {
        controller.setPromptStyle(tokens[2].toLowerCase() as PromptStyle);
        return;
    }

    if (!opt.startsWith("-")) {
        const theme = getTheme(opt);
        if (theme) {
            controller.setTheme(theme);
        }
    }
}

