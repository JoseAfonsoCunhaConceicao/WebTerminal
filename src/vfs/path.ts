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
 * @param path - The path string to parse. The path may be absolute or
 *   relative and may contain repeated or trailing path separators.
 *
 * @returns A Path containing the parsed components and an absolute flag
 *   indicating whether the input path starts at the filesystem root.
 *
 * @remarks
 * Path components are separated by `/`. Repeated separators and trailing
 * separators are ignored.
 *
 * Special components such as `.` and `..` are preserved and are not
 * normalized by this function. Path normalization is performed separately
 * by `normalizePath`.
 *
 * This function does not access the virtual filesystem and does not mutate
 * its input.
 */
export function parsePath(path: string): Path {
    const parsedComponents: string[] = [];
    let accumulator = "";
    const pathSize = path.length;

    for (let i: number = 0; i < pathSize; i++) {
        if (path[i] !== '/') {
            accumulator += path[i];
        } else {
            if (accumulator !== "") {
                parsedComponents.push(accumulator);
                accumulator = "";
            }
        }
    }

    if (accumulator !== "" )
        parsedComponents.push(accumulator);


    const res: Path = {
        components: parsedComponents,
        isAbsolute: path.startsWith('/'),
    };

    return res;
}

/**
 * Normalizes a structured Path by resolving current-directory and
 * parent-directory components.
 *
 * @param path - The Path to normalize. Its absolute/relative nature is
 *   preserved in the resulting Path.
 *
 * @returns A new normalized Path with `.` components removed and
 *   resolvable `..` components processed according to the path type.
 *
 * @remarks
 * For absolute paths, `..` components that would move above the
 * filesystem root are discarded.
 *
 * For relative paths, unresolved leading `..` components are preserved
 * because their final location depends on the path's eventual base.
 *
 * The input Path is not mutated. The returned Path contains a new
 * components array.
 *
 * Normalization is idempotent: normalizing an already normalized Path
 * produces an equivalent Path.
 */
export function normalizePath(path: Path): Path {
    const normalizedComponents: string[] = [];
    const parsedComponentsSize = path.components.length;

    for(let i = 0; i < parsedComponentsSize; i++) {
        const currentComponent = path.components[i]!;
        
        if (currentComponent == ".")
            continue;
        else if (currentComponent == "..") {
            if ((normalizedComponents.length != 0) && (normalizedComponents.at(-1) != ".."))
                normalizedComponents.pop();
            else {
                if (!path.isAbsolute)
                    normalizedComponents.push(currentComponent);
                else 
                    continue;
            }
        } else
            normalizedComponents.push(currentComponent);
    }

    const newPath: Path = {
        components: normalizedComponents,
        isAbsolute: path.isAbsolute,
    };

    return newPath;
}

/**
 * Combines a base Path with another Path.
 *
 * @param basePath - The base path to which a relative path is appended.
 *   The base path is expected to represent an absolute path.
 * @param path - The path to combine with the base path. If this path is
 *   absolute, it is returned independently of the base path.
 *
 * @returns The combined Path. Relative paths are appended to the base
 *   path and the result is marked as absolute. Absolute paths are returned
 *   without being combined with the base path.
 *
 * @remarks
 * This function performs path composition only. It does not normalize
 * the resulting components, so `.` and `..` components are preserved.
 *
 * Neither the base path nor the input path is mutated.
 */
export function joinPath(basePath: Path, path: Path): Path {
    if (path.isAbsolute)
        return path;
    else {
        const newPath = basePath.components.concat(path.components);
        const jointedPath: Path = {
            components: newPath,
            isAbsolute: true,
        }

        return jointedPath;
    }
}

/**
 * Resolves a path against the current working path.
 *
 * @param currentPath - The current working path. It must be an absolute,
 *   normalized Path.
 * @param input - The path supplied for resolution. It may be relative or
 *   absolute and may contain `.`, `..`, repeated separators, or trailing
 *   separators.
 *
 * @returns An absolute, normalized Path representing the resolved location.
 *
 * @remarks
 * Relative input paths are resolved against `currentPath`. Absolute input
 * paths are resolved independently of `currentPath`.
 *
 * The resulting Path contains no `.` or `..` components, and `..`
 * components cannot cause the result to escape the filesystem root.
 *
 * This function performs path resolution only. It does not access the
 * virtual filesystem and does not require the target path to exist.
 *
 * The `currentPath` argument is not mutated.
 */
export function resolvePath( currentPath: Path, input: string): Path {
    const inputPath: Path = parsePath(input);
    const jointedPath: Path = joinPath(currentPath, inputPath);
    const normalizedPath: Path = normalizePath(jointedPath);

    return normalizedPath;
}