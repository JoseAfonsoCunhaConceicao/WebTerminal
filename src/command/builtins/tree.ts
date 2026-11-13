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
import { hasFlag, extractValuedOption } from "../options.js";

const MAX_TREE_VISITS = 10000;

interface TreeStackEntry {
    readonly node: Node;
    readonly prefix: string;
    readonly isLast: boolean;
    readonly depth: number;
    readonly fullPath: string;
}

interface TreeTraversalConfig {
    readonly showAll: boolean;
    readonly dirsOnly: boolean;
    readonly fullPath: boolean;
    readonly maxLevel: number;
    readonly dirsFirst: boolean;
}

interface TreeTraversalResult {
    readonly lines: readonly string[];
    readonly directoryCount: number;
    readonly fileCount: number;
}

function filterAndSortChildren(
    children: readonly Node[],
    config: TreeTraversalConfig
): Node[] {
    const filtered: Node[] = [];
    const count = children.length;

    for (let idx = 0; idx < count; idx++) {
        const child = children[idx]!;
        if (!config.showAll && child.name.startsWith(".")) {
            continue;
        }
        if (config.dirsOnly && child.kind !== "directory") {
            continue;
        }
        filtered.push(child);
    }

    filtered.sort((a, b) => {
        if (config.dirsFirst && a.kind !== b.kind) {
            return a.kind === "directory" ? -1 : 1;
        }
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });

    return filtered;
}

function pushChildren(
    stack: TreeStackEntry[],
    children: readonly Node[],
    parentPrefix: string,
    depth: number,
    basePath: string
): void {
    const count = children.length;
    for (let idx = count - 1; idx >= 0; idx--) {
        const child = children[idx]!;
        const isLast = idx === count - 1;
        const fullPath = basePath === "." ? `./${child.name}` : `${basePath}/${child.name}`;
        stack.push({
            node: child,
            prefix: parentPrefix,
            isLast,
            depth,
            fullPath,
        });
    }
}

function formatSummary(dirCount: number, fileCount: number): string {
    const dirText = dirCount === 1 ? "1 directory" : `${dirCount} directories`;
    const fileText = fileCount === 1 ? "1 file" : `${fileCount} files`;
    return `${dirText}, ${fileText}`;
}

function traverseTreeIteratively(
    rootDir: Directory,
    target: string,
    config: TreeTraversalConfig
): TreeTraversalResult {
    const lines: string[] = [];
    let dirCount = 0;
    let fileCount = 0;

    const stack: TreeStackEntry[] = [];
    const visited = new Set<Node>();
    const initialChildren = filterAndSortChildren(rootDir.children, config);
    pushChildren(stack, initialChildren, "", 1, target);

    for (let visits = 0; stack.length > 0 && visits < MAX_TREE_VISITS; visits++) {
        const entry = stack.pop()!;
        if (visited.has(entry.node)) {
            continue;
        }
        visited.add(entry.node);

        const branch = entry.isLast ? "└── " : "├── ";
        const displayName = config.fullPath ? entry.fullPath : entry.node.name;
        lines.push(`${entry.prefix}${branch}${displayName}`);

        if (entry.node.kind === "directory") {
            dirCount += 1;
            if (entry.depth < config.maxLevel) {
                const childPrefix = entry.prefix + (entry.isLast ? "    " : "│   ");
                const children = filterAndSortChildren(entry.node.children, config);
                pushChildren(stack, children, childPrefix, entry.depth + 1, entry.fullPath);
            }
        } else {
            fileCount += 1;
        }
    }

    return { lines, directoryCount: dirCount, fileCount };
}

export function treeCommand(
    invocation: CommandInvocation,
    context: ExecutionContext
): CommandResult {
    if (typeof invocation !== "object" || invocation === null) {
        throw new TypeError("Invocation must be a valid object.");
    }
    if (typeof context !== "object" || context === null) {
        throw new TypeError("Context must be a valid ExecutionContext object.");
    }

    const levelOpt = extractValuedOption(invocation.options, invocation.arguments, "L", "--level");
    let maxLevel = Infinity;

    if (levelOpt.value !== undefined) {
        const parsed = Number.parseInt(levelOpt.value, 10);
        if (Number.isNaN(parsed) || parsed < 1 || String(parsed) !== levelOpt.value.trim()) {
            return errorResult("tree: Invalid level, must be greater than 0.", 1);
        }
        maxLevel = parsed;
    }

    const target = levelOpt.remainingArgs[0] ?? ".";
    const resolvedPath = resolvePath(context.session.getCurrentPath(), target);
    const config: TreeTraversalConfig = {
        showAll: hasFlag(invocation.options, "a", "--all"),
        dirsOnly: hasFlag(invocation.options, "d"),
        fullPath: hasFlag(invocation.options, "f"),
        dirsFirst: invocation.options.includes("--dirsfirst"),
        maxLevel,
    };

    const result = findNode(context.root, resolvedPath);
    if (!result.success) {
        return errorResult(`tree: '${target}': No such file or directory`, 1);
    }
    if (result.node.kind === "file") {
        return successResult(`${target}\n\n0 directories, 1 file`);
    }

    const traversal = traverseTreeIteratively(result.node, target, config);
    const header = target;
    const body = traversal.lines.length > 0 ? `\n${traversal.lines.join("\n")}` : "";
    const summary = formatSummary(traversal.directoryCount, traversal.fileCount);

    return successResult(`${header}${body}\n\n${summary}`);
}
