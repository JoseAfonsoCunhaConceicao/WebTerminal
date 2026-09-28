/**
 * Represents a parsed command invocation.
 * 
 * A command invocation contains only the syntactic components of a command
 * entered by the user. It does not interpret commands, validate options,
 * resolve paths, or execute anything.
 */
export interface CommandInvocation {
    /**
     * The command name.
     */
    readonly command: string;

    /**
     * The options provided to the command, preserving their original syntax.
     *
     * Short and long options retain their `-` or `--` prefixes.
     */
    readonly options: readonly string[];

    /**
     * The arguments provided to the command, preserving their original order.
     */
    readonly arguments: readonly string[];
}