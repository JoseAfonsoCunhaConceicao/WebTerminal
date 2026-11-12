/**
 * Built-in reset command.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";

/**
 * Resets the session working directory to root and clears command history.
 *
 * @param _invocation - The command invocation.
 * @param context - The execution context.
 *
 * @returns A CommandResult confirming session reset.
 */
export function resetCommand(
    _invocation: CommandInvocation,
    context: ExecutionContext
): CommandResult {
    if (typeof context !== "object" || context === null) {
        throw new TypeError("Context must be a valid ExecutionContext object.");
    }

    context.session.reset();
    return successResult("Session reset.");
}

