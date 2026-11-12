/**
 * Result representation for command execution.
 */

/**
 * Structured outcome returned by a command execution.
 */
export interface CommandResult {
    /**
     * Numeric process exit code. 0 indicates success, non-zero indicates an error.
     */
    readonly exitCode: number;

    /**
     * Standard output produced by the command.
     */
    readonly output: string;

    /**
     * Error message produced by the command, or null if no error occurred.
     */
    readonly error: string | null;
}

/**
 * Creates a successful CommandResult.
 *
 * @param output - Output string produced by the command.
 *
 * @returns A successful CommandResult with exitCode 0 and error null.
 */
export function successResult(output: string = ""): CommandResult {
    if (typeof output !== "string") {
        throw new TypeError("Output must be a string.");
    }

    return Object.freeze({
        exitCode: 0,
        output,
        error: null,
    });
}

/**
 * Creates an error CommandResult.
 *
 * @param error - Error message explaining the failure.
 * @param exitCode - Non-zero exit code (defaults to 1).
 *
 * @returns An error CommandResult with empty output.
 */
export function errorResult(error: string, exitCode: number = 1): CommandResult {
    if (typeof error !== "string" || error.length === 0) {
        throw new TypeError("Error message must be a non-empty string.");
    }
    if (typeof exitCode !== "number" || exitCode === 0) {
        throw new RangeError("Exit code must be a non-zero number.");
    }

    return Object.freeze({
        exitCode,
        output: "",
        error,
    });
}

