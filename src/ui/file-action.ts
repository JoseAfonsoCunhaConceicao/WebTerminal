/**
 * Browser file and URL action handlers for WebTerminal.
 */

import type { WebTerminal } from "../terminal.js";
import { resolvePath } from "../vfs/path.js";
import { findNode } from "../vfs/lookup.js";
import { classifyFile } from "../command/builtins/open.js";
import type { PagerContentType } from "./types.js";

export function handleBrowserUrl(url: string): void {
    if (typeof window !== "undefined" && typeof window.open === "function") {
        window.open(url, "_blank", "noopener,noreferrer");
    }
}

export function handleFileDownload(filename: string, content: string): void {
    if (typeof document === "undefined") {
        return;
    }
    const blob = new Blob([content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

export function processOpenCommand(
    commandLine: string,
    terminal: WebTerminal,
    onPager: (title: string, content: string, contentType: PagerContentType) => void
): void {
    const trimmed = commandLine.trim();
    if (!trimmed.startsWith("open ") && !trimmed.startsWith("view ")) {
        return;
    }

    const target = trimmed.replace(/^(open|view)\s+/, "").trim();
    if (target.startsWith("http://") || target.startsWith("https://")) {
        handleBrowserUrl(target);
        return;
    }

    const resolved = resolvePath(terminal.getSession().getCurrentPath(), target);
    const lookup = findNode(terminal.getRoot(), resolved);
    if (!lookup.success || lookup.node.kind !== "file") {
        return;
    }

    const classification = classifyFile(lookup.node.name, lookup.node.content);
    switch (classification.action) {
        case "text":
            onPager(lookup.node.name, lookup.node.content, "text");
            break;
        case "code":
            onPager(lookup.node.name, lookup.node.content, "code");
            break;
        case "markdown":
            onPager(lookup.node.name, lookup.node.content, "markdown");
            break;
        case "image":
        case "audio":
        case "video":
        case "pdf":
        case "link":
            handleBrowserUrl(classification.url ?? target);
            break;
        case "zip":
            handleFileDownload(lookup.node.name, lookup.node.content);
            break;
        default:
            break;
    }
}
