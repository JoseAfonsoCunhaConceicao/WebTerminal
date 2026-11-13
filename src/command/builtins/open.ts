/**
 * Built-in open command for viewing file contents.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { errorResult, successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";
import { resolvePath } from "../../vfs/path.js";
import { findNode } from "../../vfs/lookup.js";

const BINARY_EXTENSIONS = new Set([
    "png", "jpg", "jpeg", "gif", "webp", "ico",
    "pdf", "zip", "tar", "gz", "exe", "bin", "dmg",
]);

function getFileExtension(filename: string): string {
    const dotIndex = filename.lastIndexOf(".");
    if (dotIndex <= 0 || dotIndex === filename.length - 1) {
        return "";
    }
    return filename.slice(dotIndex + 1).toLowerCase();
}

function isSupportedTextFile(filename: string): boolean {
    const ext = getFileExtension(filename);
    if (ext.length === 0) {
        return true;
    }
    return !BINARY_EXTENSIONS.has(ext);
}

function formatFileView(name: string, content: string): string {
    const lines = content.length === 0 ? [] : content.split("\n");
    const count = lines.length;
    const lineLabel = count === 1 ? "1 line" : `${count} lines`;
    const header = `=== [ ${name} ] (${lineLabel}) ===`;
    const separator = "=".repeat(header.length);

    if (count === 0) {
        return `${header}\n(empty file)\n${separator}`;
    }

    return `${header}\n${content}\n${separator}`;
}

export function openCommand(
    invocation: CommandInvocation,
    context: ExecutionContext
): CommandResult {
    if (typeof invocation !== "object" || invocation === null) {
        throw new TypeError("Invocation must be a valid CommandInvocation object.");
    }
    if (typeof context !== "object" || context === null) {
        throw new TypeError("Context must be a valid ExecutionContext object.");
    }

    if (invocation.arguments.length === 0) {
        return errorResult("open: missing file operand", 1);
    }

    const target = invocation.arguments[0]!;
    const resolvedPath = resolvePath(context.session.getCurrentPath(), target);
    const lookupResult = findNode(context.root, resolvedPath);

    if (!lookupResult.success) {
        return errorResult(`open: '${target}': No such file or directory`, 1);
    }

    if (lookupResult.node.kind !== "file") {
        return errorResult(`open: '${target}': Is a directory`, 1);
    }

    if (!isSupportedTextFile(lookupResult.node.name)) {
        return errorResult(
            `open: '${target}': Unsupported file format. Only text files (.txt, .md, etc.) can be opened.`,
            1
        );
    }

    const view = formatFileView(lookupResult.node.name, lookupResult.node.content);
    return successResult(view);
}

