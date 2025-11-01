#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

async function readJsonFromStdin() {
  const chunks = [];

  return new Promise((resolve) => {
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => {
      const raw = chunks.join("");
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        console.error(`[cursor-hooks] Failed to parse stdin JSON: ${error.message}`);
        console.error(raw);
        process.exit(1);
      }
    });
    process.stdin.on("error", (error) => {
      console.error(`[cursor-hooks] Error reading stdin: ${error.message}`);
      process.exit(1);
    });
  });
}

function getWorkspaceRoot(payload) {
  if (payload && Array.isArray(payload.workspace_roots) && payload.workspace_roots.length > 0) {
    return payload.workspace_roots[0];
  }

  return process.cwd();
}

function logEvent(payload, eventName, metadata = {}) {
  try {
    const workspaceRoot = getWorkspaceRoot(payload);
    const logDir = path.join(workspaceRoot, "logs", "cursor-hooks");
    fs.mkdirSync(logDir, { recursive: true });

    const filePath = path.join(logDir, `${eventName}.jsonl`);
    const entry = {
      timestamp: new Date().toISOString(),
      event: eventName,
      ...metadata,
    };

    fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, { encoding: "utf8" });
  } catch (error) {
    console.error(`[cursor-hooks] Failed to write log entry for ${eventName}: ${error.message}`);
  }
}

module.exports = {
  readJsonFromStdin,
  getWorkspaceRoot,
  logEvent,
};

