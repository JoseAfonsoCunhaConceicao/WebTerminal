/**
 * Built-in help command.
 */

import type { CommandInvocation } from "../invocation.js";
import type { CommandResult } from "../result.js";
import { errorResult, successResult } from "../result.js";
import type { ExecutionContext } from "../context.js";

/**
 * Built-in command descriptions.
 */
const COMMAND_DESCRIPTIONS: Readonly<Record<string, string>> = Object.freeze({
    cat: "Concatenate and print file contents",
    cd: "Change the current working directory",
    clear: "Clear the terminal screen",
    echo: "Write arguments to standard output",
    help: "Display information about available commands",
    history: "Display the command history list",
    ls: "List directory contents",
    pwd: "Print name of current working directory",
    reset: "Reset the terminal session state",
});

/**
 * Formats a single command help description.
 */
function formatSingleHelp(name: string): CommandResult {
    const desc = COMMAND_DESCRIPTIONS[name];
    if (!desc) {
        return errorResult(`help: no help topics match '${name}'`, 1);
    }

    return successResult(`${name} - ${desc}`);
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
        const desc = COMMAND_DESCRIPTIONS[name] ?? "User defined command";
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
        : Object.keys(COMMAND_DESCRIPTIONS);

    return formatAllHelp(availableNames);
}

