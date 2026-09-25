/**
 * Session file
 */

import type { Path } from "../vfs/path.js";
import { parsePath } from "../vfs/path.js";

export class Session {
    private currentPath: Path;
    private history: string[];

    constructor() {
        this.currentPath = parsePath("/");
        this.history = [];
    }

    getCurrentPath(): Path {
        return this.currentPath;
    }

    setCurrentPath(newPath: Path): void {
        this.currentPath = newPath;
    }

    getHistory(): readonly string[] {
        return this.history;
    }

    addHistory(command: string): void {
        this.history.push(command);
    }

    reset(): void {
        this.currentPath = parsePath("/");
        this.history.length = 0;
    }
}