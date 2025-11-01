#!/usr/bin/env node

const path = require("node:path");
const {
  readJsonFromStdin,
  logEvent,
  getWorkspaceRoot,
} = require("./utils");

async function main() {
  const payload = await readJsonFromStdin();
  const workspaceRoot = getWorkspaceRoot(payload);
  const absolutePath = payload?.path ?? payload?.filepath ?? "";
  const relativePath = absolutePath.startsWith(workspaceRoot)
    ? path.relative(workspaceRoot, absolutePath)
    : absolutePath;

  logEvent(payload, "before-read-file", {
    path: relativePath,
  });

  const sensitiveMatchers = [
    /\.env/i,
    /firebase\.json$/i,
    /firestore\.(rules|indexes\.json)$/i,
    /serviceAccount.*\.json$/i,
  ];

  const sensitive = sensitiveMatchers.some((regex) => regex.test(relativePath));

  if (sensitive) {
    respond({
      continue: false,
      permission: "deny",
      userMessage: "🔒 Reading secret config files from Cursor is disabled for this demo.",
    });
    return;
  }

  respond({
    continue: true,
    permission: "allow",
  });
}

function respond(result) {
  process.stdout.write(JSON.stringify(result));
}

main().catch((error) => {
  console.error(`[cursor-hooks] before-read-file failure: ${error.message}`);
  respond({
    continue: false,
    permission: "deny",
    userMessage: "Cursor hook errored; file read cancelled to be safe.",
  });
});

