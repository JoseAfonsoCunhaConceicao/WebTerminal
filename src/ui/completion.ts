/**
 * Universal tab-completion engine for commands and filesystem paths.
 */

import type { WebTerminal } from "../terminal.js";
import type { CompletionResult } from "./types.js";
import { resolvePath } from "../vfs/path.js";
import { findNode } from "../vfs/lookup.js";

/**
 * Computes the longest common prefix across an array of candidate strings.
 */
function findLongestCommonPrefix(candidates: readonly string[]): string {
    const count = candidates.length;
    if (count === 0) {
        return "";
    }
    if (count === 1) {
        return candidates[0]!;
    }

    let prefix = candidates[0]!;
    for (let idx = 1; idx < count; idx++) {
        const item = candidates[idx]!;
        while (!item.startsWith(prefix)) {
            prefix = prefix.slice(0, -1);
            if (prefix.length === 0) {
                return "";
            }
        }
    }

    return prefix;
}

/**
 * Completes a command name against the registered command names.
 */
function completeCommand(
    prefix: string,
    terminal: WebTerminal
): { completed: string; candidates: string[] } {
    const names = terminal.getRegistry().getRegisteredNames();
    const count = names.length;
    const candidates: string[] = [];

    for (let idx = 0; idx < count; idx++) {
        const name = names[idx]!;
        if (name.startsWith(prefix)) {
            candidates.push(name);
        }
    }

    candidates.sort();
    if (candidates.length === 1) {
        return { completed: candidates[0]! + " ", candidates };
    }

    return { completed: findLongestCommonPrefix(candidates), candidates };
}

/**
 * Splits a path prefix into its parent directory component and leaf prefix.
 */
function splitPathPrefix(prefix: string): { dirPart: string; basePrefix: string } {
    const lastSlash = prefix.lastIndexOf("/");
    if (lastSlash === -1) {
        return { dirPart: ".", basePrefix: prefix };
    }

    const dirPart = lastSlash === 0 ? "/" : prefix.slice(0, lastSlash);
    const basePrefix = prefix.slice(lastSlash + 1);
    return { dirPart, basePrefix };
}

/**
 * Completes a filesystem path relative to the current working directory.
 */
function completePath(
    prefix: string,
    terminal: WebTerminal
): { completed: string; candidates: string[] } {
    const { dirPart, basePrefix } = splitPathPrefix(prefix);
    const sessionPath = terminal.getSession().getCurrentPath();
    const resolvedDir = resolvePath(sessionPath, dirPart);
    const lookupResult = findNode(terminal.getRoot(), resolvedDir);

    if (!lookupResult.success || lookupResult.node.kind !== "directory") {
        return { completed: prefix, candidates: [] };
    }

    const children = lookupResult.node.children;
    const count = children.length;
    const candidates: string[] = [];

    for (let idx = 0; idx < count; idx++) {
        const child = children[idx]!;
        if (child.name.startsWith(basePrefix)) {
            const suffix = child.kind === "directory" ? "/" : " ";
            const candidate = dirPart === "."
                ? child.name + suffix
                : (dirPart.endsWith("/") ? dirPart + child.name : `${dirPart}/${child.name}`) + suffix;
            candidates.push(candidate);
        }
    }

    candidates.sort();
    if (candidates.length === 1) {
        return { completed: candidates[0]!, candidates };
    }

    const common = findLongestCommonPrefix(candidates);
    return { completed: common.length > prefix.length ? common : prefix, candidates };
}

/**
 * Computes tab completion for the input buffer at the current cursor position.
 *
 * @param input - The current full input line.
 * @param cursorIndex - Current cursor index within input.
 * @param terminal - WebTerminal engine instance.
 *
 * @returns The resulting CompletionResult.
 */
export function computeCompletion(
    input: string,
    cursorIndex: number,
    terminal: WebTerminal
): CompletionResult {
    if (typeof input !== "string") {
        throw new TypeError("Input must be a string.");
    }
    if (typeof cursorIndex !== "number" || cursorIndex < 0 || cursorIndex > input.length) {
        throw new TypeError("Cursor index must be a valid offset within input.");
    }
    if (typeof terminal !== "object" || terminal === null) {
        throw new TypeError("Terminal must be a valid WebTerminal instance.");
    }

    const beforeCursor = input.slice(0, cursorIndex);
    const afterCursor = input.slice(cursorIndex);
    const trimmedBefore = beforeCursor.trimStart();
    const isFirstWord = !trimmedBefore.includes(" ");

    const lastSpace = beforeCursor.lastIndexOf(" ");
    const wordStart = lastSpace === -1 ? 0 : lastSpace + 1;
    const currentWord = beforeCursor.slice(wordStart);

    const result = isFirstWord
        ? completeCommand(currentWord, terminal)
        : completePath(currentWord, terminal);

    if (result.candidates.length === 0 || result.completed === currentWord) {
        return { completedInput: input, newCursorIndex: cursorIndex, candidates: result.candidates };
    }

    const completedInput = beforeCursor.slice(0, wordStart) + result.completed + afterCursor;
    const newCursorIndex = wordStart + result.completed.length;

    return { completedInput, newCursorIndex, candidates: result.candidates };
}

