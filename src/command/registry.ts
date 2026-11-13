/**
 * Command registry and handler types.
 */

import type { CommandInvocation } from "./invocation.js";
import type { CommandResult } from "./result.js";
import type { ExecutionContext } from "./context.js";

/**
 * Function signature for executing a command.
 */
export type CommandHandler = (
    invocation: CommandInvocation,
    context: ExecutionContext
) => CommandResult;

/**
 * Registry interface for associating command names with handlers.
 */
export interface CommandRegistry {
    readonly register: (name: string, handler: CommandHandler) => void;
    readonly get: (name: string) => CommandHandler | undefined;
    readonly has: (name: string) => boolean;
    readonly getRegisteredNames: () => readonly string[];
}

/**
 * Creates an empty CommandRegistry.
 *
 * @returns A new CommandRegistry instance.
 */
export function createCommandRegistry(): CommandRegistry {
    const commands = new Map<string, CommandHandler>();

    return Object.freeze({
        register(name: string, handler: CommandHandler): void {
            if (typeof name !== "string" || name.length === 0) {
                throw new TypeError("Command name must be a non-empty string.");
            }
            if (typeof handler !== "function") {
                throw new TypeError("Command handler must be a function.");
            }

            commands.set(name, handler);
        },

        get(name: string): CommandHandler | undefined {
            if (typeof name !== "string") {
                return undefined;
            }
            return commands.get(name);
        },

        has(name: string): boolean {
            if (typeof name !== "string") {
                return false;
            }
            return commands.has(name);
        },

        getRegisteredNames(): readonly string[] {
            return Array.from(commands.keys());
        },
    });
}

