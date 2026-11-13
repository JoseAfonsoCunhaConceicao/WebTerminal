/**
 * Built-in echo command.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";

/**
 * Prints the provided text arguments.
 *
 * @param invocation - The parsed command invocation.
 * @param _context - The execution context.
 *
 * @returns A CommandResult containing the joined argument text.
 */
export function echoCommand(
    invocation: CommandInvocation,
    _context: ExecutionContext
): CommandResult {
    if (typeof invocation !== "object" || invocation === null || !Array.isArray(invocation.arguments)) {
        throw new TypeError("Invocation must be a valid CommandInvocation object.");
    }

    const text = invocation.arguments.join(" ");

    return successResult(text);
}

