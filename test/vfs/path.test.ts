import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  joinPath,
  normalizePath,
  parsePath,
  type Path,
} from "../../src/vfs/path.js";

describe("parsePath", () => {
  test("parses an empty path", () => {
    assert.deepStrictEqual(parsePath(""), {
      components: [],
      isAbsolute: false,
    });
  });

  test("parses the root path", () => {
    assert.deepStrictEqual(parsePath("/"), {
      components: [],
      isAbsolute: true,
    });
  });

  test("parses a single relative component", () => {
    assert.deepStrictEqual(parsePath("home"), {
      components: ["home"],
      isAbsolute: false,
    });
  });

  test("parses a single absolute component", () => {
    assert.deepStrictEqual(parsePath("/home"), {
      components: ["home"],
      isAbsolute: true,
    });
  });

  test("parses multiple relative components", () => {
    assert.deepStrictEqual(parsePath("home/jose/docs"), {
      components: ["home", "jose", "docs"],
      isAbsolute: false,
    });
  });

  test("parses multiple absolute components", () => {
    assert.deepStrictEqual(parsePath("/home/jose/docs"), {
      components: ["home", "jose", "docs"],
      isAbsolute: true,
    });
  });

  test("ignores repeated separators", () => {
    assert.deepStrictEqual(parsePath("/home//jose///docs"), {
      components: ["home", "jose", "docs"],
      isAbsolute: true,
    });
  });

  test("ignores a trailing separator", () => {
    assert.deepStrictEqual(parsePath("/home/jose/"), {
      components: ["home", "jose"],
      isAbsolute: true,
    });
  });

  test("ignores repeated and trailing separators", () => {
    assert.deepStrictEqual(parsePath("//home///jose///"), {
      components: ["home", "jose"],
      isAbsolute: true,
    });
  });

  test("preserves dot components", () => {
    assert.deepStrictEqual(parsePath("./home/./docs"), {
      components: [".", "home", ".", "docs"],
      isAbsolute: false,
    });
  });

  test("preserves parent components", () => {
    assert.deepStrictEqual(parsePath("../home/../docs"), {
      components: ["..", "home", "..", "docs"],
      isAbsolute: false,
    });
  });

  test("preserves special components in absolute paths", () => {
    assert.deepStrictEqual(parsePath("/home/./../docs"), {
      components: ["home", ".", "..", "docs"],
      isAbsolute: true,
    });
  });
});

describe("normalizePath", () => {
  test("normalizes an empty relative path", () => {
    assert.deepStrictEqual(normalizePath(parsePath("")), {
      components: [],
      isAbsolute: false,
    });
  });

  test("normalizes the root path", () => {
    assert.deepStrictEqual(normalizePath(parsePath("/")), {
      components: [],
      isAbsolute: true,
    });
  });

  test("removes current-directory components", () => {
    assert.deepStrictEqual(normalizePath(parsePath("./home/./docs")), {
      components: ["home", "docs"],
      isAbsolute: false,
    });
  });

  test("resolves a parent component", () => {
    assert.deepStrictEqual(normalizePath(parsePath("home/jose/../docs")), {
      components: ["home", "docs"],
      isAbsolute: false,
    });
  });

  test("resolves multiple parent components", () => {
    assert.deepStrictEqual(
      normalizePath(parsePath("home/jose/projects/../../docs")),
      {
        components: ["home", "docs"],
        isAbsolute: false,
      },
    );
  });

  test("preserves unresolved parent components in relative paths", () => {
    assert.deepStrictEqual(normalizePath(parsePath("../../docs")), {
      components: ["..", "..", "docs"],
      isAbsolute: false,
    });
  });

  test("preserves unresolved parent components after normal components are exhausted", () => {
    assert.deepStrictEqual(normalizePath(parsePath("home/../../docs")), {
      components: ["..", "docs"],
      isAbsolute: false,
    });
  });

  test("removes parent components beyond the root of an absolute path", () => {
    assert.deepStrictEqual(normalizePath(parsePath("/../docs")), {
      components: ["docs"],
      isAbsolute: true,
    });
  });

  test("removes multiple parent components beyond the root", () => {
    assert.deepStrictEqual(normalizePath(parsePath("/../../docs")), {
      components: ["docs"],
      isAbsolute: true,
    });
  });

  test("resolves mixed dot and parent components", () => {
    assert.deepStrictEqual(
      normalizePath(parsePath("/home/./jose/../docs/./file")),
      {
        components: ["home", "docs", "file"],
        isAbsolute: true,
      },
    );
  });

  test("preserves the absolute flag", () => {
    const relative = normalizePath(parsePath("home/../docs"));
    const absolute = normalizePath(parsePath("/home/../docs"));

    assert.strictEqual(relative.isAbsolute, false);
    assert.strictEqual(absolute.isAbsolute, true);
  });

  test("does not mutate the input path", () => {
    const input: Path = parsePath("/home/jose/../docs");

    const originalComponents = [...input.components];
    const originalIsAbsolute = input.isAbsolute;

    normalizePath(input);

    assert.deepStrictEqual(input.components, originalComponents);
    assert.strictEqual(input.isAbsolute, originalIsAbsolute);
  });

  test("produces a path without dot components", () => {
    const result = normalizePath(
      parsePath("/home/./jose/../docs/./file"),
    );

    assert.ok(!result.components.includes("."));
  });

  test("produces an absolute path without parent components", () => {
    const result = normalizePath(
      parsePath("/home/../../jose/../docs"),
    );

    assert.ok(!result.components.includes(".."));
  });
});

describe("joinPath", () => {
  test("joins an absolute base with a relative path", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("docs/projects");

    assert.deepStrictEqual(joinPath(base, path), {
      components: ["home", "jose", "docs", "projects"],
      isAbsolute: true,
    });
  });

  test("joins an absolute base with an empty relative path", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("");

    assert.deepStrictEqual(joinPath(base, path), {
      components: ["home", "jose"],
      isAbsolute: true,
    });
  });

  test("does not normalize the joined path", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("../docs/./projects");

    assert.deepStrictEqual(joinPath(base, path), {
      components: ["home", "jose", "..", "docs", ".", "projects"],
      isAbsolute: true,
    });
  });

  test("returns an absolute path unchanged", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("/var/log");

    assert.strictEqual(joinPath(base, path), path);
  });

  test("does not mutate the base path", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("docs");

    const originalComponents = [...base.components];

    joinPath(base, path);

    assert.deepStrictEqual(base.components, originalComponents);
  });

  test("does not mutate the relative path", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("docs/projects");

    const originalComponents = [...path.components];

    joinPath(base, path);

    assert.deepStrictEqual(path.components, originalComponents);
  });

  test("creates a new component array when joining relative paths", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("docs");

    const result = joinPath(base, path);

    assert.notStrictEqual(result.components, base.components);
    assert.notStrictEqual(result.components, path.components);
  });
});