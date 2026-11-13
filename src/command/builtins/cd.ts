/**
 * Built-in cd command.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { errorResult, successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";
import { resolvePath } from "../../vfs/path.js";
import { findNode } from "../../vfs/lookup.js";

/**
 * Changes the current working directory in the session.
 *
 * @param invocation - The parsed command invocation.
 * @param context - The execution context.
 *
 * @returns A CommandResult indicating success or describing the failure.
 */
export function cdCommand(
    invocation: CommandInvocation,
    context: ExecutionContext
): CommandResult {
    if (invocation.arguments.length > 1) {
        return errorResult("cd: too many arguments", 1);
    }

    const target = invocation.arguments[0] ?? "/";
    const resolvedPath = resolvePath(context.session.getCurrentPath(), target);
    const result = findNode(context.root, resolvedPath);

    if (!result.success) {
        if (result.error === "NOT_FOUND") {
            return errorResult(`cd: no such file or directory: ${target}`, 1);
        }
        return errorResult(`cd: not a directory: ${target}`, 1);
    }

    if (result.node.kind !== "directory") {
        return errorResult(`cd: not a directory: ${target}`, 1);
    }

    context.session.setCurrentPath(resolvedPath);
    return successResult("");
}
