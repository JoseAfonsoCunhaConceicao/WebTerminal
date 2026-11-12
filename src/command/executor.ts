/**
 * Command line execution engine.
 */

import type { CommandInvocation } from "./invocation.js";
import type { CommandResult } from "./result.js";
import { errorResult, successResult } from "./result.js";
import type { ExecutionContext } from "./context.js";
import type { CommandRegistry } from "./registry.js";
import { tokenize } from "./tokenizer.js";
import { parseCommand } from "./parser.js";

/**
 * Executes a parsed command invocation using the supplied registry and context.
 *
 * @param invocation - The parsed command invocation to run.
 * @param context - The execution context.
 * @param registry - The registry containing command handlers.
 *
 * @returns The resulting CommandResult.
 */
export function executeInvocation(
    invocation: CommandInvocation,
    context: ExecutionContext,
    registry: CommandRegistry
): CommandResult {
    if (typeof invocation !== "object" || invocation === null) {
        throw new TypeError("Invocation must be a valid object.");
    }
    if (typeof context !== "object" || context === null) {
        throw new TypeError("Context must be a valid ExecutionContext object.");
    }

    const handler = registry.get(invocation.command);
    if (!handler) {
        return errorResult(`${invocation.command}: command not found`, 127);
    }

    return handler(invocation, context);
}

/**
 * Tokenizes, parses, and executes a raw command line string.
 *
 * @param commandLine - The raw command line input to execute.
 * @param context - The execution context.
 * @param registry - The command registry.
 *
 * @returns The resulting CommandResult.
 */
export function executeLine(
    commandLine: string,
    context: ExecutionContext,
    registry: CommandRegistry
): CommandResult {
    if (typeof commandLine !== "string") {
        throw new TypeError("Command line must be a string.");
    }
    if (typeof context !== "object" || context === null) {
        throw new TypeError("Context must be a valid ExecutionContext object.");
    }

    if (commandLine.trim().length > 0) {
        context.session.addHistory(commandLine);
    }

    const tokenResult = tokenize(commandLine);
    if (!tokenResult.success) {
        return errorResult(tokenResult.error.message, 2);
    }

    const invocation = parseCommand(tokenResult.tokens);
    if (invocation === null) {
        return successResult("");
    }

    return executeInvocation(invocation, context, registry);
}

