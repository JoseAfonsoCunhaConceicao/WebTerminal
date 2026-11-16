/**
 * History-based inline autosuggestion engine (fish/zsh ghost text style).
 */

export interface AcceptedSuggestionResult {
    readonly input: string;
    readonly cursor: number;
}

/**
 * Computes a suffix suggestion from history matching the current input prefix.
 * Searches backwards from most recent to oldest command.
 *
 * @param input - Current active user input string.
 * @param history - Array of historical commands.
 *
 * @returns The suffix remainder to display as ghost text, or empty string if no match.
 */
export function computeSuggestion(input: string, history: readonly string[]): string {
    if (typeof input !== "string" || !Array.isArray(history)) {
        throw new TypeError("Input must be a string and history must be an array.");
    }

    if (input.length === 0 || history.length === 0) {
        return "";
    }

    const total = history.length;
    const maxLookback = Math.min(total, 5000);
    const startIdx = total - 1;
    const endIdx = total - maxLookback;

    for (let idx = startIdx; idx >= endIdx; idx--) {
        const item = history[idx]!;
        if (item.startsWith(input) && item.length > input.length) {
            return item.slice(input.length);
        }
    }

    return "";
}

/**
 * Accepts a ghost text suggestion, appending it to the input buffer.
 *
 * @param input - Current input string.
 * @param suggestion - Ghost text suffix to accept.
 *
 * @returns Updated input and cursor position at the end of the accepted command.
 */
export function acceptSuggestion(input: string, suggestion: string): AcceptedSuggestionResult {
    if (typeof input !== "string" || typeof suggestion !== "string") {
        throw new TypeError("Input and suggestion must be valid strings.");
    }

    const nextInput = input + suggestion;
    return {
        input: nextInput,
        cursor: nextInput.length,
    };
}

