/**
 * Public facade for the WebTerminal core engine.
 */

import type { Directory } from "./vfs/node.js";
import { freezeVFS } from "./vfs/node.js";
import { Session } from "./session/session.js";
import type { CommandRegistry } from "./command/registry.js";
import { createCommandRegistry } from "./command/registry.js";
import { registerBuiltinCommands } from "./command/builtins/index.js";
import type { ExecutionContext } from "./command/context.js";
import type { CommandResult } from "./command/result.js";
import { executeLine } from "./command/executor.js";
import { resolvePath } from "./vfs/path.js";
import { findNode } from "./vfs/lookup.js";

/**
 * Configuration options for initializing WebTerminal.
 */
export interface WebTerminalOptions {
    readonly root: Directory;
    readonly initialPath?: string | undefined;
    readonly registry?: CommandRegistry | undefined;
    readonly maxHistoryEntries?: number | undefined;
}

/**
 * WebTerminal core engine facade.
 * Encapsulates VFS, session state, command registry, and execution pipeline.
 */
export class WebTerminal {
    private readonly root: Directory;
    private readonly session: Session;
    private readonly registry: CommandRegistry;
    private readonly context: ExecutionContext;

    /**
     * Initializes a new WebTerminal instance.
     *
     * @param options - Configuration options for the terminal.
     */
    constructor(options: WebTerminalOptions) {
        if (typeof options !== "object" || options === null) {
            throw new TypeError("Options must be a valid object.");
        }
        if (typeof options.root !== "object" || options.root === null || options.root.kind !== "directory") {
            throw new TypeError("Options.root must be a valid Directory node.");
        }

        this.root = freezeVFS(options.root);
        this.registry = options.registry ?? createCommandRegistry();
        if (!options.registry) {
            registerBuiltinCommands(this.registry);
        }

        const initialSession = typeof options.maxHistoryEntries === "number"
            ? new Session(options.maxHistoryEntries)
            : new Session();
        if (typeof options.initialPath === "string") {
            const resolved = resolvePath(initialSession.getCurrentPath(), options.initialPath);
            const lookupRes = findNode(this.root, resolved);
            if (lookupRes.success && lookupRes.node.kind === "directory") {
                initialSession.setCurrentPath(resolved);
            }
        }
        this.session = initialSession;

        this.context = Object.freeze({
            root: this.root,
            session: this.session,
            registry: this.registry,
        });
    }

    /**
     * Executes a raw command line string in the terminal.
     *
     * @param commandLine - The raw command string to execute.
     * @returns The resulting CommandResult.
     */
    public execute(commandLine: string): CommandResult {
        if (typeof commandLine !== "string") {
            throw new TypeError("Command line must be a string.");
        }

        const result = executeLine(commandLine, this.context, this.registry);
        if (typeof result !== "object" || result === null) {
            throw new Error("Execution produced an invalid result.");
        }

        return result;
    }

    /**
     * Gets the current terminal session.
     */
    public getSession(): Session {
        return this.session;
    }

    /**
     * Gets the command registry.
     */
    public getRegistry(): CommandRegistry {
        return this.registry;
    }

    /**
     * Gets the VFS root directory.
     */
    public getRoot(): Directory {
        return this.root;
    }
}
