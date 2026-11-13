/**
 * WebTerminal — Zero-Dependency Local Static Server
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";

const PORT = 3000;
const ROOT_DIR = process.cwd();

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
};

function getSafeFilePath(urlPath) {
    const cleanUrl = urlPath.split("?")[0] ?? "/";
    const normalized = path.normalize(cleanUrl);
    const resolved = path.join(ROOT_DIR, normalized);
    if (!resolved.startsWith(ROOT_DIR)) {
        return null;
    }
    return resolved;
}

function handleStaticRequest(req, res) {
    const targetPath = getSafeFilePath(req.url ?? "/");
    if (!targetPath) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("403 Forbidden");
        return;
    }

    fs.stat(targetPath, (statErr, stats) => {
        if (statErr || !stats) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found");
            return;
        }

        const filePath = stats.isDirectory()
            ? path.join(targetPath, "index.html")
            : targetPath;

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

        fs.readFile(filePath, (readErr, content) => {
            if (readErr) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("500 Internal Server Error");
                return;
            }
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content);
        });
    });
}

const server = http.createServer(handleStaticRequest);

server.listen(PORT, () => {
    const demoUrl = `http://localhost:${PORT}/demo/index.html`;
    console.log("==================================================");
    console.log(" WebTerminal Interactive Showcase Server");
    console.log(` Running at: ${demoUrl}`);
    console.log(" Press Ctrl+C to stop.");
    console.log("==================================================");

    exec(`open "${demoUrl}"`, () => {});
});

