/**
 * Built-in pwd command.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";
import { formatPath } from "../../vfs/path.js";

/**
 * Prints the current working directory path.
 *
 * @param _invocation - The parsed command invocation.
 * @param context - The execution context.
 *
 * @returns A CommandResult containing the current directory path.
 */
export function pwdCommand(
    _invocation: CommandInvocation,
    context: ExecutionContext
): CommandResult {
    const currentPath = context.session.getCurrentPath();
    const formatted = formatPath(currentPath);

    return successResult(formatted);
}

