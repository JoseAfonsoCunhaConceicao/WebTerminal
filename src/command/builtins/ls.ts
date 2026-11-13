/**
 * Built-in ls command.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { errorResult, successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";
import type { Node } from "../../vfs/node.js";
import { resolvePath } from "../../vfs/path.js";
import { findNode } from "../../vfs/lookup.js";

/**
 * Formats directory children into a sorted entry string.
 */
function formatDirectoryEntries(
    children: readonly Node[],
    showAll: boolean,
    onePerLine: boolean
): string {
    const names = children
        .map((child) => child.name)
        .filter((name) => showAll || !name.startsWith("."));

    if (showAll) {
        names.push(".", "..");
    }

    names.sort();
    const delimiter = onePerLine ? "\n" : "  ";
    return names.join(delimiter);
}

/**
 * Lists information about files and directories.
 *
 * @param invocation - The parsed command invocation.
 * @param context - The execution context.
 *
 * @returns A CommandResult containing the directory listing.
 */
export function lsCommand(
    invocation: CommandInvocation,
    context: ExecutionContext
): CommandResult {
    const target = invocation.arguments[0] ?? ".";
    const resolvedPath = resolvePath(context.session.getCurrentPath(), target);
    const showAll = invocation.options.includes("-a") || invocation.options.includes("--all");
    const onePerLine = invocation.options.includes("-1");

    const result = findNode(context.root, resolvedPath);
    if (!result.success) {
        return errorResult(`ls: cannot access '${target}': No such file or directory`, 1);
    }

    if (result.node.kind === "file") {
        return successResult(result.node.name);
    }

    const output = formatDirectoryEntries(result.node.children, showAll, onePerLine);
    return successResult(output);
}
