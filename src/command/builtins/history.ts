/**
 * Built-in history command.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";

/**
 * Displays the list of previously executed commands.
 *
 * @param _invocation - The command invocation.
 * @param context - The execution context.
 *
 * @returns A CommandResult with the numbered history lines.
 */
export function historyCommand(
    _invocation: CommandInvocation,
    context: ExecutionContext
): CommandResult {
    if (typeof context !== "object" || context === null) {
        throw new TypeError("Context must be a valid ExecutionContext object.");
    }

    const history = context.session.getHistory();
    const count = history.length;
    if (count === 0) {
        return successResult("");
    }

    const lines: string[] = [];
    for (let idx = 0; idx < count; idx++) {
        const item = history[idx]!;
        const num = String(idx + 1).padStart(4, " ");
        lines.push(`${num}  ${item}`);
    }

    return successResult(lines.join("\n"));
}

