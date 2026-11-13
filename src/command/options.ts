/**
 * Command option and flag parsing helpers.
 */

/**
 * Checks whether a short character flag or long option flag is present.
 * Supports bundled short options (e.g., '-la' contains both 'l' and 'a').
 *
 * @param options - List of parsed option strings.
 * @param shortChar - Single character for the short flag (e.g. 'a').
 * @param longFlag - Optional long flag string (e.g. '--all').
 *
 * @returns True if the flag is active.
 */
export function hasFlag(
    options: readonly string[],
    shortChar: string,
    longFlag?: string
): boolean {
    if (!Array.isArray(options) || typeof shortChar !== "string") {
        throw new TypeError("Invalid options array or shortChar argument.");
    }

    if (longFlag && options.includes(longFlag)) {
        return true;
    }

    const count = options.length;
    for (let idx = 0; idx < count; idx++) {
        const opt = options[idx]!;
        if (!opt.startsWith("-") || opt.startsWith("--")) {
            continue;
        }
        if (opt.slice(1).includes(shortChar)) {
            return true;
        }
    }

    return false;
}

export interface ExtractedOption {
    readonly value: string | undefined;
    readonly remainingArgs: readonly string[];
}

/**
 * Extracts a valued option from options or the leading argument.
 * Supports both attached syntax ('-L2') and detached syntax ('-L', '2').
 *
 * @param options - Parsed options list.
 * @param args - Positional arguments list.
 * @param flagChar - Option character (e.g. 'L').
 * @param longFlag - Optional long option string (e.g. '--level').
 */
export function extractValuedOption(
    options: readonly string[],
    args: readonly string[],
    flagChar: string,
    longFlag?: string
): ExtractedOption {
    if (!Array.isArray(options) || !Array.isArray(args)) {
        throw new TypeError("Options and args must be valid arrays.");
    }

    const shortPrefix = `-${flagChar}`;
    const optCount = options.length;

    for (let idx = 0; idx < optCount; idx++) {
        const opt = options[idx]!;
        if (opt.startsWith(shortPrefix) && opt.length > shortPrefix.length) {
            return { value: opt.slice(shortPrefix.length), remainingArgs: args };
        }
        if (longFlag && opt.startsWith(`${longFlag}=`)) {
            return { value: opt.slice(longFlag.length + 1), remainingArgs: args };
        }
    }

    const hasDetached = options.includes(shortPrefix) || (longFlag ? options.includes(longFlag) : false);
    if (hasDetached && args.length > 0) {
        return { value: args[0], remainingArgs: args.slice(1) };
    }

    return { value: undefined, remainingArgs: args };
}

