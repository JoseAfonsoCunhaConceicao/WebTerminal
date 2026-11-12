# WebTerminal — Project Context

## 1. Project Overview

**WebTerminal** is a TypeScript library for implementing an interactive virtual terminal interface inside web applications.

The terminal is **not a real operating-system terminal**. It is a controlled, deterministic interface over application-defined data and actions.

The initial intended use case is a personal portfolio, where the terminal can expose information such as:

- Projects
- Skills
- Articles or blog posts
- Other portfolio sections
- Links to external resources such as project websites or GitHub repositories

The virtual filesystem (VFS) is read-only from the user's perspective.

The project is being developed incrementally, with emphasis on correctness, explicit contracts, deterministic behavior, testing, and learning.

---

## 2. Development Philosophy

The project follows an incremental engineering workflow:

1. Define the contract and invariants.
2. Design the simplest correct implementation.
3. Implement the code.
4. Add or update tests.
5. Run the complete test suite and build.
6. Review the implementation and documentation.
7. Commit the stable milestone.
8. Move to the next module.

The goal is not merely to make the library work, but to understand and justify its design.

### Engineering principles

The project prioritizes:

- Correctness
- Determinism
- Explicit behavior
- Small, composable functions
- Strong TypeScript typing
- Minimal mutable state
- Low memory overhead
- Reasonable computational efficiency
- Clear separation of responsibilities
- Testability
- Maintainability
- No unnecessary abstractions
- No hidden side effects

Optimization is considered when designing data structures and algorithms, but never at the expense of correctness, safety, or clarity.

---

# 3. Architecture

The project is divided conceptually into two major areas:

```text
WebTerminal
│
├── Core
│   ├── VFS
│   ├── Paths
│   ├── Lookup
│   ├── Session
│   ├── Command parsing
│   └── Commands
│
└── Presentation
    └── Web / React integration
```

The **Core** must remain independent of:

- DOM
- Browser APIs
- React
- UI frameworks
- Rendering concerns

The Presentation layer will consume the Core but must not leak UI concerns into it.

This separation allows the core behavior to remain deterministic and independently testable.

---

# 4. Technology

Current stack:

- TypeScript
- Node.js
- npm
- Node.js built-in test runner
- ECMAScript modules

The package uses:

```json
"type": "module"
```

TypeScript is configured with strict type checking and additional safety-oriented options, including:

- `strict`
- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- `verbatimModuleSyntax`
- `isolatedModules`
- `noUncheckedSideEffectImports`

Current TypeScript version:

```text
typescript ^7.0.2
```

Current Node.js type definitions:

```text
@types/node ^22.20.3
```

---

# 5. Project Structure

Current repository structure:

```text
src/
├── index.ts
└── vfs/
    ├── errors.ts
    ├── lookup.ts
    ├── node.ts
    └── path.ts

test/
├── tsconfig.json
└── vfs/
    ├── lookup.test.ts
    └── path.test.ts
```

`src/index.ts` is reserved as the future public API entry point.

The public API has not yet been finalized.

Lower-level modules may remain directly exported during development when useful for testing. The final public surface will eventually be controlled through `index.ts`.

---

# 6. Virtual Filesystem

## 6.1 Purpose

The VFS represents the structured content exposed by the virtual terminal.

It is intentionally independent of the host filesystem.

The VFS does not read or write real files.

The initial design is read-only.

---

## 6.2 Node Model

The VFS currently uses a discriminated union:

```ts
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
```

The previous `NodeBase` abstraction was deliberately removed.

There are two concrete node types:

### File

A file contains textual content.

```text
name
kind = "file"
content
```

### Directory

A directory contains child nodes.

```text
name
kind = "directory"
children
```

The `kind` property acts as the discriminant for type narrowing.

This keeps the model explicit without introducing an unnecessary inheritance hierarchy.

---

# 7. Paths

The path module is complete.

File:

```text
src/vfs/path.ts
```

The fundamental representation is:

```ts
export interface Path {
    components: string[];
    isAbsolute: boolean;
}
```

The module currently provides:

```text
parsePath(path)
normalizePath(path)
joinPath(basePath, path)
resolvePath(currentPath, input)
```

---

## 7.1 Path Pipeline

The intended public operation is `resolvePath`.

Conceptually:

```text
input
  ↓
parsePath
  ↓
joinPath
  ↓
normalizePath
  ↓
absolute normalized Path
```

`resolvePath` combines parsing, joining, and normalization into one operation.

---

## 7.2 Path Invariants

A resolved path:

- Is absolute.
- Contains no `"."` components.
- Contains no `".."` components.
- Cannot escape the virtual filesystem root.
- Does not require the target to exist.
- Does not access the VFS.
- Does not mutate the current path.
- Produces independent path component storage.

For example:

```text
current path: /home/projects
input:        ../skills

resolved:     /home/skills
```

An absolute input ignores the current path:

```text
current path: /home/projects
input:        /docs

resolved:     /docs
```

Root is represented as:

```ts
{
    components: [],
    isAbsolute: true
}
```

---

# 8. VFS Lookup

The lookup module has been implemented.

File:

```text
src/vfs/lookup.ts
```

Its responsibility is to resolve an already-parsed `Path` against a VFS tree.

The intended pipeline is:

```text
input string
    ↓
resolvePath(currentPath, input)
    ↓
absolute normalized Path
    ↓
lookup(root, path)
    ↓
Node
```

`lookup` does not parse or normalize paths.

It assumes that its input path is already:

- Absolute
- Normalized
- Free of `"."`
- Free of `".."`

This separation keeps path manipulation and VFS traversal as independent responsibilities.

---

## 8.1 Lookup Contract

`lookup` receives:

```text
root: Directory
path: Path
```

and returns:

```text
Node
```

The function traverses the VFS iteratively.

For every path component:

1. The current node must be a directory.
2. Its children are searched for the requested name.
3. If the child exists, traversal continues.
4. If it does not exist, `PathNotFoundError` is thrown.
5. If traversal attempts to continue through a file, `NotADirectoryError` is thrown.

Root lookup is supported:

```text
/
```

resolves directly to the supplied root directory.

---

## 8.2 Lookup Properties

The lookup operation:

- Is iterative.
- Does not recursively call itself.
- Does not mutate the VFS.
- Does not mutate the supplied path.
- Returns the existing node reference.
- Is deterministic.
- Uses constant auxiliary traversal state.

The current child lookup is a linear scan through the directory's `children`.

For a path with depth `d`, the worst-case work is approximately proportional to the total number of children inspected along the traversed path.

The current implementation intentionally favors a simple explicit representation over premature indexing or caching.

---

# 9. VFS Errors

Structured lookup errors are implemented in:

```text
src/vfs/errors.ts
```

Current errors:

```text
PathNotFoundError
NotADirectoryError
```

## PathNotFoundError

Thrown when a requested path component does not exist in the current directory.

## NotADirectoryError

Thrown when traversal attempts to continue through a file.

These are separate error types so that higher-level command logic can distinguish different failure conditions without relying on message strings.

---

# 10. Testing

The project uses the Node.js built-in test runner.

Commands:

```text
npm run build
```

Builds the production TypeScript source.

```text
npm run build:test
```

Builds the source and test TypeScript into the test output directory.

```text
npm test
```

Runs the test build followed by the Node.js test runner.

The current test command is:

```text
npm run build:test && node --test "dist-test/test/**/*.test.js"
```

---

## 10.1 Current Validation

The latest local test execution produced:

```text
tests:   75
passed:  75
failed:  0
suites:  14
```

Therefore, the current implementation is validated by:

```text
75 passing tests
0 failing tests
14 test suites
```

---

## 10.2 Path Tests

The path test suite covers:

- Path parsing
- Absolute paths
- Relative paths
- Empty paths
- Separators
- Normalization
- `"."`
- `".."`.
- Root behavior
- Joining
- Absolute-path replacement
- Parent traversal
- Composition between operations
- Nonexistent paths
- Immutability
- Determinism

The tests deliberately verify both output values and important invariants.

---

## 10.3 Lookup Tests

The lookup test suite covers:

1. Root lookup.
2. Direct child directory lookup.
3. Direct child file lookup.
4. Nested directory lookup.
5. Deep file lookup.
6. Missing root child.
7. Missing nested child.
8. Traversal through a file.
9. Path immutability.
10. Returning the same node reference on repeated lookup.

The tests use a manually constructed VFS tree.

---

# 11. Current VFS Architecture

The current VFS-related architecture is:

```text
                 ┌───────────────┐
                 │  Input string │
                 └───────┬───────┘
                         │
                         ▼
                ┌─────────────────┐
                │  resolvePath()  │
                └────────┬────────┘
                         │
                         ▼
              Absolute normalized Path
                         │
                         ▼
                 ┌───────────────┐
                 │    lookup()   │
                 └───────┬───────┘
                         │
                         ▼
                       Node
                    ┌────┴────┐
                    │         │
                  File    Directory
```

This establishes a clear separation:

```text
Path logic       → determines WHAT path is requested
Lookup logic     → determines WHICH node exists there
VFS model        → represents the data
Errors           → represents failure conditions
```

---

# 12. Planned Terminal Model

The terminal is intended to expose a CLI-like interface over the VFS.

The current planned command set includes:

```text
pwd
ls [OPTIONS] [PATH]
cd [PATH]
cat [OPTIONS] <FILE>...
tree [OPTIONS] [PATH]
clear
echo [OPTIONS] [TEXT]...
help [COMMAND]
man <COMMAND>
history [OPTIONS]
whoami
reset
```

The exact command semantics, option syntax, error behavior, and output representation will be defined before implementation.

The terminal should behave like a CLI from the user's perspective while remaining a controlled application-level abstraction.

---

# 13. Planned Session Model

A terminal session will eventually maintain state such as:

- Current working directory
- Command history
- Activity since session start
- Other explicitly defined session state

The `reset` command will clear session state and return the terminal to its initial state.

Session state should remain independent from the immutable/read-only VFS structure.

---

# 14. Planned Content Model

The VFS is intended primarily for structured textual content.

Potential content includes:

```text
/
├── projects/
│   ├── project-a/
│   │   └── README.md
│   ├── project-b/
│   │   └── README.md
│   └── ...
├── skills/
│   └── ...
├── blog/
│   └── ...
└── ...
```

Directories can represent high-level sections.

Files can contain Markdown or plain-text content.

Project directories may expose commands or links to external resources such as:

- Project websites
- GitHub repositories
- Other relevant pages

The exact content abstraction will be defined later.

---

# 15. Presentation Layer

The Core must not depend on the eventual UI implementation.

A future Presentation layer may provide:

- Terminal rendering
- Input handling
- Command output rendering
- Scroll behavior
- Keyboard interaction
- React integration

However, the Core should expose data and behavior rather than manipulate UI elements.

For example, a command should conceptually produce a structured result that the Presentation layer can render, rather than directly modifying the DOM.

---

# 16. Public API

`src/index.ts` is the designated public entry point.

The public API has not yet been finalized.

For now, internal modules may remain exported directly when necessary for development and testing.

Before the project reaches a stable public API, the exported surface should be intentionally reviewed so that implementation details are not accidentally exposed.

The expected principle is:

```text
Internal implementation
        ↓
Controlled public API
        ↓
Consumer
```

rather than exposing the entire internal module structure.

---

# 17. Important Design Decisions

## 17.1 No VFS existence check during path resolution

`resolvePath` only resolves paths.

It does not check whether the resulting path exists.

Existence belongs to `lookup`.

This allows operations such as path construction to remain independent of the filesystem.

---

## 17.2 Path resolution and lookup are separate

The project deliberately uses:

```text
resolvePath()
```

followed by:

```text
lookup()
```

rather than combining both responsibilities.

This keeps:

- Path manipulation
- Filesystem traversal

independently testable.

---

## 17.3 VFS is read-only

The initial VFS model does not expose terminal-side mutation operations.

The user interacts with the representation, but does not modify the underlying VFS.

If mutation is ever introduced, it should be an explicit architectural decision rather than an accidental consequence of exposing internal arrays or objects.

---

## 17.4 Iterative algorithms by default

Where recursion provides no meaningful advantage, iterative implementations are preferred.

This is particularly relevant to:

- Path traversal
- VFS traversal
- Future tree operations

The objective is predictable stack usage and explicit control flow.

---

## 17.5 Avoid premature abstraction

The project intentionally prefers straightforward implementations when the current requirements do not justify additional abstractions.

Examples:

- Directory children are currently represented as an array.
- Lookup currently performs a linear child search.
- `NodeBase` was removed because it did not provide enough value to justify its abstraction.

More sophisticated indexing or data structures can be introduced later if actual requirements justify them.

---

# 18. Current Repository State

The following milestones are complete:

### VFS model

- File representation
- Directory representation
- Discriminated `Node` union
- Removal of the previous `NodeBase` abstraction

### Path system

- `Path`
- `parsePath`
- `normalizePath`
- `joinPath`
- `resolvePath`
- Path invariants
- Path tests

### Lookup system

- `lookup`
- Iterative VFS traversal
- Root lookup
- Nested lookup
- File traversal detection
- Missing-path detection

### Error system

- `PathNotFoundError`
- `NotADirectoryError`

### Session system

- `Session` class managing `currentPath` and `history`
- Independent of VFS and command execution
- Session tests

### Command system

- `CommandInvocation` representation
- `parseCommand` parsing options and arguments with `--` terminator support
- `tokenize` converting raw command lines into token streams
- Support for unquoted, single-quoted, double-quoted, and escaped characters
- Structured `TokenizerError` with errors-as-values contract (`TokenizeResult`)
- Command parser and tokenizer tests

### Validation

- Automated test suite
- 122 passing tests
- 0 failures
- 28 test suites

---

# 19. Next Development Stage

The VFS foundation is now sufficiently established to move beyond basic path and lookup operations.

The next module should be selected by considering the dependencies of the terminal architecture.

The logical progression is:

```text
VFS model
   ↓
Path operations
   ↓
Lookup
   ↓
Session state
   ↓
Command representation / parser
   ↓
Command execution
   ↓
Terminal results
   ↓
Public API
   ↓
Presentation integration
```

Before implementing the next module, its contract and invariants should be defined explicitly.

No production implementation should be written until the responsibility and boundaries of the module are clear.

---

# 20. Development Workflow for Future Modules

For every new module:

### Step 1 — Define the responsibility

State precisely what the module does and what it does not do.

### Step 2 — Define the public contract

Identify:

- Inputs
- Outputs
- Errors
- Invariants
- Mutation behavior
- Ownership of returned data

### Step 3 — Identify interactions

Determine which existing modules it depends on.

### Step 4 — Design the simplest appropriate representation

Avoid introducing abstractions that are not currently justified.

### Step 5 — Implement

Implementation should follow the previously defined contract.

### Step 6 — Test

Test:

- Normal cases
- Boundary cases
- Invalid input
- Invariants
- Immutability
- Determinism
- Error behavior

### Step 7 — Build and run the complete test suite

Do not rely only on tests for the new module.

### Step 8 — Review documentation

Public and important internal functions should have professional JSDoc describing their contracts and failure behavior.

### Step 9 — Commit

Commit only after the milestone is stable.

### Step 10 — Update this document

`Project_Context.md` must remain sufficiently accurate that another conversation can continue development without reconstructing the project history.

---

# 21. Current Status Summary

As of the latest validated state:

```text
Project:
    WebTerminal

Language:
    TypeScript

Architecture:
    Core-first, presentation-independent

VFS:
    Implemented

Path system:
    Complete

Lookup:
    Implemented

Structured lookup errors:
    Implemented

Session:
    Implemented

Command system:
    Tokenizer and parser implemented

Automated tests:
    122 passing
    0 failing
    28 suites

Public API:
    Not finalized

Presentation layer:
    Not implemented

Next major area:
    Command execution / built-in commands
```

The project currently has a functional foundation for resolving and locating nodes inside a deterministic, read-only virtual filesystem.

The next work should build on this foundation rather than extending the VFS prematurely.