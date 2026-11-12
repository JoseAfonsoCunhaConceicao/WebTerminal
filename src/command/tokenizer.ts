/**
 * Command line string tokenizer.
 */

import type { TokenizerError } from "./errors.js";
import { createTokenizerError } from "./errors.js";

/**
 * Internal parsing states for the tokenizer.
 */
enum TokenizerState {
    Unquoted = 0,
    SingleQuoted = 1,
    DoubleQuoted = 2,
}

/**
 * Result of a tokenization operation.
 */
export type TokenizeResult =
    | { readonly success: true; readonly tokens: readonly string[] }
    | { readonly success: false; readonly error: TokenizerError };

/**
 * Internal state context holding tokenizer iteration data.
 */
interface TokenizerContext {
    readonly input: string;
    readonly inputSize: number;
    readonly tokens: string[];
    current: string;
    hasToken: boolean;
    state: TokenizerState;
    quoteStartIndex: number;
    idx: number;
}

/**
 * Handles backslash escape sequences for unquoted and double-quoted contexts.
 */
function handleEscape(ctx: TokenizerContext): TokenizerError | null {
    if (ctx.idx + 1 >= ctx.inputSize) {
        return createTokenizerError(
            "TRAILING_ESCAPE",
            "Trailing backslash escape at end of input.",
            ctx.idx
        );
    }

    ctx.idx += 1;
    const nextChar = ctx.input[ctx.idx]!;
    ctx.current += nextChar;
    ctx.hasToken = true;
    return null;
}

/**
 * Handles characters while in unquoted state.
 */
function handleUnquoted(ctx: TokenizerContext, char: string): TokenizerError | null {
    if (char === " " || char === "\t") {
        if (ctx.hasToken) {
            ctx.tokens.push(ctx.current);
            ctx.current = "";
            ctx.hasToken = false;
        }
        return null;
    }

    if (char === "'") {
        ctx.state = TokenizerState.SingleQuoted;
        ctx.quoteStartIndex = ctx.idx;
        ctx.hasToken = true;
        return null;
    }

    if (char === '"') {
        ctx.state = TokenizerState.DoubleQuoted;
        ctx.quoteStartIndex = ctx.idx;
        ctx.hasToken = true;
        return null;
    }

    if (char === "\\") {
        return handleEscape(ctx);
    }

    ctx.current += char;
    ctx.hasToken = true;
    return null;
}

/**
 * Handles characters while in single-quoted state.
 */
function handleSingleQuoted(ctx: TokenizerContext, char: string): void {
    if (char === "'") {
        ctx.state = TokenizerState.Unquoted;
        return;
    }

    ctx.current += char;
}

/**
 * Handles characters while in double-quoted state.
 */
function handleDoubleQuoted(ctx: TokenizerContext, char: string): TokenizerError | null {
    if (char === '"') {
        ctx.state = TokenizerState.Unquoted;
        return null;
    }

    if (char === "\\") {
        return handleEscape(ctx);
    }

    ctx.current += char;
    return null;
}

/**
 * Validates the final state and flushes any pending token.
 */
function validateFinalState(ctx: TokenizerContext): TokenizerError | null {
    if (ctx.state === TokenizerState.SingleQuoted) {
        return createTokenizerError(
            "UNTERMINATED_SINGLE_QUOTE",
            "Unterminated single quote in input.",
            ctx.quoteStartIndex
        );
    }

    if (ctx.state === TokenizerState.DoubleQuoted) {
        return createTokenizerError(
            "UNTERMINATED_DOUBLE_QUOTE",
            "Unterminated double quote in input.",
            ctx.quoteStartIndex
        );
    }

    if (ctx.hasToken) {
        ctx.tokens.push(ctx.current);
    }

    return null;
}

/**
 * Tokenizes a command line input string into separate argument tokens.
 *
 * @param input - The raw command line string to tokenize.
 *
 * @returns A TokenizeResult containing either the parsed tokens or an error.
 */
export function tokenize(input: string): TokenizeResult {
    if (typeof input !== "string") {
        throw new TypeError("Input must be a string.");
    }

    const ctx: TokenizerContext = {
        input,
        inputSize: input.length,
        tokens: [],
        current: "",
        hasToken: false,
        state: TokenizerState.Unquoted,
        quoteStartIndex: -1,
        idx: 0,
    };

    for (; ctx.idx < ctx.inputSize; ctx.idx++) {
        const char = ctx.input[ctx.idx]!;
        let error: TokenizerError | null = null;

        if (ctx.state === TokenizerState.Unquoted) {
            error = handleUnquoted(ctx, char);
        } else if (ctx.state === TokenizerState.DoubleQuoted) {
            error = handleDoubleQuoted(ctx, char);
        } else {
            handleSingleQuoted(ctx, char);
        }

        if (error !== null) {
            return { success: false, error };
        }
    }

    const finalError = validateFinalState(ctx);
    if (finalError !== null) {
        return { success: false, error: finalError };
    }

    return { success: true, tokens: ctx.tokens };
}
