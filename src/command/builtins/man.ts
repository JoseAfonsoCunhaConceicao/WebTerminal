/**
 * Built-in man command.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { errorResult, successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";
import type { ManualPage } from "../manual.js";
import { getManualPage } from "../manual.js";

/**
 * Formats a ManualPage in traditional Unix manual layout.
 */
function formatManualPage(page: ManualPage): string {
    const lines = [
        "NAME",
        `    ${page.name} - ${page.shortDescription}`,
        "",
        "SYNOPSIS",
        `    ${page.synopsis}`,
        "",
        "DESCRIPTION",
        `    ${page.description}`,
    ];

    return lines.join("\n");
}

/**
 * Formats and displays online manual documentation for commands.
 *
 * @param invocation - The command invocation.
 * @param _context - The execution context.
 *
 * @returns A CommandResult with the formatted manual page.
 */
export function manCommand(
    invocation: CommandInvocation,
    _context: ExecutionContext
): CommandResult {
    if (typeof invocation !== "object" || invocation === null || !Array.isArray(invocation.arguments)) {
        throw new TypeError("Invocation must be a valid CommandInvocation object.");
    }

    const target = invocation.arguments[0];
    if (!target) {
        return errorResult("What manual page do you want?", 1);
    }

    const page = getManualPage(target);
    if (!page) {
        return errorResult(`No manual entry for ${target}`, 1);
    }

    const output = formatManualPage(page);
    return successResult(output);
}

