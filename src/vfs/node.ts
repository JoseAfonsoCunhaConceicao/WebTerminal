/**
 * Defines the common structure shared by all virtual filesystem nodes.
 */

export interface Node {
    name: string;
    kind: "file" | "directory";
}