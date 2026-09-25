/**
 * Errors file
 */


/**
 * Error thrown when a path component cannot be found in the VFS.
 *
 * This error indicates that the requested path does not exist.
 */
export class PathNotFoundError extends Error {
    /**
     * Creates a new PathNotFoundError.
     *
     * @param message - Description of the error.
     */
    constructor(message: string) {
        super(message);
        this.name = "PathNotFoundError";
    }
}

/**
 * Error thrown when a path traversal attempts to continue through a file.
 *
 * A file cannot contain child nodes and therefore cannot be used as an
 * intermediate component of a path.
 */
export class NotADirectoryError extends Error {
    /**
     * Creates a new NotADirectoryError.
     *
     * @param message - Description of the error.
     */
    constructor(message: string) {
        super(message);
        this.name = "NotADirectoryError";
    }
}