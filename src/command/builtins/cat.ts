/**
 * Built-in cat command.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { errorResult, successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";
import { resolvePath } from "../../vfs/path.js";
import { lookup } from "../../vfs/lookup.js";
import { NotADirectoryError, PathNotFoundError } from "../../vfs/errors.js";

/**
 * Concatenates and prints file contents.
 *
 * @param invocation - The parsed command invocation.
 * @param context - The execution context.
 *
 * @returns A CommandResult containing the concatenated file contents.
 */
export function catCommand(
    invocation: CommandInvocation,
    context: ExecutionContext
): CommandResult {
    const fileCount = invocation.arguments.length;
    if (fileCount === 0) {
        return errorResult("cat: missing operand", 1);
    }

    const outputs: string[] = [];

    for (let idx = 0; idx < fileCount; idx++) {
        const target = invocation.arguments[idx]!;
        const resolvedPath = resolvePath(context.session.getCurrentPath(), target);

        try {
            const node = lookup(context.root, resolvedPath);
            if (node.kind === "directory") {
                return errorResult(`cat: ${target}: Is a directory`, 1);
            }

            outputs.push(node.content);
        } catch (error) {
            if (error instanceof PathNotFoundError || error instanceof NotADirectoryError) {
                return errorResult(`cat: ${target}: No such file or directory`, 1);
            }

            throw error;
        }
    }

    return successResult(outputs.join("\n"));
}

