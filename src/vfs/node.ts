/**
 * Defines the common structure shared by all virtual filesystem nodes.
 */

export interface NodeBase {
    name: string;
    kind: "file" | "directory";
}

export interface File {
    name: string;
    kind: "file";
    content: string;
}

export interface Directory {
    name: string;
    kind: "directory";
    children: Node[];
}

export type Node = File | Directory;