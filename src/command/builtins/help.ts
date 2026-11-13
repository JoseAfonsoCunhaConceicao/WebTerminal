/**
 * Built-in help command.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { errorResult, successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";
import { getManualPage } from "../manual.js";

/**
 * Formats a single command help description.
 */
function formatSingleHelp(name: string): CommandResult {
    const page = getManualPage(name);
    if (!page) {
        return errorResult(`help: no help topics match '${name}'`, 1);
    }

    return successResult(`${page.name} - ${page.shortDescription}`);
}

/**
 * Formats the overview of all available commands.
 */
function formatAllHelp(names: readonly string[]): CommandResult {
    const sorted = [...names].sort();
    const count = sorted.length;
    const lines: string[] = ["Available commands:"];

    for (let idx = 0; idx < count; idx++) {
        const name = sorted[idx]!;
        const page = getManualPage(name);
        const desc = page ? page.shortDescription : "User defined command";
        lines.push(`  ${name.padEnd(10, " ")} ${desc}`);
    }

    return successResult(lines.join("\n"));
}

/**
 * Displays help information about available commands.
 *
 * @param invocation - The command invocation.
 * @param context - The execution context.
 *
 * @returns A CommandResult with the help text.
 */
export function helpCommand(
    invocation: CommandInvocation,
    context: ExecutionContext
): CommandResult {
    const target = invocation.arguments[0];
    if (target) {
        if (context.registry && !context.registry.has(target)) {
            return errorResult(`help: no help topics match '${target}'`, 1);
        }
        return formatSingleHelp(target);
    }

    const availableNames = context.registry
        ? context.registry.getRegisteredNames()
        : [
              "apropos",
              "cat",
              "cd",
              "clear",
              "echo",
              "help",
              "history",
              "ls",
              "man",
              "pwd",
              "reset",
              "tree",
              "whoami",
          ];

    return formatAllHelp(availableNames);
}
