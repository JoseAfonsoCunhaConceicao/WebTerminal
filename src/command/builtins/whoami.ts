/**
 * Built-in whoami command.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";

/**
 * Default user identity for visitor sessions.
 */
export const DEFAULT_USER = "visitor";

/**
 * Prints the current user name.
 *
 * @param _invocation - The command invocation.
 * @param _context - The execution context.
 *
 * @returns A CommandResult with the current user identity.
 */
export function whoamiCommand(
    _invocation: CommandInvocation,
    _context: ExecutionContext
): CommandResult {
    return successResult(DEFAULT_USER);
}

