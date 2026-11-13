/**
 * Built-in tree command with iterative VFS traversal.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { errorResult, successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";
import type { Directory, Node } from "../../vfs/node.js";
import { resolvePath } from "../../vfs/path.js";
import { findNode } from "../../vfs/lookup.js";

/**
 * Maximum node visits to prevent infinite loop execution.
 */
const MAX_TREE_VISITS = 10000;

interface TreeStackEntry {
    readonly node: Node;
    readonly prefix: string;
    readonly isLast: boolean;
}

interface TreeTraversalResult {
    readonly lines: readonly string[];
    readonly directoryCount: number;
    readonly fileCount: number;
}

/**
 * Filters and alphabetically sorts node children according to options.
 */
function filterAndSortChildren(
    children: readonly Node[],
    showAll: boolean,
    dirsOnly: boolean
): Node[] {
    const filtered: Node[] = [];
    const count = children.length;

    for (let idx = 0; idx < count; idx++) {
        const child = children[idx]!;
        if (!showAll && child.name.startsWith(".")) {
            continue;
        }
        if (dirsOnly && child.kind !== "directory") {
            continue;
        }
        filtered.push(child);
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
}

/**
 * Pushes children onto the traversal stack in reverse order.
 */
function pushChildren(
    stack: TreeStackEntry[],
    children: readonly Node[],
    parentPrefix: string
): void {
    const count = children.length;
    for (let idx = count - 1; idx >= 0; idx--) {
        const child = children[idx]!;
        const isLast = idx === count - 1;
        stack.push({
            node: child,
            prefix: parentPrefix,
            isLast,
        });
    }
}

/**
 * Formats directory and file counts summary.
 */
function formatSummary(dirCount: number, fileCount: number): string {
    const dirText = dirCount === 1 ? "1 directory" : `${dirCount} directories`;
    const fileText = fileCount === 1 ? "1 file" : `${fileCount} files`;
    return `${dirText}, ${fileText}`;
}

/**
 * Iteratively traverses a directory hierarchy without recursion.
 */
function traverseTreeIteratively(
    rootDir: Directory,
    showAll: boolean,
    dirsOnly: boolean
): TreeTraversalResult {
    const lines: string[] = [];
    let dirCount = 0;
    let fileCount = 0;

    const stack: TreeStackEntry[] = [];
    const initialChildren = filterAndSortChildren(rootDir.children, showAll, dirsOnly);
    pushChildren(stack, initialChildren, "");

    for (let visits = 0; stack.length > 0 && visits < MAX_TREE_VISITS; visits++) {
        const entry = stack.pop()!;
        const branch = entry.isLast ? "└── " : "├── ";
        lines.push(`${entry.prefix}${branch}${entry.node.name}`);

        if (entry.node.kind === "directory") {
            dirCount += 1;
            const childPrefix = entry.prefix + (entry.isLast ? "    " : "│   ");
            const children = filterAndSortChildren(entry.node.children, showAll, dirsOnly);
            pushChildren(stack, children, childPrefix);
        } else {
            fileCount += 1;
        }
    }

    return { lines, directoryCount: dirCount, fileCount };
}

/**
 * Generates an ASCII tree view of the virtual filesystem hierarchy.
 *
 * @param invocation - The command invocation.
 * @param context - The execution context.
 *
 * @returns A CommandResult with the formatted directory tree.
 */
export function treeCommand(
    invocation: CommandInvocation,
    context: ExecutionContext
): CommandResult {
    const target = invocation.arguments[0] ?? ".";
    const resolvedPath = resolvePath(context.session.getCurrentPath(), target);
    const showAll = invocation.options.includes("-a") || invocation.options.includes("--all");
    const dirsOnly = invocation.options.includes("-d");

    const result = findNode(context.root, resolvedPath);
    if (!result.success) {
        return errorResult(`tree: '${target}': No such file or directory`, 1);
    }

    if (result.node.kind === "file") {
        return successResult(`${target}\n\n0 directories, 1 file`);
    }

    const traversal = traverseTreeIteratively(result.node, showAll, dirsOnly);
    const header = target;
    const body = traversal.lines.length > 0 ? `\n${traversal.lines.join("\n")}` : "";
    const summary = formatSummary(traversal.directoryCount, traversal.fileCount);

    return successResult(`${header}${body}\n\n${summary}`);
}
