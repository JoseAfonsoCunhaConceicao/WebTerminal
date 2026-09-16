/**
 * Defines the common structure shared by all files.
 */

import type { Node } from "./node.js";

export interface File extends Node {
    content: string;
} 