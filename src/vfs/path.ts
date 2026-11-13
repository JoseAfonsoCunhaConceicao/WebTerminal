/**
 * Defines the representation and parsing of virtual filesystem paths.
 */

export interface Path {
    readonly components: readonly string[];
    readonly isAbsolute: boolean;
}

/**
 * Parses a filesystem path string into its structured Path representation.
 *
 * @param path - The path string to parse.
 *
 * @returns A Path containing the parsed components and an isAbsolute flag.
 */
export function parsePath(path: string): Path {
    if (typeof path !== "string") {
        throw new TypeError("Path must be a string.");
    }

    const parsedComponents: string[] = [];
    const pathSize = path.length;
    let start = -1;

    for (let i = 0; i < pathSize; i++) {
        if (path[i] !== '/') {
            if (start === -1) {
                start = i;
            }
        } else if (start !== -1) {
            parsedComponents.push(path.slice(start, i));
            start = -1;
        }
    }

    if (start !== -1) {
        parsedComponents.push(path.slice(start, pathSize));
    }

    return {
        components: parsedComponents,
        isAbsolute: path.startsWith('/'),
    };
}

/**
 * Normalizes a structured Path by resolving current and parent components.
 *
 * @param path - The Path to normalize.
 *
 * @returns A new normalized Path.
 */
export function normalizePath(path: Path): Path {
    if (typeof path !== "object" || path === null || !Array.isArray(path.components)) {
        throw new TypeError("Path must be a valid Path object.");
    }

    const normalizedComponents: string[] = [];
    const parsedComponentsSize = path.components.length;

    for (let i = 0; i < parsedComponentsSize; i++) {
        const currentComponent = path.components[i]!;

        if (currentComponent === ".") {
            continue;
        }

        if (currentComponent === "..") {
            const hasPrev = normalizedComponents.length !== 0;
            const prevNotParent = normalizedComponents.at(-1) !== "..";

            if (hasPrev && prevNotParent) {
                normalizedComponents.pop();
            } else if (!path.isAbsolute) {
                normalizedComponents.push(currentComponent);
            }
            continue;
        }

        normalizedComponents.push(currentComponent);
    }

    return {
        components: normalizedComponents,
        isAbsolute: path.isAbsolute,
    };
}

/**
 * Combines a base Path with another Path.
 *
 * @param basePath - The base path (expected absolute).
 * @param path - The path to combine with the base path.
 *
 * @returns The combined Path.
 */
export function joinPath(basePath: Path, path: Path): Path {
    if (typeof basePath !== "object" || basePath === null || !Array.isArray(basePath.components)) {
        throw new TypeError("BasePath must be a valid Path object.");
    }
    if (typeof path !== "object" || path === null || !Array.isArray(path.components)) {
        throw new TypeError("Path must be a valid Path object.");
    }

    if (path.isAbsolute) {
        return path;
    }

    return {
        components: basePath.components.concat(path.components),
        isAbsolute: true,
    };
}

/**
 * Resolves a path against the current working path.
 *
 * @param currentPath - The current working path (must be absolute).
 * @param input - The path supplied for resolution.
 *
 * @returns An absolute, normalized Path.
 */
export function resolvePath(currentPath: Path, input: string): Path {
    if (typeof input !== "string") {
        throw new TypeError("Input must be a string.");
    }

    if (input === "" || input === ".") {
        return {
            components: [...currentPath.components],
            isAbsolute: true,
        };
    }

    if (input.startsWith("/")) {
        return normalizePath(parsePath(input));
    }

    return normalizePath(joinPath(currentPath, parsePath(input)));
}

/**
 * Formats a structured Path into a canonical string representation.
 *
 * @param path - The Path object to format.
 *
 * @returns The string representation of the path.
 */
export function formatPath(path: Path): string {
    if (typeof path !== "object" || path === null || !Array.isArray(path.components)) {
        throw new TypeError("Path must be a valid Path object.");
    }

    if (path.components.length === 0) {
        return path.isAbsolute ? "/" : "";
    }

    const joined = path.components.join("/");
    return path.isAbsolute ? `/${joined}` : joined;
}
