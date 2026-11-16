/**
 * Syntax highlighter and IDE-style code gutter generator.
 */

import { getLanguageConfig, type LanguageConfig } from "./languages.js";

function escapeHtml(text: string): string {
    if (typeof text !== "string") {
        throw new TypeError("Input must be a string.");
    }
    if (text.length === 0) {
        return "";
    }
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeRegex(str: string): string {
    if (typeof str !== "string") {
        throw new TypeError("String required for regex escape.");
    }
    if (str.length === 0) {
        return "";
    }
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractFileExtension(filename: string): string {
    if (typeof filename !== "string") {
        throw new TypeError("Filename must be a string.");
    }
    const dot = filename.lastIndexOf(".");
    if (dot < 0 || dot === filename.length - 1) {
        return "";
    }
    return filename.slice(dot + 1).toLowerCase();
}

function tokenizeLiterals(code: string, config: LanguageConfig): { masked: string; table: Map<string, string> } {
    if (typeof code !== "string" || !config) {
        throw new TypeError("Invalid code or config.");
    }
    const table = new Map<string, string>();
    let counter = 0;

    const lineComm = config.lineComment ? `(?:${escapeRegex(config.lineComment)}.*$)` : "(?!)";
    const blockComm = config.blockCommentStart && config.blockCommentEnd
        ? `(?:${escapeRegex(config.blockCommentStart)}[\\s\\S]*?${escapeRegex(config.blockCommentEnd)})`
        : "(?!)";
    const strings = '(?:`[^`]*`|"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\')';

    const literalRegex = new RegExp(`(${lineComm}|${blockComm}|${strings})`, "gm");

    const masked = code.replace(literalRegex, (match) => {
        const key = `\uE000_${counter++}_\uE000`;
        const isComment = (config.lineComment && match.startsWith(config.lineComment)) ||
            (config.blockCommentStart && match.startsWith(config.blockCommentStart));
        const className = isComment ? "wt-syn-comment" : "wt-syn-string";
        table.set(key, `<span class="${className}">${escapeHtml(match)}</span>`);
        return key;
    });

    return { masked, table };
}

function highlightTokens(code: string, config: LanguageConfig): string {
    if (typeof code !== "string" || !config) {
        throw new TypeError("Invalid code or config.");
    }

    const tokenRegex = /\b(\d+(?:\.\d+)?)\b|\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()|\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;

    return code.replace(tokenRegex, (match, num, fn, word) => {
        if (num !== undefined) {
            return `<span class="wt-syn-number">${num}</span>`;
        }
        if (fn !== undefined) {
            if (fn === "lt" || fn === "gt" || fn === "amp") {
                return fn;
            }
            const lookup = config.caseInsensitive ? fn.toLowerCase() : fn;
            if (config.keywords.has(lookup)) {
                return `<span class="wt-syn-keyword">${fn}</span>`;
            }
            if (config.types.has(lookup)) {
                return `<span class="wt-syn-type">${fn}</span>`;
            }
            return `<span class="wt-syn-fn">${fn}</span>`;
        }
        if (word !== undefined) {
            if (word === "lt" || word === "gt" || word === "amp") {
                return word;
            }
            const lookup = config.caseInsensitive ? word.toLowerCase() : word;
            if (config.keywords.has(lookup)) {
                return `<span class="wt-syn-keyword">${word}</span>`;
            }
            if (config.types.has(lookup) || /^[A-Z][a-zA-Z0-9_$]+$/.test(word)) {
                return `<span class="wt-syn-type">${word}</span>`;
            }
            return word;
        }
        return match;
    });
}

function buildGutterHtml(lines: readonly string[]): string {
    if (!Array.isArray(lines)) {
        throw new TypeError("Lines must be an array.");
    }
    const count = lines.length;
    if (count === 0) {
        return '<div class="wt-code-container"></div>';
    }

    const padding = Math.max(2, String(count).length);
    const output: string[] = [];
    const maxLines = Math.min(count, 50_000);

    for (let idx = 0; idx < maxLines; idx++) {
        const lineNo = String(idx + 1).padStart(padding, " ");
        const content = lines[idx]!.length === 0 ? " " : lines[idx]!;
        output.push(
            `<div class="wt-code-row"><span class="wt-code-num" aria-hidden="true">${lineNo}</span><span class="wt-code-content">${content}</span></div>`
        );
    }

    return `<div class="wt-code-container">${output.join("\n")}</div>`;
}

/**
 * Highlights a source code string and wraps it with IDE line numbers.
 *
 * @param code - Raw code string.
 * @param filename - Source file name used to determine syntax rules.
 *
 * @returns Formatted HTML string ready for the in-terminal pager.
 */
export function highlightCode(code: string, filename: string): string {
    if (typeof code !== "string" || typeof filename !== "string") {
        throw new TypeError("Code and filename must be valid strings.");
    }
    if (code.length > 1_000_000) {
        throw new RangeError("Code size exceeds maximum allowable buffer.");
    }

    const ext = extractFileExtension(filename);
    const config = getLanguageConfig(ext);

    const { masked, table } = tokenizeLiterals(code, config);
    let escaped = escapeHtml(masked);
    escaped = highlightTokens(escaped, config);

    table.forEach((html, key) => {
        escaped = escaped.split(key).join(html);
    });

    const lines = escaped.split("\n");
    return buildGutterHtml(lines);
}
