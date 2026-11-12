/**
 * Execution context providing environmental access to commands.
 */

import type { Directory } from "../vfs/node.js";
import type { Session } from "../session/session.js";

/**
 * Environmental context required to execute a command.
 */
export interface ExecutionContext {
    /**
     * Root directory of the virtual file system.
     */
    readonly root: Directory;

    /**
     * Active terminal session state.
     */
    readonly session: Session;
}

