/**
 * Session file
 */

import type { Path } from "../vfs/path.js";
import { parsePath } from "../vfs/path.js";

/**
 * Represents the persistent execution state of a terminal session.
 *
 * A session stores the current working directory and the commands entered
 * during the session. It does not perform command parsing or execution and
 * has no knowledge of the virtual file system.
 */
export class Session {
    private currentPath: Path;
    private history: string[];

    /**
     * Creates a new terminal session.
     *
     * The current path is initialized to the virtual file system root and
     * the command history is initialized as empty.
     */
    constructor() {
        this.currentPath = parsePath("/");
        this.history = [];
    }

    /**
     * Returns the current working directory of the session.
     *
     * @returns The current working directory.
     */
    getCurrentPath(): Path {
        return this.currentPath;
    }

    /**
     * Changes the current working directory of the session.
     *
     * Path validation and resolution are responsibilities of the caller.
     *
     * @param newPath - The new current working directory.
     */
    setCurrentPath(newPath: Path): void {
        this.currentPath = newPath;
    }

    /**
     * Returns the commands recorded in the session history.
     *
     * The returned array is exposed as read-only and must not be modified
     * through this method.
     *
     * @returns The commands in chronological order.
     */
    getHistory(): readonly string[] {
        return this.history;
    }

    /**
     * Adds a command to the session history.
     *
     * @param command - The command to add to the history.
     */
    addHistory(command: string): void {
        this.history.push(command);
    }

    /**
     * Resets the session to its initial state.
     *
     * The current working directory is reset to the virtual file system root
     * and the command history is cleared.
     */
    reset(): void {
        this.currentPath = parsePath("/");
        this.history.length = 0;
    }
}