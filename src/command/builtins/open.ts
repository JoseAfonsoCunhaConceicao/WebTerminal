/**
 * Built-in open command for viewing files, documents, media, and external links.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { errorResult, successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";
import { resolvePath } from "../../vfs/path.js";
import { findNode } from "../../vfs/lookup.js";

export type OpenActionType =
    | "text"
    | "code"
    | "markdown"
    | "image"
    | "audio"
    | "video"
    | "pdf"
    | "zip"
    | "link"
    | "unsupported";

export interface FileClassification {
    readonly action: OpenActionType;
    readonly url?: string | undefined;
}

const TEXT_EXTS = new Set(["", "txt", "rtf", "log", "env", "csv"]);
const CODE_EXTS = new Set([
    "js", "ts", "jsx", "tsx", "json", "html", "css", "scss",
    "py", "rs", "go", "java", "c", "cpp", "h", "hpp", "cs",
    "php", "rb", "sh", "bash", "zsh", "sql", "yaml", "yml", "toml", "xml",
]);
const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "m4a", "flac", "aac"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "mkv", "avi"]);
const ARCHIVE_EXTS = new Set(["zip", "tar", "gz", "7z", "rar"]);

export function classifyFile(filename: string, content: string): FileClassification {
    const trimmed = content.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return { action: "link", url: trimmed };
    }

    const dotIndex = filename.lastIndexOf(".");
    const ext = (dotIndex > 0 ? filename.slice(dotIndex + 1) : "").toLowerCase();

    if (ext === "md" || ext === "markdown") return { action: "markdown" };
    if (ext === "pdf") return { action: "pdf", url: trimmed || filename };
    if (ext === "url" || ext === "link") return { action: "link", url: trimmed };
    if (ARCHIVE_EXTS.has(ext)) return { action: "zip", url: trimmed || filename };
    if (IMAGE_EXTS.has(ext)) return { action: "image", url: trimmed || filename };
    if (AUDIO_EXTS.has(ext)) return { action: "audio", url: trimmed || filename };
    if (VIDEO_EXTS.has(ext)) return { action: "video", url: trimmed || filename };
    if (CODE_EXTS.has(ext)) return { action: "code" };
    if (TEXT_EXTS.has(ext)) return { action: "text" };

    return { action: "unsupported" };
}

function formatSuccessMessage(action: OpenActionType, name: string, url?: string): string {
    switch (action) {
        case "text":
            return `[ Opening '${name}' in terminal pager... ]`;
        case "code":
            return `[ Opening code file '${name}' in terminal pager... ]`;
        case "markdown":
            return `[ Opening '${name}' (rendered markdown) in terminal pager... ]`;
        case "image":
            return `[ Opening image '${name}' in a new tab... ]`;
        case "audio":
            return `[ Opening audio '${name}' in a new tab... ]`;
        case "video":
            return `[ Opening video '${name}' in a new tab... ]`;
        case "pdf":
            return `[ Opening '${name}' in a new tab... ]`;
        case "zip":
            return `[ Downloading '${name}'... ]`;
        case "link":
            return `[ Opening link in a new tab: ${url} ]`;
        default:
            return `[ Opened '${name}' ]`;
    }
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
    if (target.startsWith("http://") || target.startsWith("https://")) {
        return successResult(`[ Opening link in a new tab: ${target} ]`);
    }

    const resolvedPath = resolvePath(context.session.getCurrentPath(), target);
    const lookupResult = findNode(context.root, resolvedPath);

    if (!lookupResult.success) {
        return errorResult(`open: '${target}': No such file or directory`, 1);
    }
    if (lookupResult.node.kind !== "file") {
        return errorResult(`open: '${target}': Is a directory`, 1);
    }

    const classification = classifyFile(lookupResult.node.name, lookupResult.node.content);
    if (classification.action === "unsupported") {
        return errorResult(`open: '${target}': Unsupported file format.`, 1);
    }

    const message = formatSuccessMessage(classification.action, lookupResult.node.name, classification.url);
    return successResult(message);
}
