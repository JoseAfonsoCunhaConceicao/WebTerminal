/**
 * Built-in theme command for listing and switching visual themes, cursors, and prompts.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { errorResult, successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";
import { extractValuedOption, hasFlag } from "../options.js";
import { listThemes, getTheme } from "../../ui/theme.js";

const VALID_CURSORS = new Set(["beam", "block", "underline"]);
const VALID_PROMPTS = new Set(["classic", "robbyrussell", "minimal"]);

function buildListingOutput(): string {
    const themes = listThemes();
    const themeLines = themes.map((t) => `  * ${t.id.padEnd(12, " ")} — ${t.name}`).join("\n");

    return [
        "Available Themes:",
        themeLines,
        "",
        "Available Cursors:",
        "  * beam         — Vertical bar (|)",
        "  * block        — Classic rectangle (█)",
        "  * underline    — Bottom line (_)",
        "",
        "Available Prompts:",
        "  * robbyrussell — ➜  dir",
        "  * classic      — user@host:cwd$ ",
        "  * minimal      — dir ❯ ",
        "",
        "Usage:",
        "  theme -l, --list                  List available themes and styles",
        "  theme <name>                      Switch theme (e.g. 'theme ghostty')",
        "  theme --cursor <style>            Change cursor (beam, block, underline)",
        "  theme --prompt <style>            Change prompt (robbyrussell, classic, minimal)",
    ].join("\n");
}

export function themeCommand(
    invocation: CommandInvocation,
    _context: ExecutionContext
): CommandResult {
    if (!invocation || !Array.isArray(invocation.arguments) || !Array.isArray(invocation.options)) {
        throw new TypeError("Invocation must be a valid CommandInvocation.");
    }

    const cursorExt = extractValuedOption(invocation.options, invocation.arguments, "c", "--cursor");
    if (cursorExt.value) {
        const val = cursorExt.value.toLowerCase();
        if (!VALID_CURSORS.has(val)) {
            return errorResult(`Unknown cursor style: '${cursorExt.value}'. Valid: beam, block, underline`);
        }
        return successResult(`Cursor style changed to '${val}'.`);
    }

    const promptExt = extractValuedOption(invocation.options, cursorExt.remainingArgs, "p", "--prompt");
    if (promptExt.value) {
        const val = promptExt.value.toLowerCase();
        if (!VALID_PROMPTS.has(val)) {
            return errorResult(`Unknown prompt style: '${promptExt.value}'. Valid: classic, robbyrussell, minimal`);
        }
        return successResult(`Prompt style changed to '${val}'.`);
    }

    const isList = hasFlag(invocation.options, "l", "--list");
    const args = promptExt.remainingArgs;
    if (isList || args.length === 0 || args[0] === "list") {
        return successResult(buildListingOutput());
    }

    const targetId = args[0]!.toLowerCase();
    const found = getTheme(targetId);
    if (!found) {
        return errorResult(`Theme not found: '${args[0]}'. Use 'theme -l' to list available themes.`);
    }

    return successResult(`Theme switched to ${found.name}.`);
}
