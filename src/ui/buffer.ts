/**
 * Pure helper functions for terminal input buffer editing.
 */

/**
 * Inserts text at the cursor position.
 */
export function insertAt(
    input: string,
    cursor: number,
    text: string
): { input: string; cursor: number } {
    if (text.length === 0) {
        return { input, cursor };
    }
    const before = input.slice(0, cursor);
    const after = input.slice(cursor);
    return {
        input: before + text + after,
        cursor: cursor + text.length,
    };
}

/**
 * Deletes one character backwards from cursor position (Backspace).
 */
export function deleteBackwardAt(
    input: string,
    cursor: number
): { input: string; cursor: number } {
    if (cursor === 0) {
        return { input, cursor };
    }
    const before = input.slice(0, cursor - 1);
    const after = input.slice(cursor);
    return {
        input: before + after,
        cursor: cursor - 1,
    };
}

/**
 * Deletes one character forward from cursor position (Delete).
 */
export function deleteForwardAt(
    input: string,
    cursor: number
): { input: string; cursor: number } {
    if (cursor >= input.length) {
        return { input, cursor };
    }
    const before = input.slice(0, cursor);
    const after = input.slice(cursor + 1);
    return {
        input: before + after,
        cursor,
    };
}

