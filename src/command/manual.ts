/**
 * Built-in manual documentation database and search utilities.
 */

/**
 * Representation of a command manual page.
 */
export interface ManualPage {
    readonly name: string;
    readonly section: number;
    readonly synopsis: string;
    readonly shortDescription: string;
    readonly description: string;
}

const MANUAL_DATABASE: readonly ManualPage[] = Object.freeze([
    {
        name: "pwd",
        section: 1,
        synopsis: "pwd",
        shortDescription: "Print name of current working directory",
        description: "Prints the full absolute path of the current working directory.",
    },
    {
        name: "cd",
        section: 1,
        synopsis: "cd [PATH]",
        shortDescription: "Change the current working directory",
        description: "Changes the current working directory of the session to the target path. Defaults to root if no path is given.",
    },
    {
        name: "ls",
        section: 1,
        synopsis: "ls [OPTIONS] [PATH]",
        shortDescription: "List directory contents",
        description: "Lists directory contents in alphabetical order. Supports options -a (--all) and -1.",
    },
    {
        name: "cat",
        section: 1,
        synopsis: "cat <FILE>...",
        shortDescription: "Concatenate and print file contents",
        description: "Concatenates and prints the contents of one or more files to standard output.",
    },
    {
        name: "echo",
        section: 1,
        synopsis: "echo [TEXT]...",
        shortDescription: "Write arguments to standard output",
        description: "Writes the specified text arguments to standard output separated by single spaces.",
    },
    {
        name: "clear",
        section: 1,
        synopsis: "clear",
        shortDescription: "Clear the terminal screen",
        description: "Clears the terminal screen by emitting standard ANSI escape sequences.",
    },
    {
        name: "reset",
        section: 1,
        synopsis: "reset",
        shortDescription: "Reset the terminal session state",
        description: "Resets the current working directory to root and clears the command history.",
    },
    {
        name: "history",
        section: 1,
        synopsis: "history",
        shortDescription: "Display the command history list",
        description: "Displays the numbered chronological list of commands executed in the current session.",
    },
    {
        name: "help",
        section: 1,
        synopsis: "help [COMMAND]",
        shortDescription: "Display information about available commands",
        description: "Displays general command overview or detailed usage for a specified command.",
    },
    {
        name: "whoami",
        section: 1,
        synopsis: "whoami",
        shortDescription: "Print the current user identity",
        description: "Prints the user identity currently logged into the virtual terminal session.",
    },
    {
        name: "tree",
        section: 1,
        synopsis: "tree [OPTIONS] [PATH]",
        shortDescription: "List contents of directories in a tree-like format",
        description: "Produces a graphical directory tree representation of the filesystem structure.",
    },
    {
        name: "man",
        section: 1,
        synopsis: "man <COMMAND>",
        shortDescription: "Format and display manual pages",
        description: "Displays the online manual documentation page for the specified command.",
    },
    {
        name: "apropos",
        section: 1,
        synopsis: "apropos <KEYWORD>",
        shortDescription: "Search manual page names and descriptions",
        description: "Searches the manual database for entries whose names or descriptions match the keyword.",
    },
]);

/**
 * Pre-indexed map for O(1) manual page lookup by command name.
 */
const MANUAL_MAP: ReadonlyMap<string, ManualPage> = new Map(
    MANUAL_DATABASE.map((entry) => [entry.name, entry])
);

/**
 * Retrieves a manual page by command name.
 *
 * @param name - The command name to look up.
 *
 * @returns The matching ManualPage or undefined if not found.
 */
export function getManualPage(name: string): ManualPage | undefined {
    if (typeof name !== "string") {
        throw new TypeError("Command name must be a string.");
    }

    const normalized = name.toLowerCase().trim();
    return MANUAL_MAP.get(normalized);
}

/**
 * Searches manual pages matching the provided keyword.
 *
 * @param keyword - The search term to match against name and description.
 *
 * @returns A list of matching ManualPage objects.
 */
export function searchManualPages(keyword: string): readonly ManualPage[] {
    if (typeof keyword !== "string") {
        throw new TypeError("Keyword must be a string.");
    }

    const term = keyword.toLowerCase().trim();
    if (term.length === 0) {
        return [];
    }

    const results: ManualPage[] = [];
    const count = MANUAL_DATABASE.length;

    for (let idx = 0; idx < count; idx++) {
        const entry = MANUAL_DATABASE[idx]!;
        const inName = entry.name.toLowerCase().includes(term);
        const inDesc = entry.shortDescription.toLowerCase().includes(term);

        if (inName || inDesc) {
            results.push(entry);
        }
    }

    return results;
}

