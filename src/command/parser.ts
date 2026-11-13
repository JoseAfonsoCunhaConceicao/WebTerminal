/**
 * Command parsing from tokens into structured CommandInvocation.
 */

import type { CommandInvocation } from "./invocation.js";

/**
 * Parses an array of string tokens into a structured CommandInvocation.
 *
 * @param tokens - The token stream to parse.
 *
 * @returns A CommandInvocation or null if the token stream is empty.
 */
export function parseCommand(tokens: readonly string[]): CommandInvocation | null {
    if (!Array.isArray(tokens)) {
        throw new TypeError("Tokens must be an array.");
    }

    const inputSize = tokens.length;
    if (inputSize === 0) {
        return null;
    }

    const command = tokens[0]!;
    const options: string[] = [];
    const args: string[] = [];
    let parsingOptions = true;

    for (let idx = 1; idx < inputSize; idx++) {
        const token = tokens[idx]!;

        if (!parsingOptions) {
            args.push(token);
            continue;
        }

        if (token === "--") {
            parsingOptions = false;
            continue;
        }

        if (token.startsWith("-")) {
            options.push(token);
            continue;
        }

        args.push(token);
    }

    return { command, options, arguments: args };
}
