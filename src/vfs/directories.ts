/**
 * Defines the common structure shared by all directories.
 */

import type { Node } from "./node.js";
import type { File } from "./file.js";

export interface Directory extends Node {
    children: (Directory | File)[];
}