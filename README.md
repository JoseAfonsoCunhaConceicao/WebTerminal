# WebTerminal

[![npm version](https://img.shields.io/badge/version-0.1.0-blue.svg)](package.json)
[![tests](https://img.shields.io/badge/tests-257%20passing-brightgreen.svg)](test/)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![NASA JPL Standards](https://img.shields.io/badge/standard-NASA%20Power%20of%2010-orange.svg)](Project_Context.md)

**WebTerminal** is a high-performance, deterministic virtual terminal engine and UI library written in TypeScript. Designed from the ground up for web applications, portfolios, interactive documentation, and developer tools.

Built following strict **NASA / JPL Power of 10** reliability standards: zero recursion, bounded memory allocation, errors as values, and 100% decoupling between computational core and visual presentation.

---

## Key Features

- **Virtual Filesystem (VFS):** Hierarchical, read-only in-memory filesystem with deep runtime immutability (`freezeVFS`).
- **14 Built-in Unix Commands:** `pwd`, `cd`, `ls` (with `-l`, `-a`, `-r`, `-F`, `-d`), `cat`, `tree` (with `-L <level>`, `-a`, `-d`, `-f`), `open` (with interactive `.txt` modal viewer and `view` alias), `history`, `man`, `apropos`, `help`, `echo`, `clear`, `reset`, and `whoami`.
- **Fault-Isolated Execution:** Handlers run inside a containment boundary preventing unexpected exceptions from crashing host applications.
- **Universal Headless Controller:** Framework-agnostic interactive state controller (`TerminalController`) compatible with **React**, **Vue**, **Svelte**, **Vanilla HTML**, and **Flutter Web**.
- **Interactive File Viewer Modal:** Built-in modal window to inspect and read text files with keyboard navigation (`Esc` to close) and clickable files in terminal output.
- **Smart Tab Completion:** Automatic completion for command names and VFS directory paths.
- **History & Line Editing:** Standard terminal shortcuts (`Enter`, `Backspace`, `Delete`, `Arrows`, `Home`, `End`, `Ctrl+C`, `Ctrl+L`).
- **Ultra-lightweight:** Zero external runtime dependencies. Compiles to ES modules with full tree-shaking support (`sideEffects: false`).

---

## Installation

```bash
npm install webterminal
```

---

## Quick Start

### 1. Vanilla JavaScript / HTML

```html
<div id="terminal" style="width: 800px; height: 500px;"></div>

<script type="module">
import {
    WebTerminal,
    TerminalController,
    mountTerminal
} from "webterminal";

// Define your virtual filesystem structure
const root = {
    name: "",
    kind: "directory",
    children: [
        {
            name: "about.txt",
            kind: "file",
            content: "Senior Software Engineer portfolio."
        },
        {
            name: "projects",
            kind: "directory",
            children: [
                { name: "webterminal.txt", kind: "file", content: "Interactive terminal library." }
            ]
        }
    ]
};

// 1. Initialize Core Engine
const terminal = new WebTerminal({ root, initialPath: "/" });

// 2. Initialize Universal Controller
const controller = new TerminalController({
    terminal,
    user: "visitor",
    host: "portfolio",
    welcomeBanner: "Welcome to my portfolio! Type 'help' or 'tree' to explore."
});

// 3. Mount to DOM element
const unmount = mountTerminal(document.getElementById("terminal"), controller);
</script>
```

### 2. React Integration

```tsx
import React, { useEffect, useRef } from "react";
import { WebTerminal, TerminalController, mountTerminal } from "webterminal";

export function TerminalComponent({ vfsRoot }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const terminal = new WebTerminal({ root: vfsRoot });
        const controller = new TerminalController({ terminal });
        const unmount = mountTerminal(containerRef.current, controller);

        return () => unmount();
    }, [vfsRoot]);

    return <div ref={containerRef} style={{ width: "100%", height: "500px" }} />;
}
```

---

## Architecture & Engineering Standards

WebTerminal enforces the **Elite Standard / NASA JPL Power of 10** architecture:

| Principle | Implementation in WebTerminal |
| :--- | :--- |
| **Strict File & Function Limits** | All source files $\le 200$ lines, all functions $\le 40$ lines, nesting $\le 2$. |
| **Zero Recursion (NASA Rule 4.1)** | All tree traversals (`tree`, `lookup`, `freezeVFS`) use explicit bounded iteration. |
| **Fixed Upper Bounds** | Strict limits on all loops (`MAX_FREEZE_NODES`, `MAX_TREE_VISITS`, `MAX_COMMAND_LINE_LENGTH = 4096`). |
| **Errors as Values (NASA Rule 4.4)** | Discriminated union results (`LookupResult`, `TokenizeResult`, `CommandResult`). |
| **RAM Footprint Optimization** | Static pre-frozen singletons (`ROOT_PATH`, `MANUAL_MAP`), zero string-concatenation garbage in path parsing. |
| **Layer Decoupling** | Engine has 0 DOM/React dependencies. Visual presentation connects via strongly typed DTOs. |

---

## Testing & Quality

WebTerminal maintains 100% automated test pass rate with zero compiler warnings:

```bash
npm test        # Runs test suite (239 tests across 67 suites)
npm run build   # Production TypeScript compilation with declaration maps
```

---

## License

MIT &copy; José Conceição
