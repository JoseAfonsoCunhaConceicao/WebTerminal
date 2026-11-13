/**
 * Session state management.
 */

import type { Path } from "../vfs/path.js";

/**
 * Static root path instance used for initial state and resets.
 */
const ROOT_PATH: Path = Object.freeze({
    components: Object.freeze([]),
    isAbsolute: true,
});

/**
 * Maximum number of command entries retained in session history.
 */
export const DEFAULT_MAX_HISTORY_ENTRIES = 1000;

/**
 * Represents the persistent execution state of a terminal session.
 *
 * A session stores the current working directory and the commands entered
 * during the session. It does not perform command parsing or execution and
 * has no knowledge of the virtual file system.
 */
export class Session {
    private currentPath: Path;
    private readonly history: string[];
    private readonly maxHistoryEntries: number;

    /**
     * Creates a new terminal session.
     *
     * @param maxHistoryEntries - Optional maximum history capacity (defaults to 1000).
     */
    constructor(maxHistoryEntries: number = DEFAULT_MAX_HISTORY_ENTRIES) {
        if (typeof maxHistoryEntries !== "number" || maxHistoryEntries <= 0 || !Number.isInteger(maxHistoryEntries)) {
            throw new TypeError("maxHistoryEntries must be a positive integer.");
        }

        this.currentPath = ROOT_PATH;
        this.history = [];
        this.maxHistoryEntries = maxHistoryEntries;
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
        if (typeof newPath !== "object" || newPath === null) {
            throw new TypeError("New path must be a valid Path object.");
        }

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
        return [...this.history];
    }

    /**
     * Adds a command to the session history.
     *
     * @param command - The command to add to the history.
     */
    addHistory(command: string): void {
        if (typeof command !== "string") {
            throw new TypeError("Command must be a string.");
        }

        this.history.push(command);
        if (this.history.length > this.maxHistoryEntries) {
            this.history.shift();
        }
    }

    /**
     * Resets the session to its initial state.
     *
     * The current working directory is reset to the virtual file system root
     * and the command history is cleared.
     */
    reset(): void {
        this.currentPath = ROOT_PATH;
        this.history.length = 0;
    }
}
