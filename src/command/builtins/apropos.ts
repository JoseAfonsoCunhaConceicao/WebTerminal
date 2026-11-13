/**
 * Built-in apropos command.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { errorResult, successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";
import type { ManualPage } from "../manual.js";
import { searchManualPages } from "../manual.js";

/**
 * Formats a list of matching ManualPage entries in standard whatis/apropos format.
 */
function formatMatches(matches: readonly ManualPage[]): string {
    const lines: string[] = [];
    const count = matches.length;

    for (let idx = 0; idx < count; idx++) {
        const page = matches[idx]!;
        const nameAndSection = `${page.name} (${page.section})`.padEnd(16, " ");
        lines.push(`${nameAndSection}- ${page.shortDescription}`);
    }

    return lines.join("\n");
}

/**
 * Searches the manual documentation database for matching keywords.
 *
 * @param invocation - The command invocation.
 * @param _context - The execution context.
 *
 * @returns A CommandResult with the matching command summary lines.
 */
export function aproposCommand(
    invocation: CommandInvocation,
    _context: ExecutionContext
): CommandResult {
    if (typeof invocation !== "object" || invocation === null || !Array.isArray(invocation.arguments)) {
        throw new TypeError("Invocation must be a valid CommandInvocation object.");
    }

    const keyword = invocation.arguments[0];
    if (!keyword) {
        return errorResult("apropos: missing search keyword", 1);
    }

    const matches = searchManualPages(keyword);
    if (matches.length === 0) {
        return errorResult(`${keyword}: nothing appropriate.`, 1);
    }

    const output = formatMatches(matches);
    return successResult(output);
}

