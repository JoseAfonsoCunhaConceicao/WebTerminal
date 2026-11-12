/**
 * Built-in clear command.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";

/**
 * Standard ANSI sequence to clear the screen and move cursor home.
 */
export const CLEAR_SCREEN_SEQUENCE = "\x1b[2J\x1b[H";

/**
 * Clears the terminal screen output.
 *
 * @param _invocation - The command invocation.
 * @param _context - The execution context.
 *
 * @returns A CommandResult with the clear screen escape sequence.
 */
export function clearCommand(
    _invocation: CommandInvocation,
    _context: ExecutionContext
): CommandResult {
    return successResult(CLEAR_SCREEN_SEQUENCE);
}

