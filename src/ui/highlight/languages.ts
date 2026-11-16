/**
 * Language token definitions for the syntax highlighter.
 */

export interface LanguageConfig {
    readonly keywords: ReadonlySet<string>;
    readonly types: ReadonlySet<string>;
    readonly lineComment?: string | undefined;
    readonly blockCommentStart?: string | undefined;
    readonly blockCommentEnd?: string | undefined;
    readonly caseInsensitive?: boolean | undefined;
}

const C_KEYWORDS = new Set([
    "const", "let", "var", "function", "class", "interface", "type", "enum",
    "struct", "public", "private", "protected", "static", "readonly", "override",
    "import", "export", "from", "default", "return", "if", "else", "for", "while",
    "do", "switch", "case", "break", "continue", "new", "this", "super", "try",
    "catch", "finally", "throw", "async", "await", "fn", "mut", "pub", "impl",
    "trait", "use", "mod", "namespace", "include", "void", "true", "false", "null",
]);

const C_TYPES = new Set([
    "string", "number", "boolean", "any", "unknown", "never", "object", "symbol",
    "int", "float", "double", "char", "bool", "long", "short", "unsigned", "signed",
    "i8", "i16", "i32", "i64", "u8", "u16", "u32", "u64", "usize", "isize", "f32", "f64",
]);

const SCRIPT_KEYWORDS = new Set([
    "def", "class", "return", "if", "elif", "else", "for", "while", "import",
    "from", "as", "try", "except", "finally", "with", "yield", "lambda", "pass",
    "raise", "global", "nonlocal", "in", "is", "not", "and", "or", "True", "False",
    "None", "self", "echo", "local", "export", "fi", "then", "done", "do",
]);

const SCRIPT_TYPES = new Set(["int", "float", "str", "dict", "list", "set", "tuple", "bool"]);

const SQL_KEYWORDS = new Set([
    "select", "from", "where", "insert", "into", "update", "delete", "create",
    "table", "drop", "alter", "join", "inner", "left", "right", "full", "on",
    "group", "by", "order", "having", "limit", "and", "or", "not", "null",
    "primary", "key", "foreign", "references", "as", "distinct", "union", "view",
]);

const SQL_TYPES = new Set(["int", "integer", "varchar", "text", "boolean", "timestamp", "date"]);

const HTML_KEYWORDS = new Set([
    "doctype", "html", "head", "body", "div", "span", "p", "a", "script", "style",
    "table", "tr", "td", "th", "ul", "ol", "li", "input", "button", "form",
    "meta", "link", "header", "footer", "nav", "section", "article", "main", "h1", "h2", "h3",
]);

const HTML_ATTRS = new Set([
    "class", "id", "src", "href", "type", "name", "value", "rel", "style", "width", "height", "alt",
]);

const PHP_KEYWORDS = new Set([
    "echo", "print", "function", "class", "public", "private", "protected",
    "static", "return", "if", "else", "elseif", "foreach", "for", "while",
    "try", "catch", "finally", "throw", "new", "namespace", "use", "include", "require",
]);

const LUA_KEYWORDS = new Set([
    "function", "end", "local", "then", "do", "while", "repeat", "until",
    "if", "else", "elseif", "return", "nil", "true", "false", "and", "or", "not",
]);

const PROLOG_KEYWORDS = new Set([
    "is", "fail", "true", "false", "not", "write", "nl", "consult",
    "assert", "retract", "findall", "dynamic", "module",
]);

const ASM_KEYWORDS = new Set([
    "mov", "push", "pop", "add", "sub", "mul", "div", "jmp", "je", "jne",
    "call", "ret", "int", "section", "global", "extern", "db", "dw", "dd", "dq",
]);

const ASM_REGISTERS = new Set([
    "eax", "ebx", "ecx", "edx", "rax", "rbx", "rcx", "rdx", "rsp", "rbp",
    "rsi", "rdi", "r8", "r9", "r10", "r11", "r12", "r13", "r14", "r15",
]);

const EMPTY_SET = new Set<string>();

export function getLanguageConfig(ext: string): LanguageConfig {
    if (typeof ext !== "string") {
        throw new TypeError("File extension must be a string.");
    }
    if (ext.length > 20) {
        throw new RangeError("Extension exceeds maximum allowable length.");
    }

    const clean = ext.toLowerCase();
    switch (clean) {
        case "py":
        case "rb":
        case "sh":
        case "bash":
        case "zsh":
        case "yaml":
        case "yml":
            return { keywords: SCRIPT_KEYWORDS, types: SCRIPT_TYPES, lineComment: "#" };
        case "sql":
            return {
                keywords: SQL_KEYWORDS,
                types: SQL_TYPES,
                lineComment: "--",
                blockCommentStart: "/*",
                blockCommentEnd: "*/",
                caseInsensitive: true,
            };
        case "html":
        case "htm":
        case "xml":
            return {
                keywords: HTML_KEYWORDS,
                types: HTML_ATTRS,
                blockCommentStart: "<!--",
                blockCommentEnd: "-->",
                caseInsensitive: true,
            };
        case "php":
            return {
                keywords: PHP_KEYWORDS,
                types: C_TYPES,
                lineComment: "//",
                blockCommentStart: "/*",
                blockCommentEnd: "*/",
            };
        case "lua":
            return { keywords: LUA_KEYWORDS, types: EMPTY_SET, lineComment: "--" };
        case "pl":
        case "pro":
        case "prolog":
            return { keywords: PROLOG_KEYWORDS, types: EMPTY_SET, lineComment: "%" };
        case "asm":
        case "s":
            return { keywords: ASM_KEYWORDS, types: ASM_REGISTERS, lineComment: ";" };
        case "json":
            return { keywords: new Set(["true", "false", "null"]), types: EMPTY_SET };
        default:
            return {
                keywords: C_KEYWORDS,
                types: C_TYPES,
                lineComment: "//",
                blockCommentStart: "/*",
                blockCommentEnd: "*/",
            };
    }
}
