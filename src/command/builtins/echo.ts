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
    const text = invocation.arguments.join(" ");

    return successResult(text);
}

