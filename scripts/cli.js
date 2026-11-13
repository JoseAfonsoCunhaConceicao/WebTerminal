/**
 * WebTerminal — Interactive CLI Demo & First Test Runner
 */

import * as readline from "node:readline";
import { WebTerminal, formatPath } from "../dist/index.js";

const sampleVFS = {
    name: "",
    kind: "directory",
    children: [
        {
            name: "about.txt",
            kind: "file",
            content: "Developer: José Conceição\nSpecialization: Elite Software Architecture & Systems\nStandard: NASA JPL Power of 10",
        },
        {
            name: "projects",
            kind: "directory",
            children: [
                {
                    name: "webterminal",
                    kind: "directory",
                    children: [
                        {
                            name: "status.txt",
                            kind: "file",
                            content: "Status: Production Ready\nAutomated Tests: 239/239 passing\nZero external dependencies.",
                        },
                    ],
                },
            ],
        },
        {
            name: "contact.txt",
            kind: "file",
            content: "GitHub: https://github.com/joseconceicao\nProject: WebTerminal",
        },
    ],
};

function runDemonstration(terminal) {
    const demoCommands = [
        "pwd",
        "ls -a",
        "cat about.txt",
        "tree",
        "whoami",
        "help",
    ];

    console.log("=================================================");
    console.log(" WebTerminal — First Automated CLI Demonstration");
    console.log("=================================================\n");

    const count = demoCommands.length;
    for (let idx = 0; idx < count; idx++) {
        const cmd = demoCommands[idx];
        const currentPath = formatPath(terminal.getSession().getCurrentPath());
        console.log(`visitor@webterminal:${currentPath}$ ${cmd}`);
        const result = terminal.execute(cmd);
        if (result.output) {
            console.log(result.output);
        }
        if (result.exitCode !== 0) {
            console.log(`[Exit code: ${result.exitCode}]`);
        }
        console.log("");
    }
}

function startInteractiveREPL(terminal) {
    const promptStr = () => `visitor@webterminal:${formatPath(terminal.getSession().getCurrentPath())}$ `;
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: promptStr(),
    });

    console.log("WebTerminal Interactive REPL (type 'exit' to quit)\n");
    rl.prompt();

    rl.on("line", (line) => {
        const trimmed = line.trim();
        if (trimmed === "exit" || trimmed === "quit") {
            rl.close();
            return;
        }

        const result = terminal.execute(trimmed);
        if (result.output) {
            console.log(result.output);
        }
        rl.setPrompt(promptStr());
        rl.prompt();
    });

    rl.on("close", () => {
        console.log("\nTerminal session closed.");
        process.exit(0);
    });
}

const terminal = new WebTerminal({ root: sampleVFS, initialPath: "/" });

if (process.argv.includes("--interactive") || process.argv.includes("-i")) {
    startInteractiveREPL(terminal);
} else {
    runDemonstration(terminal);
}
