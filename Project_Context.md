# WebTerminal — Project Context

> **Purpose:** Persistent technical context for continuing development of WebTerminal across separate conversations.
>
> **Important:** Before making architectural or implementation decisions in a new conversation, read this file and inspect the current repository state. This document describes the intended and known state at the time it was last updated; the repository itself is the source of truth if they differ.
>
> **Last context update:** 2026-09-21
> **Latest repository commit verified:** `e84b01f5cbb6e2b8280a1e96860dc40f0df04a85` — `docs: document path operations`

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

Current package configuration includes:

- package name: `webterminal`
- version: `0.1.0`
- ESM via `"type": "module"`
- TypeScript `^7.0.2`
- Node type definitions `^22.20.3`

---

## 5. Repository Structure

Current relevant structure:

```text
WebTerminal/
├── src/
│   ├── index.ts
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
└── Project_Context.md
```

The context file is named **`Project_Context.md`**. Do not assume a different capitalization.

The directory file is currently named **`directories.ts`**. Do not assume it is named `directory.ts`.

### Current implementation scope

The implemented Core is currently limited to the VFS data model and path handling.

Not yet implemented:

- `lookup`;
- Session;
- command parser;
- command registry;
- built-in commands;
- structured error types;
- Presentation layer.

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

Current interface:

```ts
export interface File extends Node {
    content: string;
}
```

---

## 6.3 Directory

`src/vfs/directories.ts`

A directory extends `Node` and contains child nodes.

Current interface is conceptually:

```ts
export interface Directory extends Node {
    children: (Directory | File)[];
}
```

The VFS uses a recursive **data model**, but recursive algorithms are intentionally avoided.

There are no parent pointers.

The intended approach is to maintain the current absolute path in Session rather than storing parent references in every directory.

The current `children` representation is an array. Therefore, a future lookup operation will initially perform linear child searches. Do not introduce an index/map merely for theoretical optimization before there is a demonstrated need.

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

`Path` is currently an exported TypeScript interface because multiple Core modules need to share the path contract.

This does **not** mean every exported symbol in an internal module is part of the package's public API. The package API will be controlled later through `src/index.ts`.

---

# 8. `parsePath`

`parsePath(path: string): Path`

Responsibilities:

- split a string into path components;
- detect whether the path is absolute;
- ignore repeated `/`;
- ignore trailing separators;
- preserve `.`;
- preserve `..`;
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

The current implementation is iterative, does not access the VFS, and does not mutate the input string.

---

# 9. `normalizePath`

`normalizePath(path: Path): Path`

Responsibilities:

- remove `.`;
- resolve `..` against preceding components;
- preserve unresolved `..` for relative paths;
- discard `..` that would go above root for absolute paths;
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

`normalizePath` must not mutate its input and returns a new components array.

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

The current implementation creates a new component array when joining relative paths.

The expected primitive pipeline is:

```text
string
  ↓
parsePath
  ↓
joinPath (only if relative)
  ↓
normalizePath
  ↓
absolute normalized Path
```

---

# 11. `resolvePath`

`resolvePath(currentPath: Path, input: string): Path`

**Status: implemented and tested.**

This is the semantic/public path-resolution operation built from the path primitives.

Current implementation:

```text
parsePath(input)
    ↓
joinPath(currentPath, inputPath)
    ↓
normalizePath(joinedPath)
    ↓
Path
```

### Contract

#### `currentPath`

Precondition:

- must be absolute;
- must be normalized.

It represents the current working directory/path used as the base for relative input.

#### `input`

May be:

- relative;
- absolute;
- empty;
- contain `.`;
- contain `..`;
- contain repeated separators;
- contain trailing separators.

#### Result

The result is always:

- absolute;
- normalized;
- free of `.`;
- free of `..`;
- independent of VFS existence.

#### Semantics

Relative input:

```text
resolvePath("/home/jose", "docs/file.txt")
    -> "/home/jose/docs/file.txt"
```

Absolute input ignores `currentPath`:

```text
resolvePath("/home/jose", "/etc/config")
    -> "/etc/config"
```

Root is represented by an empty component list with `isAbsolute: true`.

Parent traversal cannot escape the root:

```text
resolvePath("/home", "../../etc")
    -> "/etc"
```

### Architectural boundary

`resolvePath` performs **path resolution only**.

It:

- does not access the VFS;
- does not check whether the target exists;
- does not return a `File` or `Directory`;
- does not produce `PathNotFound` or `NotADirectory`.

The intended pipeline is:

```text
command/input
    ↓
resolvePath(currentPath, input)
    ↓
absolute normalized Path
    ↓
lookup(root, path)
    ↓
Node or structured VFS error
```

This separation is intentional and must be preserved.

### Immutability and determinism

`resolvePath` must not mutate `currentPath`.

The result must not share the current path's component array.

Repeated calls with the same inputs must produce equivalent results.

---

# 12. Internal Exports vs Package API

The current path module exports:

- `Path`;
- `parsePath`;
- `normalizePath`;
- `joinPath`;
- `resolvePath`.

This is currently intentional because the primitive operations are independently tested and may be useful to other Core modules.

However, **module-level exports are not automatically the public package API**.

`src/index.ts` is the package's public entry point and is currently intentionally empty apart from a documentation comment.

Later, `src/index.ts` will explicitly expose the supported public API.

Therefore:

```text
module export
    ≠
package public API
```

Do not remove the primitive exports merely to make them "private" before the package API is consolidated.

If stronger package-level encapsulation is required later, `package.json` exports/subpath restrictions can also be considered.

---

# 13. Lookup — Immediate Next Module

The next Core module is **VFS lookup**.

It is deliberately separate from `resolvePath`.

### Goal

Given:

```ts
root: Directory
path: Path
```

locate the corresponding `Node` in the VFS.

Conceptual pipeline:

```text
resolvePath(currentPath, input)
        ↓
absolute normalized Path
        ↓
lookup(root, path)
        ↓
File | Directory
```

### Lookup contract to define before implementation

Preconditions should include:

- `root` is the VFS root directory;
- `path` is absolute;
- `path` is normalized;
- `path.components` contains neither `.` nor `..`.

Questions that must be explicitly decided before implementation:

- exact function signature;
- how the root path `/` is handled;
- behavior when a component does not exist;
- distinction between missing paths and non-directory intermediate nodes;
- `PathNotFound`;
- `NotADirectory`;
- whether errors are thrown or returned;
- exact structured error representation;
- complexity and allocation requirements.

Important distinction:

```text
/home/missing/file.txt
    → missing component

/home/file.txt/child
    → existing intermediate node is a File, not a Directory
```

These should not be silently conflated.

### Algorithm

The intended lookup traversal is iterative:

```text
current = root

for each component:
    find matching child in current.children

    if missing:
        error

    if more components remain:
        child must be a Directory

    current = child

return current
```

Do not introduce recursive traversal.

The current directory representation is an array, so the initial implementation will naturally use linear child lookup.

Do not introduce maps/indexes prematurely.

### Testing strategy

Tests should be defined before implementation and should cover at least:

- root lookup;
- directory lookup;
- file lookup;
- nested lookup;
- missing final component;
- missing intermediate component;
- file used as an intermediate component;
- immutability of VFS/path inputs;
- deterministic repeated lookup;
- relevant structured error cases.

Keep lookup tests separate from path-resolution tests at the conceptual level.

Integration tests can later cover:

```text
resolvePath → lookup
```

---

# 14. Session

The planned Session model is:

```text
Session
├── currentDirectory
├── history
└── environment
```

The intended current-directory representation is an absolute normalized `Path`.

The Session should guarantee the `currentPath` invariant required by `resolvePath`.

Parent pointers are not planned for VFS nodes.

The exact Session implementation has not yet been completed.

---

# 15. Commands

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

# 16. Parser Scope

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

# 17. Structured Errors

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

The next immediate error-design problem is the VFS lookup boundary, especially:

- `PathNotFound`;
- `NotADirectory`;
- thrown vs returned errors;
- typed/structured error representation.

Errors should remain explicit and typed rather than relying on arbitrary strings.

---

# 18. Actions

Commands such as `clear` may need to request presentation-layer actions.

The Core must not directly manipulate:

```text
DOM
window
document
```

Instead, external/UI actions should be represented as Core results/actions which the Presentation layer interprets.

---

# 19. Tests

Tests are located under:

```text
test/
```

The current test file is:

```text
test/vfs/path.test.ts
```

The current suite contains **65 tests**.

The latest local development run reported:

```text
tests   65
suites  13
pass    65
fail    0
skipped 0
todo    0
```

The test file contains the path primitive tests, path composition tests, and the `resolvePath` suite.

### `parsePath`

Coverage includes:

- empty path;
- root;
- relative path;
- absolute path;
- multiple components;
- repeated separators;
- trailing separators;
- `.`;
- `..`;
- special components in absolute paths.

### `normalizePath`

Coverage includes:

- empty path;
- root;
- `.`;
- single and multiple `..`;
- unresolved relative `..`;
- absolute paths above root;
- mixed `.` and `..`;
- absolute flag preservation;
- input immutability;
- no `.` invariant;
- no `..` in normalized absolute paths;
- idempotence;
- repeated normalization without mutation.

### `joinPath`

Coverage includes:

- relative joining;
- empty relative path;
- preservation of unnormalized components;
- absolute path passthrough;
- input immutability;
- new component array for relative joins.

### Path composition

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
- `.`;
- `..`;
- mixed `.` and `..`;
- absolute paths;
- multiple parent traversals.

### `resolvePath`

Coverage includes:

- simple relative paths;
- empty input;
- `.`;
- relative `..`;
- complex relative paths;
- absolute paths;
- root;
- multiple parent traversals;
- root-boundary behavior;
- repeated separators;
- nonexistent target paths;
- absolute/relative result invariants;
- absence of `.` and `..`;
- current-path immutability;
- non-sharing of the current path's component array;
- deterministic repeated calls;
- stability when resolving an already resolved path.

One existing test named `does not perform filesystem lookup` only verifies that resolution does not throw for a nonexistent path; it does not instrument or prove absence of a lookup internally. Do not treat that test as a formal observability proof. The architectural contract itself defines that `resolvePath` does not access the VFS.

---

# 20. Test Configuration

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

The project uses strict TypeScript settings, including:

- `strict`;
- `verbatimModuleSyntax`;
- `isolatedModules`;
- `noUncheckedIndexedAccess`;
- `exactOptionalPropertyTypes`;
- `noUncheckedSideEffectImports`;
- `moduleDetection: "force"`.

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

# 21. npm Scripts

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

# 22. Git / Repository Discipline

The project uses small, focused commits.

Recent path-development commits include:

```text
feat: implement virtual fylesystem path operations (normalizePath and joinPath)
test: add path operation test suite
test: strengthen path normalization coverage
test: cover path operation composition
feat: add path resolution
docs: document path operations
```

The latest verified commit is:

```text
e84b01f5cbb6e2b8280a1e96860dc40f0df04a85
docs: document path operations
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

# 23. Current State

The following is implemented:

- VFS `Node` model;
- `File` model;
- `Directory` model;
- `Path` representation;
- `parsePath`;
- `normalizePath`;
- `joinPath`;
- `resolvePath`;
- comprehensive path tests;
- professional JSDoc for all four path operations;
- production/test TypeScript configuration;
- README;
- public entry-point placeholder in `src/index.ts`.

The path module is considered **complete for the current requirements**.

The current path API is conceptually:

```text
Path
parsePath
normalizePath
joinPath
resolvePath
```

The primitives remain exported from the internal module for now because they are independently tested and may be used by other Core modules. Package-level public API exposure will be controlled later through `src/index.ts`.

The path module must not gain VFS lookup responsibilities.

Not yet implemented:

- `lookup`;
- structured VFS errors;
- Session;
- command parser;
- command registry;
- built-in commands;
- command documentation system;
- Presentation layer.

---

# 24. Immediate Next Step

The next module is **VFS lookup**.

Do not start implementation immediately.

Follow this sequence:

1. Inspect the current repository.
2. Read this file.
3. Verify that the described state still matches the code.
4. Define the `lookup` contract.
5. Decide the exact error semantics, especially `PathNotFound` and `NotADirectory`.
6. Decide whether errors are thrown or returned.
7. Define complexity and memory requirements.
8. Define the iterative traversal algorithm.
9. Define tests before implementation.
10. Implement `lookup`.
11. Run the complete test suite.
12. Document `lookup`.
13. Commit the completed milestone.

Do not mix `lookup` with Session or command implementation.

---

# 25. Important Working Convention

The user is learning TypeScript while building this project.

When introducing a new technical concept:

1. Explain the concept first.
2. Explain why it is needed.
3. Explain the intended approach.
4. Let the user implement the production code.
5. Review and correct the implementation.

**Do not provide finalized production code unless the user explicitly asks for it.**

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

The user's general project preference is to favor memory-efficient and computationally efficient solutions where this does not compromise correctness, safety or clarity.

---

# 26. Source of Truth

This file is a persistent handoff document, not a substitute for the repository.

If this document conflicts with the actual code:

**the repository wins.**

Update this file whenever an architectural decision, important invariant, project state, or development direction changes.

A future conversation should begin by reading this file and checking the current repository state before continuing development.
