#!/usr/bin/env node

const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  readJsonFromStdin,
  logEvent,
  getWorkspaceRoot,
} = require("./utils");

const LINTABLE_EXTENSIONS = new Set(["ts", "tsx", "js", "jsx", "mjs", "cjs"]);

async function main() {
  const payload = await readJsonFromStdin();
  const workspaceRoot = getWorkspaceRoot(payload);
  const absolutePath = payload?.path ?? payload?.filepath ?? "";
  const relativePath = absolutePath.startsWith(workspaceRoot)
    ? path.relative(workspaceRoot, absolutePath)
    : absolutePath;

  logEvent(payload, "after-file-edit", {
    path: relativePath,
  });

  const ext = path.extname(relativePath).replace(".", "");
  if (!LINTABLE_EXTENSIONS.has(ext)) {
    respond({ status: "skip" });
    return;
  }

  const lintResult = spawnSync(
    "npm",
    ["run", "lint", "--", "--max-warnings=0", relativePath],
    {
      cwd: workspaceRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (lintResult.status !== 0) {
    logEvent(payload, "after-file-edit-lint-error", {
      path: relativePath,
      exitCode: lintResult.status,
    });
    const stderr = lintResult.stderr ? lintResult.stderr.trim() : "Unknown ESLint failure.";
    console.error(`[cursor-hooks] ESLint reported issues in ${relativePath}:\n${stderr}`);
    respond({
      status: "error",
      message: "ESLint failed; check terminal output for details.",
    });
    return;
  }

  respond({
    status: "ok",
    message: `ESLint passed for ${relativePath}`,
  });
}

function respond(result) {
  process.stdout.write(JSON.stringify(result));
}

main().catch((error) => {
  console.error(`[cursor-hooks] after-file-edit failure: ${error.message}`);
  respond({
    status: "error",
    message: "Cursor hook encountered an unexpected error; check console.",
  });
});

