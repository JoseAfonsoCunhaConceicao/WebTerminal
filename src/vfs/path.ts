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