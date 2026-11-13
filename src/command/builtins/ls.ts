/**
 * Built-in ls command with Unix standard formatting options.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { errorResult, successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";
import type { Node } from "../../vfs/node.js";
import { resolvePath } from "../../vfs/path.js";
import { findNode } from "../../vfs/lookup.js";
import { hasFlag } from "../options.js";

interface LsEntry {
    readonly name: string;
    readonly kind: "file" | "directory";
    readonly size: number;
}

interface LsConfig {
    readonly showAll: boolean;
    readonly almostAll: boolean;
    readonly onePerLine: boolean;
    readonly longFormat: boolean;
    readonly reverseSort: boolean;
    readonly classify: boolean;
    readonly dirOnly: boolean;
}

function collectEntries(children: readonly Node[], config: LsConfig): LsEntry[] {
    const entries: LsEntry[] = [];
    const count = children.length;

    for (let idx = 0; idx < count; idx++) {
        const child = children[idx]!;
        if (!config.showAll && !config.almostAll && child.name.startsWith(".")) {
            continue;
        }
        const size = child.kind === "file" ? child.content.length : child.children.length * 64;
        entries.push({ name: child.name, kind: child.kind, size });
    }

    if (config.showAll && !config.almostAll) {
        entries.push(
            { name: ".", kind: "directory", size: 64 },
            { name: "..", kind: "directory", size: 64 }
        );
    }

    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    if (config.reverseSort) {
        entries.reverse();
    }
    return entries;
}

function formatLongLine(entry: LsEntry, classify: boolean): string {
    const perms = entry.kind === "directory" ? "drwxr-xr-x" : "-rw-r--r--";
    const sizeStr = `${entry.size}`.padStart(6, " ");
    const suffix = classify && entry.kind === "directory" ? "/" : "";
    return `${perms}  1 visitor  staff  ${sizeStr}  ${entry.name}${suffix}`;
}

function formatEntries(entries: readonly LsEntry[], config: LsConfig): string {
    const count = entries.length;
    if (count === 0) {
        return "";
    }

    if (config.longFormat) {
        const lines: string[] = [];
        for (let idx = 0; idx < count; idx++) {
            lines.push(formatLongLine(entries[idx]!, config.classify));
        }
        return lines.join("\n");
    }

    const formattedNames: string[] = [];
    for (let idx = 0; idx < count; idx++) {
        const entry = entries[idx]!;
        const suffix = config.classify && entry.kind === "directory" ? "/" : "";
        formattedNames.push(`${entry.name}${suffix}`);
    }

    const delimiter = config.onePerLine ? "\n" : "  ";
    return formattedNames.join(delimiter);
}

export function lsCommand(
    invocation: CommandInvocation,
    context: ExecutionContext
): CommandResult {
    if (typeof invocation !== "object" || invocation === null) {
        throw new TypeError("Invocation must be a valid CommandInvocation object.");
    }
    if (typeof context !== "object" || context === null) {
        throw new TypeError("Context must be a valid ExecutionContext object.");
    }

    const config: LsConfig = {
        showAll: hasFlag(invocation.options, "a", "--all"),
        almostAll: hasFlag(invocation.options, "A", "--almost-all"),
        onePerLine: hasFlag(invocation.options, "1"),
        longFormat: hasFlag(invocation.options, "l"),
        reverseSort: hasFlag(invocation.options, "r", "--reverse"),
        classify: hasFlag(invocation.options, "F", "--classify"),
        dirOnly: hasFlag(invocation.options, "d", "--directory"),
    };

    const target = invocation.arguments[0] ?? ".";
    const resolvedPath = resolvePath(context.session.getCurrentPath(), target);
    const result = findNode(context.root, resolvedPath);

    if (!result.success) {
        return errorResult(`ls: cannot access '${target}': No such file or directory`, 1);
    }

    if (result.node.kind === "file" || config.dirOnly) {
        const size = result.node.kind === "file" ? result.node.content.length : result.node.children.length * 64;
        const entry: LsEntry = { name: result.node.name || target, kind: result.node.kind, size };
        return successResult(formatEntries([entry], config));
    }

    const entries = collectEntries(result.node.children, config);
    return successResult(formatEntries(entries, config));
}
