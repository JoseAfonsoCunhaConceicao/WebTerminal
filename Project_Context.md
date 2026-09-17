# WebTerminal — Project Context

> **Purpose:** Persistent technical context for continuing development of WebTerminal across separate conversations.
>
> **Important:** Before making architectural or implementation decisions in a new conversation, read this file and inspect the current repository state. This document describes the intended and known state at the time it was last updated; the repository itself is the source of truth if they differ.

---

## 1. Project

**Name:** WebTerminal

WebTerminal is a TypeScript library for building an interactive terminal-like UI for web applications.

It simulates a Unix-like terminal over a **virtual filesystem**.

It is:

- not a real terminal;
- not a system shell;
- not Bash/Zsh;
- not a real host filesystem;
- not an arbitrary code execution environment.

The consumer provides the virtual world/content. WebTerminal provides terminal behavior and interaction semantics.

The project is currently in **early development**.

---

## 2. Main Architectural Goal

The project is designed around a strict separation between domain logic and presentation.

```text
WebTerminal
├── Core
│   ├── Parser
│   ├── Session
│   ├── VFS
│   ├── Commands
│   │   └── Command Registry
│   │       ├── Built-ins
│   │       └── Custom
│   └── Documentation
│
└── Presentation
    └── React / Web
```

### Core

The Core owns terminal/domain behavior.

It must not depend on:

- React;
- the DOM;
- CSS;
- browser APIs;
- `window`;
- `document`;
- UI-specific state.

The Core should remain independently testable and usable without a browser.

### Presentation

The Presentation layer is an adapter/rendering layer.

It is responsible for:

- rendering the terminal;
- capturing user interaction;
- translating UI events into Core operations;
- displaying Core results.

Business/domain rules must not be implemented in the presentation layer.

---

## 3. Engineering Principles

The project follows a strict engineering discipline inspired by the user's interpretation of NASA/JPL "Power of 10" principles, adapted to TypeScript.

The objective is deterministic, auditable and predictable software rather than literal application of C/C++ rules.

Important principles:

1. Keep Core independent of UI and browser APIs.
2. Prefer deterministic functions.
3. Minimize mutable state.
4. Keep functions small and explicit.
5. Avoid recursion in Core algorithms unless there is a clear justification.
6. Prefer iterative algorithms.
7. Loops should have clearly understandable bounds.
8. Use explicit types and structured errors.
9. Keep public interfaces small.
10. Avoid implicit asynchronous behavior.
11. Minimize unnecessary allocations and copies.
12. Optimize memory usage where it does not compromise correctness or verifiability.
13. Prefer simple, auditable data structures over clever abstractions.
14. Keep tests deterministic.
15. `tsc`, linting and tests should be clean before committing.

Performance matters, but micro-optimization must not compromise correctness, maintainability or verification.

---

## 4. Technology

Current stack:

- TypeScript
- Node.js
- npm
- Node.js built-in test runner

Testing intentionally uses Node's built-in test runner rather than Vitest/Jest to keep the dependency footprint small.

The project currently uses strict TypeScript settings.

---

## 5. Repository Structure

Current relevant structure:

```text
WebTerminal/
├── src/
│   └── vfs/
│       ├── node.ts
│       ├── file.ts
│       ├── directories.ts
│       └── path.ts
│
├── test/
│   ├── tsconfig.json
│   └── vfs/
│       └── path.test.ts
│
├── tsconfig.json
├── tsconfig.test.json
├── package.json
├── package-lock.json
├── .gitignore
├── README.md
└── PROJECT_CONTEXT.md
```

The directory file is currently named **`directories.ts`**. Do not assume it is named `directory.ts`.

---

# 6. Virtual Filesystem

## 6.1 Node

`src/vfs/node.ts`

The common node representation:

```ts
export interface Node {
  name: string;
  kind: "file" | "directory";
}
```

---

## 6.2 File

`src/vfs/file.ts`

A file extends `Node` and contains:

```text
name
kind = "file"
content
```

The current interface is conceptually:

```ts
export interface File extends Node {
  content: string;
}
```

---

## 6.3 Directory

`src/vfs/directories.ts`

A directory extends `Node` and contains child nodes.

Conceptually:

```ts
export interface Directory extends Node {
  name: string;
  kind: "directory";
  children: (Directory | File)[];
}
```

The VFS currently uses a recursive **data model**, but recursive algorithms are intentionally avoided.

There are no parent pointers.

The planned approach is to maintain the current absolute path in the Session rather than storing parent references in every directory.

---

# 7. Path Representation

`src/vfs/path.ts`

Current representation:

```ts
export interface Path {
  components: string[];
  isAbsolute: boolean;
}
```

A path is represented as components plus an absolute/relative flag.

Examples:

```text
"/"                  -> { components: [], isAbsolute: true }
"/home/jose"         -> { components: ["home", "jose"], isAbsolute: true }
"docs/projects"      -> { components: ["docs", "projects"], isAbsolute: false }
"../docs"            -> { components: ["..", "docs"], isAbsolute: false }
```

---

# 8. `parsePath`

`parsePath(path: string): Path`

Responsibilities:

- split a string into path components;
- detect whether the path is absolute;
- ignore repeated `/`;
- ignore trailing separators;
- preserve `"."`;
- preserve `".."`;
- do not perform normalization.

Examples:

```text
""                    -> []
"/"                   -> []
"home/jose"           -> ["home", "jose"]
"/home/jose"          -> ["home", "jose"]
"/home//jose///docs"  -> ["home", "jose", "docs"]
"./home/./docs"       -> [".", "home", ".", "docs"]
"../home/../docs"     -> ["..", "home", "..", "docs"]
```

`parsePath` is intentionally only a parser.

Normalization is a separate operation.

---

# 9. `normalizePath`

`normalizePath(path: Path): Path`

Responsibilities:

- remove `"."`;
- resolve `".."` against preceding components;
- preserve unresolved `".."` for relative paths;
- discard `".."` that would go above root for absolute paths;
- preserve the absolute/relative flag;
- never mutate the input `Path`.

Examples:

```text
"/home/./docs"
    -> "/home/docs"

"/home/jose/../docs"
    -> "/home/docs"

"../../docs"
    -> "../../docs"

"/../docs"
    -> "/docs"
```

Important invariants:

### No dot components

A normalized path never contains:

```text
"."
```

### Absolute paths contain no parent components

A normalized absolute path never contains:

```text
".."
```

### Relative paths may contain unresolved parent components

For example:

```text
../../docs
```

remains valid as a relative normalized path.

### Idempotence

Normalization is idempotent:

```text
normalize(normalize(P)) === normalize(P)
```

### Immutability

`normalizePath` must not mutate its input.

The current implementation is iterative and uses an output array as a stack.

---

# 10. `joinPath`

`joinPath(basePath: Path, path: Path): Path`

Responsibilities:

- if `path` is absolute, return it unchanged;
- otherwise append its components to the base path;
- produce an absolute result;
- do not normalize;
- do not mutate either input.

Examples:

```text
joinPath("/home/jose", "docs")
    -> "/home/jose/docs"

joinPath("/home/jose", "../docs")
    -> "/home/jose/../docs"

joinPath("/home/jose", "/var/log")
    -> "/var/log"
```

Normalization is intentionally separate.

The expected pipeline is:

```text
string
  ↓
parsePath
  ↓
joinPath (only if relative)
  ↓
normalizePath
  ↓
absolute canonical Path
```

---

# 11. Planned `resolvePath`

`resolvePath` is the next major VFS operation.

It has **not yet been implemented**.

Before writing code, define its contract carefully.

Questions that must be resolved first:

- exact function signature;
- whether it accepts only absolute paths;
- root handling;
- lookup behavior;
- missing component behavior;
- file encountered before the final component;
- `PathNotFound`;
- `NotADirectory`;
- whether errors are thrown or returned;
- complexity requirements;
- iterative traversal strategy.

Expected traversal:

```text
Root Directory
    ↓
component[0]
    ↓
component[1]
    ↓
component[2]
    ↓
...
    ↓
Node
```

Traversal should be iterative.

Do not introduce parent pointers or recursive directory traversal.

---

# 12. Session

The planned Session model is:

```text
Session
├── currentDirectory
├── history
└── environment
```

The project currently intends to track the current absolute path so that resolving `..` does not require parent pointers in VFS nodes.

The exact Session implementation has not yet been completed.

---

# 13. Commands

Planned V1 built-ins:

```text
pwd
ls
cd
cat
tree
clear
echo
help
man
history
whoami
reset
apropos
```

The command system has not yet been implemented.

Custom commands are intended to be first-class.

Command metadata should drive:

- `help`;
- `man`;
- `apropos`.

---

# 14. Parser Scope

The intended command parser for V1:

- first token is the command name;
- tokens beginning with `-` are options;
- other tokens are arguments;
- options may appear anywhere;
- `--` terminates option parsing;
- grouped flags such as `-lah` are preserved;
- basic single and double quotes are supported.

Explicitly out of scope for the initial parser:

- pipes;
- redirection;
- subshells;
- background execution;
- complex shell expansion.

---

# 15. Structured Errors

Planned structured errors include:

```text
CommandNotFound
InvalidArguments
PathNotFound
NotADirectory
IsADirectory
PermissionDenied
```

Not all of these have been implemented yet.

Errors should remain explicit and typed rather than relying on arbitrary strings.

---

# 16. Actions

Commands such as `clear` may need to request presentation-layer actions.

The Core must not directly manipulate:

```text
DOM
window
document
```

Instead, external/UI actions should be represented as Core results/actions which the Presentation layer interprets.

---

# 17. Tests

Tests are located under:

```text
test/
```

The current test file is:

```text
test/vfs/path.test.ts
```

The project currently has **43 tests** across four suites:

```text
parsePath
normalizePath
joinPath
path composition
```

Current coverage includes:

### `parsePath`

- empty path;
- root;
- relative path;
- absolute path;
- multiple components;
- repeated separators;
- trailing separators;
- `"."`;
- `".."`.

### `normalizePath`

- empty path;
- root;
- `"."`;
- single and multiple `".."`;
- unresolved relative `".."`;
- absolute paths above root;
- mixed `"."` and `".."`;
- absolute flag preservation;
- input immutability;
- no `"."` invariant;
- no `".."` in normalized absolute paths;
- idempotence.

### `joinPath`

- relative joining;
- empty relative path;
- preservation of `"."` / `".."`;
- absolute path passthrough;
- input immutability;
- allocation behavior for relative paths.

### Composition

The following pipeline is explicitly tested:

```text
parsePath
    ↓
joinPath
    ↓
normalizePath
```

including:

- simple relative paths;
- `"."`;
- `".."`;
- mixed `"."` and `".."`;
- absolute paths;
- multiple parent traversals.

---

# 18. Test Configuration

There are two relevant TypeScript configurations.

## Production

`tsconfig.json`

Builds only:

```text
src/**/*.ts
```

Output:

```text
dist/
```

The explicit `include` is intentional so that test files do not enter the production build.

## Tests

`tsconfig.test.json`

Builds:

```text
src/**/*.ts
test/**/*.ts
```

Output:

```text
dist-test/
```

It is currently self-contained rather than extending the production `tsconfig.json`.

## VS Code test project

`test/tsconfig.json`

Currently:

```json
{
  "extends": "../tsconfig.test.json"
}
```

This file exists because VS Code's TypeScript project discovery did not correctly associate the test files with `tsconfig.test.json` alone.

It should not be removed without verifying that VS Code continues to recognize the test project correctly.

---

# 19. npm Scripts

Current relevant scripts:

```text
npm run build
```

Builds the production library.

```text
npm run build:test
```

Compiles source and tests to `dist-test`.

```text
npm test
```

Builds the tests and runs them with Node's built-in test runner.

Current test command:

```text
node --test "dist-test/test/**/*.test.js"
```

---

# 20. Git / Repository Discipline

The project uses small, focused commits.

Prefer commits that represent one coherent change, for example:

```text
test: strengthen path normalization coverage
test: cover path operation composition
feat: add path resolution
```

Do not mix unrelated refactoring with feature work.

Before committing:

```bash
npm test
npm run build
git diff --check
```

The working tree should be clean after the commit.

Do not push automatically unless explicitly requested.

---

# 21. Current State

At the point this context was written:

- VFS node model exists.
- File model exists.
- Directory model exists.
- `Path` representation exists.
- `parsePath` exists.
- `normalizePath` exists.
- `joinPath` exists.
- Path tests contain 43 tests.
- Production build passes.
- Test build passes.
- Test suite passes.
- TypeScript test project is recognized by VS Code.
- README exists.
- `resolvePath` is the next planned Core operation.
- Command parser and command system are not yet implemented.
- Session is not yet implemented.
- React/Web presentation layer is not yet implemented.

---

# 22. Immediate Next Step

Before implementing `resolvePath`:

1. Inspect the current repository.
2. Read this file.
3. Verify that the described files and behavior still match the code.
4. Define the `resolvePath` contract.
5. Define its error semantics.
6. Define complexity and memory requirements.
7. Design the iterative traversal.
8. Define tests before implementation.
9. Implement `resolvePath`.
10. Run the complete test suite.

Do not skip directly to implementation.

---

# 23. Important Working Convention

The user is learning TypeScript while building this project.

When introducing a new technical concept:

1. Explain the concept first.
2. Explain why it is needed.
3. Explain the intended approach.
4. Let the user implement the production code.
5. Review and correct the implementation.

Do **not** provide finalized production code unless the user explicitly asks for it.

Tests are an exception: the user has explicitly chosen not to spend significant time writing test code and may request finalized tests directly.

When reviewing code, prioritize:

1. correctness;
2. architectural consistency;
3. determinism;
4. memory usage;
5. algorithmic complexity;
6. TypeScript type safety;
7. readability and auditability.

Do not introduce abstractions merely for abstraction's sake.

---

# 24. Source of Truth

This file is a persistent handoff document, not a substitute for the repository.

If this document conflicts with the actual code:

**the repository wins.**

Update this file when an architectural decision, important invariant, project state, or development direction changes.

A future conversation should begin by reading this file and checking the current repository state before continuing development.