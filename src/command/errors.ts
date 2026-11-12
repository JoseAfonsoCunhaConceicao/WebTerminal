/**
 * Errors and error representations for command tokenization and parsing.
 */

/**
 * Identifies the specific error condition encountered by the tokenizer.
 */
export type TokenizerErrorCode =
    | "UNTERMINATED_SINGLE_QUOTE"
    | "UNTERMINATED_DOUBLE_QUOTE"
    | "TRAILING_ESCAPE";

/**
 * Structured error details for a tokenization failure.
 */
export interface TokenizerError {
    readonly code: TokenizerErrorCode;
    readonly message: string;
    readonly index: number;
}

/**
 * Creates a structured TokenizerError value.
 *
 * @param code - The error classification code.
 * @param message - Human-readable explanation of the error.
 * @param index - Zero-based character index where the error occurred or started.
 *
 * @returns A frozen TokenizerError object.
 */
export function createTokenizerError(
    code: TokenizerErrorCode,
    message: string,
    index: number
): TokenizerError {
    if (typeof index !== "number" || index < 0) {
        throw new RangeError("Index must be a non-negative number.");
    }
    if (typeof message !== "string" || message.length === 0) {
        throw new TypeError("Message must be a non-empty string.");
    }

    return Object.freeze({
        code,
        message,
        index,
    });
}

