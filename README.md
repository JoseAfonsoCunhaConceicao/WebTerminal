# WebTerminal

Interactive virtual terminal UI library for web applications.

WebTerminal is a TypeScript library for building terminal-like interfaces backed by a **virtual filesystem**. It is designed as a real application component, not as a wrapper around a system shell or a real filesystem.

The project is currently in early development.

## Goals

WebTerminal aims to provide:

- A Unix-like terminal experience inside web applications.
- A virtual filesystem independent of the host operating system.
- A deterministic and testable core.
- A clear separation between core logic and presentation.
- Support for built-in and custom commands.
- A framework-independent core that can be integrated with different presentation layers.

## Architecture

The project is structured around a strict separation between the core and the presentation layer:

```text
WebTerminal
├── Core
│   ├── Parser
│   ├── Session
│   ├── VFS
│   ├── Commands
│   └── Documentation
│
└── Presentation
    └── React / Web
```

The **Core** contains the terminal's domain logic and does not depend on React, the DOM, CSS, or browser APIs.

The **Presentation** layer is responsible for rendering the terminal and translating user interaction into core operations.

## Current Development

The current implementation is focused on the virtual filesystem and path handling.

Implemented so far:

- Virtual filesystem node model.
- File and directory representations.
- Virtual path parsing.
- Path normalization.
- Path joining.
- Automated tests for path operations and their composition.

The project currently uses the Node.js built-in test runner, keeping the development dependency footprint small.

## Technology

- TypeScript
- Node.js
- npm
- Node.js built-in test runner

## Development

Install dependencies:

```bash
npm install
```

Build the library:

```bash
npm run build
```

Build and run the test suite:

```bash
npm test
```

The project is compiled with strict TypeScript settings.

## Project Status

**Early development**

The public API, internal architecture, and command system are still evolving. APIs should therefore be considered unstable at this stage.

## License

License to be defined.