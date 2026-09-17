/**
 * Defines the representation and parsing of virtual filesystem paths.
 */

export interface Path {
    components: string[];
    isAbsolute: boolean;
}

/** Function that constructs the parsed Path object */
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

/** Function that normalizes the parsed Path */
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

/** Function that combines a base path with another path, returning an absolute path. */
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